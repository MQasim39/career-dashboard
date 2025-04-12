
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Server, CloudOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PythonBackendConfig = () => {
  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem("python_backend_url") || "";
  });
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [activeTab, setActiveTab] = useState("aws");
  const { toast } = useToast();

  const saveBackendUrl = () => {
    if (!backendUrl) {
      toast({
        title: "Error",
        description: "Please enter a backend URL",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("python_backend_url", backendUrl);
    toast({
      title: "Backend URL saved",
      description: "The Python backend URL has been saved",
    });
  };

  const testConnection = async () => {
    if (!backendUrl) {
      toast({
        title: "Error",
        description: "Please enter a backend URL",
        variant: "destructive",
      });
      return;
    }

    setTestStatus("testing");
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setTestStatus("success");
        toast({
          title: "Connection successful",
          description: "Successfully connected to the Python backend",
        });
      } else {
        setTestStatus("failed");
        toast({
          title: "Connection failed",
          description: `Error: ${response.status} ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestStatus("failed");
      toast({
        title: "Connection failed",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Python Backend Configuration</CardTitle>
          {testStatus === "success" ? (
            <Badge variant="outline" className="bg-green-500/20 text-green-500 hover:bg-green-500/20 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/20 flex items-center gap-1">
              <CloudOff className="h-3 w-3" />
              Not Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Configure the connection to your Python backend for job scraping and resume parsing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="backend-url">Backend URL</Label>
          <div className="flex items-center gap-2">
            <Input
              id="backend-url"
              placeholder="https://your-python-backend-url.com"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
            />
            <Button 
              variant="outline" 
              onClick={testConnection}
              disabled={testStatus === "testing"}
              className="whitespace-nowrap"
            >
              {testStatus === "testing" ? "Testing..." : "Test Connection"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the URL of your deployed Python backend API
          </p>
        </div>

        {testStatus === "failed" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to connect to the Python backend. Please check the URL and ensure the backend is running.
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-4">
          <h3 className="text-sm font-medium mb-2">Deployment Instructions</h3>
          <Tabs defaultValue="aws" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="aws">AWS Lambda</TabsTrigger>
              <TabsTrigger value="gcp">Google Cloud</TabsTrigger>
            </TabsList>
            <TabsContent value="aws" className="mt-4">
              <div className="text-sm text-muted-foreground bg-secondary/50 rounded-md p-3 space-y-2">
                <p>
                  1. Deploy the Python backend to AWS Lambda using the provided template.
                </p>
                <p>
                  2. Set environment variables for SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and FIRECRAWL_API_KEY.
                </p>
                <p>
                  3. Use the API Gateway URL for your backend URL.
                </p>
                <p>
                  See the deployment guide in the <code>python_backend/deploy_aws.md</code> file for detailed instructions.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="gcp" className="mt-4">
              <div className="text-sm text-muted-foreground bg-secondary/50 rounded-md p-3 space-y-2">
                <p>
                  1. Deploy the Python backend to Google Cloud Functions.
                </p>
                <p>
                  2. Set environment variables for SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and FIRECRAWL_API_KEY.
                </p>
                <p>
                  3. Use the Cloud Function URL for your backend URL.
                </p>
                <p>
                  See the deployment guide in the <code>python_backend/deploy_gcp.md</code> file for detailed instructions.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveBackendUrl} className="w-full">
          <Server className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PythonBackendConfig;
