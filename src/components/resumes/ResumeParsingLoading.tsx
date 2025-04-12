
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

const ResumeParsingLoading = () => {
  const [progress, setProgress] = useState(10);
  const [stage, setStage] = useState("Initiating analysis");

  useEffect(() => {
    // Simulate progress for better user experience
    const stages = [
      "Initiating analysis",
      "Extracting text content",
      "Identifying skills",
      "Processing work experience",
      "Analyzing education history",
      "Finalizing resume profile"
    ];
    
    let currentStage = 0;
    const interval = setInterval(() => {
      // Update progress
      setProgress((prev) => {
        const newProgress = prev + Math.floor(Math.random() * 10);
        return newProgress > 95 ? 95 : newProgress;
      });
      
      // Update stage message occasionally
      if (Math.random() > 0.7 && currentStage < stages.length - 1) {
        currentStage++;
        setStage(stages[currentStage]);
      }
    }, 800);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-8 flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-center text-muted-foreground">
        {stage}...
      </p>
      <div className="w-full mt-4">
        <Progress value={progress} className="h-2" />
      </div>
      <p className="text-xs text-center text-muted-foreground mt-3">
        This may take a few moments. PDF analysis can take longer than other file types.
      </p>
    </div>
  );
};

export default ResumeParsingLoading;
