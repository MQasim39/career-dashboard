
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
from agents.company_job_crew import CompanyJobCrew # Import the crew
from werkzeug.utils import secure_filename
import tempfile
import uuid

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

# --- Add this new endpoint ---
@app.route('/find-company-jobs', methods=['POST'])
@validate_token # Assuming you want this protected
@handle_errors
def find_company_jobs_endpoint():
    """
    Endpoint to find jobs at a specific company and match them to an uploaded resume.
    Expects form data with 'companyName' and 'resumeFile'.
    """
    logger.info("Received request for /find-company-jobs")

    company_name = request.form.get('companyName')
    if not company_name:
        raise AppError("Missing companyName", 400)

    if 'resumeFile' not in request.files:
        raise AppError("No resumeFile provided", 400)

    resume_file = request.files['resumeFile']
    if resume_file.filename == '':
        raise AppError("No selected resume file", 400)

    # Securely save the uploaded resume temporarily
    # Consider a more robust storage solution for production (e.g., S3, Supabase Storage)
    filename = secure_filename(f"{uuid.uuid4()}_{resume_file.filename}")
    temp_dir = tempfile.gettempdir()
    temp_resume_path = os.path.join(temp_dir, filename)

    try:
        resume_file.save(temp_resume_path)
        logger.info(f"Temporarily saved resume to {temp_resume_path}")

        # Ensure API keys are loaded (dotenv should handle this, but double-check)
        if not os.getenv("ANTHROPIC_API_KEY") or not os.getenv("FIRECRAWL_API_KEY") or not os.getenv("SERPER_API_KEY"):
             logger.error("Missing required API keys (Anthropic, Firecrawl, Serper)")
             raise AppError("Server configuration error: Missing API keys", 500)

        # Initialize and run the crew
        job_crew = CompanyJobCrew(resume_path=temp_resume_path)
        crew_result = job_crew.crew().kickoff(inputs={'company_name': company_name})

        logger.info(f"Crew finished execution for company: {company_name}")
        # The final result is typically the output of the last task
        return jsonify({"success": True, "data": {"matches": crew_result}}), 200

    except Exception as e:
        logger.exception(f"Error processing company job search for {company_name}")
        # Use the AppError structure if it's a known error type, otherwise raise generic
        if isinstance(e, AppError):
            raise e
        else:
            raise AppError(f"An internal error occurred: {str(e)}", 500)
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_resume_path):
            try:
                os.remove(temp_resume_path)
                logger.info(f"Removed temporary resume file: {temp_resume_path}")
            except Exception as remove_err:
                logger.error(f"Error removing temporary file {temp_resume_path}: {remove_err}")


if __name__ == '__main__':
    # Ensure config directory and files exist before running
    config_dir = os.path.join(os.path.dirname(__file__), 'config')
    if not os.path.exists(config_dir):
        os.makedirs(config_dir)
        print(f"Created directory: {config_dir}")
        print("Please create 'agents.yaml' and 'tasks.yaml' inside it.")
    elif not os.path.exists(os.path.join(config_dir, 'agents.yaml')) or \
         not os.path.exists(os.path.join(config_dir, 'tasks.yaml')):
        print("Error: 'agents.yaml' or 'tasks.yaml' not found in the 'config' directory.")
        # Optionally exit or prevent app run if configs are missing
        # exit(1)

    # Load environment variables
    load_dotenv()
    app.run(debug=os.environ.get('FLASK_DEBUG', 'False') == 'True', host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
