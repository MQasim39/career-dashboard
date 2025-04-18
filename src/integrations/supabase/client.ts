
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://egiyjyvprrsnvstfnfpf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaXlqeXZwcnJzbnZzdGZuZnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4Njk3NjUsImV4cCI6MjA1NDQ0NTc2NX0.GTV9EfSIyCGPZmfq53ZcWnA43tv111Ym1HHHepj480U";

// Use a type assertion to handle the fact that the types.ts doesn't fully reflect 
// the database schema yet. This will allow our code to compile while Supabase 
// generates the proper types in the background.
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

// Helper function to access tables that might not be in the auto-generated types yet
export const fromTable = (tableName: string) => {
  return supabase.from(tableName as any);
};

// Define the type for parsed resume
export type ParsedResume = {
  id: string;
  user_id: string;
  resume_id: string;
  skills: string[];
  experience: any[];
  education: any[];
  personal_info: Record<string, any>;
  created_at: string;
  updated_at: string;
  full_text: string | null;
};

// Type-safe helper for the parsed_resumes table without complex generics
export const fromParsedResumes = () => {
  // Simply use the any type as an intermediate step to avoid TypeScript errors
  // This is a workaround until the Supabase types are properly generated
  return fromTable('parsed_resumes') as any;
};

// Types for job scraping system
export type Industry = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
};

export type JobSource = {
  id: string;
  name: string;
  url: string | null;
  logo_url: string | null;
  type: 'job_board' | 'company_site' | 'custom';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ScraperConfiguration = {
  id: string;
  user_id: string;
  name: string;
  source_id: string | null;
  url: string | null;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  keywords: string[];
  locations: string[];
  job_types: string[];
  industries: string[];
  experience_levels: string[];
  salary_range: {
    min: number | null;
    max: number | null;
    currency: string;
  };
  filters: Record<string, any>;
  is_active: boolean;
  last_run: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type ScraperQueueItem = {
  id: string;
  configuration_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  result_stats: Record<string, any>;
  scheduled_for: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Type-safe helpers for job scraping tables
export const fromIndustries = () => {
  return fromTable('industries') as any;
};

export const fromJobSources = () => {
  return fromTable('job_sources') as any;
};

export const fromScraperConfigurations = () => {
  return fromTable('scraper_configurations') as any;
};

export const fromScraperQueue = () => {
  return fromTable('scraper_queue') as any;
};
