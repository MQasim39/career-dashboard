
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, Check, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResumeSkillsListProps {
  resumeId: string;
  userId: string;
}

const ResumeSkillsList = ({ resumeId, userId }: ResumeSkillsListProps) => {
  const [skills, setSkills] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch skills for this resume
  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('parsed_resumes')
          .select('skills')
          .eq('resume_id', resumeId)
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        
        setSkills(data?.skills || []);
      } catch (error) {
        console.error("Error fetching skills:", error);
        // Not showing error toast as the resume might not have been parsed yet
      } finally {
        setIsLoading(false);
      }
    };

    if (resumeId && userId) {
      fetchSkills();
    }
  }, [resumeId, userId]);

  const addSkill = () => {
    if (!newSkill.trim()) return;
    
    // Check if skill already exists
    if (skills.includes(newSkill.toLowerCase().trim())) {
      toast({
        title: "Skill already exists",
        description: "This skill is already in your list",
        variant: "destructive",
      });
      return;
    }
    
    // Add the new skill
    const updatedSkills = [...skills, newSkill.toLowerCase().trim()];
    setSkills(updatedSkills);
    setNewSkill("");
    
    // Save to database
    updateSkillsInDatabase(updatedSkills);
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(updatedSkills);
    
    // Save to database
    updateSkillsInDatabase(updatedSkills);
  };

  const updateSkillsInDatabase = async (updatedSkills: string[]) => {
    try {
      const { error } = await supabase
        .from('parsed_resumes')
        .upsert({
          user_id: userId,
          resume_id: resumeId,
          skills: updatedSkills,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast({
        title: "Skills updated",
        description: "Your resume skills have been updated successfully",
      });
    } catch (error) {
      console.error("Error updating skills:", error);
      toast({
        title: "Failed to update skills",
        description: "An error occurred while updating your skills",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Skills</CardTitle>
            <CardDescription>
              Skills extracted from your resume
            </CardDescription>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-pulse h-4 bg-muted rounded w-full"></div>
          </div>
        ) : (
          <>
            {isEditing && (
              <div className="flex gap-2 mb-4">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a skill..."
                  className="flex-1"
                />
                <Button onClick={addSkill} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="capitalize"
                  >
                    {skill}
                    {isEditing && (
                      <button 
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {isEditing
                    ? "Add skills to improve job matching"
                    : "No skills found. Parse your resume or add skills manually."}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeSkillsList;
