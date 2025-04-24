from pydantic import BaseModel, Field
from typing import List, Optional

class JobListing(BaseModel):
    """Schema for a single job listing extracted from a careers page."""
    title: str = Field(..., description="The title of the job position.")
    location: Optional[str] = Field(None, description="The location of the job (e.g., city, state, remote).")
    description: Optional[str] = Field(None, description="A brief description of the job responsibilities and requirements.")
    url: Optional[str] = Field(None, description="The direct URL to the specific job posting, if available.")
    # Add any other fields you want to extract, e.g., company, department, required_skills

class JobListingsExtractSchema(BaseModel):
    """Schema for the overall extraction result containing multiple job listings."""
    jobs: List[JobListing] = Field(..., description="A list of job listings found on the page.")