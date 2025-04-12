
import os
from functools import wraps
from flask import request, jsonify
import json
from jose import jwt
from supabase import create_client, Client
from .error_handler import AppError

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def validate_token(f):
    """
    Decorator to validate Supabase JWT tokens.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid authorization token"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Using jose to validate JWT
            # In production, you should fetch the JWT secret from Supabase
            # This is a simplified validation
            payload = jwt.decode(
                token, 
                os.environ.get("JWT_SECRET", "your-secret-key"),
                algorithms=["HS256"]
            )
            
            # Add user info to request for downstream handlers
            request.user = payload.get('sub')
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401
    
    return decorated_function

def get_user_from_token():
    """
    Extract user information from the token.
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        raise AppError("Missing or invalid authorization token", 401)
    
    token = auth_header.split(' ')[1]
    
    try:
        # Using jose to validate JWT
        payload = jwt.decode(
            token, 
            os.environ.get("JWT_SECRET", "your-secret-key"),
            algorithms=["HS256"]
        )
        
        return payload.get('sub')
    except Exception as e:
        raise AppError(f"Invalid token: {str(e)}", 401)
