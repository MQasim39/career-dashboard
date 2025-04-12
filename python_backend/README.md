
# Job Scraper and Resume Parser Backend

This Python backend uses Flask to provide APIs for job scraping and resume parsing functionality.

## Features

- **Resume Parsing**: Extract structured information from PDF and DOCX resumes
- **Job Scraping**: Scrape job listings from various sources using Firecrawl
- **Job Matching**: Match resumes to job listings based on skills and content
- **AI Agent**: Configure and run job matching agents for users

## Setup and Deployment

### Prerequisites

- Python 3.10+
- Supabase project with the required tables
- Firecrawl API key

### Local Development

1. Clone this repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and fill in the required values
6. Run the application: `flask run`

### Deployment to AWS Lambda

1. Install AWS CLI and AWS SAM CLI
2. Build the Lambda package:
   ```
   sam build
   ```
3. Deploy to AWS:
   ```
   sam deploy --guided
   ```

### Deployment to Google Cloud Functions

1. Install Google Cloud SDK
2. Deploy to Google Cloud Functions:
   ```
   gcloud functions deploy job-functions \
     --runtime python310 \
     --trigger-http \
     --allow-unauthenticated \
     --entry-point app
   ```

## API Documentation

### Resume Parsing

**Endpoint**: `/parse-resume`
**Method**: POST
**Authentication**: Bearer token required

**Request**:
- Form data with file attachment
- Form fields:
  - resumeId: UUID of the resume
  - userId: UUID of the user

**Response**:
```json
{
  "success": true,
  "data": {
    "skills": ["python", "javascript", "react"],
    "education": [
      {
        "degree": "Bachelor of Science",
        "school": "Example University",
        "dates": "2016-2020"
      }
    ],
    "experience": [
      {
        "title": "Software Engineer",
        "company": "Example Company",
        "dates": "Jan 2020 - Present",
        "description": "Developed web applications using React and Node.js"
      }
    ],
    "personal_info": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "123-456-7890",
      "location": "New York, NY"
    },
    "full_text": "Full resume text..."
  }
}
```

### Job Scraping

**Endpoint**: `/scrape-jobs`
**Method**: POST
**Authentication**: Bearer token required

**Request**:
```json
{
  "configurationId": "uuid-of-scraper-configuration"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "configuration_id": "uuid-of-scraper-configuration",
    "jobs_scraped": 15,
    "status": "completed"
  }
}
```

### Activate Agent

**Endpoint**: `/activate-agent`
**Method**: POST
**Authentication**: Bearer token required

**Request**:
```json
{
  "user_id": "user-uuid",
  "resume_id": "resume-uuid",
  "location": "New York",
  "job_type": "full-time",
  "department": "Engineering",
  "salary_range": [50000, 120000],
  "email_alerts": true,
  "browser_alerts": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "AI agent activated successfully",
  "config_id": "uuid-of-agent-configuration"
}
```

### Job Matches

**Endpoint**: `/job-matches`
**Method**: GET
**Authentication**: Bearer token required

**Query Parameters**:
- user_id: UUID of the user
- resume_id: UUID of the resume

**Response**:
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "match_id": "match-uuid",
        "match_score": 85.5,
        "matched_skills": ["python", "javascript", "react"],
        "job": {
          "id": "job-uuid",
          "title": "Frontend Developer",
          "company": "Example Inc",
          "location": "New York, NY",
          "description": "Job description...",
          "url": "https://example.com/job",
          "requirements": ["3+ years experience", "Bachelor's degree"],
          "salary_range": "$70,000 - $90,000",
          "job_type": "Full-time"
        }
      }
    ]
  }
}
```

## Authentication

This API requires authentication using a bearer token from Supabase. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Error Handling

Errors are returned in a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (if available)"
}
```
