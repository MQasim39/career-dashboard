
import { useState, useEffect } from "react";
import { Bot, Bell, Mail, FileText, Info, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { useAuth } from "@/hooks/use-auth";
import { useJobMatching } from "@/hooks/use-job-matching";
import { usePythonBackend } from "@/services/python-backend";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface AgentState {
  enabled: boolean;
  location: string;
  jobType: string;
  department: string;
  salaryRange: [number, number];
  emailAlerts: boolean;
  browserAlerts: boolean;
  configId: string | null;
}

const Agent = () => {
  const { resumes, defaultResumeId, setDefaultResume } = useResumes();
  const [agentState, setAgentState] = useState<AgentState>({
    enabled: false,
    location: "",
    jobType: "full-time",
    department: "",
    salaryRange: [40000, 120000] as [number, number],
    emailAlerts: true,
    browserAlerts: true,
    configId: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState({
    api: "unknown",
    claude_api: "unknown",
    supabase: "unknown",
    firecrawl: "unknown"
  });
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { jobMatches, isLoading: isLoadingMatches } = useJobMatching(defaultResumeId || undefined);
  const { 
    isConfigured, 
    checkConfiguration, 
    activateAgent, 
    getApiStatus 
  } = usePythonBackend();

  // Load saved agent state
  useEffect(() => {
    if (user) {
      const savedState = localStorage.getItem(`agent_state_${user.id}`);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          setAgentState(parsedState);
        } catch (e) {
          console.error("Error parsing saved agent state:", e);
        }
      }
    }
  }, [user]);

  // Save agent state
  useEffect(() => {
    if (user) {
      localStorage.setItem(`agent_state_${user.id}`, JSON.stringify(agentState));
    }
  }, [user, agentState]);

  // Check backend status
  useEffect(() => {
    const checkBackendStatus = async () => {
      if (!isConfigured()) return;
      
      try {
        const status = await getApiStatus();
        setBackendStatus(status);
      } catch (error) {
        console.error("Error checking API status:", error);
      }
    };
    
    checkBackendStatus();
    // Check every 5 minutes
    const interval = setInterval(checkBackendStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [getApiStatus, isConfigured]);

  // Activate AI agent
  useEffect(() => {
    const activateAIAgent = async () => {
      if (!agentState.enabled || !user || !defaultResumeId) return;
      if (!isConfigured()) {
        setAgentState(prev => ({ ...prev, enabled: false }));
        return;
      }

      setIsProcessing(true);
      setLastError(null);

      try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(defaultResumeId)) {
          throw new Error("Invalid resume ID format. Please select a valid resume.");
        }
        
        console.log("Activating AI Agent with resume:", defaultResumeId);
        
        // Get access token from session directly
        const token = session?.access_token;
        
        if (!token) {
          throw new Error("Unable to get authentication token. Please try signing out and back in.");
        }
        
        // Call Python backend
        const response = await activateAgent({
          user_id: user.id,
          resume_id: defaultResumeId,
          location: agentState.location,
          job_type: agentState.jobType,
          department: agentState.department,
          salary_range: agentState.salaryRange,
          email_alerts: agentState.emailAlerts,
          browser_alerts: agentState.browserAlerts
        }, token);

        if (response && response.data && response.data.config_id) {
          setAgentState(prev => ({
            ...prev,
            configId: response.data.config_id
          }));
        }

        toast({
          title: "AI Agent activated",
          description: "Your AI job agent is now searching for matching positions.",
        });
      } catch (error: any) {
        console.error("Error activating AI agent:", error);
        setLastError(error.message || "Unknown error");
        toast({
          title: "AI Agent activation failed",
          description: error.message || "There was an error activating your AI job agent.",
          variant: "destructive",
        });
        setAgentState(prev => ({ ...prev, enabled: false }));
      } finally {
        setIsProcessing(false);
      }
    };

    if (agentState.enabled && !isProcessing) {
      activateAIAgent();
    }
  }, [
    agentState.enabled, 
    agentState.location, 
    agentState.jobType, 
    agentState.department, 
    agentState.salaryRange, 
    agentState.emailAlerts, 
    agentState.browserAlerts,
    user, 
    session,
    defaultResumeId, 
    toast, 
    isConfigured,
    activateAgent
  ]);

  const handleAgentToggle = (checked: boolean) => {
    if (checked && !validateForm()) return;
    
    setAgentState(prev => ({ ...prev, enabled: checked }));
    
    if (!checked) {
      toast({
        title: "AI Agent disabled",
        description: "Your AI job agent has been turned off."
      });
    }
  };

  const validateForm = () => {
    if (!isConfigured()) {
      toast({
        title: "Python Backend Not Configured",
        description: "Please configure the Python backend URL in the settings",
        variant: "destructive"
      });
      return false;
    }
    
    if (!defaultResumeId) {
      toast({
        title: "Resume required",
        description: "Please select a resume to enable the agent",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "configured":
        return <Badge variant="outline" className="bg-green-500/20 text-green-500">Available</Badge>;
      case "not configured":
        return <Badge variant="outline" className="bg-amber-500/20 text-amber-500">Not Configured</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-500/20 text-red-500">Error</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-500/20 text-gray-500">Unknown</Badge>;
    }
  };

  const updateAgentState = <K extends keyof AgentState>(key: K, value: AgentState[K]) => {
    setAgentState(prev => ({ ...prev, [key]: value }));
  };

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
                <CardTitle className="text-xl font-heading">AI Agent Status</CardTitle>
                <Switch
                  checked={agentState.enabled}
                  onCheckedChange={handleAgentToggle}
                  disabled={isProcessing || !defaultResumeId || !isConfigured()}
                />
              </div>
              <CardDescription>
                {agentState.enabled
                  ? "Your AI job agent is actively searching for matching positions"
                  : "Enable the AI agent to start intelligent job matching"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Bot className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {isProcessing
                    ? "AI agent is analyzing your resume and searching for jobs..."
                    : agentState.enabled
                    ? "AI agent is actively matching jobs based on your resume and preferences"
                    : "AI agent is currently inactive"}
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

              {!isConfigured() && (
                <div className="mt-3 text-sm text-amber-500 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  <span>Python backend is not configured. Please set it up in Settings</span>
                </div>
              )}
            </CardContent>
            {isConfigured() && (
              <CardFooter className="border-t pt-3">
                <div className="w-full">
                  <div className="text-sm font-medium mb-2">Service Status</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">API:</span>
                      {getStatusBadge(backendStatus.api)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Claude AI:</span>
                      {getStatusBadge(backendStatus.claude_api)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Supabase:</span>
                      {getStatusBadge(backendStatus.supabase)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Firecrawl:</span>
                      {getStatusBadge(backendStatus.firecrawl)}
                    </div>
                  </div>
                </div>
              </CardFooter>
            )}
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
                    value={agentState.location}
                    onChange={(e) => updateAgentState('location', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-type">Job Type</Label>
                  <Select 
                    value={agentState.jobType} 
                    onValueChange={(value) => updateAgentState('jobType', value)}
                  >
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
                  value={agentState.department}
                  onChange={(e) => updateAgentState('department', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Salary Range</Label>
                  <span className="text-sm text-muted-foreground">
                    ${agentState.salaryRange[0].toLocaleString()} - ${agentState.salaryRange[1].toLocaleString()}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={250000}
                  step={5000}
                  value={agentState.salaryRange}
                  onValueChange={(value) => updateAgentState('salaryRange', value as [number, number])}
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
                  checked={agentState.browserAlerts}
                  onCheckedChange={(checked) => updateAgentState('browserAlerts', checked)}
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
                  checked={agentState.emailAlerts}
                  onCheckedChange={(checked) => updateAgentState('emailAlerts', checked)}
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

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-heading">AI Configuration</CardTitle>
              <CardDescription>
                Manage how the AI assistant processes your resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="model">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="model">AI Model</TabsTrigger>
                  <TabsTrigger value="parameters">Parameters</TabsTrigger>
                </TabsList>
                <TabsContent value="model" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>AI Model</Label>
                    <Select defaultValue="claude-3.5-sonnet">
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Claude 3.5 Sonnet offers the best balance of performance and cost
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="parameters" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Temperature</Label>
                      <span className="text-xs text-muted-foreground">0.2</span>
                    </div>
                    <Slider
                      defaultValue={[0.2]}
                      min={0}
                      max={1}
                      step={0.1}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower temperature provides more consistent results
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Request Rate</Label>
                      <span className="text-xs text-muted-foreground">20 per minute</span>
                    </div>
                    <Slider
                      defaultValue={[20]}
                      min={1}
                      max={50}
                      step={1}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Rate limiting prevents excessive API usage
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Agent;
