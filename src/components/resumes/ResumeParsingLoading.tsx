
import { Loader2 } from "lucide-react";

const ResumeParsingLoading = () => {
  return (
    <div className="py-8 flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-center text-muted-foreground">
        Analyzing your resume...
      </p>
      <p className="text-xs text-center text-muted-foreground mt-2">
        This may take a few moments
      </p>
    </div>
  );
};

export default ResumeParsingLoading;
