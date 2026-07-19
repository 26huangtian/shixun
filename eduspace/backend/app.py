from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys
import traceback
from pathlib import Path
from datetime import datetime, timedelta
from functools import wraps
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID

# --- 1. 环境与路径配置 ---
sys.path.append(str(Path(__file__).parent.parent))
load_dotenv()

app = Flask(__name__)
# 允许所有来源跨域，解决线上线下通信问题
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- 2. 数据库配置 ---
app.config[
    'SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres.rrwkycogajqdqawbyxos:Huangtianxiang@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# --- 3. 数据库模型定义 ---

class Profile(db.Model):
    __tablename__ = 'profiles'
    id = db.Column(UUID(as_uuid=True), primary_key=True)
    name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='reader')


class Book(db.Model):
    __tablename__ = 'books'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(100))
    isbn = db.Column(db.String(50))      # 新增
    stock = db.Column(db.Integer, default=5)
    category = db.Column(db.String(50))
    description = db.Column(db.Text)     # 新增
    location = db.Column(db.String(100))  # 新增


class BorrowRecord(db.Model):
    __tablename__ = 'borrow_records'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('profiles.id'))
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'))
    borrow_date = db.Column(db.Date, default=datetime.utcnow)
    due_date = db.Column(db.Date)
    return_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='borrowing')  # borrowing, returned
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Wishlist(db.Model):
    __tablename__ = 'wishlist'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('profiles.id'))
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'))


# 导入验证中间件
from middleware.auth import token_required


# --- 4. API 接口定义 ---

# 健康检查
@app.route('/api/health')
@app.route('/health')
def health_check():
    return jsonify({"status": "ok", "message": "BookSpace API 在线运行中"})

# 首页统计接口
@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_book_stats(current_user_id):
    try:
        # 1. 获取用户信息及角色
        user = db.session.get(Profile, current_user_id)
        role = user.role if user else 'reader'
        today = datetime.now().date()

        # 2. 【阅读挑战逻辑】计算本月已读数量 (status='returned' 且 return_date 在本月)
        start_of_month = today.replace(day=1)
        returned_this_month = BorrowRecord.query.filter(
            BorrowRecord.user_id == current_user_id,
            BorrowRecord.status == 'returned',
            BorrowRecord.return_date >= start_of_month
        ).count()

        challenge_goal = 4  # 设定每月目标
        challenge_percent = min(100, int((returned_this_month / challenge_goal) * 100))

        # 3. 【逾期罚金逻辑】实时扫描未还且超期的书籍
        overdue_books = BorrowRecord.query.filter(
            BorrowRecord.user_id == current_user_id,
            BorrowRecord.status == 'borrowing',
            BorrowRecord.due_date < today
        ).all()

        total_fine = 0.0
        overdue_details = []
        for rec in overdue_books:
            # 计算逾期天数
            days_diff = (today - rec.due_date).days
            fine = days_diff * 0.5  # 逾期费率：0.5元/天
            total_fine += fine
            # 查出书名
            book = db.session.get(Book, rec.book_id)
            overdue_details.append({
                "title": book.title if book else "未知书籍",
                "days": days_diff,
                "fine": fine
            })

        # 4. 【基础借阅统计】
        my_borrowing_count = BorrowRecord.query.filter_by(
            user_id=current_user_id,
            status='borrowing'
        ).count()

        # 5. 【临期提醒】查找最近的一本待还书
        due_soon = db.session.query(Book.title, BorrowRecord.due_date) \
            .join(BorrowRecord, Book.id == BorrowRecord.book_id) \
            .filter(BorrowRecord.user_id == current_user_id, BorrowRecord.status == 'borrowing') \
            .order_by(BorrowRecord.due_date.asc()).first()

        # 构造响应基础结构
        res = {
            "real_name": user.name if user else "新读者",
            "role": role,
            "challenge": {
                "current": returned_this_month,
                "goal": challenge_goal,
                "percent": challenge_percent
            },
            "overdue_info": {
                "has_overdue": len(overdue_details) > 0,
                "total_fine": round(total_fine, 2),
                "count": len(overdue_details),
                "details": overdue_details
            },
            "my_stats": {
                "borrowing": my_borrowing_count,
                "due_soon_book": due_soon[0] if due_soon else None,
                "due_date": due_soon[1].strftime('%Y-%m-%d') if due_soon else None
            }
        }

        # 6. 【管理端特权逻辑】全馆实时数据统计
        if role == 'admin':
            # 统计读者总数 (排除管理员)
            total_readers = Profile.query.filter(Profile.role != 'admin').count()
            # 统计总书籍种类
            total_books_types = Book.query.count()
            # 统计全馆当前借出总数
            global_active_borrows = BorrowRecord.query.filter_by(status='borrowing').count()
            # 库存预警 (库存 < 2)
            low_stock_count = Book.query.filter(Book.stock < 2).count()

            # 借阅热度榜 (前 5 名)
            top_books = db.session.query(
                Book.id, Book.title, func.count(BorrowRecord.id).label('borrow_count')
            ).join(BorrowRecord, Book.id == BorrowRecord.book_id) \
                .group_by(Book.id) \
                .order_by(db.text('borrow_count DESC')) \
                .limit(5).all()

            res["admin_stats"] = {
                "total_books": total_books_types,
                "total_readers": total_readers,
                "active_borrows": global_active_borrows,
                "low_stock_count": low_stock_count
            }
            res["top_courses"] = [
                {"id": b[0], "name": b[1], "enrolled": b[2], "capacity": 10}  # 10用于计算百分比条
                for b in top_books
            ]

        # 7. 公共空间推荐 (全角色共享)
        res["rooms"] = [
            {"name": "2F 科技阅览室", "status": "空闲"},
            {"name": "4F 静音自习区", "status": "开放"},
            {"name": "1F 报刊阅览中心", "status": "空闲"}
        ]

        return jsonify(res)

    except Exception as e:
        # 调试必备：打印完整报错堆栈到 PyCharm 控制台
        print(f"!!! 统计逻辑严重崩溃: {str(e)} !!!")
        traceback.print_exc()
        return jsonify({"error": "数据中心同步失败", "details": str(e)}), 500


@app.route('/api/my-borrowing', methods=['GET'])
@app.route('/my-borrowing', methods=['GET'])
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
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# 图书列表（支持搜索与分类）
@app.route('/api/books', methods=['GET'])
@app.route('/books', methods=['GET'])
@token_required
def get_books(current_user_id):
    try:
        search = request.args.get('search', '')
        category = request.args.get('category', '全部')
        query = Book.query
        if search:
            query = query.filter(Book.title.ilike(f'%{search}%') | Book.author.ilike(f'%{search}%'))
        if category != '全部':
            query = query.filter(Book.category == category)

        books = query.all()

        # 1. 查出当前用户正在借阅的书 ID 列表
        my_borrows = [r.book_id for r in
                      BorrowRecord.query.filter_by(user_id=current_user_id, status='borrowing').all()]

        # 2. 核心新增：查出当前用户已收藏的书 ID 列表
        my_wishlist = [w.book_id for w in Wishlist.query.filter_by(user_id=current_user_id).all()]

        return jsonify({
            "books": [{
                "id": b.id, "title": b.title, "author": b.author,
                "stock": b.stock, "category": b.category,
                "description": b.description or "暂无简介",
                "location": b.location or "通用架位",
                "is_borrowed": b.id in my_borrows,
                "is_wishlisted": b.id in my_wishlist  # 传给前端判定心形颜色
            } for b in books]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 借书接口
@app.route('/api/books/borrow', methods=['POST'])
@app.route('/books/borrow', methods=['POST'])
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
            return jsonify({"message": "您已借阅此书，请先归还"}), 400

        new_record = BorrowRecord(
            user_id=current_user_id, book_id=book_id,
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


# 归还接口
@app.route('/api/books/return', methods=['POST'])
@app.route('/books/return', methods=['POST'])
@token_required
def return_book(current_user_id):
    try:
        data = request.json
        record_id = data.get('record_id')
        record = db.session.get(BorrowRecord, record_id)
        if not record or record.user_id != current_user_id:
            return jsonify({"message": "未找到借阅记录"}), 404

        book = db.session.get(Book, record.book_id)
        record.status = 'returned'
        record.return_date = datetime.now().date()
        book.stock += 1
        db.session.commit()
        return jsonify({"message": "归还成功"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# 今日荐书
@app.route('/api/books/recommend', methods=['GET'])
@app.route('/books/recommend', methods=['GET'])
@token_required
def get_recommendation(current_user_id):
    try:
        book = Book.query.order_by(func.random()).first()
        if book:
            return jsonify({
                "id": book.id, "title": book.title, "author": book.author,
                "description": book.description or "精彩好书。", "category": book.category
            })
        return jsonify({"error": "书库暂空"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 个人资料管理
@app.route('/api/me', methods=['GET', 'POST'])
@app.route('/me', methods=['GET', 'POST'])
@token_required
def manage_profile(current_user_id):
    try:
        profile = db.session.get(Profile, current_user_id)
        if request.method == 'GET':
            return jsonify({"name": profile.name if profile else "", "role": profile.role if profile else "reader"})
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


@app.route('/api/wishlist/toggle', methods=['POST'])
@token_required
def toggle_wishlist(current_user_id):
    data = request.json
    book_id = data.get('book_id')
    item = Wishlist.query.filter_by(user_id=current_user_id, book_id=book_id).first()

    if item:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "已从收藏夹移除", "status": "removed"})
    else:
        new_item = Wishlist(user_id=current_user_id, book_id=book_id)
        db.session.add(new_item)
        db.session.commit()
        return jsonify({"message": "已加入收藏夹", "status": "added"})


# 接口：获取我的收藏列表
@app.route('/api/wishlist', methods=['GET'])
@token_required
def get_my_wishlist(current_user_id):
    items = db.session.query(Book).join(Wishlist).filter(Wishlist.user_id == current_user_id).all()
    return jsonify([{"id": b.id, "title": b.title, "author": b.author, "category": b.category} for b in items])

def admin_only(f):
    @wraps(f)
    def decorated_function(current_user_id, *args, **kwargs):
        user = db.session.get(Profile, current_user_id)
        if not user or user.role != 'admin':
            return jsonify({"message": "权限不足，仅限管理员访问"}), 403
        return f(current_user_id, *args, **kwargs)
    return decorated_function


# 1. 管理端：图书全量管理 (新增/修改)
@app.route('/api/admin/users', methods=['GET'])
@app.route('/admin/users', methods=['GET'])
@token_required
@admin_only
def admin_get_users(current_user_id):
    # 只查询非管理员账号
    users = Profile.query.filter(Profile.role != 'admin').all()
    return jsonify([{"id": str(u.id), "name": u.name, "role": u.role} for u in users])


@app.route('/api/admin/user-detail/<target_user_id>', methods=['GET'])
@app.route('/admin/user-detail/<target_user_id>', methods=['GET'])
@token_required
@admin_only
def admin_get_user_detail(current_user_id, target_user_id):
    try:
        reader = db.session.get(Profile, target_user_id)
        if not reader: return jsonify({"error": "档案不存在"}), 404

        # 借阅流水
        history = db.session.query(BorrowRecord, Book.title).join(Book).filter(
            BorrowRecord.user_id == target_user_id).all()
        # 心愿单
        wishlist = db.session.query(Book.title, Book.category).join(Wishlist).filter(
            Wishlist.user_id == target_user_id).all()

        return jsonify({
            "name": reader.name, "role": reader.role,
            "borrow_history": [{"title": h[1], "status": h[0].status, "due_date": str(h[0].due_date)} for h in history],
            "wishlist": [{"title": w[0], "category": w[1]} for w in wishlist]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/records', methods=['GET'])
@app.route('/admin/records', methods=['GET'])
@token_required
@admin_only
def admin_get_records(current_user_id):
    records = db.session.query(BorrowRecord, Book.title, Profile.name).join(Book).join(Profile).all()
    return jsonify(
        [{"id": r[0].id, "title": r[1], "user_name": r[2], "status": r[0].status, "due_date": str(r[0].due_date)} for r
         in records])


@app.route('/api/admin/records/<int:record_id>/return', methods=['POST'])
@token_required
@admin_only
def admin_manual_return(current_user_id, record_id):
    record = db.session.get(BorrowRecord, record_id)
    if record and record.status == 'borrowing':
        book = db.session.get(Book, record.book_id)
        record.status = 'returned'
        record.return_date = datetime.now().date()
        book.stock += 1
        db.session.commit()
        return jsonify({"message": "还书办结"})
    return jsonify({"error": "记录异常"}), 400


@app.route('/api/admin/books', methods=['POST'])
@app.route('/api/admin/books/<int:book_id>', methods=['PUT', 'DELETE'])
@token_required
@admin_only
def admin_manage_books(current_user_id, book_id=None):
    if request.method == 'POST':
        data = request.json
        db.session.add(Book(title=data['title'], author=data['author'], category=data['category'], stock=data['stock'],
                            location=data.get('location'), description=data.get('description'), isbn=data.get('isbn')))
    elif request.method == 'PUT':
        data = request.json
        book = db.session.get(Book, book_id)
        if book:
            book.title, book.stock = data['title'], data['stock']
            book.location, book.description = data.get('location'), data.get('description')
    elif request.method == 'DELETE':
        book = db.session.get(Book, book_id)
        if book: db.session.delete(book)
    db.session.commit()
    return jsonify({"message": "操作成功"})

if __name__ == '__main__':
    # 本地开发监听 5328 端口
    app.run(host='127.0.0.1', port=5328, debug=True)


    @app.route('/')
    def hello():
        return '后端服务运行正常'