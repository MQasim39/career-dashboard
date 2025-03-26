
import { useState, useRef } from "react";
import { BarChart, ChevronRight, FileText, Briefcase, ArrowUp, ArrowDown, Check, Clock, BarChart3, BarChart4, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResumes } from "@/hooks/use-resumes";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Mock data for the dashboard charts
const applicationData = [{
  name: 'Jan',
  applications: 5,
  interviews: 2
}, {
  name: 'Feb',
  applications: 8,
  interviews: 3
}, {
  name: 'Mar',
  applications: 12,
  interviews: 5
}, {
  name: 'Apr',
  applications: 10,
  interviews: 4
}, {
  name: 'May',
  applications: 15,
  interviews: 6
}, {
  name: 'Jun',
  applications: 18,
  interviews: 8
}, {
  name: 'Jul',
  applications: 22,
  interviews: 10
}];

const Dashboard = () => {
  const { resumes, addResume } = useResumes();
  const [expandedStats, setExpandedStats] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock statistics
  const stats = {
    totalApplications: 42,
    perfectMatches: 8,
    partialMatches: 22,
    noResponses: 12,
    interviewRate: 38,
    lastWeekApplications: 5,
    prevWeekApplications: 3
  };
  const weeklyChange = stats.lastWeekApplications - stats.prevWeekApplications;
  const weeklyChangePercent = stats.prevWeekApplications !== 0 ? Math.round(weeklyChange / stats.prevWeekApplications * 100) : 100;

  // Handle resume upload
  const handleUploadResume = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or DOCX file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    // Simulate upload process
    setTimeout(() => {
      // Create a new resume object
      const newResume = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type === 'application/pdf' ? 'PDF' : 'DOCX',
        size: file.size,
        dateUploaded: new Date().toISOString(),
        data: URL.createObjectURL(file),
        status: 'active',
        favorite: false
      };

      // Add the resume to the context
      addResume(newResume);

      // Show success message
      toast({
        title: "Resume uploaded",
        description: "Your resume has been successfully uploaded",
      });

      setIsUploading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1500);
  };

  // Navigation handlers
  const handleConfigureAgent = () => {
    navigate('/agent');
  };

  const handleBrowseJobs = () => {
    navigate('/jobs');
  };

  const handleViewReports = () => {
    navigate('/reports');
  };

  return <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your job application progress and analytics
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <div className={`flex items-center text-xs ${weeklyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {weeklyChange >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                <span>{Math.abs(weeklyChangePercent)}% from last week</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Perfect Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.perfectMatches}</div>
              <div className="flex items-center gap-1 text-xs text-primary">
                <span>{Math.round(stats.perfectMatches / stats.totalApplications * 100)}%</span>
                <span>match rate</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partial Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.partialMatches}</div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-accent-foreground dark:text-accent-foreground">{Math.round(stats.partialMatches / stats.totalApplications * 100)}%</span>
                <span className="text-accent-foreground dark:text-accent-foreground">of total</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interview Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.interviewRate}%</div>
              <div className="flex items-center gap-1 text-xs text-accent-foreground">
                <span>{Math.round(stats.interviewRate / 10)}/10</span>
                <span>score</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Stats (Expandable) */}
      <Card className="shadow-sm transition-all duration-300">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl font-heading">Application Statistics</CardTitle>
            <CardDescription>
              Detailed breakdown of your job applications
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpandedStats(!expandedStats)} className="h-8 w-8 p-0 rounded-full">
            <ChevronRight className={`h-4 w-4 transition-transform ${expandedStats ? 'rotate-90' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className={`grid gap-4 transition-all duration-300 overflow-hidden ${expandedStats ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {/* Application Status */}
              <div>
                <h3 className="text-sm font-medium mb-2">Application Status</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Perfect Match</span>
                      <span>{Math.round(stats.perfectMatches / stats.totalApplications * 100)}%</span>
                    </div>
                    <Progress value={Math.round(stats.perfectMatches / stats.totalApplications * 100)} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Partial Match</span>
                      <span>{Math.round(stats.partialMatches / stats.totalApplications * 100)}%</span>
                    </div>
                    <Progress value={Math.round(stats.partialMatches / stats.totalApplications * 100)} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">No Response</span>
                      <span>{Math.round(stats.noResponses / stats.totalApplications * 100)}%</span>
                    </div>
                    <Progress value={Math.round(stats.noResponses / stats.totalApplications * 100)} className="h-2" />
                  </div>
                </div>
              </div>
              
              {/* Job Match Breakdown */}
              <div>
                <h3 className="text-sm font-medium mb-2">Application Timeline</h3>
                <div className="flex items-center justify-between space-x-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary"></div>
                    <span className="text-xs">Applications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-accent"></div>
                    <span className="text-xs">Interviews</span>
                  </div>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={applicationData} margin={{
                    top: 5,
                    right: 20,
                    left: 0,
                    bottom: 5
                  }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" tick={{
                      fontSize: 12
                    }} tickLine={false} />
                      <YAxis tick={{
                      fontSize: 12
                    }} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="applications" stroke="#4361EE" fill="#4361EE" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="interviews" stroke="#F72585" fill="#F72585" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className={expandedStats ? "border-t" : ""}>
          {expandedStats && <div className="w-full flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setExpandedStats(false)}>
                Collapse
              </Button>
            </div>}
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recent">Recent Applications</TabsTrigger>
              <TabsTrigger value="matches">Best Matches</TabsTrigger>
              <TabsTrigger value="interviews">Upcoming Interviews</TabsTrigger>
            </TabsList>
            <TabsContent value="recent">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-heading">Recently Applied</CardTitle>
                  <CardDescription>
                    Your most recent job applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-3 rounded-lg border">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">Senior Frontend Developer</h4>
                          <span className="text-xs text-muted-foreground">2 days ago</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">TechCorp Inc. • Remote • Full-time</p>
                        <div className="flex items-center gap-2">
                          <div className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            92% Match
                          </div>
                          <div className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            Interview Scheduled
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-3 rounded-lg border">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">UX/UI Designer</h4>
                          <span className="text-xs text-muted-foreground">3 days ago</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">Design Studio • San Francisco, CA • Full-time</p>
                        <div className="flex items-center gap-2">
                          <div className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            78% Match
                          </div>
                          <div className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            Interview Scheduled
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-3 rounded-lg border">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">Full Stack Developer</h4>
                          <span className="text-xs text-muted-foreground">5 days ago</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">Startup Labs • New York, NY • Full-time</p>
                        <div className="flex items-center gap-2">
                          <div className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            85% Match
                          </div>
                          <div className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            Under Review
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="outline" className="w-full" onClick={() => navigate('/jobs')}>
                    View All Applications
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="matches">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-heading">Best Matches</CardTitle>
                  <CardDescription>
                    Jobs that closely match your resume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-3 rounded-lg border">
                      <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">Frontend Lead Developer</h4>
                          <span className="text-xs text-muted-foreground">New</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">InnovateX • Remote • Full-time</p>
                        <div className="flex items-center gap-2">
                          <div className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                            98% Match
                          </div>
                          <div className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            Not Applied
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-3 rounded-lg border">
                      <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">React Developer</h4>
                          <span className="text-xs text-muted-foreground">New</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">TechGiant • Austin, TX • Full-time</p>
                        <div className="flex items-center gap-2">
                          <div className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                            94% Match
                          </div>
                          <div className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            Not Applied
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="outline" className="w-full" onClick={() => navigate('/jobs')}>
                    View All Matches
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="interviews">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-heading">Upcoming Interviews</CardTitle>
                  <CardDescription>
                    Your scheduled interviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-3 rounded-lg border">
                      <div className="h-10 w-10 bg-accent/10 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">UX/UI Designer</h4>
                          <span className="text-xs font-medium text-accent">Tomorrow, 2:00 PM</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">Design Studio • Video Interview</p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs">Join Meeting</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">Reschedule</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-3 rounded-lg border">
                      <div className="h-10 w-10 bg-accent/10 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">Senior Frontend Developer</h4>
                          <span className="text-xs font-medium text-accent">Friday, 11:00 AM</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">TechCorp Inc. • Technical Interview</p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs">View Details</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">Reschedule</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="outline" className="w-full" onClick={() => navigate('/jobs')}>
                    View Calendar
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Quick Actions & Resume Overview */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Hidden file input for resume upload */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                className="hidden" 
              />
              
              <Button 
                className="w-full justify-start" 
                onClick={handleUploadResume}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Upload Resume
                  </>
                )}
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                onClick={handleConfigureAgent}
              >
                <Bot className="mr-2 h-4 w-4" />
                Configure Agent
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                onClick={handleBrowseJobs}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Browse Jobs
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                onClick={handleViewReports}
              >
                <BarChart className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Resume Overview</CardTitle>
              <CardDescription>
                {resumes.length > 0 ? `You have ${resumes.length} resume${resumes.length > 1 ? 's' : ''}` : "No resumes uploaded yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resumes.length > 0 ? <div className="space-y-2">
                  {resumes.slice(0, 3).map(resume => <div key={resume.id} className="flex items-center p-2 rounded-md hover:bg-muted">
                      <div className="bg-secondary p-1.5 rounded-md mr-3">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{resume.name}</p>
                        <p className="text-xs text-muted-foreground">{resume.type}</p>
                      </div>
                    </div>)}
                  
                  {resumes.length > 3 && <p className="text-xs text-center text-muted-foreground pt-2">
                      +{resumes.length - 3} more resumes
                    </p>}
                </div> : <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a resume to get started
                  </p>
                  <Button size="sm" onClick={handleUploadResume}>
                    Upload Now
                  </Button>
                </div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Dashboard;
