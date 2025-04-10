
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    
    // This is where we would implement the actual scraping logic
    // For this demo, we'll simulate the scraping process
    console.log(`Running scraper: ${config.name}`);
    console.log(`Source: ${jobSource?.name || 'Custom URL'}`);
    console.log(`URL: ${config.url || jobSource?.url}`);
    
    // Simulate delay for scraping process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create a mock result
    const result: ScraperResult = {
      pages_scraped: Math.floor(Math.random() * 10) + 1,
      jobs_found: Math.floor(Math.random() * 30) + 5,
      jobs_saved: Math.floor(Math.random() * 20) + 1,
      errors: []
    };
    
    // Simulating job creation process
    for (let i = 0; i < result.jobs_saved; i++) {
      const mockJob = {
        title: `Software Engineer ${i + 1}`,
        company: `Tech Company ${Math.floor(Math.random() * 100)}`,
        location: config.locations[0] || 'Remote',
        description: 'This is a mock job description',
        requirements: ['JavaScript', 'React', 'Node.js'],
        salary_range: '$100K - $150K',
        job_type: config.job_types[0] || 'Full-time',
        source: jobSource?.name || 'Custom Source',
        url: `https://example.com/jobs/${i + 1}`,
        skills_required: ['JavaScript', 'React', 'Node.js', 'TypeScript']
      };
      
      // Here we would save the job to the database
      console.log(`Found job: ${mockJob.title} at ${mockJob.company}`);
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
