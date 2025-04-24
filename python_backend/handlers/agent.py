
import os
import logging
import json
from typing import Dict, List, Any, Optional
import uuid
# Remove requests import as Serper/platform calls are handled by CrewAI
# import requests
from dotenv import load_dotenv
from utils.supabase_client import get_supabase_client
from utils.error_handler import AppError
# Remove ClaudeClient if no longer used directly here (Commented out for now)
# from utils.claude_client import ClaudeClient
# Remove sklearn imports as matching is done by CrewAI/Gemini
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
# import numpy as np
# import re
import datetime # Keep datetime import

# Import the CrewAI class
from agents.company_job_crew import CompanyJobCrew # Assuming company_job_crew.py is in agents subdir

logger = logging.getLogger(__name__)
load_dotenv() # Load environment variables

# Initialize Claude client - Commented out as it seems unused in this flow
# claude_client = None
# try:
#     claude_client = ClaudeClient()
#     logger.info("Claude client initialized successfully")
# except Exception as e:
#     logger.error(f"Failed to initialize Claude client: {str(e)}")

def activate_agent(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Activate the job matching agent for a user.
    Sets up configuration and triggers the CrewAI job search and matching process.
    """
    try:
        user_id = data.get('user_id')
        resume_id = data.get('resume_id')
        # Extract search parameters needed by CrewAI from data
        keywords = data.get('keywords', [])
        location = data.get('location')
        job_type = data.get('job_type')
        department = data.get('department') # Corresponds to industries in config

        if not user_id or not resume_id:
            raise AppError("Missing user_id or resume_id", 400)

        logger.info(f"Activating agent for user: {user_id}, resume: {resume_id}")

        # Validate resume format
        validate_resume_id(resume_id)

        # Check if resume exists and belongs to user
        supabase = get_supabase_client()
        resume_result = supabase.table('resumes').select('id').eq('id', resume_id).eq('user_id', user_id).maybe_single().execute()

        if not resume_result.data:
            logger.error(f"Resume not found or does not belong to user: {resume_id}")
            raise AppError("Resume not found or does not belong to user", 404)

        # Get or create an agent configuration (scraper_configurations table)
        config_id = setup_agent_configuration(data)
        logger.info(f"Agent configuration {config_id} set up for user {user_id}.")

        # Prepare inputs for CrewAI
        crew_inputs = {
            'user_id': user_id,
            'resume_id': resume_id,
            'keywords': keywords,
            'location': location,
            'job_type': job_type,
            'department': department,
            'config_id': config_id # Pass config_id for context if needed by crew/storage
        }

        # Trigger the CrewAI job search and matching process (asynchronously?)
        # Consider running this in a background task (e.g., Celery, RQ, FastAPI background tasks)
        # For simplicity, running synchronously here.
        trigger_crewai_job_processing(crew_inputs)

        return {
            "success": True,
            "message": "AI agent activated successfully. Job search and matching process initiated via CrewAI.",
            "config_id": config_id
        }

    except AppError:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error activating agent: {str(e)}")
        raise AppError(f"Agent activation failed: {str(e)}", 500)

def validate_resume_id(resume_id: str) -> None:
    """
    Validate that the resume ID is a valid UUID.
    """
    try:
        uuid_obj = uuid.UUID(resume_id)
    except ValueError:
        logger.error(f"Invalid resume ID format: {resume_id}")
        raise AppError("Invalid resume ID format. Please select a valid resume.", 400)

def setup_agent_configuration(data: Dict[str, Any]) -> str:
    """
    Set up or update the agent configuration for a user.
    """
    supabase = get_supabase_client()
    user_id = data.get('user_id')
    
    # Extract configuration parameters
    config = {
        'user_id': user_id,
        'name': f"Job Agent for {user_id}",
        'is_active': True,
        'keywords': data.get('keywords', []),
        'locations': [data.get('location')] if data.get('location') else [],
        'job_types': [data.get('job_type')] if data.get('job_type') else [],
        'industries': [data.get('department')] if data.get('department') else [],
        'salary_range': {
            'min': data.get('salary_range', [0, 0])[0],
            'max': data.get('salary_range', [0, 0])[1],
            'currency': 'USD'
        },
        'filters': {
            'email_alerts': data.get('email_alerts', True),
            'browser_alerts': data.get('browser_alerts', True)
        }
    }
    
    # Check if configuration already exists
    config_result = supabase.table('scraper_configurations').select('id').eq('user_id', user_id).eq('name', config['name']).execute()
    
    if config_result.data:
        # Update existing configuration
        config_id = config_result.data[0]['id']
        logger.info(f"Updating existing agent configuration: {config_id}")
        
        supabase.table('scraper_configurations').update(config).eq('id', config_id).execute()
    else:
        # Create new configuration
        logger.info(f"Creating new agent configuration for user: {user_id}")
        result = supabase.table('scraper_configurations').insert(config).execute()
        config_id = result.data[0]['id']
    
    return config_id

# --- New CrewAI Orchestration and Storage Functions ---

def trigger_crewai_job_processing(crew_inputs: Dict[str, Any]):
    """
    Initializes and runs the CompanyJobCrew, then stores the results.
    """
    user_id = inputs.get('user_id')
    resume_id = inputs.get('resume_id')
    config_id = inputs.get('config_id')
    logger.info(f"Triggering CrewAI job processing for user: {user_id}, resume: {resume_id}, config: {config_id}")
    supabase = get_supabase_client()

    try:
        # *** TODO: Instantiate and run the CompanyJobCrew ***
        # 1. Prepare CrewAI Configuration/Inputs based on the 'inputs' dict
        #    (keywords, location, job_type, department etc.)
        #    You might need to fetch the full resume text or specific parsed data here
        #    or pass the IDs and let the Crew fetch it.
        logger.info(f"Preparing inputs for CompanyJobCrew: {inputs}")

        # Example: Fetching resume text (adjust based on CrewAI needs)
        # parsed_resume_result = supabase.table('parsed_resumes').select('full_text, skills').eq('resume_id', resume_id).eq('user_id', user_id).maybe_single().execute()
        # if not parsed_resume_result.data:
        #     raise AppError(f"Parsed resume data not found for resume {resume_id}")
        # resume_data = parsed_resume_result.data
        # inputs['resume_text'] = resume_data.get('full_text')
        # inputs['resume_skills'] = resume_data.get('skills')


        # 2. Instantiate the Crew
        #    The CompanyJobCrew class needs to be adapted to accept these inputs
        #    or have agents/tools that use them.
        # crew_config = CompanyJobCrewConfig(...) # Define how config is passed
        # job_crew = CompanyJobCrew(config=crew_config)
        job_crew = CompanyJobCrew() # Assuming default init for now, needs refactoring

        # 3. Kick off the Crew process
        #    The kickoff method should accept the dynamic inputs.
        #    It should perform search, scraping, Gemini matching (70-100%),
        #    and return the final matched jobs.
        # matched_jobs = job_crew.kickoff(inputs=inputs) # Pass necessary inputs
        logger.warning("CrewAI instantiation and kickoff logic needs implementation in company_job_crew.py")
        matched_jobs = [] # Placeholder for results from CrewAI

        logger.info(f"CrewAI process completed. Found {len(matched_jobs)} matched jobs meeting criteria.")

        # 4. Store the matched results (returned by CrewAI)
        #    This might involve a modified 'store_scraped_jobs' or a new function
        #    depending on the format returned by CrewAI.
        if matched_jobs:
            # store_crewai_matches(matched_jobs, user_id, resume_id, config_id)
            logger.info(f"Storing {len(matched_jobs)} matches from CrewAI.")
            # Placeholder for storing logic - adapt based on CrewAI output and DB schema
            pass # Implement storage logic here

        # 5. Update Configuration Status
        supabase.table('scraper_configurations').update({
            'last_run': datetime.datetime.now().isoformat(),
            'last_error': None
        }).eq('id', config_id).execute()

        # 6. Handle Notifications (Email/Browser)
        #    This logic could be triggered here based on 'matched_jobs'
        #    or potentially handled within a CrewAI agent.
        if matched_jobs:
            # trigger_notifications(user_id, matched_jobs)
            logger.info("Placeholder for triggering notifications.")
            pass # Implement notification logic here


    except Exception as e:
        logger.exception(f"Error during CrewAI job processing for config {config_id}: {e}")
        # Update config with error status
        try:
            supabase.table('scraper_configurations').update({
                'last_error': str(e),
                'last_run': datetime.datetime.now().isoformat()
            }).eq('id', config_id).execute()
        except Exception as update_err:
            logger.error(f"Failed to update config error status: {update_err}")


# --- Removed Functions ---

# def extract_keywords_from_resume(resume_data: Dict) -> List[str]:
#     """Extracts relevant keywords from parsed resume data."""
#     # Example: Combine skills and job titles
#     keywords = resume_data.get('skills', [])
#     # Add logic to extract keywords from experience, etc.
#     logger.info(f"Extracted keywords from resume: {keywords[:10]}...") # Log first few
#     return keywords

# def search_linkedin(params: Dict) -> List[Dict]:
#     """Searches jobs (potentially including LinkedIn) using Serper Google Jobs API."""
#     logger.info(f"Searching jobs via Serper with params: {params}")
#     serper_api_key = os.getenv("SERPER_API_KEY")
#     if not serper_api_key:
#         logger.error("SERPER_API_KEY not found in environment variables.")
#         return []

#     search_url = "https://google.serper.dev/jobs"

#     # Construct the query string
#     query_parts = []
#     if params.get("keywords"):
#         query_parts.extend(params["keywords"])
#     if params.get("job_types"):
#         query_parts.extend(params["job_types"])
#     # Serper might primarily use location in the 'q' parameter or specific location params
#     if params.get("locations"):
#         query_parts.append(f"in {', '.join(params['locations'])}")

#     query = " ".join(filter(None, query_parts))
#     if not query:
#         logger.warning("No keywords or location provided for Serper search.")
#         return []

#     payload = json.dumps({
#         "q": query,
#         "num": 20 # Request more results (adjust as needed)
#         # Add location parameter if Serper API supports it separately
#         # "location": ", ".join(params.get("locations", []))
#     })

#     headers = {
#         'X-API-KEY': serper_api_key,
#         'Content-Type': 'application/json'
#     }

#     jobs_found = []
#     try:
#         response = requests.post(search_url, headers=headers, data=payload, timeout=30)
#         response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
#         results = response.json()

#         if 'jobs' in results:
#             logger.info(f"Serper returned {len(results['jobs'])} potential job results.")
#             for job in results['jobs']:
#                 # Standardize the output format
#                 standardized_job = {
#                     "title": job.get("title"),
#                     "company": job.get("company_name"),
#                     "location": job.get("location"),
#                     "description": job.get("description"), # Often truncated
#                     "url": job.get("job_url") or job.get("related_links", [{}])[0].get("link"), # Prioritize direct job URL
#                     "source_platform": "Serper/GoogleJobs", # Indicate the source
#                     "via": job.get("via"), # e.g., "via LinkedIn"
#                     "posted_at_string": job.get("detected_extensions", {}).get("posted_at"),
#                     # Add other fields as needed from Serper response
#                 }
#                 # Basic filtering: Ensure essential fields are present
#                 if standardized_job["title"] and standardized_job["company"] and standardized_job["url"]:
#                     jobs_found.append(standardized_job)

#     except requests.exceptions.RequestException as e:
#         logger.error(f"Error calling Serper API: {e}")
#     except json.JSONDecodeError:
#         logger.error("Error decoding Serper API response JSON.")
#     except Exception as e:
#         logger.exception(f"Unexpected error during Serper job search: {e}") # Use exception for traceback

#     logger.info(f"Returning {len(jobs_found)} standardized jobs from Serper search.")
#     return jobs_found


# def search_glassdoor(params: Dict) -> List[Dict]:
#     """Searches jobs (potentially including Glassdoor) using Serper Google Jobs API."""
#     # This function is essentially the same as search_linkedin as it uses the same Serper endpoint.
#     # We keep it separate for logical clarity and potential future adaptation if a Glassdoor-specific API/method is used.
#     logger.info(f"Searching jobs (Glassdoor target) via Serper with params: {params}")
#     # Re-use the Serper logic from search_linkedin
#     return search_linkedin(params) # For now, just call the same function

# def search_indeed(params: Dict) -> List[Dict]:
#     """Searches jobs (potentially including Indeed) using Serper Google Jobs API."""
#     # This function is essentially the same as search_linkedin as it uses the same Serper endpoint.
#     # We keep it separate for logical clarity and potential future adaptation if an Indeed-specific API/method is used.
#     logger.info(f"Searching jobs (Indeed target) via Serper with params: {params}")
#     # Re-use the Serper logic from search_linkedin
#     return search_linkedin(params) # For now, just call the same function

# def deduplicate_jobs(jobs: List[Dict]) -> List[Dict]:
#     """Deduplicates job listings based on a composite key of title, company, and location."""
#     logger.info(f"Deduplicating {len(jobs)} raw job results...")
#     unique_jobs_dict = {}
#     duplicates_removed = 0
#     for job in jobs:
#         # Normalize key fields for comparison
#         title = job.get('title', '').strip().lower()
#         company = job.get('company', '').strip().lower()
#         location = job.get('location', '').strip().lower()
#         # Create a unique key tuple
#         key = (title, company, location)

#         # If the key hasn't been seen, add the job to the dictionary
#         if key not in unique_jobs_dict:
#             unique_jobs_dict[key] = job
#         else:
#             duplicates_removed += 1
#             # Optional: Logic to merge or prioritize jobs if duplicates are found
#             # For example, prefer the one with a more complete description or specific source
#             # current_job = unique_jobs_dict[key]
#             # if len(job.get('description', '')) > len(current_job.get('description', '')):
#             #     unique_jobs_dict[key] = job # Replace if new job has longer description

#     result = list(unique_jobs_dict.values())
#     logger.info(f"Removed {duplicates_removed} duplicates. Returning {len(result)} unique jobs.")
#     return result

# def store_scraped_jobs(jobs: List[Dict], user_id: str, config_id: str):
#     """Stores standardized job data into the Supabase 'scraped_jobs' table."""
#     if not jobs:
#         logger.info("No unique jobs to store.")
#         return

#     logger.info(f"Attempting to store {len(jobs)} unique jobs for user {user_id}, config {config_id}...")
#     supabase = get_supabase_client()
#     jobs_to_insert = []

#     for job in jobs:
#         # Map standardized job keys to 'scraped_jobs' table columns
#         # Adjust column names based on your actual Supabase table schema
#         job_data = {
#             'title': job.get('title'),
#             'company_name': job.get('company'), # Assuming table column is 'company_name'
#             'location': job.get('location'),
#             'description': job.get('description'),
#             'job_url': job.get('url'),
#             'source_platform': job.get('source_platform'),
#             'via': job.get('via'), # e.g., "via LinkedIn"
#             'posted_at_string': job.get('posted_at_string'), # Store the string representation
#             'configuration_id': config_id, # Link to the agent configuration
#             'user_id': user_id, # Link to the user
#             # Add other relevant fields if they exist in your table schema
#             # 'salary_min': ...,
#             # 'salary_max': ...,
#             # 'job_type': ...,
#             # 'scraped_at': datetime.datetime.now().isoformat() # Add timestamp
#         }
#         # Remove keys with None values if your DB constraints require it
#         job_data_cleaned = {k: v for k, v in job_data.items() if v is not None}
#         jobs_to_insert.append(job_data_cleaned)

#     if jobs_to_insert:
#         try:
#             # Use upsert=True if you have unique constraints (e.g., on job_url or title+company+location)
#             # and want to update existing entries. Define the 'on_conflict' column(s).
#             # If no unique constraints or you want duplicates possible (not recommended), use insert directly.
#             # Assuming 'job_url' is a unique identifier for upsert:
#             # result = supabase.table('scraped_jobs').upsert(jobs_to_insert, on_conflict='job_url').execute()

#             # Simple insert for now (adjust based on your table's constraints)
#             result = supabase.table('scraped_jobs').insert(jobs_to_insert).execute()

#             # Check for errors in the response if possible (depends on Supabase client version)
#             # if hasattr(result, 'error') and result.error:
#             #    logger.error(f"Supabase error storing jobs: {result.error}")
#             # elif result.data:
#             #    logger.info(f"Successfully stored/updated {len(result.data)} jobs in database.")
#             # else:
#             #    logger.warning("Supabase insert/upsert operation completed, but no data returned in response.")
#             logger.info(f"Supabase insert operation for {len(jobs_to_insert)} jobs completed. Check DB for results.")


#     except Exception as e:
#         logger.exception(f"Database error storing jobs: {e}") # Use exception for traceback

# --- Existing run_job_matching function ---
# This function can remain largely the same, as it operates on the
# 'scraped_jobs' table which will now be populated by trigger_multi_platform_job_search
def run_job_matching(user_id: str, resume_id: str) -> None:
    """
    Run the job matching algorithm to find matching jobs for a resume
    against jobs stored in the database.
    """
    logger.info(f"Running job matching for user: {user_id}, resume: {resume_id}")
    # ... (rest of the function remains the same, fetching parsed_resume and scraped_jobs from DB) ...

def calculate_match_score(parsed_resume: Dict[str, Any], job: Dict[str, Any]) -> tuple:
    """
    Calculate the match score between a resume and a job.
    """
    # Extract resume data
    resume_skills = parsed_resume.get('skills', [])
    resume_text = parsed_resume.get('full_text', '')
    
    # Extract job data
    job_title = job.get('title', '')
    job_description = job.get('description', '')
    job_requirements = job.get('requirements', [])
    
    # Extract skills from job description and requirements
    job_skills = extract_skills_from_job(job_description, job_requirements)
    
    # Calculate skill match
    matched_skills = []
    for skill in resume_skills:
        if skill.lower() in [js.lower() for js in job_skills]:
            matched_skills.append(skill)
    
    skill_match_score = 0
    if job_skills:
        skill_match_score = (len(matched_skills) / len(job_skills)) * 100
    
    # Calculate text similarity using TF-IDF and cosine similarity
    text_similarity_score = 0
    if resume_text and job_description:
        tfidf_vectorizer = TfidfVectorizer()
        try:
            tfidf_matrix = tfidf_vectorizer.fit_transform([resume_text, job_description])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            text_similarity_score = similarity * 100
        except Exception as e:
            logger.error(f"Error calculating text similarity: {str(e)}")
            # Continue with other matching methods even if this fails
    
    # Calculate overall match score
    # Weight the components based on importance
    skill_weight = 0.6
    text_weight = 0.4
    
    overall_score = (skill_match_score * skill_weight) + (text_similarity_score * text_weight)
    
    # Ensure score is between 0-100 and round to 2 decimal places
    final_score = round(min(max(overall_score, 0), 100), 2)
    
    return final_score, matched_skills

def extract_skills_from_job(job_description: str, job_requirements: List[str]) -> List[str]:
    """
    Extract skills from job description and requirements.
    """
    from handlers.resume_parser import COMMON_SKILLS
    
    skills = []
    
    # Combine job description and requirements into one text
    full_text = job_description + " " + " ".join(job_requirements)
    full_text = full_text.lower()
    
    # Look for skills in the text
    for skill in COMMON_SKILLS:
        # For single word skills
        if len(skill.split()) == 1:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, full_text):
                skills.append(skill)
        # For multi-word skills
        else:
            if skill.lower() in full_text:
                skills.append(skill)
    
    # Add skills directly mentioned in requirements
    for req in job_requirements:
        req_lower = req.lower()
        for skill in COMMON_SKILLS:
            if skill.lower() in req_lower:
                skills.append(skill)
    
    # Remove duplicates and sort
    return sorted(list(set(skills)))

def get_job_matches(user_id: str, resume_id: str) -> Dict[str, Any]:
    """
    Retrieve job matches for a user's resume.
    """
    try:
        # Validate resume ID
        validate_resume_id(resume_id)
        
        # Get matches from database
        supabase = get_supabase_client()
        matches_result = supabase.table('job_matches').select('*').eq('user_id', user_id).eq('resume_id', resume_id).order('match_score', {"ascending": False}).execute()
        
        if not matches_result.data:
            logger.info(f"No job matches found for user: {user_id}, resume: {resume_id}")
            return {"matches": []}
            
        matches = matches_result.data
        logger.info(f"Retrieved {len(matches)} job matches")
        
        # Get job details for each match
        job_ids = [match['job_id'] for match in matches]
        
        jobs_details = []
        for job_id in job_ids:
            job_result = supabase.table('scraped_jobs').select('*').eq('id', job_id).execute()
            if job_result.data:
                jobs_details.append(job_result.data[0])
        
        # Combine match data with job details
        full_matches = []
        for match in matches:
            job = next((j for j in jobs_details if j['id'] == match['job_id']), None)
            if job:
                full_matches.append({
                    "match_id": match['id'],
                    "match_score": match['match_score'],
                    "matched_skills": match['skills_matched'],
                    "job": job
                })
        
        return {"matches": full_matches}
        
    except AppError:
        # Re-raise application errors
        raise
    except Exception as e:
        logger.error(f"Error retrieving job matches: {str(e)}")
        raise AppError(f"Failed to retrieve job matches: {str(e)}", 500)
