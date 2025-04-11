
import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJobs } from "@/hooks/use-jobs";
import JobTracking from "@/components/jobs/JobTracking";

const Jobs = () => {
  const { jobs } = useJobs();
  const [loading, setLoading] = useState(true);

  // Simulate loading state for a smoother experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Applications</h1>
          <p className="text-muted-foreground">
            Track and manage your job applications in one place
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">          
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add New Job</span>
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." className="pl-9 w-full sm:w-[300px]" />
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : jobs.length > 0 ? (
        <JobTracking />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-md">
          <div className="bg-muted p-3 rounded-full mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-2">No job applications yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Start tracking your job applications by adding your first job or activate your Job Agent to find matching positions
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Job
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/agent'}>
              <Search className="h-4 w-4 mr-2" />
              Setup Job Agent
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
