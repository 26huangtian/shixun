from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy.dialects.postgresql import UUID

# --- 1. 环境与路径配置 ---
# 处理 Vercel 部署时的路径问题，确保能找到同级或上级目录的 middleware
sys.path.append(str(Path(__file__).parent.parent))
load_dotenv()

# --- 2. 创建 App 与 跨域配置 ---
app = Flask(__name__)
# 允许所有来源跨域，确保前端 Vercel 域名能访问
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- 3. 数据库连接配置 (按照你提供的格式) ---
# 使用你提供的 Supabase 连接字符串，并强制指定 pg8000 驱动以确保兼容性
app.config[
    'SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres.rrwkycogajqdqawbyxos:Huangtianxiang@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
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


# --- 6. 导入中间件 (放在 db 定义之后防止循环引用) ---
from middleware.auth import token_required


# --- 7. API 接口定义 ---

# 健康检查
@app.route('/api/health')
@app.route('/health')
def health_check():
    return jsonify({"status": "ok", "message": "BookSpace API 在线"})


# 图书系统首页统计接口
@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_book_stats(current_user_id):
    try:
        # 获取当前用户信息
        user = db.session.get(Profile, current_user_id)
        role = user.role if user else 'reader'

        # 1. 个人借阅统计
        my_borrowing_count = BorrowRecord.query.filter_by(user_id=current_user_id, status='borrowing').count()

        # 查找即将到期的书 (最近的一本)
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

        # 2. 如果是管理员，返回全馆数据
        if role == 'admin':
            res["admin_stats"] = {
                "total_books": Book.query.count(),
                "total_readers": Profile.query.filter(Profile.role != 'admin').count(),
                "active_borrows": BorrowRecord.query.filter_by(status='borrowing').count(),
                "low_stock_count": Book.query.filter(Book.stock < 2).count()
            }

        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 1. 获取所有图书列表（支持搜索）
@app.route('/api/books', methods=['GET'])
@token_required
def get_books(current_user_id):
    search = request.args.get('search', '')
    query = Book.query
    if search:
        query = query.filter(Book.title.ilike(f'%{search}%'))

    books = query.all()
    # 查出当前用户已借阅且未归还的书 ID 列表
    my_borrows = [r.book_id for r in BorrowRecord.query.filter_by(user_id=current_user_id, status='borrowing').all()]

    return jsonify({
        "books": [{
            "id": b.id, "title": b.title, "author": b.author,
            "stock": b.stock, "category": b.category,
            "is_borrowed": b.id in my_borrows
        } for b in books]
    })


# 2. 借书接口
@app.route('/api/books/borrow', methods=['POST'])
@token_required
def borrow_book(current_user_id):
    data = request.json
    book_id = data.get('book_id')

    book = db.session.get(Book, book_id)
    if not book or book.stock <= 0:
        return jsonify({"message": "书本库存不足"}), 400

    # 检查是否重复借阅同一本
    existing = BorrowRecord.query.filter_by(user_id=current_user_id, book_id=book_id, status='borrowing').first()
    if existing:
        return jsonify({"message": "您已借阅此书，请先归还后再借"}), 400

    try:
        # 创建借书记录
        new_record = BorrowRecord(
            user_id=current_user_id,
            book_id=book_id,
            due_date=(datetime.now() + timedelta(days=30)).date(),  # 默认30天归还
            status='borrowing'
        )
        book.stock -= 1  # 库存减一
        db.session.add(new_record)
        db.session.commit()
        return jsonify({"message": "借阅成功！应还日期：" + new_record.due_date.strftime('%Y-%m-%d')})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# 3. 归还图书接口
@app.route('/api/books/return', methods=['POST'])
@token_required
def return_book(current_user_id):
    data = request.json
    record_id = data.get('record_id')

    record = BorrowRecord.query.filter_by(id=record_id, user_id=current_user_id).first()
    if not record:
        return jsonify({"message": "记录不存在"}), 404

    book = db.session.get(Book, record.book_id)
    try:
        record.status = 'returned'
        record.return_date = datetime.now().date()
        book.stock += 1  # 库存加一
        db.session.commit()
        return jsonify({"message": "归还成功"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# --- 获取当前用户的真实借阅记录 ---
@app.route('/api/my-borrowing', methods=['GET'])
@token_required
def get_my_borrowing(current_user_id):
    try:
        # 使用 SQLAlchemy 进行多表联查：BorrowRecord + Book
        # 只查当前登录用户的记录，并按借阅时间倒序排列
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
                "status": rec.status,  # borrowing, returned
                "return_date": rec.return_date.strftime('%Y-%m-%d') if rec.return_date else None
            })

        return jsonify(result)
    except Exception as e:
        print(f"获取借阅记录失败: {str(e)}")
        return jsonify({"error": str(e)}), 500


# 启动本地服务测试
if __name__ == '__main__':
    app.run(debug=True, port=5328)