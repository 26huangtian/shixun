from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys
import traceback
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy.dialects.postgresql import UUID

# --- 1. 环境与路径配置 ---
sys.path.append(str(Path(__file__).parent.parent))
load_dotenv()

# --- 2. 创建 App 与 跨域配置 ---
app = Flask(__name__)
# 允许所有来源跨域，确保前端 Vercel 域名能访问
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- 3. 数据库连接配置 ---
# 请确保你的数据库密码 Huangtianxiang 是正确的
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres.rrwkycogajqdqawbyxos:Huangtianxiang@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# --- 4. 初始化数据库对象 ---
db = SQLAlchemy(app)

# --- 5. 定义图书管理系统模型 ---

class Profile(db.Model):
    __tablename__ = 'profiles'
    id = db.Column(UUID(as_uuid=True), primary_key=True)
    name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='reader')  # reader, admin

class Book(db.Model):
    __tablename__ = 'books'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(100))
    stock = db.Column(db.Integer, default=5)
    category = db.Column(db.String(50))
    description = db.Column(db.Text)
    location = db.Column(db.String(100))

class BorrowRecord(db.Model):
    __tablename__ = 'borrow_records'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('profiles.id'))
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'))
    borrow_date = db.Column(db.Date, default=datetime.utcnow)
    due_date = db.Column(db.Date)
    return_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='borrowing')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# --- 6. 导入中间件 (确保已创建 middleware/auth.py) ---
from middleware.auth import token_required

# --- 7. API 接口定义 ---

# A. 健康检查
@app.route('/api/health')
@app.route('/health')
def health_check():
    return jsonify({"status": "ok", "message": "BookSpace API 运行中"})

# B. 图书系统首页统计接口
@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_book_stats(current_user_id):
    try:
        user = db.session.get(Profile, current_user_id)
        role = user.role if user else 'reader'

        # 统计个人借阅数量
        my_borrowing_count = BorrowRecord.query.filter_by(user_id=current_user_id, status='borrowing').count()

        # 查找即将到期的书
        due_soon = db.session.query(Book.title, BorrowRecord.due_date) \
            .join(BorrowRecord, Book.id == BorrowRecord.book_id) \
            .filter(BorrowRecord.user_id == current_user_id, BorrowRecord.status == 'borrowing') \
            .order_by(BorrowRecord.due_date.asc()).first()

        res = {
            "real_name": user.name if user else "新读者",
            "role": role,
            "my_stats": {
                "borrowing": my_borrowing_count,
                "due_soon_book": due_soon[0] if due_soon else None,
                "due_date": due_soon[1].strftime('%Y-%m-%d') if due_soon else None
            }
        }

        # 如果是管理员，增加全馆统计
        if role == 'admin':
            res["admin_stats"] = {
                "total_books": Book.query.count(),
                "total_readers": Profile.query.filter(Profile.role != 'admin').count(),
                "active_borrows": BorrowRecord.query.filter_by(status='borrowing').count(),
                "low_stock_count": Book.query.filter(Book.stock < 2).count()
            }

        return jsonify(res)
    except Exception as e:
        print(f"统计接口出错: {str(e)}")
        return jsonify({"error": str(e)}), 500

# C. 获取图书列表
@app.route('/api/books', methods=['GET'])
@token_required
def get_books(current_user_id):
    try:
        search = request.args.get('search', '')
        query = Book.query
        if search:
            query = query.filter(Book.title.ilike(f'%{search}%') | Book.author.ilike(f'%{search}%'))

        books = query.all()
        my_borrows = [r.book_id for r in BorrowRecord.query.filter_by(user_id=current_user_id, status='borrowing').all()]

        return jsonify({
            "books": [{
                "id": b.id,
                "title": b.title,
                "author": b.author,
                "stock": b.stock,
                "category": b.category,
                "description": b.description or "暂无简介",
                "location": b.location or "通用架位",
                "is_borrowed": b.id in my_borrows
            } for b in books]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# D. 借书接口
@app.route('/api/books/borrow', methods=['POST'])
@token_required
def borrow_book(current_user_id):
    try:
        data = request.json
        book_id = data.get('book_id')

        book = db.session.get(Book, book_id)
        if not book or book.stock <= 0:
            return jsonify({"message": "书本库存不足"}), 400

        existing = BorrowRecord.query.filter_by(user_id=current_user_id, book_id=book_id, status='borrowing').first()
        if existing:
            return jsonify({"message": "您已借阅此书，请先归还后再借"}), 400

        new_record = BorrowRecord(
            user_id=current_user_id,
            book_id=book_id,
            due_date=(datetime.now() + timedelta(days=30)).date(),
            status='borrowing'
        )
        book.stock -= 1
        db.session.add(new_record)
        db.session.commit()
        return jsonify({"message": f"借阅成功！应还日期：{new_record.due_date}"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"系统错误: {str(e)}"}), 500

# E. 归还图书接口
@app.route('/api/books/return', methods=['POST'])
@token_required
def return_book(current_user_id):
    try:
        data = request.json
        record_id = data.get('record_id')

        record = BorrowRecord.query.filter_by(id=record_id, user_id=current_user_id).first()
        if not record:
            return jsonify({"message": "记录不存在"}), 404

        book = db.session.get(Book, record.book_id)
        record.status = 'returned'
        record.return_date = datetime.now().date()
        book.stock += 1
        db.session.commit()
        return jsonify({"message": "归还成功"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# F. 获取个人借阅历史
@app.route('/api/my-borrowing', methods=['GET'])
@token_required
def get_my_borrowing(current_user_id):
    try:
        records = db.session.query(BorrowRecord, Book.title, Book.author) \
            .join(Book, BorrowRecord.book_id == Book.id) \
            .filter(BorrowRecord.user_id == current_user_id) \
            .order_by(BorrowRecord.created_at.desc()).all()

        result = []
        for rec, title, author in records:
            result.append({
                "record_id": rec.id,
                "title": title,
                "author": author,
                "borrow_date": rec.borrow_date.strftime('%Y-%m-%d') if rec.borrow_date else "未知",
                "due_date": rec.due_date.strftime('%Y-%m-%d') if rec.due_date else "未知",
                "status": rec.status,
                "return_date": rec.return_date.strftime('%Y-%m-%d') if rec.return_date else None
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# G. 个人资料管理
@app.route('/api/me', methods=['GET', 'POST'])
@app.route('/me', methods=['GET', 'POST'])
@token_required
def manage_profile(current_user_id):
    try:
        profile = db.session.get(Profile, current_user_id)
        if request.method == 'GET':
            return jsonify({
                "name": profile.name if profile else "",
                "role": profile.role if profile else "reader"
            })
        if request.method == 'POST':
            data = request.get_json()
            if not profile:
                profile = Profile(id=current_user_id, role='reader')
                db.session.add(profile)
            profile.name = data.get('name', '')
            db.session.commit()
            return jsonify({"message": "更新成功"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5328)