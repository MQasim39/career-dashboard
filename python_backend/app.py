
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging
from handlers.resume_parser import parse_resume
from handlers.job_scraper import scrape_jobs
from handlers.agent import activate_agent, get_job_matches
from utils.auth import validate_token
from utils.error_handler import handle_errors, AppError

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/parse-resume', methods=['POST'])
@validate_token
@handle_errors
def parse_resume_endpoint():
    """
    Endpoint to parse resume files.
    Expects form data with 'file' and JSON data with resumeId, userId, etc.
    Returns parsed resume data.
    """
    if 'file' not in request.files:
        raise AppError("No file provided", 400)
    
    file = request.files['file']
    resume_id = request.form.get('resumeId')
    user_id = request.form.get('userId')
    
    if not resume_id or not user_id:
        raise AppError("Missing resumeId or userId", 400)
    
    result = parse_resume(file, resume_id, user_id)
    return jsonify({"success": True, "data": result}), 200

@app.route('/scrape-jobs', methods=['POST'])
@validate_token
@handle_errors
def scrape_jobs_endpoint():
    """
    Endpoint to trigger job scraping.
    Expects JSON with scraper configuration details.
    Returns status of scraping job.
    """
    data = request.json
    if not data:
        raise AppError("No data provided", 400)
    
    configuration_id = data.get('configurationId')
    if not configuration_id:
        raise AppError("Missing configuration ID", 400)
    
    result = scrape_jobs(data)
    return jsonify({"success": True, "data": result}), 200

@app.route('/activate-agent', methods=['POST'])
@validate_token
@handle_errors
def activate_agent_endpoint():
    """
    Endpoint to activate job matching agent.
    Expects JSON with user_id, resume_id, and preferences.
    Returns agent configuration details.
    """
    data = request.json
    if not data:
        raise AppError("No data provided", 400)
    
    user_id = data.get('user_id')
    resume_id = data.get('resume_id')
    
    if not user_id or not resume_id:
        raise AppError("Missing user_id or resume_id", 400)
    
    result = activate_agent(data)
    return jsonify({"success": True, "data": result}), 200

@app.route('/job-matches', methods=['GET'])
@validate_token
@handle_errors
def job_matches_endpoint():
    """
    Endpoint to retrieve job matches.
    Expects query params with user_id and resume_id.
    Returns matching jobs with scores.
    """
    user_id = request.args.get('user_id')
    resume_id = request.args.get('resume_id')
    
    if not user_id or not resume_id:
        raise AppError("Missing user_id or resume_id", 400)
    
    result = get_job_matches(user_id, resume_id)
    return jsonify({"success": True, "data": result}), 200

@app.route('/api-status', methods=['GET'])
def api_status():
    """
    Endpoint to check API and dependency status.
    """
    status = {
        "api": "healthy",
        "claude_api": "unknown",
        "supabase": "unknown",
        "firecrawl": "unknown"
    }
    
    try:
        # Check Claude API
        from utils.claude_client import ClaudeClient
        if os.environ.get("ANTHROPIC_API_KEY"):
            status["claude_api"] = "configured"
        else:
            status["claude_api"] = "not configured"
    except Exception:
        status["claude_api"] = "error"
    
    try:
        # Check Supabase connection
        from utils.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        test_query = supabase.table('profiles').select('count', count='exact').execute()
        if test_query:
            status["supabase"] = "connected"
    except Exception:
        status["supabase"] = "error"
    
    try:
        # Check Firecrawl API
        if os.environ.get("FIRECRAWL_API_KEY"):
            status["firecrawl"] = "configured"
        else:
            status["firecrawl"] = "not configured"
    except Exception:
        status["firecrawl"] = "error"
    
    return jsonify(status), 200

if __name__ == '__main__':
    # Only for local development, production should use gunicorn
    app.run(debug=os.environ.get('FLASK_DEBUG', 'False') == 'True', host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
