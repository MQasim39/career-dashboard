
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { ParsedResume } from "@/hooks/use-resume-parsing";

interface UserDetailsProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
    resume_count?: number;
    notification_count?: number;
  };
  open: boolean;
  onClose: () => void;
}

interface Resume {
  id: string;
  filename: string;
  uploaded_at: string;
  file_size: number;
}

export default function UserDetailsDialog({ user, open, onClose }: UserDetailsProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [parsedResumes, setParsedResumes] = useState<ParsedResume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!open || !user) return;
      
      setLoading(true);
      try {
        // Fetch user's resumes
        const { data: resumesData, error: resumesError } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id);
          
        if (resumesError) throw resumesError;
        setResumes(resumesData || []);
        
        // Fetch parsed resume data
        const { data: parsedData, error: parsedError } = await supabase
          .from('parsed_resumes')
          .select('id, skills, experience, education')
          .eq('user_id', user.id);
          
        if (parsedError) throw parsedError;
        
        // Convert the JSON data into the expected format
        const formattedParsedResumes = (parsedData || []).map(item => ({
          id: item.id,
          skills: Array.isArray(item.skills) ? item.skills : [],
          // Ensure experience is always an array
          experience: Array.isArray(item.experience) ? item.experience : [],
          // Ensure education is always an array
          education: Array.isArray(item.education) ? item.education : [],
          // Add other required fields from ParsedResume type with defaults
          personal_info: {
            name: '',
            email: '',
            phone: '',
            location: ''
          },
          full_text: ''
        }));
        
        setParsedResumes(formattedParsedResumes);
        
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Detailed information for user {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p>{user.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p>{new Date(user.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium">Resumes ({resumes.length})</h3>
              {resumes.length === 0 ? (
                <p className="text-muted-foreground text-sm mt-2">No resumes uploaded</p>
              ) : (
                <div className="mt-2">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 text-sm font-medium">
                      <div>Filename</div>
                      <div>Uploaded</div>
                      <div>Size</div>
                    </div>
                    {resumes.map(resume => (
                      <div key={resume.id} className="grid grid-cols-3 gap-4 p-3 border-t text-sm">
                        <div className="truncate">{resume.filename}</div>
                        <div>{new Date(resume.uploaded_at).toLocaleString()}</div>
                        <div>{formatFileSize(resume.file_size)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium">Skills</h3>
              {parsedResumes.length === 0 ? (
                <p className="text-muted-foreground text-sm mt-2">No parsed resume data available</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {parsedResumes[0]?.skills?.map((skill, index) => (
                    <span key={index} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      {skill}
                    </span>
                  )) || <p className="text-muted-foreground text-sm">No skills found</p>}
                </div>
              )}
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Total Resumes</p>
                  <p>{resumes.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notifications</p>
                  <p>{user.notification_count || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
