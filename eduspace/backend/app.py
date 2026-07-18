from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# 1.创建app
app = Flask(__name__)
CORS(app)

# 2.【必须先配置数据库连接，这一步不能后置】
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres.rrwkycogajqdqawbyxos:Huangtianxiang@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 3.配置完成后，再初始化数据库
db = SQLAlchemy(app)

# 4.再定义Course模型和接口
class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200))
    teacher = db.Column(db.String(100))

@app.route('/api/courses', methods=['GET'])
def get_courses():
    courses = Course.query.all()
    result = []
    for c in courses:
        result.append({
            "id": c.id,
            "name": c.name,
            "teacher": c.teacher
        })
    return {"courses": result}

if __name__ == '__main__':
    app.run(debug=True, port=5328)