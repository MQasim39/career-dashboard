
import { File, Trash2, Eye, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter,
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Resume } from "@/types/resume";
import { useResumes } from "@/hooks/use-resumes";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import ResumeParsing from "./ResumeParsing";
import { useAuth } from "@/hooks/use-auth";
import ResumeSkillsList from "./ResumeSkillsList";

interface ResumeCardProps {
  resume: Resume;
}

const ResumeCard = ({ resume }: ResumeCardProps) => {
  const { removeResume, setDefaultResume, defaultResumeId } = useResumes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedView, setExpandedView] = useState(false);

  const isDefault = defaultResumeId === resume.id;

  const handleRemove = () => {
    removeResume(resume.id);
  };

  const handleSetDefault = () => {
    setDefaultResume(resume.id);
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "general":
        return "bg-blue-500/20 text-blue-500 hover:bg-blue-500/20";
      case "technical":
        return "bg-green-500/20 text-green-500 hover:bg-green-500/20";
      case "executive":
        return "bg-purple-500/20 text-purple-500 hover:bg-purple-500/20";
      case "creative":
        return "bg-orange-500/20 text-orange-500 hover:bg-orange-500/20";
      case "entry-level":
        return "bg-teal-500/20 text-teal-500 hover:bg-teal-500/20";
      default:
        return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/20";
    }
  };

  const { user } = useAuth();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        {isDefault && (
          <div className="absolute -top-2 -right-2 bg-primary rounded-full p-0.5">
            <CheckCircle className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
        
        <div className="flex items-start gap-4">
          <div className="bg-secondary rounded-md p-2">
            <File className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-base truncate">{resume.name}</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                      <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => {
                        e.preventDefault(); // Prevent menu from closing
                        setDialogOpen(true);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>{resume.name}</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 overflow-auto">
                        {resume.file && (
                          <object 
                            data={resume.file} 
                            type={resume.fileType || "application/pdf"}
                            className="w-full h-full min-h-[60vh] border rounded-md"
                            aria-label={`Preview of ${resume.name}`}
                          >
                            <div className="p-4 text-center">
                              <p>Unable to display preview. <a href={resume.file} target="_blank" rel="noopener noreferrer" className="text-primary">Download the file</a> to view it.</p>
                            </div>
                          </object>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <DropdownMenuItem onClick={() => window.open(resume.file, '_blank')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleSetDefault} disabled={isDefault}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Set as Default
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this resume? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className={getBadgeColor(resume.type)}>
                {resume.type.charAt(0).toUpperCase() + resume.type.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(resume.dateUploaded), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {user && (
              <ResumeParsing 
                resume={resume} 
                onParseComplete={() => setExpandedView(true)}
              />
            )}
          </div>
          
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setExpandedView(!expandedView)}
          >
            {expandedView ? "Show Less" : "Show More"}
          </Button>
        </div>
      </CardContent>
      
      {expandedView && user && (
        <div className="px-6 pb-6 pt-2">
          <ResumeSkillsList 
            resumeId={resume.id} 
            userId={user.id}
          />
        </div>
      )}
    </Card>
  );
};

export default ResumeCard;
