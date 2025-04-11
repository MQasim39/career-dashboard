
import { useState } from "react";
import { Briefcase, Clock, MapPin, Calendar, Check, X, MoreHorizontal, Star, Building, ExternalLink, Edit, Copy, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Job } from "@/types/job";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import JobMatchScore from "./JobMatchScore";
import { useToast } from "@/hooks/use-toast";

interface JobCardProps {
  job: Job;
  onStatusChange: (id: string, status: string) => void;
  onToggleFavorite: (id: string) => void;
  matchScore?: number;
  matchedSkills?: string[];
}

const JobCard = ({ job, onStatusChange, onToggleFavorite, matchScore, matchedSkills }: JobCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-500/20 text-blue-500 hover:bg-blue-500/20";
      case "interview":
        return "bg-purple-500/20 text-purple-500 hover:bg-purple-500/20";
      case "offer":
        return "bg-green-500/20 text-green-500 hover:bg-green-500/20";
      case "rejected":
        return "bg-red-500/20 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/20";
    }
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case "full-time":
        return "bg-teal-500/20 text-teal-500 hover:bg-teal-500/20";
      case "part-time":
        return "bg-orange-500/20 text-orange-500 hover:bg-orange-500/20";
      case "contract":
        return "bg-amber-500/20 text-amber-500 hover:bg-amber-500/20";
      case "internship":
        return "bg-sky-500/20 text-sky-500 hover:bg-sky-500/20";
      default:
        return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/20";
    }
  };

  const handleCopyLink = () => {
    // In a real implementation, this would copy an actual job application URL
    navigator.clipboard.writeText(`https://example.com/job/${job.id}`);
    toast({
      title: "Link copied",
      description: "Job application link has been copied to clipboard",
    });
  };

  const handleEditJob = () => {
    toast({
      title: "Edit job",
      description: "Job editing functionality will be implemented soon",
    });
  };

  const handleViewDetails = () => {
    toast({
      title: "View details",
      description: "Detailed job view will be implemented soon",
    });
    setIsExpanded(true);
  };

  const handleDeleteJob = () => {
    toast({
      title: "Delete job",
      description: "Job deletion functionality will be implemented soon",
      variant: "destructive",
    });
  };

  return (
    <Card className="overflow-hidden transition-all duration-300">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            <div className="rounded-md p-2 bg-secondary">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-base">{job.title}</h3>
              <p className="text-sm text-muted-foreground">{job.company}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8", job.favorite ? "text-yellow-500" : "")}
              onClick={() => onToggleFavorite(job.id)}
            >
              <Star className={cn("h-5 w-5", job.favorite ? "fill-current" : "")} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEditJob}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewDetails}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDeleteJob}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("p-4 text-sm grid gap-3", isExpanded ? "grid-cols-2" : "grid-cols-1")}>
        <div className="flex flex-wrap items-center gap-4">
          <Badge variant="outline" className={getStatusColor(job.status)}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
          <Badge variant="outline" className={getJobTypeColor(job.jobType)}>
            {job.jobType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Badge>
          <span className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDistanceToNow(new Date(job.dateApplied), { addSuffix: true })}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{job.location}</span>
          </span>
          {job.salary && (
            <span className="flex items-center text-muted-foreground">
              <span>${job.salary.toLocaleString()}</span>
            </span>
          )}
          {matchScore && matchScore >= 70 && (
            <JobMatchScore score={matchScore} matchedSkills={matchedSkills} />
          )}
        </div>
        {isExpanded && (
          <>
            <div className="col-span-full mt-2">
              <p className="text-sm text-muted-foreground">{job.description}</p>
            </div>
            <div className="col-span-full">
              <div className="flex flex-wrap gap-2 mt-2">
                {job.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-secondary/50">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-green-500 border-green-500/20 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30"
            onClick={() => onStatusChange(job.id, job.status === "applied" ? "interview" : "offer")}
            disabled={job.status === "offer" || job.status === "rejected"}
          >
            <Check className="h-4 w-4 mr-1" />
            {job.status === "applied" ? "To Interview" : job.status === "interview" ? "To Offer" : "Accepted"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            onClick={() => onStatusChange(job.id, "rejected")}
            disabled={job.status === "rejected"}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
