
import { Wrench, Server, Code2 } from "lucide-react";
import PythonBackendConfig from "@/components/python-integration/PythonBackendConfig";

const PythonBackend = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Python Backend</h1>
        <p className="text-muted-foreground">
          Configure and manage your Python backend for job scraping and resume parsing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <PythonBackendConfig />
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Server className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Why Python Backend?</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                The Python backend provides enhanced capabilities for job scraping and resume parsing:
              </p>
              <ul className="space-y-1 list-disc pl-5">
                <li>Advanced PDF parsing using PyPDF2</li>
                <li>Improved job scraping with Firecrawl</li>
                <li>Sophisticated job matching algorithms</li>
                <li>Better error handling and retries</li>
              </ul>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Setup Instructions</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                To set up the Python backend:
              </p>
              <ol className="space-y-1 list-decimal pl-5">
                <li>Deploy the Python code to AWS Lambda or Google Cloud Functions</li>
                <li>Configure environment variables</li>
                <li>Enter the backend URL in the configuration</li>
                <li>Test the connection</li>
              </ol>
              <p className="mt-2">
                Full instructions are available in the <code>python_backend/README.md</code> file.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">API Endpoints</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                The Python backend provides the following endpoints:
              </p>
              <ul className="space-y-1 list-disc pl-5">
                <li><code>/parse-resume</code> - Parse resume files</li>
                <li><code>/scrape-jobs</code> - Scrape job listings</li>
                <li><code>/activate-agent</code> - Activate job matching agent</li>
                <li><code>/job-matches</code> - Get job matches</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PythonBackend;
