import os
import logging
from typing import List, Dict, Any
from crewai import Agent, Task, Crew, Process
# Import FirecrawlTool instead of ScrapeWebsiteTool
from crewai_tools import SerperDevTool, FirecrawlTool
# Add Supabase client and AppError for fetching resume data
from utils.supabase_client import get_supabase_client
from utils.error_handler import AppError # Import AppError if you want to raise specific errors
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize the Gemini LLM
# Ensure GOOGLE_API_KEY is set in your .env file
try:
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", verbose=True, temperature=0.1)
    logger.info("Gemini LLM initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize Gemini LLM: {e}")
    # Handle the error appropriately, maybe raise it or use a fallback
    raise

# --- Tools ---
# Tool for searching the web for job postings
search_tool = SerperDevTool()

# Tool for scraping job details using Firecrawl
# Ensure FIRECRAWL_API_KEY is set in your .env file
try:
    # You might need to configure mode ('scrape' or 'crawl') if needed
    scrape_tool = FirecrawlTool(api_key=os.getenv("FIRECRAWL_API_KEY"))
    logger.info("FirecrawlTool initialized.")
    # Simple check if API key is missing (FirecrawlTool might not raise error on init)
    if not os.getenv("FIRECRAWL_API_KEY"):
        logger.warning("FIRECRAWL_API_KEY not found in environment variables. FirecrawlTool may not function.")
except Exception as e:
    logger.error(f"Failed to initialize FirecrawlTool: {e}")
    # Decide how to handle this - maybe raise the error or disable scraping?
    scrape_tool = None # Set to None if initialization fails

# --- Function for fetching resume data ---
# Updated to use Supabase
def get_resume_data(user_id: str, resume_id: str) -> Dict[str, Any]:
    """Fetches parsed resume data from Supabase."""
    logger.info(f"Fetching resume data from Supabase for user_id: {user_id}, resume_id: {resume_id}")
    try:
        supabase = get_supabase_client()
        # Select relevant fields from the parsed_resumes table
        result = supabase.table('parsed_resumes') \
                         .select('full_text, skills, experience') \
                         .eq('resume_id', resume_id) \
                         .eq('user_id', user_id) \
                         .maybe_single() \
                         .execute()

        if not result.data:
            logger.error(f"Parsed resume not found for resume_id: {resume_id} and user_id: {user_id}")
            # Return empty dict or raise an error, depending on desired handling
            # raise AppError(f"Parsed resume not found: {resume_id}", 404)
            return {} # Returning empty dict for now

        logger.info(f"Successfully fetched resume data for resume_id: {resume_id}")
        # Ensure keys exist even if null in DB, provide defaults if necessary
        resume_details = {
            "full_text": result.data.get("full_text", ""),
            "skills": result.data.get("skills", []),
            "experience": result.data.get("experience", [])
        }
        return resume_details

    except Exception as e:
        logger.exception(f"Database error fetching resume data for resume_id {resume_id}: {e}")
        # Re-raise or return empty dict/error structure
        # raise AppError(f"Database error fetching resume: {str(e)}", 500)
        return {} # Returning empty dict on error


# --- Agents ---

# Agent 1: Job Search Specialist
job_searcher = Agent(
    role='Job Search Specialist',
    goal='Find relevant job postings online based on provided keywords, location, and other criteria. Focus on sources like LinkedIn, Indeed, and Glassdoor.',
    backstory=(
        "You are an expert web searcher specializing in finding job opportunities. "
        "You know how to craft effective search queries for job boards and company career pages "
        "using tools like SerperDevTool to aggregate results from Google Jobs, which includes listings from major platforms."
    ),
    verbose=True,
    allow_delegation=False,
    tools=[search_tool],
    llm=llm
)

# Agent 2: Job Scraper and Detail Extractor (Optional - depends on search results)
# If search_tool provides enough detail, this might not be needed or could be simpler.
# If only URLs are returned, this agent is crucial.
job_scraper = Agent(
    role='Job Scraper and Detail Extractor',
    goal='Extract detailed information (description, requirements, company details) from specific job posting URLs using Firecrawl.',
    backstory=(
        "You are skilled at using Firecrawl to navigate complex web pages, handle JavaScript rendering, "
        "and extract clean, structured data or markdown content. "
        "You meticulously gather the full job description, qualifications, company information, "
        "and any other relevant details from a given job posting URL, providing it in a format suitable for AI analysis."
    ),
    verbose=True,
    allow_delegation=False,
    tools=[scrape_tool] if scrape_tool else [], # Only add tool if initialized
    llm=llm
)

# Agent 3: Resume and Job Matching Analyst (Using Gemini)
job_matcher = Agent(
    role='Resume and Job Matching Analyst',
    goal='Analyze job descriptions against a user\'s resume, calculate a percentage match score (0-100), and filter jobs based on a minimum threshold (70%).',
    backstory=(
        "You are an expert HR analyst with a deep understanding of skills, experience, and job requirements. "
        "Using the provided resume text and job details, you leverage the power of the Gemini LLM "
        "to perform a nuanced comparison, assessing the alignment between the candidate's profile and the job opening. "
        "You output a precise match percentage and filter out jobs below the 70% threshold."
    ),
    verbose=True,
    allow_delegation=False,
    # No specific tools needed here, relies on LLM's analytical capabilities and context.
    llm=llm
)


# --- Crew Class ---

class CompanyJobCrew:
    def __init__(self):
        # Initialization can be simple if inputs are passed to kickoff
        pass

    def kickoff(self, inputs: Dict[str, Any]):
        """
        Runs the job search and matching crew with dynamic inputs.
        Args:
            inputs (Dict[str, Any]): Dictionary containing user_id, resume_id,
                                     keywords, location, job_type, department.
        Returns:
            List[Dict[str, Any]]: A list of matched jobs (score >= 70),
                                  each containing details and the match score.
        """
        logger.info(f"Kicking off CompanyJobCrew with inputs: {inputs}")

        user_id = inputs.get('user_id')
        resume_id = inputs.get('resume_id')
        keywords = inputs.get('keywords', [])
        location = inputs.get('location', '')
        job_type = inputs.get('job_type', '')
        department = inputs.get('department', '') # Industry/Department

        if not user_id or not resume_id:
            logger.error("Missing user_id or resume_id in inputs.")
            return {"error": "Missing user_id or resume_id"} # Return error state

        # --- Fetch Resume Data ---
        # This data needs to be available in the context for the matching task.
        try:
            resume_data = get_resume_data(user_id, resume_id)
            # Check if resume data is empty (which indicates an error or not found)
            if not resume_data or not resume_data.get("full_text"):
                logger.error(f"Could not retrieve valid resume data for resume_id: {resume_id}")
                return {"error": "Failed to retrieve resume data or resume text is empty"}
            resume_text = resume_data.get("full_text", "")
            # You might pass specific parts like skills, experience summary too
        except AppError as ae: # Catch specific AppErrors if raised by get_resume_data
             logger.error(f"AppError fetching resume data: {ae}")
             return {"error": str(ae)}
        except Exception as e:
            logger.exception(f"Unexpected error during resume data fetching: {e}")
            return {"error": f"Unexpected error fetching resume data: {str(e)}"}

        # --- Define Tasks ---

        # Task 1: Search for Jobs
        # Construct a targeted search query
        search_query = f"'{' '.join(keywords)}' jobs"
        if job_type:
            search_query += f" type:'{job_type}'"
        if department:
            search_query += f" in department:'{department}'" # Adjust based on how Serper handles industry/dept
        if location:
            search_query += f" in '{location}'"
        # Add site restrictions if desired, e.g., site:linkedin.com OR site:indeed.com
        search_query += " (site:linkedin.com OR site:indeed.com OR site:glassdoor.com)"

        search_task = Task(
            description=f"Search the web for job postings matching the query: '{search_query}'. Compile a list of potential job opportunities, including their titles, companies, locations, and URLs.",
            expected_output="A list of dictionaries, each containing job details like 'title', 'company_name', 'location', 'job_url', and potentially a snippet of the 'description'. Prioritize results from LinkedIn, Indeed, and Glassdoor.",
            agent=job_searcher,
            # Context can be added if needed, but the query is in the description
        )

        # Task 2: Scrape Job Details (Conditional/Refinement Task using Firecrawl)
        # This task remains commented out for now, but the agent is ready.
        # If you uncomment this, ensure the agent has the scrape_tool.
        # scrape_task = Task(
        #     description="For each job URL found in the previous task, use FirecrawlTool to scrape the full job description and requirements.",
        #     expected_output="An updated list of job dictionaries, where each dictionary now includes a detailed 'full_description' field (likely in Markdown format from Firecrawl).",
        #     agent=job_scraper,
        #     context=[search_task] # Depends on the output of the search task
        # )

        # Task 3: Match Jobs to Resume and Filter
        match_task = Task(
            description=(
                f"Analyze the following resume text:\n--- RESUME START ---\n{resume_text}\n--- RESUME END ---\n\n"
                "Compare this resume against each job found in the search results (output of the search task). "
                "For each job, calculate a percentage match score from 0 to 100 based on skills, experience, and overall relevance. "
                "Return ONLY the jobs that have a match score of 70% or higher. "
                "The output should be a list of dictionaries, each containing the original job details PLUS a 'match_score' field (integer 0-100)."
            ),
            expected_output=(
                "A JSON list of job dictionaries. Each dictionary MUST include: 'title', 'company_name', 'location', 'job_url', 'description' (if available), "
                "AND a 'match_score' (integer, 70-100). Jobs below 70% MUST be excluded."
            ),
            agent=job_matcher,
            context=[search_task] # Takes the output of the search task as input context
        )

        # --- Create and Run the Crew ---
        # Make sure job_scraper is only included if its tool was initialized
        crew_agents = [job_searcher]
        if scrape_tool and job_scraper.tools: # Check if scrape_tool exists and was added to agent
             crew_agents.append(job_scraper)
        crew_agents.append(job_matcher)

        # Correspondingly adjust tasks if scrape_task is uncommented
        crew_tasks = [search_task, match_task]
        # if scrape_tool and job_scraper.tools:
        #    crew_tasks = [search_task, scrape_task, match_task] # Insert scrape_task

        job_crew = Crew(
            agents=crew_agents,
            tasks=crew_tasks,
            process=Process.sequential,
            verbose=2
            # memory=True
        )

        logger.info("Starting Crew execution...")
        # Pass initial context if needed, though tasks define their needs
        crew_result = job_crew.kickoff()

        logger.info("Crew execution finished.")
        logger.debug(f"Raw Crew Result: {crew_result}") # Log the raw output for debugging

        # --- Process and Return Result ---
        # The result should ideally be the direct output of the final task (match_task)
        # Perform basic validation/parsing if necessary
        if isinstance(crew_result, str):
             # Attempt to parse if it's a JSON string (sometimes happens)
             import json
             try:
                 processed_result = json.loads(crew_result)
             except json.JSONDecodeError:
                 logger.error(f"Failed to parse crew result string: {crew_result}")
                 processed_result = {"error": "Failed to parse final crew output", "raw_output": crew_result}
        elif isinstance(crew_result, list):
             processed_result = crew_result # Assume it's the list of dicts
        elif isinstance(crew_result, dict) and 'error' in crew_result:
             processed_result = crew_result # Pass through error dicts
        else:
             logger.warning(f"Unexpected crew result type: {type(crew_result)}. Returning raw output.")
             processed_result = {"error": "Unexpected output format from crew", "raw_output": crew_result}


        # Final validation: Ensure it's a list of dicts with required keys
        final_matches = []
        if isinstance(processed_result, list):
            for item in processed_result:
                if isinstance(item, dict) and 'match_score' in item and item.get('match_score', 0) >= 70:
                    # Add default values for potentially missing keys expected by agent.py
                    item.setdefault('title', 'N/A')
                    item.setdefault('company_name', 'N/A')
                    item.setdefault('location', 'N/A')
                    item.setdefault('job_url', '#')
                    item.setdefault('description', '') # Add description if available
                    final_matches.append(item)
                else:
                    logger.warning(f"Skipping invalid item in final result: {item}")
            logger.info(f"Returning {len(final_matches)} matched jobs meeting criteria.")
            return final_matches
        else:
             logger.error(f"Processed crew result is not a list: {processed_result}")
             # Return the error structure if processing failed
             return processed_result if isinstance(processed_result, dict) and 'error' in processed_result else {"error": "Crew did not return a list of matched jobs"}


# Example usage (for testing purposes)
if __name__ == '__main__':
    print("Testing CompanyJobCrew...")
    test_inputs = {
        'user_id': 'test-user-123',
        'resume_id': 'test-resume-abc', # Ensure get_resume_data handles this test case
        'keywords': ['Backend Python Developer', 'API', 'Cloud'],
        'location': 'Remote',
        'job_type': 'Full-time',
        'department': 'Software Engineering'
    }
    crew = CompanyJobCrew()
    results = crew.kickoff(test_inputs)
    print("\n--- Crew Results ---")
    import json
    print(json.dumps(results, indent=2))
    print("--------------------")