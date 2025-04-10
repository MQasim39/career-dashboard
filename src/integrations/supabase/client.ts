
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://egiyjyvprrsnvstfnfpf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaXlqeXZwcnJzbnZzdGZuZnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4Njk3NjUsImV4cCI6MjA1NDQ0NTc2NX0.GTV9EfSIyCGPZmfq53ZcWnA43tv111Ym1HHHepj480U";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
