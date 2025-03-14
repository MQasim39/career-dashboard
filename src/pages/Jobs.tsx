
import JobTracking from "@/components/jobs/JobTracking";

const Jobs = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Job Applications</h1>
        <p className="text-muted-foreground">
          Track and manage your job applications in one place
        </p>
      </div>
      
      <JobTracking />
    </div>
  );
};

export default Jobs;
