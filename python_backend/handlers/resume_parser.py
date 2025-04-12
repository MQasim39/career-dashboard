
import os
import logging
import tempfile
import PyPDF2
import docx
import re
import json
from typing import Dict, List, Any, Optional
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from utils.supabase_client import get_supabase_client
from utils.error_handler import AppError

# Download NLTK data
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

logger = logging.getLogger(__name__)

# Common skills list - can be expanded with more domain-specific skills
COMMON_SKILLS = [
    "python", "javascript", "typescript", "react", "vue", "angular", 
    "node.js", "express", "flask", "django", "fastapi", "aws", "azure", 
    "gcp", "docker", "kubernetes", "ci/cd", "git", "sql", "nosql", 
    "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "kafka", 
    "rabbitmq", "graphql", "rest", "api", "html", "css", "sass", "less", 
    "webpack", "babel", "typescript", "java", "c#", "c++", "go", "rust", 
    "swift", "kotlin", "android", "ios", "mobile", "react native", "flutter",
    "machine learning", "ai", "data science", "tensorflow", "pytorch", 
    "scikit-learn", "nlp", "computer vision", "statistics", "data analysis",
    "data visualization", "d3.js", "tableau", "power bi", "excel", "word",
    "powerpoint", "project management", "agile", "scrum", "kanban", "jira",
    "confluence", "leadership", "communication", "teamwork", "problem solving"
]

def extract_text_from_pdf(file_obj) -> str:
    """
    Extract text content from a PDF file.
    """
    # Save uploaded file to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp:
        file_obj.save(temp.name)
        temp_path = temp.name
    
    # Extract text from PDF
    try:
        text = ""
        with open(temp_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Log PDF structure for debugging
            logger.info(f"PDF has {len(pdf_reader.pages)} pages")
            
            # Extract text from each page
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                
                if not page_text or page_text.isspace():
                    logger.warning(f"Page {page_num} appears to be empty or contains non-extractable content")
                    continue
                    
                text += page_text + "\n"
        
        # Clean up the temporary file
        os.unlink(temp_path)
        
        if not text or text.isspace():
            logger.error("Failed to extract any text from PDF")
            raise AppError("Failed to extract text from PDF", 422, {"file_type": "pdf"})
            
        return text
    except Exception as e:
        # Clean up the temporary file in case of exception
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise AppError(f"PDF parsing error: {str(e)}", 422, {"file_type": "pdf"})

def extract_text_from_docx(file_obj) -> str:
    """
    Extract text content from a DOCX file.
    """
    # Save uploaded file to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp:
        file_obj.save(temp.name)
        temp_path = temp.name
    
    # Extract text from DOCX
    try:
        doc = docx.Document(temp_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        
        # Clean up the temporary file
        os.unlink(temp_path)
        
        if not text or text.isspace():
            logger.error("Failed to extract any text from DOCX")
            raise AppError("Failed to extract text from DOCX", 422, {"file_type": "docx"})
            
        return text
    except Exception as e:
        # Clean up the temporary file in case of exception
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        
        logger.error(f"Error extracting text from DOCX: {str(e)}")
        raise AppError(f"DOCX parsing error: {str(e)}", 422, {"file_type": "docx"})

def extract_skills(text: str) -> List[str]:
    """
    Extract skills from resume text using NLP techniques.
    """
    # Tokenize and normalize the text
    tokens = word_tokenize(text.lower())
    
    # Remove stopwords and punctuation
    stop_words = set(stopwords.words('english'))
    filtered_tokens = [word for word in tokens if word.isalnum() and word not in stop_words]
    
    # Find skills based on the COMMON_SKILLS list
    skills = []
    for skill in COMMON_SKILLS:
        skill_words = skill.lower().split()
        if len(skill_words) == 1:
            if skill in filtered_tokens:
                skills.append(skill)
        else:
            # For multi-word skills, check if they appear in the text
            if all(word in filtered_tokens for word in skill_words):
                skills.append(skill)
    
    # Remove duplicates and sort
    return sorted(list(set(skills)))

def extract_education(text: str) -> List[Dict[str, str]]:
    """
    Extract education information from resume text.
    """
    education_list = []
    
    # Regular expressions for education detection
    degree_pattern = r'(bachelor|master|doctorate|phd|bs|ms|ba|ma|mba|b\.s\.|m\.s\.|b\.a\.|m\.a\.|m\.b\.a\.|associate)'
    school_pattern = r'(university|college|institute|school)'
    year_pattern = r'(19|20)\d{2}'
    
    # Find potential education sections
    lines = text.split('\n')
    for i, line in enumerate(lines):
        line_lower = line.lower()
        
        # Check if line contains education keywords
        if re.search(degree_pattern, line_lower) or re.search(school_pattern, line_lower):
            degree = "Unknown Degree"
            school = "Unknown Institution"
            dates = ""
            
            # Extract degree
            degree_match = re.search(degree_pattern, line_lower)
            if degree_match:
                # Try to extract full degree name (e.g., "Bachelor of Science")
                degree_context = line
                degree = degree_context.strip()
            
            # Extract school name
            school_match = re.search(school_pattern, line_lower)
            if school_match:
                # Try to extract full school name
                school_context = line
                school = school_context.strip()
            
            # Try to find dates in this line or next few lines
            date_match = re.search(year_pattern, line)
            if date_match:
                dates = line
            else:
                # Look in next few lines for dates
                for j in range(1, 4):
                    if i + j < len(lines):
                        date_match = re.search(year_pattern, lines[i + j])
                        if date_match:
                            dates = lines[i + j]
                            break
            
            education_list.append({
                "degree": degree,
                "school": school,
                "dates": dates
            })
    
    return education_list

def extract_experience(text: str) -> List[Dict[str, str]]:
    """
    Extract work experience information from resume text.
    """
    experience_list = []
    
    # Regular expressions for experience detection
    job_title_patterns = [
        r'(engineer|developer|manager|director|analyst|consultant|specialist|coordinator|associate|assistant|lead|senior|junior)'
    ]
    company_patterns = [
        r'(company|corporation|inc|llc|ltd)'
    ]
    date_pattern = r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec).*(19|20)\d{2}\s*(-|to|–|—)\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec).*(19|20)\d{2}|(19|20)\d{2}\s*(-|to|–|—)\s*(19|20)\d{2}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec).*(19|20)\d{2}\s*(-|to|–|—)\s*present)'
    
    # Find potential experience sections
    lines = text.split('\n')
    for i, line in enumerate(lines):
        line_lower = line.lower()
        
        # Check if line contains job title keywords
        if any(re.search(pattern, line_lower) for pattern in job_title_patterns):
            title = line.strip()
            company = "Unknown Company"
            dates = ""
            description = ""
            
            # Look for company name in the same line or next line
            company_match = any(re.search(pattern, line_lower) for pattern in company_patterns)
            if company_match:
                company = line.strip()
            elif i + 1 < len(lines) and any(re.search(pattern, lines[i + 1].lower()) for pattern in company_patterns):
                company = lines[i + 1].strip()
            
            # Look for dates
            date_match = re.search(date_pattern, line_lower)
            if date_match:
                dates = date_match.group(0)
            else:
                # Look in nearby lines for dates
                for j in range(1, 3):
                    if i + j < len(lines):
                        date_match = re.search(date_pattern, lines[i + j].lower())
                        if date_match:
                            dates = date_match.group(0)
                            break
            
            # Collect job description from subsequent lines
            description_lines = []
            for j in range(1, 10):  # Look at next 10 lines max
                if i + j < len(lines) and lines[i + j].strip() and not any(re.search(pattern, lines[i + j].lower()) for pattern in job_title_patterns):
                    description_lines.append(lines[i + j].strip())
                else:
                    break
            
            description = " ".join(description_lines)
            
            experience_list.append({
                "title": title,
                "company": company,
                "dates": dates,
                "description": description
            })
    
    return experience_list

def extract_personal_info(text: str) -> Dict[str, str]:
    """
    Extract personal information from resume text.
    """
    # Regular expressions for contact info
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    phone_pattern = r'(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}'
    location_pattern = r'[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}'  # City, State format
    
    # Extract information
    email_match = re.search(email_pattern, text)
    phone_match = re.search(phone_pattern, text)
    location_match = re.search(location_pattern, text)
    
    # Try to extract name from the beginning of the resume
    name = ""
    lines = text.split('\n')
    for line in lines[:5]:  # Check first 5 lines
        # Name is often in all caps or is the first line with 2-3 words
        if line.isupper() or (len(line.split()) in [2, 3] and all(word.strip() for word in line.split())):
            name = line.strip()
            break
    
    return {
        "name": name,
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0) if phone_match else "",
        "location": location_match.group(0) if location_match else ""
    }

def parse_resume(file, resume_id, user_id) -> Dict[str, Any]:
    """
    Main function to parse resume file and extract structured information.
    """
    try:
        logger.info(f"Starting resume parsing for resume ID: {resume_id}, user ID: {user_id}")
        
        # Check file type and extract text
        file_type = file.content_type
        logger.info(f"File type: {file_type}")
        
        if 'pdf' in file_type:
            text = extract_text_from_pdf(file)
        elif 'word' in file_type or 'docx' in file_type:
            text = extract_text_from_docx(file)
        else:
            logger.error(f"Unsupported file type: {file_type}")
            raise AppError(f"Unsupported file type: {file_type}", 415)
        
        logger.info(f"Successfully extracted text from resume, length: {len(text)}")
        
        # Extract structured information
        skills = extract_skills(text)
        education = extract_education(text)
        experience = extract_experience(text)
        personal_info = extract_personal_info(text)
        
        # Prepare the parsed data
        parsed_data = {
            "skills": skills,
            "education": education,
            "experience": experience,
            "personal_info": personal_info,
            "full_text": text
        }
        
        # Store the parsed data in Supabase
        supabase = get_supabase_client()
        
        # First check if a parsed resume already exists for this resume_id
        existing_data = supabase.table('parsed_resumes').select('id').eq('resume_id', resume_id).execute()
        
        if existing_data.data:
            # Update existing record
            logger.info(f"Updating existing parsed resume for resume ID: {resume_id}")
            result = supabase.table('parsed_resumes').update({
                'skills': skills,
                'education': json.dumps(education),
                'experience': json.dumps(experience),
                'personal_info': json.dumps(personal_info),
                'full_text': text,
                'updated_at': 'now()'
            }).eq('resume_id', resume_id).execute()
        else:
            # Insert new record
            logger.info(f"Creating new parsed resume for resume ID: {resume_id}")
            result = supabase.table('parsed_resumes').insert({
                'user_id': user_id,
                'resume_id': resume_id,
                'skills': skills,
                'education': json.dumps(education),
                'experience': json.dumps(experience),
                'personal_info': json.dumps(personal_info),
                'full_text': text
            }).execute()
        
        if 'error' in result and result['error']:
            logger.error(f"Error storing parsed resume: {result['error']}")
            raise AppError("Error storing parsed resume data", 500)
            
        logger.info(f"Resume parsing completed successfully for resume ID: {resume_id}")
        
        return parsed_data
        
    except AppError:
        # Re-raise application errors
        raise
    except Exception as e:
        logger.error(f"Unexpected error parsing resume: {str(e)}")
        raise AppError(f"Resume parsing failed: {str(e)}", 500)
