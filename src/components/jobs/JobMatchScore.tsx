
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";

interface JobMatchScoreProps {
  score: number;
  matchedSkills?: string[];
}

const JobMatchScore = ({ score, matchedSkills = [] }: JobMatchScoreProps) => {
  const getScoreColor = () => {
    if (score >= 90) return "bg-green-500/20 text-green-500";
    if (score >= 80) return "bg-blue-500/20 text-blue-500";
    if (score >= 70) return "bg-amber-500/20 text-amber-500";
    return "bg-gray-500/20 text-gray-500";
  };
  
  const getMatchLabel = () => {
    if (score >= 90) return "Excellent Match";
    if (score >= 80) return "Strong Match";
    if (score >= 70) return "Good Match";
    return "Low Match";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${getScoreColor()} flex items-center gap-1 cursor-help`}>
            <Sparkles className="h-3 w-3" />
            <span>{getMatchLabel()} • {Math.round(score)}%</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 p-1">
            <p className="text-sm font-medium">Match score: {Math.round(score)}%</p>
            {matchedSkills.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Matched skills:</p>
                <div className="flex flex-wrap gap-1">
                  {matchedSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default JobMatchScore;
