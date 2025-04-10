
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common NLP patterns for resume parsing
const SKILL_KEYWORDS = [
  "javascript", "typescript", "react", "node", "express", "html", "css", "python",
  "java", "c#", "c++", "ruby", "php", "aws", "azure", "gcp", "docker", "kubernetes",
  "sql", "nosql", "mongodb", "postgresql", "mysql", "oracle", "git", "github",
  "rest", "graphql", "redux", "vue", "angular", "svelte", "next.js", "gatsby",
  "tailwind", "bootstrap", "material-ui", "figma", "sketch", "adobe",
  "agile", "scrum", "kanban", "jira", "confluence", "devops", "ci/cd", "jenkins",
  "test", "jest", "mocha", "cypress", "selenium", "machine learning", "ai",
  "data analysis", "data science", "tensorflow", "pytorch", "nlp", "computer vision"
];

// Education degree patterns
const EDUCATION_PATTERNS = [
  "bachelor", "master", "phd", "doctorate", "associate", "certificate", "certification",
  "bsc", "msc", "ba", "bs", "ms", "ma", "mba", "b.a.", "b.s.", "m.s.", "m.a.", "ph.d."
];

// Job title patterns
const JOB_TITLE_PATTERNS = [
  "developer", "engineer", "architect", "manager", "director", "lead",
  "designer", "analyst", "specialist", "consultant", "administrator",
  "devops", "sre", "scientist", "researcher", "intern"
];

// Parse plain text to extract structured information
function parseResumeText(text: string) {
  // Normalize text
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
  
  // Extract skills
  const skills = SKILL_KEYWORDS.filter(skill => 
    new RegExp(`\\b${skill}\\b`, 'i').test(normalizedText)
  );
  
  // Basic parsing for education (very simplified)
  const educationSection = extractSection(text, ["education", "academic background"]);
  const education = [];
  if (educationSection) {
    // Find education degrees
    const degreeMatches = EDUCATION_PATTERNS.filter(pattern => 
      new RegExp(`\\b${pattern}\\b`, 'i').test(educationSection)
    );
    
    // Basic parsing for school names (just a heuristic)
    const possibleSchools = educationSection.split(/[\n.;]/)
      .filter(line => line.includes("University") || line.includes("College") || line.includes("Institute"))
      .map(line => line.trim());
    
    if (degreeMatches.length > 0 || possibleSchools.length > 0) {
      education.push({
        degree: degreeMatches.length > 0 ? degreeMatches[0] : "Degree",
        school: possibleSchools.length > 0 ? possibleSchools[0] : "School",
        dates: extractDateRange(educationSection),
      });
    }
  }
  
  // Basic parsing for experience (simplified)
  const experienceSection = extractSection(text, ["experience", "work experience", "professional experience"]);
  const experience = [];
  if (experienceSection) {
    // Split into possible job entries
    const potentialEntries = experienceSection.split(/\n\n+/);
    
    for (const entry of potentialEntries) {
      if (entry.length < 20) continue; // Skip short entries
      
      // Try to extract job title
      let title = "Position";
      for (const pattern of JOB_TITLE_PATTERNS) {
        if (new RegExp(`\\b${pattern}\\b`, 'i').test(entry)) {
          // Extract surrounding context as potential title
          const match = entry.match(new RegExp(`.{0,20}\\b${pattern}\\b.{0,20}`, 'i'));
          if (match) {
            title = match[0].trim();
            break;
          }
        }
      }
      
      // Try to extract company name
      let company = "Company";
      const companyMatch = entry.match(/(?:at|with|for)\s+([A-Z][A-Za-z\s]+)(?:,|\.|in)/);
      if (companyMatch && companyMatch[1]) {
        company = companyMatch[1].trim();
      }
      
      experience.push({
        title,
        company,
        dates: extractDateRange(entry),
        description: entry.substring(0, 150) + "..." // Truncate long descriptions
      });
      
      // Limit to a few entries for performance
      if (experience.length >= 3) break;
    }
  }
  
  // Extract personal info (basic)
  const personalInfo = {
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    location: extractLocation(text)
  };
  
  return {
    skills,
    education,
    experience,
    personal_info: personalInfo,
    full_text: text
  };
}

// Helper to extract sections from text
function extractSection(text: string, sectionNames: string[]) {
  const normalizedText = '\n' + text.toLowerCase();
  
  for (const name of sectionNames) {
    const pattern = new RegExp(`\\n${name}[:\\s]*\\n`, 'i');
    const match = normalizedText.match(pattern);
    
    if (match) {
      const startIdx = match.index + match[0].length;
      
      // Find the next section
      const nextSectionMatch = normalizedText.substring(startIdx).match(/\n[a-z\s]{2,30}[:\n]/i);
      const endIdx = nextSectionMatch 
        ? startIdx + nextSectionMatch.index 
        : text.length;
      
      return text.substring(startIdx, endIdx).trim();
    }
  }
  
  return null;
}

// Extract date ranges (simple regex)
function extractDateRange(text: string) {
  const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:-|–|to)\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\b\d{4}\s*(?:-|–|to)\s*\d{4}|\b\d{4}\s*(?:-|–|to)\s*(present|current|now)\b/i;
  const match = text.match(datePattern);
  return match ? match[0] : "";
}

// Extract email
function extractEmail(text: string) {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = text.match(emailPattern);
  return match ? match[0] : "";
}

// Extract phone
function extractPhone(text: string) {
  const phonePattern = /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  const match = text.match(phonePattern);
  return match ? match[0] : "";
}

// Extract name (heuristic - assumes name is at beginning)
function extractName(text: string) {
  const lines = text.split('\n').filter(l => l.trim());
  // Make a simplified guess using the first non-empty line
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.split(' ').length <= 4 && !firstLine.includes('@') && !firstLine.match(/^\d/)) {
      return firstLine;
    }
  }
  return "";
}

// Extract location
function extractLocation(text: string) {
  // Simple location extraction - looks for common location patterns
  const locationPatterns = [
    /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/, // City, ST
    /\b[A-Z][a-z]+,\s*[A-Z][a-z]+\b/, // City, State
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return "";
}

// Parse plain text content from a resume file 
async function extractResumeContent(fileContent: ArrayBuffer, fileType: string) {
  let textContent = "";

  try {
    if (fileType === 'application/pdf') {
      // For PDF files, we'd need a PDF parser
      // This is a placeholder for where you'd use a PDF parsing library
      textContent = "PDF text extraction would happen here in production";
      
      // In a real implementation, we'd use the PDF.js library via a Deno-compatible CDN
    } else if (fileType.includes('word') || fileType.includes('docx')) {
      // For Word documents
      // This is a placeholder for where you'd use a DOCX parsing library
      textContent = "DOCX text extraction would happen here in production";
      
      // In a real implementation, we'd use mammoth.js via a Deno-compatible CDN
    } else {
      // Assume it's plain text or something we can't parse
      textContent = new TextDecoder().decode(fileContent);
    }
  } catch (error) {
    console.error("Error extracting text:", error);
    textContent = "Error extracting text from document.";
  }

  return textContent;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the request body
    const requestData = await req.json();
    const { resumeId, fileUrl, fileType, userId } = requestData;

    if (!resumeId || !fileUrl || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the resume file
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('resumes')
      .download(fileUrl);

    if (fileError || !fileData) {
      return new Response(JSON.stringify({ error: `Error downloading resume: ${fileError?.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract text content from the resume
    const textContent = await extractResumeContent(await fileData.arrayBuffer(), fileType);

    // Parse the resume content
    const parsedResume = parseResumeText(textContent);

    // Save the parsed resume to the database
    const { data: insertData, error: insertError } = await supabase
      .from('parsed_resumes')
      .upsert({
        user_id: userId,
        resume_id: resumeId,
        full_text: parsedResume.full_text,
        skills: parsedResume.skills,
        education: parsedResume.education,
        experience: parsedResume.experience,
        personal_info: parsedResume.personal_info,
        updated_at: new Date().toISOString()
      })
      .select();

    if (insertError) {
      return new Response(JSON.stringify({ error: `Error saving parsed resume: ${insertError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Return the parsed resume data
    return new Response(JSON.stringify({
      message: 'Resume parsed successfully',
      data: parsedResume,
      id: insertData[0]?.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing resume:', error);
    
    return new Response(JSON.stringify({ error: `Internal server error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
