
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
import { FileText, CheckCircle2 } from "lucide-react";
import { Resume } from "@/types/resume";
import { useResumeParsing, ParsedResume } from "@/hooks/use-resume-parsing";
import ResumeParsingIntro from "./ResumeParsingIntro";
import ResumeParsingLoading from "./ResumeParsingLoading";
import ResumeParsingError from "./ResumeParsingError";
import ResumeParsingTabs from "./ResumeParsingTabs";

interface ResumeParsingProps {
  resume: Resume;
  onParseComplete?: (parsedData: ParsedResume) => void;
}

const ResumeParsing = ({ resume, onParseComplete }: ResumeParsingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("skills");
  
  const { 
    isLoading, 
    error, 
    parsedResume, 
    parseResume
  } = useResumeParsing(resume, onParseComplete);

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
          <ResumeParsingIntro resume={resume} />
        )}

        {isLoading && <ResumeParsingLoading />}

        {error && <ResumeParsingError error={error} />}

        {parsedResume && (
          <ResumeParsingTabs 
            parsedResume={parsedResume} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
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
