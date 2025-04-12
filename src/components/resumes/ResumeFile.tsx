
import { FileText } from "lucide-react";
import { Resume } from "@/types/resume";

interface ResumeFileProps {
  resume: Resume;
}

const ResumeFile = ({ resume }: ResumeFileProps) => {
  return (
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
  );
};

export default ResumeFile;
