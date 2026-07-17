from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app) # 允许跨域

@app.route('/api/health')
def health_check():
    return {"status": "ok", "message": "EduSpace Backend is running"}

if __name__ == '__main__':
    app.run(port=5328, debug=True