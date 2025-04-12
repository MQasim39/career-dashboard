
import { AlertCircle } from "lucide-react";
import ResumeFile from "./ResumeFile";
import { Resume } from "@/types/resume";

interface ResumeParsingIntroProps {
  resume: Resume;
}

const ResumeParsingIntro = ({ resume }: ResumeParsingIntroProps) => {
  return (
    <div className="space-y-4 py-4">
      <p className="text-center text-muted-foreground">
        Our AI will analyze your resume to extract key information including skills, 
        experience, education, and personal details.
      </p>
      
      <div className="flex flex-col items-center gap-2">
        <ResumeFile resume={resume} />
      </div>
      
      <div className="border rounded-md p-3">
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <p>For best results, make sure your resume is properly formatted.</p>
        </div>
      </div>
    </div>
  );
};

export default ResumeParsingIntro;
