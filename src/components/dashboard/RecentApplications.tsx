
import { Briefcase, MoreHorizontal, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useJobs } from "@/hooks/use-jobs";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const RecentApplications = () => {
  const { jobs } = useJobs();
  const navigate = useNavigate();
  
  // Sort jobs by date and take the latest 5
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())
    .slice(0, 5);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-500/20 text-blue-500 hover:bg-blue-500/20";
      case "interview":
        return "bg-purple-500/20 text-purple-500 hover:bg-purple-500/20";
      case "offer":
        return "bg-green-500/20 text-green-500 hover:bg-green-500/20";
      case "rejected":
        return "bg-red-500/20 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/20";
    }
  };
  
  const getJobTypeColor = (type: string) => {
    switch (type) {
      case "full-time":
        return "bg-teal-500/20 text-teal-500 hover:bg-teal-500/20";
      case "part-time":
        return "bg-orange-500/20 text-orange-500 hover:bg-orange-500/20";
      case "contract":
        return "bg-amber-500/20 text-amber-500 hover:bg-amber-500/20";
      case "internship":
        return "bg-sky-500/20 text-sky-500 hover:bg-sky-500/20";
      default:
        return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/20";
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={() => navigate("/jobs")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {recentJobs.length > 0 ? (
          <div className="divide-y">
            {recentJobs.map((job) => (
              <div key={job.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-secondary">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className={getStatusColor(job.status)}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </Badge>
                        <Badge variant="outline" className={getJobTypeColor(job.jobType)}>
                          {job.jobType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Badge>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(job.dateApplied), { addSuffix: true })}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">No recent applications</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => navigate("/jobs")}
            >
              Add Your First Job
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentApplications;
