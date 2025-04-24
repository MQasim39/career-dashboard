import os
import logging
import argparse
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# --- Check for required API keys ---
required_keys = ["ANTHROPIC_API_KEY", "FIRECRAWL_API_KEY", "SERPER_API_KEY"]
missing_keys = [key for key in required_keys if not os.getenv(key)]

if missing_keys:
    logger.error(f"Missing required environment variables: {', '.join(missing_keys)}")
    print(f"Error: Missing required environment variables: {', '.join(missing_keys)}")
    print("Please ensure they are set in your .env file.")
    exit(1) # Exit if keys are missing

# --- Import CrewAI class (only after checking keys) ---
try:
    from agents.company_job_crew import CompanyJobCrew
except ImportError as e:
    logger.error(f"Failed to import CompanyJobCrew: {e}")
    print(f"Error: Could not import the necessary CrewAI components. Ensure 'agents/company_job_crew.py' exists and is correct.")
    exit(1)
except Exception as e:
    logger.error(f"An unexpected error occurred during import: {e}")
    print(f"An unexpected error occurred: {e}")
    exit(1)


def main():
    parser = argparse.ArgumentParser(description="Run the Company Job Crew from the command line.")
    parser.add_argument(
        "--company-name",
        required=True,
        help="The name of the company to search for jobs."
    )
    parser.add_argument(
        "--resume-path",
        required=True,
        help="The absolute or relative path to the resume file (e.g., test_resume.pdf)."
    )
    args = parser.parse_args()

    company_name = args.company_name
    resume_path = args.resume_path

    # --- Validate resume file path ---
    if not os.path.isabs(resume_path):
        # If relative, assume it's relative to the script's directory (python_backend)
        script_dir = os.path.dirname(__file__)
        resume_path = os.path.join(script_dir, resume_path)

    if not os.path.exists(resume_path):
        logger.error(f"Resume file not found at the specified path: {resume_path}")
        print(f"Error: Resume file not found at '{resume_path}'. Please provide a valid path.")
        return # Exit the main function

    logger.info(f"Starting Company Job Crew for company: '{company_name}' with resume: '{resume_path}'")
    print(f"\n🚀 Starting job search for '{company_name}' using resume '{os.path.basename(resume_path)}'...")
    print("-" * 30)

    try:
        # --- Ensure config directory and files exist ---
        config_dir = os.path.join(os.path.dirname(__file__), 'config')
        agents_config_path = os.path.join(config_dir, 'agents.yaml')
        tasks_config_path = os.path.join(config_dir, 'tasks.yaml')

        if not os.path.exists(config_dir):
             logger.error(f"Config directory not found: {config_dir}")
             print(f"Error: Configuration directory '{config_dir}' not found.")
             return
        if not os.path.exists(agents_config_path) or not os.path.exists(tasks_config_path):
             logger.error("agents.yaml or tasks.yaml not found in the config directory.")
             print(f"Error: 'agents.yaml' or 'tasks.yaml' not found in '{config_dir}'.")
             return

        # --- Initialize and run the crew ---
        job_crew = CompanyJobCrew(resume_path=resume_path)
        crew_instance = job_crew.crew()
        result = crew_instance.kickoff(inputs={'company_name': company_name})

        print("\n" + "=" * 30)
        print("✅ Crew Execution Finished!")
        print("=" * 30)
        print("\nFinal Result (Job Matches):")
        print("-" * 30)
        # The result structure might vary slightly depending on CrewAI version and task output
        if isinstance(result, str):
            print(result)
        elif isinstance(result, dict):
             # Attempt to pretty-print if it's complex, otherwise just print
             try:
                 import json
                 print(json.dumps(result, indent=2))
             except ImportError:
                 print(result)
        else:
            print(result) # Print whatever the result is

    except Exception as e:
        logger.exception(f"An error occurred during crew execution for company '{company_name}'")
        print(f"\n❌ An error occurred during execution:")
        print(f"   Error Type: {type(e).__name__}")
        print(f"   Error Details: {e}")
        # You might want to add more detailed error logging or traceback printing for debugging
        # import traceback
        # print("\nTraceback:")
        # traceback.print_exc()

if __name__ == '__main__':
    main()