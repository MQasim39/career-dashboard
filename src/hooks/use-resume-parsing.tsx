
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Resume } from "@/types/resume";

export interface ParsedResume {
  id?: string;
  skills: string[];
  education: Array<{
    degree: string;
    school: string;
    dates: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    dates: string;
    description: string;
  }>;
  personal_info: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  full_text: string;
}

export const useResumeParsing = (resume: Resume, onParseComplete?: (parsedData: ParsedResume) => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const parseResume = async () => {
    if (!resume || !resume.id) {
      setError("No resume selected");
      toast({
        title: "Error",
        description: "No resume selected for parsing",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      setError("Authentication required");
      toast({
        title: "Authentication required",
        description: "Please sign in to parse resumes",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Starting resume parsing for:", resume.id);
      
      // Validate resume ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(resume.id)) {
        throw new Error("Invalid resume ID format");
      }

      // Call the Supabase Edge Function for parsing
      const { data, error: functionError } = await supabase.functions.invoke('parse-resume', {
        body: {
          resumeId: resume.id,
          fileUrl: resume.file, // This should be the storage path
          fileType: resume.fileType,
          userId: user.id
        }
      });

      if (functionError) {
        console.error("Edge Function error:", functionError);
        throw new Error(functionError.message || "Error invoking parse function");
      }

      if (!data || !data.data) {
        throw new Error("No data returned from parsing function");
      }

      console.log("Resume parsed successfully:", data);
      
      // Set the parsed resume data
      setParsedResume(data.data);
      
      // Call the callback if provided
      if (onParseComplete) {
        onParseComplete(data.data);
      }

      toast({
        title: "Resume parsed successfully",
        description: "All information has been extracted from your resume.",
      });
    } catch (err: any) {
      console.error("Error parsing resume:", err);
      const errorMessage = err.message || "Failed to parse resume";
      setError(errorMessage);
      
      toast({
        title: "Failed to parse resume",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryParsing = () => {
    if (error) {
      setError(null);
    }
    parseResume();
  };

  return {
    isLoading,
    error,
    parsedResume,
    parseResume,
    retryParsing,
    setParsedResume
  };
};
