
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, GraduationCap, User } from "lucide-react";
import { ParsedResume } from "@/hooks/use-resume-parsing";

interface ResumeParsingTabsProps {
  parsedResume: ParsedResume;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ResumeParsingTabs = ({ parsedResume, activeTab, setActiveTab }: ResumeParsingTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="skills">Skills</TabsTrigger>
        <TabsTrigger value="experience">Experience</TabsTrigger>
        <TabsTrigger value="education">Education</TabsTrigger>
        <TabsTrigger value="personal">Personal</TabsTrigger>
      </TabsList>
      
      <TabsContent value="skills" className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {parsedResume.skills.length > 0 ? (
            parsedResume.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="capitalize">
                {skill}
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No skills detected</p>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="experience" className="space-y-4">
        {parsedResume.experience.length > 0 ? (
          parsedResume.experience.map((exp, index) => (
            <Card key={index}>
              <CardHeader className="py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{exp.title}</CardTitle>
                    <CardDescription>{exp.company}</CardDescription>
                  </div>
                  {exp.dates && (
                    <Badge variant="outline">{exp.dates}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <p className="text-sm text-muted-foreground">{exp.description}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No experience detected</p>
        )}
      </TabsContent>
      
      <TabsContent value="education" className="space-y-4">
        {parsedResume.education.length > 0 ? (
          parsedResume.education.map((edu, index) => (
            <Card key={index}>
              <CardHeader className="py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base capitalize">{edu.degree}</CardTitle>
                    <CardDescription>{edu.school}</CardDescription>
                  </div>
                  {edu.dates && (
                    <Badge variant="outline">{edu.dates}</Badge>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No education detected</p>
        )}
      </TabsContent>
      
      <TabsContent value="personal" className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <dl className="space-y-3">
              <div className="flex items-center">
                <dt className="flex items-center gap-2 text-sm font-medium w-28">
                  <User className="h-4 w-4" />
                  Name:
                </dt>
                <dd className="flex-1">{parsedResume.personal_info.name || "Not detected"}</dd>
              </div>
              <div className="flex items-center">
                <dt className="flex items-center gap-2 text-sm font-medium w-28">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Email:
                </dt>
                <dd className="flex-1">{parsedResume.personal_info.email || "Not detected"}</dd>
              </div>
              <div className="flex items-center">
                <dt className="flex items-center gap-2 text-sm font-medium w-28">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Phone:
                </dt>
                <dd className="flex-1">{parsedResume.personal_info.phone || "Not detected"}</dd>
              </div>
              <div className="flex items-center">
                <dt className="flex items-center gap-2 text-sm font-medium w-28">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Location:
                </dt>
                <dd className="flex-1">{parsedResume.personal_info.location || "Not detected"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ResumeParsingTabs;
