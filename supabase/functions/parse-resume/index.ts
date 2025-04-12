
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.10.111/+esm";

// Set worker source path for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.10.111/build/pdf.worker.min.js";

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
  console.log("Parsing resume text, content length:", text.length);
  if (!text || text.length < 10) {
    console.warn("Resume text is too short or empty:", text);
    return {
      skills: [],
      education: [{ degree: "Unknown", school: "Unknown", dates: "" }],
      experience: [{ title: "Unknown", company: "Unknown", dates: "", description: "No experience data extracted" }],
      personal_info: {
        name: "",
        email: "",
        phone: "",
        location: ""
      },
      full_text: text || "Failed to extract text from document"
    };
  }

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
      .filter(line => line.includes("University") || line.includes("College") || line.includes("Institute") || line.includes("School"))
      .map(line => line.trim());
    
    if (degreeMatches.length > 0 || possibleSchools.length > 0) {
      education.push({
        degree: degreeMatches.length > 0 ? degreeMatches[0] : "Degree",
        school: possibleSchools.length > 0 ? possibleSchools[0] : "School",
        dates: extractDateRange(educationSection),
      });
    }
  }
  
  if (education.length === 0) {
    education.push({
      degree: "Not specified",
      school: "Not found",
      dates: ""
    });
  }
  
  // Basic parsing for experience (simplified)
  const experienceSection = extractSection(text, ["experience", "work experience", "professional experience", "employment"]);
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
  
  if (experience.length === 0) {
    experience.push({
      title: "Not specified",
      company: "Not found",
      dates: "",
      description: "No work experience data could be extracted from the resume"
    });
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
  if (!text) return null;
  
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
  if (!text) return "";
  
  const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:-|–|to)\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\b\d{4}\s*(?:-|–|to)\s*\d{4}|\b\d{4}\s*(?:-|–|to)\s*(present|current|now)\b/i;
  const match = text.match(datePattern);
  return match ? match[0] : "";
}

// Extract email
function extractEmail(text: string) {
  if (!text) return "";
  
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = text.match(emailPattern);
  return match ? match[0] : "";
}

// Extract phone
function extractPhone(text: string) {
  if (!text) return "";
  
  const phonePattern = /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  const match = text.match(phonePattern);
  return match ? match[0] : "";
}

// Extract name (heuristic - assumes name is at beginning)
function extractName(text: string) {
  if (!text) return "";
  
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
  if (!text) return "";
  
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
  console.log(`Extracting content from file of type: ${fileType}, size: ${fileContent.byteLength} bytes`);
  let textContent = "";

  try {
    if (fileType === 'application/pdf') {
      console.log("Processing PDF file...");
      try {
        // Load PDF document using PDF.js
        const pdfData = new Uint8Array(fileContent);
        const loadingTask = pdfjs.getDocument({ data: pdfData });
        const pdfDocument = await loadingTask.promise;
        console.log(`PDF loaded successfully with ${pdfDocument.numPages} pages`);
        
        // Extract text from each page
        let extractedText = "";
        for (let i = 1; i <= pdfDocument.numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          extractedText += pageText + "\n\n";
        }
        
        textContent = extractedText;
        console.log(`Extracted ${textContent.length} characters from PDF`);
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        // Fallback to simple content reporting
        textContent = `Failed to parse PDF file: ${pdfError.message}. This file appears to be a PDF document of ${fileContent.byteLength} bytes.`;
      }
    } else if (fileType.includes('word') || fileType.includes('docx')) {
      console.log("Processing Word document...");
      // For Word documents - basic extraction
      // In production, you would use a proper DOCX parser
      textContent = "This file appears to be a Word document. For most accurate parsing, please upload a PDF file.";
      
      // Try to extract some raw text if possible
      try {
        const textDecoder = new TextDecoder();
        const rawText = textDecoder.decode(fileContent);
        
        // Try to extract plain text from Word XML
        const textMatches = rawText.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        if (textMatches && textMatches.length > 0) {
          const extractedText = textMatches
            .map(match => match.replace(/<[^>]+>/g, ''))
            .join(' ');
          
          textContent = extractedText;
        }
      } catch (docError) {
        console.error("Word document parsing error:", docError);
      }
    } else if (fileType.includes('text') || fileType.includes('plain')) {
      console.log("Processing plain text file...");
      textContent = new TextDecoder().decode(fileContent);
    } else {
      console.log("Unsupported file type, attempting generic text extraction...");
      // Attempt generic text extraction for unsupported formats
      try {
        textContent = new TextDecoder().decode(fileContent);
        if (!textContent || textContent.length < 10) {
          textContent = `Unable to extract text from file of type: ${fileType}. Please upload a PDF or plain text file for best results.`;
        }
      } catch (error) {
        console.error("Generic text extraction error:", error);
        textContent = `Error extracting text from document: ${error.message}. Please upload a different file format.`;
      }
    }
  } catch (error) {
    console.error("Error in extractResumeContent:", error);
    textContent = `Error extracting text from document: ${error.message}. Please try a different file format or check if the file is corrupted.`;
  }

  // Make sure we return at least something
  if (!textContent || textContent.length < 10) {
    textContent = `Unable to extract meaningful text from the document. The file appears to be of type ${fileType} and size ${fileContent.byteLength} bytes. Please try uploading a PDF file.`;
  }

  return textContent;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log("Parse-resume function invoked");
    
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the request body
    const requestData = await req.json();
    console.log("Request data received:", JSON.stringify(requestData, null, 2));
    const { resumeId, fileUrl, fileType, userId } = requestData;

    if (!resumeId || !fileUrl || !userId) {
      console.error("Missing required fields:", { resumeId, fileUrl, userId });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate UUID format for resumeId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (resumeId && !uuidRegex.test(resumeId)) {
      console.error("Invalid resumeId format:", resumeId);
      return new Response(JSON.stringify({ error: 'Invalid resumeId format. Must be a UUID.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Supabase credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase client created, attempting to download resume file...");

    // Download the resume file
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('resumes')
      .download(fileUrl);

    if (fileError || !fileData) {
      console.error("Error downloading resume:", fileError);
      return new Response(JSON.stringify({ 
        error: `Error downloading resume: ${fileError?.message || 'File not found'}`,
        details: "The file may have been deleted or the storage bucket may be misconfigured." 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("Resume file downloaded successfully, extracting content...");
    
    // Extract text content from the resume
    const textContent = await extractResumeContent(await fileData.arrayBuffer(), fileType);
    console.log(`Text content extracted, length: ${textContent.length} characters`);

    // Parse the resume content
    const parsedResume = parseResumeText(textContent);
    console.log("Resume parsed successfully");

    // Save the parsed resume to the database
    try {
      console.log("Saving parsed resume to database...");
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
        console.error("Error saving parsed resume:", insertError);
        return new Response(JSON.stringify({ 
          error: `Error saving parsed resume: ${insertError.message}`,
          parsedData: parsedResume // Return the parsed data even if saving failed
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log("Parsed resume saved to database");
      
      // Return the parsed resume data
      return new Response(JSON.stringify({
        message: 'Resume parsed successfully',
        data: parsedResume,
        id: insertData[0]?.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      return new Response(JSON.stringify({ 
        error: `Database error: ${dbError.message}`,
        parsedData: parsedResume // Return the parsed data even if saving failed
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error processing resume:', error);
    
    return new Response(JSON.stringify({ 
      error: `Internal server error: ${error.message}`,
      details: "See function logs for more details"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
