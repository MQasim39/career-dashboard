import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedResume {
  id: string;
  user_id: string;
  resume_id: string;
  skills: string[];
  experience: any[];
  education: any[];
  personal_info: Record<string, any>;
  full_text: string | null;
}

interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  description: string | null;
  requirements: string[] | null;
  skills_required: string[] | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request data
    const requestData = await req.json();
    const { resume_id, user_id } = requestData;
    
    if (!resume_id || !user_id) {
      throw new Error("Missing required parameters: resume_id or user_id");
    }
    
    // Get the parsed resume
    const { data: resumeData, error: resumeError } = await supabase
      .from("parsed_resumes")
      .select("*")
      .eq("resume_id", resume_id)
      .eq("user_id", user_id)
      .single();
    
    if (resumeError) {
      throw new Error(`Error fetching parsed resume: ${resumeError.message}`);
    }
    
    const parsedResume = resumeData as unknown as ParsedResume;
    
    if (!parsedResume || !parsedResume.skills || parsedResume.skills.length === 0) {
      throw new Error("No skills found in the parsed resume");
    }
    
    // Get all scraped jobs
    const { data: jobsData, error: jobsError } = await supabase
      .from("scraped_jobs")
      .select("id, title, company, description, requirements, skills_required");
    
    if (jobsError) {
      throw new Error(`Error fetching scraped jobs: ${jobsError.message}`);
    }
    
    const scrapedJobs = jobsData as unknown as ScrapedJob[];
    
    if (!scrapedJobs || scrapedJobs.length === 0) {
      throw new Error("No scraped jobs found");
    }
    
    console.log(`Found ${scrapedJobs.length} jobs to match against resume with ${parsedResume.skills.length} skills`);
    
    // Calculate match scores for each job
    const jobMatches = [];
    
    for (const job of scrapedJobs) {
      // Skip jobs with no skills required
      if (!job.skills_required || job.skills_required.length === 0) {
        continue;
      }
      
      // Calculate match score based on skills
      const matchedSkills = parsedResume.skills.filter(skill => 
        job.skills_required?.some(jobSkill => 
          jobSkill.toLowerCase() === skill.toLowerCase()
        )
      );
      
      // Calculate match percentage
      const totalUniqueSkills = new Set([
        ...parsedResume.skills.map(s => s.toLowerCase()),
        ...(job.skills_required?.map(s => s.toLowerCase()) || [])
      ]).size;
      
      const matchScore = Math.round((matchedSkills.length / totalUniqueSkills) * 100);
      
      // Only save matches with a score of 50 or higher
      if (matchScore >= 50) {
        jobMatches.push({
          job_id: job.id,
          resume_id: resume_id,
          user_id: user_id,
          match_score: matchScore,
          skills_matched: matchedSkills
        });
      }
    }
    
    console.log(`Generated ${jobMatches.length} job matches with scores >= 50%`);
    
    // Save job matches to the database
    if (jobMatches.length > 0) {
      // First delete existing matches for this resume
      await supabase
        .from("job_matches")
        .delete()
        .eq("resume_id", resume_id)
        .eq("user_id", user_id);
      
      // Insert new matches
      const { data: insertedMatches, error: insertError } = await supabase
        .from("job_matches")
        .insert(jobMatches)
        .select("id");
      
      if (insertError) {
        throw new Error(`Error inserting job matches: ${insertError.message}`);
      }
      
      console.log(`Successfully saved ${insertedMatches?.length || 0} job matches to database`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Job matches generated successfully",
        matches_count: jobMatches.length
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error in generate-job-matches function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred" 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
