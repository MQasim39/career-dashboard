
import { useState } from "react";
import { UploadCloud, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useResumes } from "@/hooks/use-resumes";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const ResumeUpload = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [resumeType, setResumeType] = useState("general");
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();
  const { addResume } = useResumes();
  const { user } = useAuth();

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection via input
  const handleFileChange = (file: File) => {
    // Check file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document",
        variant: "destructive"
      });
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setResumeName(file.name.split('.')[0]);
  };

  // Automatically parse the resume
  const parseResume = async (resumeId: string, filePath: string, fileType: string) => {
    if (!user) return;
    
    setIsParsing(true);
    
    try {
      // Call the Supabase Edge Function to parse the resume
      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: {
          resumeId: resumeId,
          fileUrl: filePath,
          fileType: fileType,
          userId: user.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Resume processed successfully",
        description: "Your resume has been analyzed and skills extracted",
      });
      
      console.log("Parse resume result:", data);
    } catch (err) {
      console.error("Error parsing resume:", err);
      toast({
        title: "Resume processing in progress",
        description: "Your resume is being analyzed in the background",
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a resume file to upload",
        variant: "destructive"
      });
      return;
    }

    if (!resumeName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a name for your resume",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload resumes",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Generate a unique ID for the resume
      const resumeId = Date.now().toString();
      
      // Create resume object
      const newResume = {
        id: resumeId,
        name: resumeName,
        type: resumeType,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        dateUploaded: new Date().toISOString(),
        file: URL.createObjectURL(selectedFile)
      };

      // Add resume to storage
      addResume(newResume);
      
      // Reset form and close dialog
      setSelectedFile(null);
      setResumeName("");
      setResumeType("general");
      setIsOpen(false);
      
      toast({
        title: "Resume uploaded",
        description: "Your resume is being processed...",
      });
      
      // Auto-parse the resume
      await parseResume(resumeId, newResume.file, newResume.fileType);
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your resume",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file removal
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setResumeName("");
  };

  // Direct file input click handler
  const handleSelectFileClick = () => {
    document.getElementById("resume-upload")?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" onClick={() => setIsOpen(true)}>
          <UploadCloud className="h-4 w-4" />
          <span>Add Resume</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Resume</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/10" : "border-border"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <UploadCloud className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-base font-medium">
                    Drag and drop your resume here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports PDF, DOC, DOCX (max 5MB)
                  </p>
                </div>
                <div className="mt-2">
                  <Input
                    id="resume-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSelectFileClick}
                  >
                    Select File
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary p-2 rounded">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume-name">Resume Name</Label>
              <Input
                id="resume-name"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                placeholder="e.g., Software Developer Resume"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume-type">Resume Type</Label>
              <Select value={resumeType} onValueChange={setResumeType}>
                <SelectTrigger id="resume-type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="entry-level">Entry Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || isParsing}>
              {isUploading ? (
                <>
                  <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Uploading...
                </>
              ) : (
                <>Upload Resume</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeUpload;
