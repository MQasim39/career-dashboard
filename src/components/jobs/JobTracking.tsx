
import { useState, useEffect } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import JobCard from "./JobCard";
import { useJobs } from "@/hooks/use-jobs";
import { useToast } from "@/hooks/use-toast";
import { useResumes } from "@/hooks/use-resumes";
import { useJobMatching } from "@/hooks/use-job-matching";

const JobTracking = () => {
  const { toast } = useToast();
  const { jobs, updateJobStatus, toggleFavorite } = useJobs();
  const { defaultResumeId } = useResumes();
  const { jobMatches, isLoading: matchesLoading } = useJobMatching(defaultResumeId || undefined);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("matchScore");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFavorites, setShowFavorites] = useState(false);
  const [matchFilter, setMatchFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate loading state for demonstration
  useEffect(() => {
    console.log("JobTracking mounted, jobs:", jobs);
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (jobs.length === 0) {
        console.log("No jobs found in the jobs state");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [jobs]);

  // Map match scores to jobs
  const jobsWithMatches = jobs.map(job => {
    const match = jobMatches.find(m => m.jobId === job.id);
    return {
      ...job,
      matchScore: match?.matchScore || 0,
      matchedSkills: match?.matchedSkills || []
    };
  });

  // Filter and sort jobs
  const filteredJobs = jobsWithMatches.filter(job => {
    // Search filter
    const searchMatch = 
      job.title.toLowerCase().includes(search.toLowerCase()) || 
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase());
    
    // Status filter
    const statusMatch = statusFilter ? job.status === statusFilter : true;
    
    // Favorites filter
    const favoriteMatch = showFavorites ? job.favorite : true;
    
    // Match quality filter
    let matchQualityMatch = true;
    if (matchFilter) {
      if (matchFilter === 'excellent') matchQualityMatch = job.matchScore >= 90;
      else if (matchFilter === 'strong') matchQualityMatch = job.matchScore >= 80 && job.matchScore < 90;
      else if (matchFilter === 'good') matchQualityMatch = job.matchScore >= 70 && job.matchScore < 80;
      else if (matchFilter === 'all-matches') matchQualityMatch = job.matchScore >= 70;
    }
    
    return searchMatch && statusMatch && favoriteMatch && matchQualityMatch;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === "matchScore") {
      comparison = a.matchScore - b.matchScore;
    } else if (sortBy === "dateApplied") {
      comparison = new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime();
    } else if (sortBy === "company") {
      comparison = a.company.localeCompare(b.company);
    } else if (sortBy === "title") {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === "status") {
      comparison = a.status.localeCompare(b.status);
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleStatusChange = (id: string, status: string) => {
    updateJobStatus(id, status);
    toast({
      title: "Job status updated",
      description: `Job status has been changed to ${status}`,
    });
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
  };

  if (isLoading || matchesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-12 bg-muted rounded-md w-full"></div>
          <div className="h-32 bg-muted rounded-md w-full"></div>
          <div className="h-32 bg-muted rounded-md w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <p className="text-destructive">Error loading jobs</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            className="w-full sm:w-[300px] pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={matchFilter || "all"} onValueChange={(value) => setMatchFilter(value === "all" ? null : value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Match Quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="all-matches">All Matches (70%+)</SelectItem>
              <SelectItem value="excellent">Excellent Matches (90%+)</SelectItem>
              <SelectItem value="strong">Strong Matches (80-89%)</SelectItem>
              <SelectItem value="good">Good Matches (70-79%)</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Sort & Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortBy === "matchScore"}
                onCheckedChange={() => setSortBy("matchScore")}
              >
                Match Score
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "dateApplied"}
                onCheckedChange={() => setSortBy("dateApplied")}
              >
                Date Applied
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "company"}
                onCheckedChange={() => setSortBy("company")}
              >
                Company
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "title"}
                onCheckedChange={() => setSortBy("title")}
              >
                Job Title
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "status"}
                onCheckedChange={() => setSortBy("status")}
              >
                Status
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Order</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortOrder === "asc"}
                onCheckedChange={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                Ascending
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showFavorites}
                onCheckedChange={() => setShowFavorites(!showFavorites)}
              >
                Favorites Only
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button className="gap-2 ml-auto sm:ml-0">
            <Plus className="h-4 w-4" />
            <span>Add Job</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedJobs.length > 0 ? (
          sortedJobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              onStatusChange={handleStatusChange}
              onToggleFavorite={handleToggleFavorite}
              matchScore={job.matchScore}
              matchedSkills={job.matchedSkills}
            />
          ))
        ) : (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No jobs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {jobs.length > 0 
                ? "Try adjusting your filters or search terms" 
                : "Start by adding your first job application"}
            </p>
            {jobs.length === 0 && (
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Job</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobTracking;
