
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RecentApplications from "@/components/dashboard/RecentApplications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useResumes } from "@/hooks/use-resumes";

const Dashboard = () => {
  const { resumes } = useResumes();
  
  return (
    <div className="space-y-8 animate-fade-in">
      <DashboardHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentApplications />
        </div>
        
        <div>
          <Tabs defaultValue="resumes">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resumes">Resumes</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            </TabsList>
            <TabsContent value="resumes">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Your Resumes</CardTitle>
                  <CardDescription>
                    {resumes.length > 0
                      ? `You have ${resumes.length} resume${resumes.length > 1 ? 's' : ''}`
                      : "No resumes uploaded yet"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {resumes.length > 0 ? (
                    <div className="space-y-2">
                      {resumes.slice(0, 3).map((resume) => (
                        <div key={resume.id} className="flex items-center p-2 rounded-md hover:bg-muted">
                          <div className="bg-secondary p-1.5 rounded-md mr-3">
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary">
                              <path d="M3.5 2C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V6H8.5C8.22386 6 8 5.77614 8 5.5V2H3.5ZM9 2.70711L11.2929 5H9V2.70711ZM2 2.5C2 1.67157 2.67157 1 3.5 1H8.5C8.63261 1 8.75979 1.05268 8.85355 1.14645L12.8536 5.14645C12.9473 5.24021 13 5.36739 13 5.5V12.5C13 13.3284 12.3284 14 11.5 14H3.5C2.67157 14 2 13.3284 2 12.5V2.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{resume.name}</p>
                            <p className="text-xs text-muted-foreground">{resume.type}</p>
                          </div>
                        </div>
                      ))}
                      
                      {resumes.length > 3 && (
                        <p className="text-xs text-center text-muted-foreground pt-2">
                          +{resumes.length - 3} more resumes
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload a resume to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="upcoming">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Upcoming Interviews</CardTitle>
                  <CardDescription>
                    Your scheduled interviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No upcoming interviews
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
