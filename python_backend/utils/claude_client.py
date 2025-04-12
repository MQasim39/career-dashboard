
import os
import logging
import json
from typing import Dict, List, Any, Optional
from anthropic import Anthropic
import time

logger = logging.getLogger(__name__)

class ClaudeClient:
    """
    Client for interacting with Claude API for resume analysis and job matching.
    """
    def __init__(self):
        self.api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            logger.error("Claude API key not found in environment variables")
            raise ValueError("Missing Claude API key")
        
        self.client = Anthropic(api_key=self.api_key)
        
        # Rate limiting configuration
        self.requests_per_minute = 20  # Adjust based on your Claude API tier
        self.request_timestamps = []
        
        # Caching for similar requests
        self.cache = {}
        self.cache_ttl = 3600  # Cache TTL in seconds (1 hour)
        
        logger.info("Claude client initialized")

    def _enforce_rate_limit(self):
        """
        Enforce rate limiting to prevent exceeding API limits.
        Implements a rolling window approach for rate limiting.
        """
        current_time = time.time()
        
        # Remove timestamps older than 1 minute
        self.request_timestamps = [ts for ts in self.request_timestamps 
                                  if current_time - ts < 60]
        
        # If we've reached the limit, wait until we can make another request
        if len(self.request_timestamps) >= self.requests_per_minute:
            oldest_timestamp = min(self.request_timestamps)
            sleep_time = 60 - (current_time - oldest_timestamp)
            if sleep_time > 0:
                logger.info(f"Rate limit reached, waiting for {sleep_time:.2f} seconds")
                time.sleep(sleep_time)
        
        # Add current request timestamp
        self.request_timestamps.append(time.time())

    def _get_cache_key(self, messages, max_tokens, temperature):
        """Generate a cache key from request parameters"""
        return hash(str(messages) + str(max_tokens) + str(temperature))

    def _check_cache(self, cache_key):
        """Check if a request is cached and still valid"""
        if cache_key in self.cache:
            entry = self.cache[cache_key]
            if time.time() - entry['timestamp'] < self.cache_ttl:
                logger.info("Using cached response")
                return entry['response']
        return None

    def _update_cache(self, cache_key, response):
        """Update the cache with a new response"""
        self.cache[cache_key] = {
            'timestamp': time.time(),
            'response': response
        }
        
        # Clean up old cache entries
        current_time = time.time()
        expired_keys = [k for k, v in self.cache.items() 
                        if current_time - v['timestamp'] > self.cache_ttl]
        for k in expired_keys:
            del self.cache[k]

    def analyze_resume(self, resume_text: str, job_description: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze a resume using Claude to extract key information.
        
        Args:
            resume_text: The full text of the resume
            job_description: Optional job description for targeted analysis
            
        Returns:
            Dict containing structured resume data
        """
        prompt = self._build_resume_analysis_prompt(resume_text, job_description)
        
        # Generate cache key
        cache_key = self._get_cache_key(prompt, 4000, 0.2)
        cached_response = self._check_cache(cache_key)
        if cached_response:
            return cached_response
        
        # Enforce rate limiting
        self._enforce_rate_limit()
        
        try:
            # Make API call to Claude
            logger.info("Sending resume analysis request to Claude")
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20240620",
                max_tokens=4000,
                temperature=0.2,
                system="You are an expert resume parser and job matching assistant. Extract structured information from the resume in JSON format.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Extract and parse JSON from the response
            response_text = response.content[0].text
            try:
                # Try to extract JSON from the response
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    result = json.loads(json_str)
                else:
                    # Fallback if no JSON is found
                    logger.warning("No JSON found in Claude response, using structured extraction")
                    result = self._structured_extraction(resume_text)
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON from Claude response, using structured extraction")
                result = self._structured_extraction(resume_text)
            
            # Cache the result
            self._update_cache(cache_key, result)
            return result
            
        except Exception as e:
            logger.error(f"Error in Claude API call: {str(e)}")
            # Fallback to basic extraction when Claude API fails
            return self._structured_extraction(resume_text)

    def enhance_job_matching(self, resume_data: Dict[str, Any], job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhance job matching results using Claude.
        
        Args:
            resume_data: Structured resume data
            job_data: Job listing data
            
        Returns:
            Enhanced matching results with explanations
        """
        prompt = self._build_job_matching_prompt(resume_data, job_data)
        
        # Generate cache key
        cache_key = self._get_cache_key(prompt, 2000, 0.3)
        cached_response = self._check_cache(cache_key)
        if cached_response:
            return cached_response
        
        # Enforce rate limiting
        self._enforce_rate_limit()
        
        try:
            # Make API call to Claude
            logger.info("Sending job matching request to Claude")
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20240620",
                max_tokens=2000,
                temperature=0.3,
                system="You are an expert job matching assistant. Analyze the match between a resume and job, providing detailed explanations in JSON format.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Extract and parse JSON from the response
            response_text = response.content[0].text
            try:
                # Try to extract JSON from the response
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    result = json.loads(json_str)
                else:
                    # Fallback if no JSON is found
                    logger.warning("No JSON found in Claude response, using basic matching")
                    result = self._basic_matching(resume_data, job_data)
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON from Claude response, using basic matching")
                result = self._basic_matching(resume_data, job_data)
            
            # Cache the result
            self._update_cache(cache_key, result)
            return result
            
        except Exception as e:
            logger.error(f"Error in Claude API call: {str(e)}")
            # Fallback to basic matching when Claude API fails
            return self._basic_matching(resume_data, job_data)

    def _build_resume_analysis_prompt(self, resume_text: str, job_description: Optional[str] = None) -> str:
        """
        Build a prompt for resume analysis.
        """
        prompt = "Parse the following resume and extract structured information in JSON format. Include:\n"
        prompt += "- personal_info (name, email, phone, location, etc.)\n"
        prompt += "- skills (technical skills, soft skills, languages, etc.)\n"
        prompt += "- experience (work history with company, title, dates, and responsibilities)\n"
        prompt += "- education (degrees, institutions, dates, etc.)\n"
        prompt += "- certifications\n\n"
        
        if job_description:
            prompt += "Also identify key skills and experiences that match the following job description:\n\n"
            prompt += f"{job_description}\n\n"
            
        prompt += "Resume text:\n\n"
        prompt += resume_text
        prompt += "\n\nProvide your analysis in valid JSON format."
        
        return prompt

    def _build_job_matching_prompt(self, resume_data: Dict[str, Any], job_data: Dict[str, Any]) -> str:
        """
        Build a prompt for job matching enhancement.
        """
        prompt = "Analyze how well this resume matches the job listing. Provide:\n"
        prompt += "- An overall match score (0-100)\n"
        prompt += "- Matching skills and their relevance to the position\n"
        prompt += "- Experience alignment with job requirements\n"
        prompt += "- Areas where the candidate may need additional skills or experience\n"
        prompt += "- Recommendations for how the candidate could improve their resume for this role\n\n"
        
        prompt += "Resume data:\n"
        prompt += json.dumps(resume_data, indent=2)
        prompt += "\n\nJob listing:\n"
        prompt += json.dumps(job_data, indent=2)
        prompt += "\n\nProvide your analysis in valid JSON format."
        
        return prompt

    def _structured_extraction(self, resume_text: str) -> Dict[str, Any]:
        """
        Fallback method for basic structured extraction from resume text.
        """
        logger.info("Using structured extraction fallback")
        
        # Basic extraction logic for when Claude API fails
        import re
        from nltk.tokenize import sent_tokenize, word_tokenize
        
        # Ensure NLTK data is downloaded
        try:
            word_tokenize("Test")
        except LookupError:
            import nltk
            nltk.download('punkt')
        
        # Initialize result structure
        result = {
            "personal_info": {},
            "skills": [],
            "experience": [],
            "education": [],
            "certifications": []
        }
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, resume_text)
        if emails:
            result["personal_info"]["email"] = emails[0]
        
        # Extract phone
        phone_pattern = r'\b(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
        phones = re.findall(phone_pattern, resume_text)
        if phones:
            result["personal_info"]["phone"] = phones[0]
        
        # Extract skills (using a predefined list of common skills)
        common_skills = [
            "python", "java", "javascript", "html", "css", "react", "angular", "vue", 
            "node", "express", "django", "flask", "sql", "nosql", "mongodb", "postgresql", 
            "mysql", "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git", 
            "agile", "scrum", "project management", "leadership", "communication"
        ]
        
        for skill in common_skills:
            if re.search(r'\b' + re.escape(skill) + r'\b', resume_text.lower()):
                result["skills"].append(skill)
        
        # Basic extraction of education (looking for common degrees)
        education_patterns = [
            r'\b(BS|BA|B\.S\.|B\.A\.|Bachelor)[^\n.]*',
            r'\b(MS|MA|M\.S\.|M\.A\.|Master)[^\n.]*',
            r'\b(PhD|Ph\.D\.|Doctor)[^\n.]*'
        ]
        
        for pattern in education_patterns:
            matches = re.findall(pattern, resume_text)
            for match in matches:
                # Extract a reasonable amount of text around the degree mention
                context = re.search(r'([^\n.]*' + re.escape(match) + r'[^\n.]*)', resume_text)
                if context:
                    result["education"].append({"degree": context.group(0).strip()})
        
        return result

    def _basic_matching(self, resume_data: Dict[str, Any], job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback method for basic job matching when Claude API fails.
        """
        logger.info("Using basic matching fallback")
        
        # Extract skills from resume and job
        resume_skills = set([skill.lower() for skill in resume_data.get("skills", [])])
        
        job_skills = set()
        job_description = job_data.get("description", "")
        job_requirements = job_data.get("requirements", [])
        
        # Extract skills from job description and requirements
        from handlers.resume_parser import COMMON_SKILLS
        
        for skill in COMMON_SKILLS:
            # Check job description
            if skill.lower() in job_description.lower():
                job_skills.add(skill.lower())
            
            # Check requirements
            for req in job_requirements:
                if skill.lower() in req.lower():
                    job_skills.add(skill.lower())
        
        # Find matching skills
        matching_skills = resume_skills.intersection(job_skills)
        
        # Calculate match score
        if job_skills:
            match_score = (len(matching_skills) / len(job_skills)) * 100
        else:
            match_score = 0
        
        result = {
            "match_score": round(match_score, 2),
            "matching_skills": list(matching_skills),
            "missing_skills": list(job_skills - resume_skills),
            "recommendations": "Consider highlighting your existing skills that match the job requirements and acquiring skills in the missing areas."
        }
        
        return result
