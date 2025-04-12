
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export interface JobMatch {
  jobId: string;
  resumeId: string;
  matchScore: number;
  matchCategory: 'excellent' | 'strong' | 'good' | 'low';
  matchedSkills: string[];
}

// Helper function to get the category name based on the match score
const getCategoryFromScore = (score: number): 'excellent' | 'strong' | 'good' | 'low' => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'strong';
  if (score >= 70) return 'good';
  return 'low';
};

// Helper function to validate UUID format
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const useJobMatching = (resumeId?: string) => {
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchJobMatches = useCallback(async () => {
    if (!user || !resumeId) return;
    
    setIsLoading(true);
    
    try {
      // Check if resumeId is a valid UUID format
      if (!isValidUUID(resumeId)) {
        console.log(`Resume ID ${resumeId} is not in UUID format, skipping match fetch`);
        setJobMatches([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching job matches for resume ${resumeId}`);
      
      // Fetch all job matches for the user and resume
      const { data, error } = await supabase
        .from('job_matches')
        .select('job_id, resume_id, match_score, skills_matched')
        .eq('user_id', user.id)
        .eq('resume_id', resumeId)
        .gte('match_score', 70) // Only fetch matches with 70% or higher score
        .order('match_score', { ascending: false });
        
      if (error) {
        console.error("Error fetching job matches:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log("No job matches found for this resume");
        setJobMatches([]);
        return;
      }
      
      console.log(`Found ${data.length} job matches`);
      
      // Transform the data
      const transformedMatches: JobMatch[] = data.map(match => ({
        jobId: match.job_id,
        resumeId: match.resume_id,
        matchScore: match.match_score,
        matchCategory: getCategoryFromScore(match.match_score),
        matchedSkills: match.skills_matched || [],
      }));
      
      setJobMatches(transformedMatches);
    } catch (error: any) {
      console.error("Error fetching job matches:", error);
      // Don't show toast for invalid UUID format errors
      if (error.message && !error.message.includes("invalid input syntax for type uuid")) {
        toast({
          title: "Error fetching matches",
          description: "Unable to load job matches. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [resumeId, user, toast]);
  
  // Fetch matches when resumeId changes
  useEffect(() => {
    if (resumeId) {
      fetchJobMatches();
    } else {
      setJobMatches([]);
      setIsLoading(false);
    }
  }, [resumeId, user, fetchJobMatches]);
  
  return {
    jobMatches,
    isLoading,
    refreshMatches: fetchJobMatches
  };
};
