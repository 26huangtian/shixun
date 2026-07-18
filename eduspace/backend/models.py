from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# 1. 用户模型
class Profile(db.Model):
    __tablename__ = 'profiles'
    id = db.Column(db.String(36), primary_key=True) # 对应 Supabase Auth 的 UUID
    name = db.Column(db.String(100))
    user_class = db.Column(db.String(50), name='class') # class是关键字，映射一下
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 2. 课程模型
class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    teacher = db.Column(db.String(100))
    credit = db.Column(db.Integer)
    capacity = db.Column(db.Integer, default=30)
    enrolled_count = db.Column(db.Integer, default=0)
    schedule_json = db.Column(db.JSON) # 存储上课时间