
import { AlertCircle, RefreshCcw, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ResumeParsingErrorProps {
  error: string;
  onRetry?: () => void;
  onUploadNew?: () => void;
}

const ResumeParsingError = ({ 
  error, 
  onRetry, 
  onUploadNew 
}: ResumeParsingErrorProps) => {
  // Provide more user-friendly error messages
  const getUserFriendlyError = (errorMessage: string) => {
    if (errorMessage.includes("Edge Function returned a non-2xx status code")) {
      return "Our resume parsing service encountered an issue. The Python backend may be temporarily unavailable.";
    }
    
    if (errorMessage.includes("PDF")) {
      return "There was a problem processing your PDF file. The file might be protected, damaged, or in a format we can't read.";
    }
    
    if (errorMessage.includes("download")) {
      return "We couldn't access your resume file. It may have been deleted or moved.";
    }
    
    if (errorMessage.toLowerCase().includes("timeout") || errorMessage.toLowerCase().includes("time out")) {
      return "The resume processing took too long. This might be due to the complexity or size of your document.";
    }
    
    // Default message if we can't categorize the error
    return errorMessage || "An unexpected error occurred while processing your resume.";
  };

  return (
    <div className="py-6 flex flex-col items-center gap-4">
      <AlertCircle className="h-10 w-10 text-destructive" />
      
      <div className="text-center">
        <h3 className="text-lg font-medium">Failed to parse resume</h3>
        
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription className="mt-2">
            {getUserFriendlyError(error)}
          </AlertDescription>
        </Alert>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        )}
        
        {onUploadNew && (
          <Button 
            variant="default" 
            onClick={onUploadNew}
            className="gap-2"
          >
            <FilePlus className="h-4 w-4" />
            <span>Upload Different File</span>
          </Button>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground mt-2 text-center">
        <p>For best results, try uploading a PDF file with clear text content.</p>
        <p>Make sure the file is not password protected or has security restrictions.</p>
      </div>
    </div>
  );
};

export default ResumeParsingError;
