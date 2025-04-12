
import os
import logging
import json
import requests
from typing import Dict, List, Any, Optional
from utils.supabase_client import get_supabase_client
from utils.error_handler import AppError
import time

logger = logging.getLogger(__name__)

def initialize_firecrawl():
    """
    Initialize Firecrawl client with API key.
    """
    api_key = os.environ.get("FIRECRAWL_API_KEY")
    if not api_key:
        logger.error("Firecrawl API key not found in environment variables")
        raise AppError("Firecrawl API key not configured", 500)
    
    return api_key

def scrape_jobs(config_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to scrape jobs based on configuration.
    """
    try:
        logger.info(f"Starting job scraping with configuration: {config_data['configurationId']}")
        
        # Get Firecrawl API key
        firecrawl_api_key = initialize_firecrawl()
        
        # Fetch scraper configuration details from Supabase
        supabase = get_supabase_client()
        config_id = config_data['configurationId']
        
        config_result = supabase.table('scraper_configurations').select('*').eq('id', config_id).execute()
        
        if not config_result.data:
            logger.error(f"Scraper configuration not found: {config_id}")
            raise AppError(f"Scraper configuration not found: {config_id}", 404)
            
        config = config_result.data[0]
        logger.info(f"Retrieved configuration: {config['name']}")
        
        # Get job source details
        source_id = config.get('source_id')
        if source_id:
            source_result = supabase.table('job_sources').select('*').eq('id', source_id).execute()
            if source_result.data:
                job_source = source_result.data[0]
                source_url = job_source.get('url')
            else:
                source_url = config.get('url')
        else:
            source_url = config.get('url')
        
        if not source_url:
            logger.error("No URL found for job scraping")
            raise AppError("No URL specified for job scraping", 400)
        
        # Prepare Firecrawl parameters
        keywords = " ".join(config.get('keywords', []))
        locations = config.get('locations', [])
        job_types = config.get('job_types', [])
        
        # Construct search URL with parameters if needed
        search_url = source_url
        if keywords and "job board" in source_url.lower():
            search_url = f"{source_url}/search?q={keywords}"
            if locations and len(locations) > 0:
                search_url += f"&location={locations[0]}"
        
        logger.info(f"Scraping URL: {search_url}")
        
        # Call Firecrawl API
        headers = {
            "Authorization": f"Bearer {firecrawl_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "url": search_url,
            "limit": 100,
            "waitForSelector": ".job-listing, .job-card, .job-result"  # Common job listing selectors
        }
        
        logger.info("Calling Firecrawl API")
        response = requests.post(
            "https://api.firecrawl.dev/crawl",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            logger.error(f"Firecrawl API error: {response.status_code} - {response.text}")
            raise AppError(f"Firecrawl API error: {response.status_code}", 500)
            
        crawl_result = response.json()
        logger.info(f"Firecrawl completed with {len(crawl_result.get('results', []))} results")
        
        # Process and extract job listings
        jobs = extract_jobs_from_crawl_result(crawl_result, config)
        
        # Store jobs in Supabase
        if jobs:
            insert_jobs_to_supabase(jobs, config)
            
        # Update configuration with last run timestamp
        update_result = supabase.table('scraper_configurations').update({
            'last_run': 'now()',
            'last_error': None
        }).eq('id', config_id).execute()
        
        # Create a queue record
        queue_result = supabase.table('scraper_queue').insert({
            'configuration_id': config_id,
            'status': 'completed',
            'completed_at': 'now()',
            'result_stats': json.dumps({
                'total_jobs_found': len(jobs),
                'jobs_inserted': len(jobs)
            })
        }).execute()
        
        return {
            "configuration_id": config_id,
            "jobs_scraped": len(jobs),
            "status": "completed"
        }
    
    except AppError:
        # Re-raise application errors
        raise
    except Exception as e:
        logger.error(f"Unexpected error during job scraping: {str(e)}")
        
        # Update configuration with error
        try:
            supabase = get_supabase_client()
            config_id = config_data['configurationId']
            supabase.table('scraper_configurations').update({
                'last_error': str(e)
            }).eq('id', config_id).execute()
            
            # Create a queue record with error
            supabase.table('scraper_queue').insert({
                'configuration_id': config_id,
                'status': 'failed',
                'error_message': str(e)
            }).execute()
        except Exception as update_error:
            logger.error(f"Error updating configuration with error: {str(update_error)}")
        
        raise AppError(f"Job scraping failed: {str(e)}", 500)

def extract_jobs_from_crawl_result(crawl_result: Dict[str, Any], config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract job listing information from Firecrawl results.
    """
    jobs = []
    results = crawl_result.get('results', [])
    
    for result in results:
        html_content = result.get('html', '')
        url = result.get('url', '')
        
        # Extract job information from HTML
        job = extract_job_from_html(html_content, url, config)
        if job:
            jobs.append(job)
    
    logger.info(f"Extracted {len(jobs)} job listings from crawl results")
    return jobs

def extract_job_from_html(html_content: str, url: str, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extract job details from HTML content.
    
    This is a simplified version. In a real implementation, you would use
    more advanced HTML parsing and extraction logic with libraries like
    Beautiful Soup and pattern matching specific to each job board.
    """
    import re
    from bs4 import BeautifulSoup
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extract basic job information
        # These selectors would need to be customized for each job board
        title_element = soup.select_one('.job-title, h1, .title')
        company_element = soup.select_one('.company-name, .company, .employer')
        location_element = soup.select_one('.location, .job-location')
        description_element = soup.select_one('.description, .job-description, .details')
        
        # Extract job requirements from bullet points or lists
        requirements = []
        requirements_section = soup.select_one('.requirements, .qualifications')
        if requirements_section:
            list_items = requirements_section.select('li, ul > li')
            for item in list_items:
                if item.text.strip():
                    requirements.append(item.text.strip())
        
        # Extract salary information using regex
        salary_range = ""
        if description_element:
            salary_regex = r'(\$\d{1,3}(,\d{3})*(\.\d+)?)\s*-\s*(\$\d{1,3}(,\d{3})*(\.\d+)?)'
            salary_match = re.search(salary_regex, description_element.text)
            if salary_match:
                salary_range = salary_match.group(0)
        
        # Extract job type
        job_type = ""
        job_type_element = soup.select_one('.job-type, .employment-type')
        if job_type_element:
            job_type = job_type_element.text.strip()
        
        # Build job object
        job = {
            "title": title_element.text.strip() if title_element else "",
            "company": company_element.text.strip() if company_element else "",
            "location": location_element.text.strip() if location_element else "",
            "description": description_element.text.strip() if description_element else "",
            "url": url,
            "requirements": requirements,
            "salary_range": salary_range,
            "job_type": job_type,
            "source": config.get('name', 'Unknown Source')
        }
        
        # Skip jobs with missing critical information
        if not job["title"] or not job["company"]:
            return None
            
        return job
    
    except Exception as e:
        logger.error(f"Error extracting job from HTML: {str(e)}")
        return None

def insert_jobs_to_supabase(jobs: List[Dict[str, Any]], config: Dict[str, Any]) -> None:
    """
    Insert scraped jobs into Supabase database.
    """
    supabase = get_supabase_client()
    
    for job in jobs:
        try:
            # Check if job already exists (based on URL or title + company)
            existing_job = None
            if job.get('url'):
                existing_result = supabase.table('scraped_jobs').select('id').eq('url', job['url']).execute()
                if existing_result.data:
                    existing_job = existing_result.data[0]
            
            if not existing_job:
                title_company_result = supabase.table('scraped_jobs').select('id').eq('title', job['title']).eq('company', job['company']).execute()
                if title_company_result.data:
                    existing_job = title_company_result.data[0]
            
            if existing_job:
                # Update existing job
                supabase.table('scraped_jobs').update(job).eq('id', existing_job['id']).execute()
            else:
                # Insert new job
                supabase.table('scraped_jobs').insert(job).execute()
                
        except Exception as e:
            logger.error(f"Error inserting job into Supabase: {str(e)}")
            # Continue with other jobs even if one fails
            continue
