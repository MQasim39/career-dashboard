
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("AI Agent function invoked");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const claudeApiKey = Deno.env.get("CLAUDE_API_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    
    if (!claudeApiKey) {
      throw new Error("Missing CLAUDE_API_KEY. Please add this to your Supabase secrets.");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request data
    const requestData = await req.json();
    console.log("Request data received:", JSON.stringify({
      ...requestData,
      user_id: requestData.user_id ? "REDACTED" : null, // Redact sensitive information in logs
    }, null, 2));
    
    const { 
      user_id, 
      resume_id, 
      location, 
      job_type, 
      department, 
      salary_range,
      email_alerts,
      browser_alerts
    } = requestData;
    
    if (!user_id) {
      throw new Error("Missing required parameter: user_id");
    }
    
    if (!resume_id) {
      throw new Error("Missing required parameter: resume_id");
    }
    
    // Validate resume_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(resume_id)) {
      console.error("Invalid resume_id format:", resume_id);
      throw new Error("Invalid resume_id format. Must be a UUID.");
    }
    
    // Step 1: Get the resume data
    console.log(`Fetching parsed resume data for resume ID: ${resume_id}`);
    const { data: resumeData, error: resumeError } = await supabase
      .from("parsed_resumes")
      .select("*")
      .eq("resume_id", resume_id)
      .eq("user_id", user_id)
      .maybeSingle(); // Use maybeSingle instead of single to prevent errors if no data
    
    if (resumeError) {
      console.error("Error fetching resume:", resumeError);
      throw new Error(`Error fetching resume: ${resumeError.message}`);
    }
    
    if (!resumeData) {
      console.log("No parsed resume found, attempting to check if resume exists");
      
      // Check if the resume exists at all
      const { data: rawResumeData, error: rawResumeError } = await supabase
        .from("resumes")
        .select("id, filename")
        .eq("id", resume_id)
        .maybeSingle();
      
      if (rawResumeError) {
        console.error("Error checking resume existence:", rawResumeError);
      }
      
      if (rawResumeData) {
        throw new Error(`Resume exists but hasn't been parsed yet. Please parse resume "${rawResumeData.filename}" before activating the AI agent.`);
      } else {
        throw new Error("No resume found with the provided resume_id. Please upload and parse a resume first.");
      }
    }
    
    // Step 2: Use Claude to analyze the resume and extract key information
    console.log("Analyzing resume with Claude...");
    const resumeAnalysis = await analyzeResumeWithClaude(claudeApiKey, resumeData);
    console.log("Resume analysis complete, creating scraper configuration...");
    
    // Step 3: Create a scraper configuration based on resume analysis
    const configData = {
      name: `AI Agent Job Search - ${new Date().toISOString().split('T')[0]}`,
      user_id: user_id,
      keywords: [
        ...resumeAnalysis.suggestedKeywords,
        ...(department ? [department] : [])
      ],
      locations: location ? [location] : [],
      job_types: job_type ? [job_type] : ["full-time"],
      salary_range: {
        min: salary_range?.[0] || 0,
        max: salary_range?.[1] || 200000, 
        currency: "USD"
      },
      filters: {
        resume_id: resume_id,
        email_alerts: email_alerts || false,
        browser_alerts: browser_alerts || false,
        ai_enhanced: true
      },
      is_active: true,
      frequency: "daily"
    };
    
    // Step 4: Create the scraper configuration
    console.log("Creating scraper configuration");
    const { data: configResult, error: configError } = await supabase
      .from('scraper_configurations')
      .upsert(configData)
      .select()
      .single();
      
    if (configError) {
      console.error("Error creating scraper configuration:", configError);
      throw new Error(`Error creating scraper configuration: ${configError.message}`);
    }
    
    // Step 5: Add to the scraper queue
    console.log("Adding job to scraper queue...");
    const { data: queueResult, error: queueError } = await supabase
      .from('scraper_queue')
      .insert({
        configuration_id: configResult.id,
        status: 'pending',
        scheduled_for: new Date().toISOString(),
        priority: 10
      })
      .select();
      
    if (queueError) {
      console.error("Error adding to scraper queue:", queueError);
      throw new Error(`Error adding to scraper queue: ${queueError.message}`);
    }
    
    // Step 6: Run the scraper
    const queueItemId = queueResult && queueResult.length > 0 ? queueResult[0].id : null;
    
    if (queueItemId) {
      console.log(`Starting scrape-jobs function with queue item ID: ${queueItemId}`);
      try {
        const { error: functionError } = await supabase.functions.invoke('scrape-jobs', {
          body: { 
            configuration_id: configResult.id,
            queue_item_id: queueItemId,
            resume_id: resume_id,
            resume_analysis: resumeAnalysis
          }
        });
        
        if (functionError) {
          console.error("Error invoking scrape-jobs function:", functionError);
          throw new Error(`Error invoking scrape-jobs function: ${functionError.message}`);
        }
      } catch (invokeError) {
        console.error("Error invoking scrape-jobs function:", invokeError);
        // Don't fail the entire process if job scraping fails, just log it
        // We'll update the queue item status to reflect the error
        await supabase
          .from('scraper_queue')
          .update({ 
            status: 'failed', 
            error_message: `Failed to invoke scrape-jobs: ${invokeError.message}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', queueItemId);
      }
    } else {
      throw new Error("Failed to create queue item");
    }
    
    // Step 7: Wait for scraping to complete (poll the queue item status)
    console.log("Waiting for scraping to complete...");
    let scrapingComplete = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!scrapingComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      const { data: queueStatus, error: statusError } = await supabase
        .from('scraper_queue')
        .select('status, error_message')
        .eq('id', queueItemId)
        .maybeSingle();
      
      if (statusError) {
        console.error("Error checking queue status:", statusError);
        break; // Don't throw error, just break the polling loop
      }
      
      if (queueStatus && (queueStatus.status === 'completed' || queueStatus.status === 'failed')) {
        scrapingComplete = true;
        console.log(`Scraping completed with status: ${queueStatus.status}`);
        if (queueStatus.status === 'failed' && queueStatus.error_message) {
          console.log(`Scraping error: ${queueStatus.error_message}`);
        }
      }
      
      attempts++;
    }
    
    // Step 8: Use Claude to enhance job matching
    if (scrapingComplete) {
      console.log("Scraping complete. Enhancing job matching with Claude...");
      try {
        await enhanceJobMatchingWithClaude(claudeApiKey, supabase, user_id, resume_id, resumeAnalysis);
      } catch (enhanceError) {
        console.error("Error enhancing job matches:", enhanceError);
        // Don't fail the entire process if enhancement fails
      }
    } else {
      console.log("Scraping did not complete within the timeout period. Job matching will be handled asynchronously.");
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "AI Agent has completed job search and matching",
        config_id: configResult.id
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error in AI agent function:", error);
    
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

// Function to analyze resume with Claude
async function analyzeResumeWithClaude(apiKey, resumeData) {
  const skills = resumeData.skills || [];
  const experience = resumeData.experience || [];
  const education = resumeData.education || [];
  const fullText = resumeData.full_text || "";
  
  console.log(`Analyzing resume with ${skills.length} skills, ${experience.length} experience items, and ${education.length} education items`);
  
  // Prepare the prompt for Claude
  const prompt = `
    Analyze this resume information and extract key insights:
    
    Skills: ${JSON.stringify(skills)}
    Experience: ${JSON.stringify(experience)}
    Education: ${JSON.stringify(education)}
    
    Additional resume text: ${fullText ? fullText.substring(0, 2000) : "No full text available"}
    
    Based on this resume, provide:
    1. Top 5-10 keywords for job search
    2. Candidate's experience level (entry, mid, senior)
    3. Primary job roles this candidate is qualified for
    4. Technical skills rating (1-10)
    5. Soft skills assessment
    
    Format your response as JSON.
  `;
  
  try {
    console.log("Sending request to Claude API...");
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: "You are an expert resume analyzer and job matcher. Respond only with valid JSON."
      })
    });
    
    if (!response.ok) {
      console.error(`Claude API error: ${response.status}`);
      throw new Error(`Claude API error: ${response.status} - ${await response.text()}`);
    }
    
    const data = await response.json();
    const analysisText = data.content && data.content[0] && data.content[0].text ? data.content[0].text : "{}";
    
    // Extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
    
    try {
      const analysis = JSON.parse(jsonStr);
      console.log("Resume analysis complete:", analysis);
      
      return {
        suggestedKeywords: analysis.keywords || [],
        experienceLevel: analysis.experience_level || "mid",
        suggestedRoles: analysis.job_roles || [],
        technicalSkillsRating: analysis.technical_skills_rating || 5,
        softSkillsAssessment: analysis.soft_skills_assessment || ""
      };
    } catch (parseError) {
      console.error("Error parsing Claude response as JSON:", parseError);
      console.log("Raw response:", analysisText);
      // Return default values if JSON parsing fails
      return {
        suggestedKeywords: skills.slice(0, 10),
        experienceLevel: "mid",
        suggestedRoles: [],
        technicalSkillsRating: 5,
        softSkillsAssessment: ""
      };
    }
  } catch (error) {
    console.error("Error analyzing resume with Claude:", error);
    // Return default values if Claude analysis fails
    return {
      suggestedKeywords: skills.slice(0, 10),
      experienceLevel: "mid",
      suggestedRoles: [],
      technicalSkillsRating: 5,
      softSkillsAssessment: ""
    };
  }
}

// Function to enhance job matching with Claude
async function enhanceJobMatchingWithClaude(apiKey, supabase, userId, resumeId, resumeAnalysis) {
  try {
    // Get all job matches for this resume
    const { data: matches, error: matchesError } = await supabase
      .from('job_matches')
      .select('id, job_id, match_score')
      .eq('user_id', userId)
      .eq('resume_id', resumeId)
      .gte('match_score', 50);
    
    if (matchesError) {
      console.error("Error fetching job matches:", matchesError);
      throw matchesError;
    }
    
    if (!matches || matches.length === 0) {
      console.log("No job matches found to enhance");
      return;
    }
    
    console.log(`Enhancing ${matches.length} job matches with Claude...`);
    
    // Process each match in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (match) => {
        // Get job details
        const { data: job, error: jobError } = await supabase
          .from('scraped_jobs')
          .select('*')
          .eq('id', match.job_id)
          .maybeSingle();
        
        if (jobError) {
          console.error(`Error fetching job ${match.job_id}:`, jobError);
          return; // Skip this job if there's an error
        }
        
        if (!job) {
          console.log(`Job ${match.job_id} not found`);
          return; // Skip if job not found
        }
        
        // Use Claude to get a more nuanced match score
        const enhancedScore = await getEnhancedMatchScore(
          apiKey, 
          job, 
          resumeAnalysis
        );
        
        // Update the match score if it's different and within 70-100% range
        if (enhancedScore >= 70 && enhancedScore !== match.match_score) {
          await supabase
            .from('job_matches')
            .update({ 
              match_score: enhancedScore,
              ai_enhanced: true
            })
            .eq('id', match.id);
            
          console.log(`Updated match score for job ${job.title} from ${match.match_score} to ${enhancedScore}`);
        } else if (enhancedScore < 70) {
          // Remove matches below 70%
          await supabase
            .from('job_matches')
            .delete()
            .eq('id', match.id);
            
          console.log(`Removed job match ${match.id} with low score ${enhancedScore}`);
        }
      }));
      
      // Add a small delay between batches to avoid rate limits
      if (i + batchSize < matches.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log("Job matching enhancement complete");
  } catch (error) {
    console.error("Error enhancing job matches:", error);
    // Don't throw error here - just log it to prevent function failure
  }
}

// Function to get enhanced match score using Claude
async function getEnhancedMatchScore(apiKey, job, resumeAnalysis) {
  if (!job) {
    console.log("No job data provided for match scoring");
    return 50; // Return default score
  }
  
  const prompt = `
    Compare this job with the candidate's profile and provide a match score (0-100):
    
    Job Title: ${job.title || "Unknown"}
    Company: ${job.company || "Unknown"}
    Job Description: ${job.description ? job.description.substring(0, 1000) : "N/A"}
    Required Skills: ${JSON.stringify(job.skills_required || [])}
    Requirements: ${JSON.stringify(job.requirements || [])}
    
    Candidate Profile:
    - Experience Level: ${resumeAnalysis.experienceLevel || "mid"}
    - Technical Skills Rating: ${resumeAnalysis.technicalSkillsRating || 5}/10
    - Suggested Roles: ${JSON.stringify(resumeAnalysis.suggestedRoles || [])}
    - Keywords: ${JSON.stringify(resumeAnalysis.suggestedKeywords || [])}
    
    Provide only a number between 0 and 100 representing the match percentage.
  `;
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: "You are an expert job matcher. Respond only with a number between 0 and 100."
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }
    
    const data = await response.json();
    const scoreText = data.content && data.content[0] && data.content[0].text 
      ? data.content[0].text.trim() 
      : "50";
    
    // Extract the score from the response
    const scoreMatch = scoreText.match(/\d+/);
    const score = scoreMatch ? parseInt(scoreMatch[0], 10) : 50;
    
    // Ensure the score is within valid range
    return Math.min(Math.max(score, 0), 100);
  } catch (error) {
    console.error("Error getting enhanced match score with Claude:", error);
    return 50; // Return a default score if Claude analysis fails
  }
}
