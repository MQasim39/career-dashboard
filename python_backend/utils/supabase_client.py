
import os
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # Using service role key for admin access

if not supabase_url or not supabase_key:
    logger.error("Supabase credentials not found in environment variables")
    raise ValueError("Missing Supabase credentials")

supabase: Client = create_client(supabase_url, supabase_key)

def get_supabase_client():
    """
    Returns the Supabase client instance.
    """
    return supabase
