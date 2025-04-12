
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
    setIsLoading(true);
    setError(null);

    try {
      // Call the Supabase Edge Function for parsing
      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: {
          resumeId: resume.id,
          fileUrl: resume.file, // This should be the storage path
          fileType: resume.fileType,
          userId: user?.id
        }
      });

      if (error) {
        throw new Error(error.message);
      }

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
      setError(err.message || "Failed to parse resume");
      
      toast({
        title: "Failed to parse resume",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    parsedResume,
    parseResume,
    setParsedResume
  };
};
