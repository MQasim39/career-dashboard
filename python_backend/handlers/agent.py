
import os
import logging
import json
from typing import Dict, List, Any, Optional
import uuid
from utils.supabase_client import get_supabase_client
from utils.error_handler import AppError
from utils.claude_client import ClaudeClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re

logger = logging.getLogger(__name__)

# Initialize Claude client
claude_client = None
try:
    claude_client = ClaudeClient()
    logger.info("Claude client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Claude client: {str(e)}")

def activate_agent(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Activate the job matching agent for a user.
    """
    try:
        user_id = data.get('user_id')
        resume_id = data.get('resume_id')
        
        if not user_id or not resume_id:
            raise AppError("Missing user_id or resume_id", 400)
            
        logger.info(f"Activating agent for user: {user_id}, resume: {resume_id}")
        
        # Validate resume format
        validate_resume_id(resume_id)
        
        # Check if resume exists and belongs to user
        supabase = get_supabase_client()
        resume_result = supabase.table('resumes').select('*').eq('id', resume_id).eq('user_id', user_id).execute()
        
        if not resume_result.data:
            logger.error(f"Resume not found or does not belong to user: {resume_id}")
            raise AppError("Resume not found or does not belong to user", 404)
            
        # Get or create an agent configuration
        config_id = setup_agent_configuration(data)
        
        # Trigger initial job matching
        run_job_matching(user_id, resume_id)
        
        return {
            "success": True,
            "message": "AI agent activated successfully",
            "config_id": config_id
        }
    
    except AppError:
        # Re-raise application errors
        raise
    except Exception as e:
        logger.error(f"Unexpected error activating agent: {str(e)}")
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

def run_job_matching(user_id: str, resume_id: str) -> None:
    """
    Run the job matching algorithm to find matching jobs for a resume.
    """
    logger.info(f"Running job matching for user: {user_id}, resume: {resume_id}")
    
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Get parsed resume
        parsed_resume_result = supabase.table('parsed_resumes').select('*').eq('resume_id', resume_id).eq('user_id', user_id).execute()
        
        if not parsed_resume_result.data:
            logger.error(f"Parsed resume not found for resume ID: {resume_id}")
            raise AppError("Resume has not been parsed yet", 404)
            
        parsed_resume = parsed_resume_result.data[0]
        
        # Get resume file path
        resume_result = supabase.table('resumes').select('*').eq('id', resume_id).execute()
        if not resume_result.data:
            logger.error(f"Resume not found: {resume_id}")
            raise AppError("Resume not found", 404)
        
        # Get jobs to match against
        jobs_result = supabase.table('scraped_jobs').select('*').execute()
        jobs = jobs_result.data
        
        if not jobs:
            logger.info("No jobs found to match against")
            return
        
        logger.info(f"Matching resume against {len(jobs)} jobs")
        
        # Use Claude to enhance job matching if available
        use_claude = claude_client is not None
        if use_claude:
            logger.info("Using Claude for enhanced job matching")
        else:
            logger.info("Claude client not available, using basic matching")
        
        # Calculate matches for each job
        matches = []
        
        for job in jobs:
            job_id = job['id']
            
            try:
                # Calculate match score with Claude if available
                if use_claude:
                    # Get full resume text
                    resume_text = parsed_resume.get('full_text', '')
                    
                    # Combine job data
                    job_text = f"{job.get('title', '')}\n{job.get('description', '')}\n"
                    for req in job.get('requirements', []):
                        job_text += f"- {req}\n"
                    
                    # Use Claude to enhance matching
                    match_data = claude_client.enhance_job_matching(
                        {
                            "skills": parsed_resume.get('skills', []),
                            "experience": parsed_resume.get('experience', []),
                            "education": parsed_resume.get('education', []),
                            "full_text": resume_text
                        },
                        {
                            "title": job.get('title', ''),
                            "company": job.get('company', ''),
                            "description": job.get('description', ''),
                            "requirements": job.get('requirements', [])
                        }
                    )
                    
                    match_score = match_data.get('match_score', 0)
                    matched_skills = match_data.get('matching_skills', [])
                    
                else:
                    # Fall back to traditional matching
                    match_score, matched_skills = calculate_match_score(parsed_resume, job)
                
                if match_score >= 70:  # Only store high-quality matches
                    # Prepare match record
                    match_record = {
                        'user_id': user_id,
                        'resume_id': resume_id,
                        'job_id': job_id,
                        'match_score': match_score,
                        'skills_matched': matched_skills
                    }
                    
                    matches.append(match_record)
            except Exception as e:
                logger.error(f"Error calculating match for job {job_id}: {str(e)}")
                # Continue processing other jobs
        
        # Store matches in database
        if matches:
            logger.info(f"Storing {len(matches)} job matches")
            
            # First delete existing matches for this resume
            supabase.table('job_matches').delete().eq('resume_id', resume_id).execute()
            
            # Insert new matches
            for match in matches:
                supabase.table('job_matches').insert(match).execute()
    
    except AppError:
        # Re-raise application errors
        raise
    except Exception as e:
        logger.error(f"Error running job matching: {str(e)}")
        raise AppError(f"Job matching failed: {str(e)}", 500)

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
