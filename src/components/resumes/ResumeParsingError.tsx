
import { XCircle } from "lucide-react";

interface ResumeParsingErrorProps {
  error: string;
}

const ResumeParsingError = ({ error }: ResumeParsingErrorProps) => {
  return (
    <div className="py-8 flex flex-col items-center justify-center">
      <XCircle className="h-8 w-8 text-destructive mb-4" />
      <p className="text-center font-medium">Failed to parse resume</p>
      <p className="text-center text-muted-foreground mt-1">
        {error}
      </p>
    </div>
  );
};

export default ResumeParsingError;
