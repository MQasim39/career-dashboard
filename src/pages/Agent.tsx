
import { useState, useEffect } from "react";
import { Bot, Bell, Mail, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useResumes } from "@/hooks/use-resumes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useJobMatching } from "@/hooks/use-job-matching";

// Define the queue item interface to match the database schema
interface QueueItem {
  id: string;
  configuration_id: string;
  status: string;
  scheduled_for: string;
  priority: number;
}

const Agent = () => {
  const { resumes, defaultResumeId, setDefaultResume } = useResumes();
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("full-time");
  const [department, setDepartment] = useState("");
  const [salaryRange, setSalaryRange] = useState([40000, 120000]);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [browserAlerts, setBrowserAlerts] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { jobMatches, isLoading: isLoadingMatches } = useJobMatching(defaultResumeId || undefined);

  // Load saved agent status from localStorage on initial render
  useEffect(() => {
    if (user) {
      const savedState = localStorage.getItem(`agent_enabled_${user.id}`);
      const savedConfig = localStorage.getItem(`agent_config_${user.id}`);
      const savedLocation = localStorage.getItem(`agent_location_${user.id}`);
      const savedJobType = localStorage.getItem(`agent_jobType_${user.id}`);
      const savedDepartment = localStorage.getItem(`agent_department_${user.id}`);
      const savedSalaryRange = localStorage.getItem(`agent_salaryRange_${user.id}`);
      const savedEmailAlerts = localStorage.getItem(`agent_emailAlerts_${user.id}`);
      const savedBrowserAlerts = localStorage.getItem(`agent_browserAlerts_${user.id}`);
      
      if (savedState === 'true') setAgentEnabled(true);
      if (savedConfig) setConfigId(savedConfig);
      if (savedLocation) setLocation(savedLocation);
      if (savedJobType) setJobType(savedJobType);
      if (savedDepartment) setDepartment(savedDepartment);
      if (savedSalaryRange) setSalaryRange(JSON.parse(savedSalaryRange));
      if (savedEmailAlerts) setEmailAlerts(savedEmailAlerts === 'true');
      if (savedBrowserAlerts) setBrowserAlerts(savedBrowserAlerts === 'true');
    }
  }, [user]);

  // Save agent status to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`agent_enabled_${user.id}`, agentEnabled.toString());
      localStorage.setItem(`agent_location_${user.id}`, location);
      localStorage.setItem(`agent_jobType_${user.id}`, jobType);
      localStorage.setItem(`agent_department_${user.id}`, department);
      localStorage.setItem(`agent_salaryRange_${user.id}`, JSON.stringify(salaryRange));
      localStorage.setItem(`agent_emailAlerts_${user.id}`, emailAlerts.toString());
      localStorage.setItem(`agent_browserAlerts_${user.id}`, browserAlerts.toString());
      if (configId) {
        localStorage.setItem(`agent_config_${user.id}`, configId);
      }
    }
  }, [
    user, 
    agentEnabled, 
    configId, 
    location, 
    jobType, 
    department, 
    salaryRange, 
    emailAlerts, 
    browserAlerts
  ]);

  useEffect(() => {
    const triggerJobScraping = async () => {
      if (!agentEnabled || !user || !defaultResumeId) return;
      
      setIsProcessing(true);
      setLastError(null);
      
      try {
        // Create config data but don't include resume_id as a direct column
        // Instead, store it in a metadata field which should be part of the filters JSON column
        const configData = {
          name: `Auto Agent Job Search - ${new Date().toISOString().split('T')[0]}`,
          user_id: user.id,
          keywords: department ? [department] : [],
          locations: location ? [location] : [],
          job_types: [jobType],
          salary_range: {
            min: salaryRange[0],
            max: salaryRange[1], 
            currency: "USD"
          },
          filters: {
            resume_id: defaultResumeId,
            email_alerts: emailAlerts,
            browser_alerts: browserAlerts
          },
          is_active: true,
          frequency: "daily"
        };
        
        const { data: configResult, error: configError } = await supabase
          .from('scraper_configurations')
          .insert(configData)
          .select()
          .single();
          
        if (configError) throw configError;
        
        // Save the config ID for future reference
        if (configResult) {
          setConfigId(configResult.id);
        }
        
        // Properly type the queue result
        const { data: queueResult, error: queueError } = await supabase
          .from('scraper_queue')
          .insert({
            configuration_id: configResult.id,
            status: 'pending',
            scheduled_for: new Date().toISOString(),
            priority: 10
          })
          .select<'*', QueueItem>(); // Properly type the response
          
        if (queueError) throw queueError;
        
        // Safely check if we have a valid queue item
        const queueItemId = queueResult && queueResult.length > 0 ? queueResult[0].id : null;
        
        if (queueItemId) {
          const { error: functionError } = await supabase.functions.invoke('scrape-jobs', {
            body: { 
              configuration_id: configResult.id,
              queue_item_id: queueItemId,
              resume_id: defaultResumeId // Pass resume_id as a separate parameter to the function
            }
          });
          
          if (functionError) throw functionError;
        } else {
          throw new Error("Failed to create queue item");
        }
        
        toast({
          title: "Agent activated",
          description: "Your job agent is now searching for matching positions.",
        });
      } catch (error: any) {
        console.error("Error activating agent:", error);
        setLastError(error.message || "Unknown error");
        toast({
          title: "Agent activation failed",
          description: error.message || "There was an error activating your job agent.",
          variant: "destructive",
        });
        setAgentEnabled(false);
      } finally {
        setIsProcessing(false);
      }
    };
    
    if (agentEnabled) {
      triggerJobScraping();
    }
  }, [agentEnabled, user, defaultResumeId, location, jobType, department, salaryRange, toast, emailAlerts, browserAlerts]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">Job Agent</h1>
        <p className="text-muted-foreground">
          Configure your automated job search assistant to find the perfect match
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-heading">Agent Status</CardTitle>
                <Switch
                  checked={agentEnabled}
                  onCheckedChange={setAgentEnabled}
                  disabled={isProcessing || !defaultResumeId}
                />
              </div>
              <CardDescription>
                {agentEnabled 
                  ? "Your job search agent is actively searching for matching positions"
                  : "Enable the agent to start automated job searching"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Bot className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {isProcessing 
                    ? "Agent is initializing and starting jobs search..."
                    : agentEnabled
                    ? "Agent is currently searching based on your active resume and filters"
                    : "Agent is currently inactive"}
                </span>
                {isProcessing && (
                  <div className="ml-auto">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {lastError && (
                <Alert variant="destructive" className="mt-3">
                  <AlertDescription className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span className="text-sm">Error details: {lastError}</span>
                  </AlertDescription>
                </Alert>
              )}
              
              {!defaultResumeId && (
                <div className="mt-3 text-sm text-amber-500 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>You need to select a resume to enable the agent</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Search Criteria</CardTitle>
              <CardDescription>
                Define parameters for the automated job search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="City, State, or Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-type">Job Type</Label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger id="job-type">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input 
                  id="department" 
                  placeholder="Engineering, Marketing, etc."
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Salary Range</Label>
                  <span className="text-sm text-muted-foreground">
                    ${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()}
                  </span>
                </div>
                <Slider
                  defaultValue={[40000, 120000]}
                  min={0}
                  max={250000}
                  step={5000}
                  value={salaryRange}
                  onValueChange={setSalaryRange}
                  className="py-4"
                />
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="advanced-filters">
                  <AccordionTrigger className="text-sm font-medium">
                    Advanced Filters
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="experience">Experience Level</Label>
                          <Select defaultValue="mid">
                            <SelectTrigger id="experience">
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="entry">Entry Level</SelectItem>
                              <SelectItem value="mid">Mid Level</SelectItem>
                              <SelectItem value="senior">Senior Level</SelectItem>
                              <SelectItem value="executive">Executive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company-size">Company Size</Label>
                          <Select defaultValue="any">
                            <SelectTrigger id="company-size">
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any Size</SelectItem>
                              <SelectItem value="startup">Startup (1-10)</SelectItem>
                              <SelectItem value="small">Small (11-50)</SelectItem>
                              <SelectItem value="medium">Medium (51-200)</SelectItem>
                              <SelectItem value="large">Large (201-1000)</SelectItem>
                              <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords (comma separated)</Label>
                        <Input id="keywords" placeholder="React, TypeScript, UI/UX, etc." />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Active Resume</CardTitle>
              <CardDescription>
                Select which resume to use for job matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resumes.length > 0 ? (
                <div className="space-y-2">
                  <Select
                    value={defaultResumeId || ""}
                    onValueChange={setDefaultResume}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a resume" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((resume) => (
                        <SelectItem key={resume.id} value={resume.id}>
                          {resume.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <p className="text-xs text-muted-foreground mt-4">
                    The selected resume will be used to match against job requirements
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No resumes uploaded yet
                  </p>
                  <Button asChild size="sm">
                    <a href="/resumes">Upload Resume</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Notifications</CardTitle>
              <CardDescription>
                Configure how you receive job alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <Label htmlFor="browser-alerts" className="text-sm">
                    Browser Notifications
                  </Label>
                </div>
                <Switch
                  id="browser-alerts"
                  checked={browserAlerts}
                  onCheckedChange={setBrowserAlerts}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <Label htmlFor="email-alerts" className="text-sm">
                    Email Alerts
                  </Label>
                </div>
                <Switch
                  id="email-alerts"
                  checked={emailAlerts}
                  onCheckedChange={setEmailAlerts}
                />
              </div>
              
              <div className="pt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Select defaultValue="important">
                          <SelectTrigger>
                            <SelectValue placeholder="Notification frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Real-time</SelectItem>
                            <SelectItem value="daily">Daily digest</SelectItem>
                            <SelectItem value="important">Important matches only</SelectItem>
                            <SelectItem value="weekly">Weekly summary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Control how often you receive notifications</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Agent;
