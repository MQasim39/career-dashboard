
import { useState } from "react";
import { BarChart, LineChart, Calendar, Download, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useJobs } from "@/hooks/use-jobs";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart as RechartsLineChart,
  Line
} from 'recharts';

const Reports = () => {
  const { jobs } = useJobs();
  const [activeTab, setActiveTab] = useState("summary");
  
  // Calculate statistics for reports
  const totalApplications = jobs.length;
  const responseRate = Math.round((jobs.filter(job => job.status !== 'applied').length / totalApplications) * 100) || 0;
  const interviewRate = Math.round((jobs.filter(job => job.status === 'interview').length / totalApplications) * 100) || 0;
  const offerRate = Math.round((jobs.filter(job => job.status === 'offer').length / totalApplications) * 100) || 0;

  // Data for pie chart
  const statusData = [
    { name: 'Applied', value: jobs.filter(job => job.status === 'applied').length, color: '#4361EE' },
    { name: 'Interview', value: jobs.filter(job => job.status === 'interview').length, color: '#F72585' },
    { name: 'Offer', value: jobs.filter(job => job.status === 'offer').length, color: '#4CC9F0' },
    { name: 'Rejected', value: jobs.filter(job => job.status === 'rejected').length, color: '#7209B7' }
  ];

  // Data for bar chart (applications by month)
  const monthlyData = [
    { name: 'Jan', applications: 5 },
    { name: 'Feb', applications: 8 },
    { name: 'Mar', applications: 12 },
    { name: 'Apr', applications: 10 },
    { name: 'May', applications: 15 },
    { name: 'Jun', applications: 18 },
    { name: 'Jul', applications: 22 },
  ];

  // Data for line chart (response rate by month)
  const responseRateData = [
    { name: 'Jan', rate: 40 },
    { name: 'Feb', rate: 45 },
    { name: 'Mar', rate: 50 },
    { name: 'Apr', rate: 55 },
    { name: 'May', rate: 60 },
    { name: 'Jun', rate: 65 },
    { name: 'Jul', rate: 70 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Application Reports</h1>
          <p className="text-muted-foreground">
            Visualize and analyze your job application performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">This Month</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all job boards and direct applications
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseRate}%</div>
            <Progress value={responseRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interview Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviewRate}%</div>
            <Progress value={interviewRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offer Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offerRate}%</div>
            <Progress value={offerRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different report types */}
      <Tabs defaultValue="summary" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Application Summary</TabsTrigger>
          <TabsTrigger value="timeline">Timeline Analysis</TabsTrigger>
          <TabsTrigger value="sources">Source Analytics</TabsTrigger>
        </TabsList>
        
        {/* Summary Tab */}
        <TabsContent value="summary">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>
                  Breakdown of your applications by current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Applications by Month</CardTitle>
                <CardDescription>
                  Number of applications submitted each month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={monthlyData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="applications" fill="#4361EE" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Response Rate Over Time</CardTitle>
              <CardDescription>
                How your application response rate has evolved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={responseRateData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#F72585" activeDot={{ r: 8 }} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Sources Tab */}
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Application Sources</CardTitle>
              <CardDescription>
                Where your job applications are coming from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <BarChart className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium">Source analytics coming soon</h3>
                  <p className="text-sm text-muted-foreground">
                    We're working on tracking where your applications originate from
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
