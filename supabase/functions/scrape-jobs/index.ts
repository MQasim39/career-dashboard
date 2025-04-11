
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScraperConfig {
  id: string;
  name: string;
  source_id: string;
  url: string | null;
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
}

interface JobSource {
  id: string;
  name: string;
  url: string | null;
  type: 'job_board' | 'company_site' | 'custom';
}

interface ScraperResult {
  pages_scraped: number;
  jobs_found: number;
  jobs_saved: number;
  errors: string[];
}

interface Job {
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  requirements: string[] | null;
  salary_range: string | null;
  job_type: string | null;
  source: string;
  url: string | null;
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
    const { configuration_id, queue_item_id } = requestData;

    if (!configuration_id || !queue_item_id) {
      throw new Error("Missing required parameters: configuration_id or queue_item_id");
    }

    // Update queue item status to processing
    await supabase
      .from("scraper_queue")
      .update({
        status: "processing",
        started_at: new Date().toISOString()
      })
      .eq("id", queue_item_id);

    // Get scraper configuration
    const { data: configData, error: configError } = await supabase
      .from("scraper_configurations")
      .select("*")
      .eq("id", configuration_id)
      .single();

    if (configError) {
      throw new Error(`Error fetching configuration: ${configError.message}`);
    }

    const config = configData as unknown as ScraperConfig;

    // Get job source
    let jobSource: JobSource | null = null;
    if (config.source_id) {
      const { data: sourceData, error: sourceError } = await supabase
        .from("job_sources")
        .select("*")
        .eq("id", config.source_id)
        .single();

      if (sourceError) {
        throw new Error(`Error fetching job source: ${sourceError.message}`);
      }

      jobSource = sourceData as unknown as JobSource;
    }

    // Implement actual job scraping using a public API
    console.log(`Running scraper: ${config.name}`);
    console.log(`Source: ${jobSource?.name || 'Custom URL'}`);
    console.log(`URL: ${config.url || jobSource?.url}`);

    // Initialize result object
    const result: ScraperResult = {
      pages_scraped: 0,
      jobs_found: 0,
      jobs_saved: 0,
      errors: []
    };

    try {
      // Prepare search parameters based on configuration
      const keywords = config.keywords.join(' ');
      const location = config.locations.length > 0 ? config.locations[0] : '';

      // Use the JSearch API from RapidAPI to get real job listings
      // Note: In a production environment, you would use your own API key
      const apiUrl = new URL('https://jsearch.p.rapidapi.com/search');
      apiUrl.searchParams.append('query', `${keywords} ${location} ${config.job_types.join(' ')}`.trim());
      apiUrl.searchParams.append('page', '1');
      apiUrl.searchParams.append('num_pages', '1');

      console.log(`Searching for jobs with query: ${apiUrl.searchParams.get('query')}`);

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': '3b809ab6e4mshb5265d5e9cf4e7fp1e9a8fjsn8d8a17fc8f2a', // This is a temporary key for demo purposes
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      result.pages_scraped = 1;

      if (data.data && Array.isArray(data.data)) {
        result.jobs_found = data.data.length;
        console.log(`Found ${result.jobs_found} jobs from API`);

        // Process and save each job
        const jobsToInsert: Job[] = [];

        for (const item of data.data) {
          // Extract skills from job description
          const description = item.job_description || '';
          const skills = extractSkillsFromDescription(description);

          // Format salary range if available
          let salaryRange = null;
          if (item.job_min_salary && item.job_max_salary) {
            salaryRange = `$${item.job_min_salary}-$${item.job_max_salary}`;
          }

          // Create job object
          const job: Job = {
            title: item.job_title || 'Unknown Position',
            company: item.employer_name || 'Unknown Company',
            location: item.job_city ? `${item.job_city}, ${item.job_country || ''}` : item.job_country || null,
            description: description,
            requirements: extractRequirementsFromDescription(description),
            salary_range: salaryRange,
            job_type: item.job_employment_type || config.job_types[0] || null,
            source: jobSource?.name || 'JSearch API',
            url: item.job_apply_link || null,
            skills_required: skills
          };

          jobsToInsert.push(job);
        }

        // Insert jobs into database
        if (jobsToInsert.length > 0) {
          const { data: insertedJobs, error: insertError } = await supabase
            .from('scraped_jobs')
            .insert(jobsToInsert)
            .select('id');

          if (insertError) {
            throw new Error(`Error inserting jobs: ${insertError.message}`);
          }

          result.jobs_saved = insertedJobs?.length || 0;
          console.log(`Successfully saved ${result.jobs_saved} jobs to database`);
        }
      } else {
        console.log('No jobs found in API response');
      }
    } catch (error) {
      console.error('Error during job scraping:', error);
      result.errors.push(error.message || 'Unknown error during scraping');
    }

    // Helper function to extract skills from job description
    function extractSkillsFromDescription(description: string): string[] {
      if (!description) return [];

      const commonSkills = [
        'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js',
        'Python', 'Java', 'C#', 'C++', 'Ruby', 'PHP', 'Swift', 'Kotlin',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'SQL', 'NoSQL',
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST',
        'HTML', 'CSS', 'Sass', 'LESS', 'Tailwind', 'Bootstrap',
        'Git', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Agile', 'Scrum'
      ];

      return commonSkills.filter(skill =>
        new RegExp(`\\b${skill}\\b`, 'i').test(description)
      );
    }

    // Helper function to extract requirements from description
    function extractRequirementsFromDescription(description: string): string[] {
      if (!description) return [];

      // Look for common requirement patterns
      const requirementPatterns = [
        /requirements?:([^\n]+)/gi,
        /qualifications?:([^\n]+)/gi,
        /we are looking for([^\n]+)/gi,
        /what you'll need([^\n]+)/gi,
        /what we require([^\n]+)/gi
      ];

      const requirements: string[] = [];

      for (const pattern of requirementPatterns) {
        const matches = description.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            requirements.push(match[1].trim());
          }
        }
      }

      // If no specific requirements found, extract bullet points
      if (requirements.length === 0) {
        const bulletPoints = description.split(/[\n•·\-]+/).map(p => p.trim()).filter(p => p.length > 20 && p.length < 200);
        return bulletPoints.slice(0, 5); // Limit to 5 requirements
      }

      return requirements;
    }

    // Update the scraper configuration with last run time
    await supabase
      .from("scraper_configurations")
      .update({
        last_run: new Date().toISOString(),
        last_error: null
      })
      .eq("id", configuration_id);

    // Update queue item with success result
    await supabase
      .from("scraper_queue")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result_stats: result
      })
      .eq("id", queue_item_id);

    // If we have a resume_id in the request, generate job matches
    if (requestData.resume_id) {
      try {
        console.log(`Generating job matches for resume ${requestData.resume_id}`);

        // Call the generate-job-matches function
        const matchResponse = await fetch(`${supabaseUrl}/functions/v1/generate-job-matches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            resume_id: requestData.resume_id,
            user_id: configData.user_id
          })
        });

        if (!matchResponse.ok) {
          const errorText = await matchResponse.text();
          console.error(`Error generating job matches: ${errorText}`);
        } else {
          const matchResult = await matchResponse.json();
          console.log(`Job matching result: ${matchResult.matches_count} matches generated`);
        }
      } catch (matchError) {
        console.error('Error calling job matching function:', matchError);
        // Don't fail the whole process if job matching fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Scraper completed successfully",
        result
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Error in scrape-jobs function:", error);

    // If we have the queue item ID, update its status
    if (req.json && (await req.json()).queue_item_id) {
      const { queue_item_id, configuration_id } = await req.json();

      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Update queue item with error
        await supabase
          .from("scraper_queue")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: error.message || "Unknown error"
          })
          .eq("id", queue_item_id);

        // Update the scraper configuration with error
        if (configuration_id) {
          await supabase
            .from("scraper_configurations")
            .update({
              last_error: error.message || "Unknown error"
            })
            .eq("id", configuration_id);
        }
      }
    }

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
