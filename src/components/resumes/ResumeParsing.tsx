
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, AlertCircle, FileText, Briefcase, GraduationCap, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Resume } from "@/types/resume";

interface ParsedResume {
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

interface ResumeParsingProps {
  resume: Resume;
  onParseComplete?: (parsedData: ParsedResume) => void;
}

const ResumeParsing = ({ resume, onParseComplete }: ResumeParsingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [activeTab, setActiveTab] = useState("skills");
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
      setActiveTab("skills");
      
      // Call the callback if provided
      if (onParseComplete) {
        onParseComplete(data.data);
      }

      toast({
        title: "Resume parsed successfully",
        description: "All information has been extracted from your resume.",
      });
    } catch (err) {
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          <span>Parse Resume</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Resume Analysis</DialogTitle>
        </DialogHeader>

        {!isLoading && !parsedResume && !error && (
          <div className="space-y-4 py-4">
            <p className="text-center text-muted-foreground">
              Our AI will analyze your resume to extract key information including skills, 
              experience, education, and personal details.
            </p>
            
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-md border p-3 w-full bg-muted/50">
                <div className="flex gap-3 items-center">
                  <div className="p-2 rounded-md bg-secondary">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="font-medium text-sm">{resume.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {(resume.fileSize / 1024).toFixed(1)} KB • {resume.fileType}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <p>For best results, make sure your resume is properly formatted.</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="py-8 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center text-muted-foreground">
              Analyzing your resume...
            </p>
            <p className="text-xs text-center text-muted-foreground mt-2">
              This may take a few moments
            </p>
          </div>
        )}

        {error && (
          <div className="py-8 flex flex-col items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive mb-4" />
            <p className="text-center font-medium">Failed to parse resume</p>
            <p className="text-center text-muted-foreground mt-1">
              {error}
            </p>
          </div>
        )}

        {parsedResume && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="personal">Personal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="skills" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {parsedResume.skills.length > 0 ? (
                  parsedResume.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="capitalize">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No skills detected</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="experience" className="space-y-4">
              {parsedResume.experience.length > 0 ? (
                parsedResume.experience.map((exp, index) => (
                  <Card key={index}>
                    <CardHeader className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{exp.title}</CardTitle>
                          <CardDescription>{exp.company}</CardDescription>
                        </div>
                        {exp.dates && (
                          <Badge variant="outline">{exp.dates}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm text-muted-foreground">{exp.description}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No experience detected</p>
              )}
            </TabsContent>
            
            <TabsContent value="education" className="space-y-4">
              {parsedResume.education.length > 0 ? (
                parsedResume.education.map((edu, index) => (
                  <Card key={index}>
                    <CardHeader className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base capitalize">{edu.degree}</CardTitle>
                          <CardDescription>{edu.school}</CardDescription>
                        </div>
                        {edu.dates && (
                          <Badge variant="outline">{edu.dates}</Badge>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No education detected</p>
              )}
            </TabsContent>
            
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <dl className="space-y-3">
                    <div className="flex items-center">
                      <dt className="flex items-center gap-2 text-sm font-medium w-28">
                        <User className="h-4 w-4" />
                        Name:
                      </dt>
                      <dd className="flex-1">{parsedResume.personal_info.name || "Not detected"}</dd>
                    </div>
                    <div className="flex items-center">
                      <dt className="flex items-center gap-2 text-sm font-medium w-28">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        Email:
                      </dt>
                      <dd className="flex-1">{parsedResume.personal_info.email || "Not detected"}</dd>
                    </div>
                    <div className="flex items-center">
                      <dt className="flex items-center gap-2 text-sm font-medium w-28">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Phone:
                      </dt>
                      <dd className="flex-1">{parsedResume.personal_info.phone || "Not detected"}</dd>
                    </div>
                    <div className="flex items-center">
                      <dt className="flex items-center gap-2 text-sm font-medium w-28">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        Location:
                      </dt>
                      <dd className="flex-1">{parsedResume.personal_info.location || "Not detected"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          {!isLoading && !parsedResume && (
            <Button onClick={parseResume} className="w-full">
              Analyze Resume
            </Button>
          )}
          {parsedResume && (
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              <Button variant="default" onClick={() => setIsOpen(false)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm & Save
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeParsing;
