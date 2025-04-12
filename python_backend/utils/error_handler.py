
from flask import jsonify
from functools import wraps
import logging
import traceback

logger = logging.getLogger(__name__)

class AppError(Exception):
    """Custom application error class with status code"""
    def __init__(self, message, status_code=500, details=None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)

def handle_errors(f):
    """
    Decorator for handling errors in route handlers.
    Catches exceptions and returns appropriate JSON responses.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except AppError as e:
            logger.error(f"Application error: {e.message}")
            if e.details:
                logger.error(f"Error details: {e.details}")
            
            response = {
                "success": False,
                "error": e.message
            }
            
            if e.details:
                response["details"] = e.details
                
            return jsonify(response), e.status_code
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            logger.error(traceback.format_exc())
            
            return jsonify({
                "success": False,
                "error": "An unexpected error occurred",
                "details": str(e) if logger.level == logging.DEBUG else None
            }), 500
    
    return decorated_function
