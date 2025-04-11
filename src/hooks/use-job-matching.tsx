
import { useState, useEffect } from "react";
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

export const useJobMatching = (resumeId?: string) => {
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchJobMatches = async () => {
    if (!user || !resumeId) return;
    
    setIsLoading(true);
    
    try {
      // Fetch all job matches for the user and resume
      const { data, error } = await supabase
        .from('job_matches')
        .select('job_id, resume_id, match_score, skills_matched')
        .eq('user_id', user.id)
        .eq('resume_id', resumeId)
        .gte('match_score', 70) // Only fetch matches with 70% or higher score
        .order('match_score', { ascending: false });
        
      if (error) throw error;
      
      // Transform the data
      const transformedMatches: JobMatch[] = data.map(match => ({
        jobId: match.job_id,
        resumeId: match.resume_id,
        matchScore: match.match_score,
        matchCategory: getCategoryFromScore(match.match_score),
        matchedSkills: match.skills_matched || [],
      }));
      
      setJobMatches(transformedMatches);
    } catch (error) {
      console.error("Error fetching job matches:", error);
      toast({
        title: "Error fetching matches",
        description: "Unable to load job matches. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get the category name based on the match score
  const getCategoryFromScore = (score: number): 'excellent' | 'strong' | 'good' | 'low' => {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'strong';
    if (score >= 70) return 'good';
    return 'low';
  };
  
  // Fetch matches when resumeId changes
  useEffect(() => {
    if (resumeId) {
      fetchJobMatches();
    }
  }, [resumeId, user]);
  
  return {
    jobMatches,
    isLoading,
    refreshMatches: fetchJobMatches
  };
};
