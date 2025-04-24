import os
import logging
from crewai.tools import BaseTool # Revert to original import / Try top-level import
# from crewai_tools.tools.base_tool import BaseTool # Remove this line
from firecrawl import FirecrawlApp
from schemas.job_schema import JobListingsExtractSchema # Import the schema

logger = logging.getLogger(__name__)

class FirecrawlMapTool(BaseTool):
    name: str = "Firecrawl URL Mapper"
    description: str = "Maps a website URL to find related links, useful for finding specific pages like 'careers' or 'jobs'."
    app: FirecrawlApp = None

    def __init__(self, api_key: str = None):
        super().__init__()
        api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        if not api_key:
            raise ValueError("Firecrawl API key is required.")
        self.app = FirecrawlApp(api_key=api_key)
        self.description = ("Maps a website URL using Firecrawl to find related links. "
                            "Input should be the base URL of the company website.")

    def _run(self, url: str) -> dict:
        """Uses Firecrawl to map URLs starting from the given base URL."""
        logger.info(f"Mapping URL: {url}")
        try:
            # Basic parameters, can be customized
            map_result = self.app.map_url(url, params={'includeSubdomains': False, 'maxDepth': 1})
            logger.info(f"Mapping result for {url}: {map_result}")
            return map_result
        except Exception as e:
            logger.error(f"Error mapping URL {url}: {e}")
            return {"success": False, "error": str(e)}

class FirecrawlExtractTool(BaseTool):
    name: str = "Firecrawl Job Extractor"
    description: str = ("Extracts structured job listing data from a given URL (typically a careers page) "
                        "using a predefined schema. Input should be the specific URL of the careers page.")
    app: FirecrawlApp = None

    def __init__(self, api_key: str = None):
        super().__init__()
        api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        if not api_key:
            raise ValueError("Firecrawl API key is required.")
        self.app = FirecrawlApp(api_key=api_key)

    def _run(self, url: str) -> dict:
        """Uses Firecrawl Extract API to scrape and structure job listings."""
        logger.info(f"Extracting jobs from URL: {url}")
        try:
            # Use the Pydantic schema defined earlier
            extract_params = {
                'pageOptions': {'onlyMainContent': True}, # Try to focus on main content
                'extractorOptions': {
                    'mode': 'llm-extraction',
                    'extractionPrompt': ("Extract all job listings from the page. For each job, include its title, "
                                         "location, a brief description, and the direct URL if available. "
                                         "Focus only on actual job postings."),
                    'extractionSchema': JobListingsExtractSchema.model_json_schema()
                }
            }
            extracted_data = self.app.scrape_url(url, params=extract_params)

            # Check if the extraction was successful and data is present
            if extracted_data and 'llm_extraction' in extracted_data and extracted_data['llm_extraction']:
                 logger.info(f"Successfully extracted jobs from {url}")
                 # Return just the extracted data part
                 return extracted_data['llm_extraction']
            elif extracted_data and 'error' in extracted_data:
                 logger.error(f"Firecrawl returned an error for {url}: {extracted_data['error']}")
                 return {"success": False, "error": extracted_data['error']}
            else:
                 logger.warning(f"No structured job data extracted from {url}. Raw data: {extracted_data}")
                 return {"success": False, "error": "No structured job data could be extracted."}

        except Exception as e:
            logger.error(f"Error extracting jobs from {url}: {e}")
            return {"success": False, "error": str(e)}