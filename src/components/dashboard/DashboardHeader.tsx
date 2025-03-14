
import { Briefcase, FileText, ChevronUp, ChevronDown, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useJobs } from "@/hooks/use-jobs";
import { useResumes } from "@/hooks/use-resumes";

const StatCard = ({ icon, title, value, change, changeType, className }: { 
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: string | number;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center gap-1 text-xs mt-1">
                {changeType === 'positive' && <ChevronUp className="h-3 w-3 text-green-500" />}
                {changeType === 'negative' && <ChevronDown className="h-3 w-3 text-red-500" />}
                <span className={
                  changeType === 'positive' 
                    ? 'text-green-500' 
                    : changeType === 'negative' 
                      ? 'text-red-500' 
                      : 'text-muted-foreground'
                }>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="p-2 rounded-md bg-primary/10">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardHeader = () => {
  const { jobs } = useJobs();
  const { resumes } = useResumes();
  
  // Calculate stats
  const totalApplications = jobs.length;
  const activeApplications = jobs.filter(job => job.status !== 'rejected').length;
  const interviewsScheduled = jobs.filter(job => job.status === 'interview').length;
  const offers = jobs.filter(job => job.status === 'offer').length;
  
  // Calculate success rate
  const successRate = totalApplications > 0 
    ? Math.round((interviewsScheduled / totalApplications) * 100) 
    : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        
        <div className="flex gap-2">
          <Button variant="outline" className="hidden sm:flex gap-2">
            <Clock className="h-4 w-4" />
            <span>Last 30 Days</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Briefcase className="h-5 w-5 text-primary" />}
          title="Active Applications"
          value={activeApplications}
          change="+3 from last week"
          changeType="positive"
        />
        
        <StatCard 
          icon={<Briefcase className="h-5 w-5 text-primary" />}
          title="Interviews"
          value={interviewsScheduled}
          change="2 upcoming"
          changeType="neutral"
        />
        
        <StatCard 
          icon={<Briefcase className="h-5 w-5 text-primary" />}
          title="Offers"
          value={offers}
          change="+1 from last month"
          changeType="positive"
        />
        
        <StatCard 
          icon={<FileText className="h-5 w-5 text-primary" />}
          title="Resumes"
          value={resumes.length}
          change={resumes.length > 0 ? "Ready to apply" : "Upload now"}
          changeType="neutral"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Application Progress</h3>
              <p className="text-sm text-muted-foreground">Success Rate: {successRate}%</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Applied</span>
                <span>{jobs.filter(job => job.status === 'applied').length}</span>
              </div>
              <Progress value={jobs.filter(job => job.status === 'applied').length / (totalApplications || 1) * 100} className="h-2" />
              
              <div className="flex justify-between text-sm">
                <span>Interview</span>
                <span>{interviewsScheduled}</span>
              </div>
              <Progress value={interviewsScheduled / (totalApplications || 1) * 100} className="h-2" />
              
              <div className="flex justify-between text-sm">
                <span>Offer</span>
                <span>{offers}</span>
              </div>
              <Progress value={offers / (totalApplications || 1) * 100} className="h-2" />
              
              <div className="flex justify-between text-sm">
                <span>Rejected</span>
                <span>{jobs.filter(job => job.status === 'rejected').length}</span>
              </div>
              <Progress value={jobs.filter(job => job.status === 'rejected').length / (totalApplications || 1) * 100} className="h-2" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-medium">Quick Actions</h3>
            
            <div className="space-y-2">
              <Button className="w-full justify-start gap-2">
                <Briefcase className="h-4 w-4" />
                <span>Add New Job Application</span>
              </Button>
              
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                <span>Upload New Resume</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHeader;
