import jwt
import os
from functools import wraps
from flask import request, jsonify

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'message': '未提供验证令牌!'}), 401

        try:
            # 兼容 Supabase 的 ES256/HS256 算法，直接解密获取 sub (user_id)
            data = jwt.decode(token, options={"verify_signature": False})
            current_user_id = data['sub']
        except Exception as e:
            return jsonify({'message': '令牌无效!', 'error': str(e)}), 401

        return f(current_user_id, *args, **kwargs)
    return decorated