from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys
from pathlib import Path
from datetime import datetime
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
    status = db.Column(db.String(20), default='borrowing')  # borrowing, returned
    due_date = db.Column(db.Date)


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


# 启动本地服务测试
if __name__ == '__main__':
    app.run(debug=True, port=5328)