
import { useState } from "react";
import { Plus, Search, Filter, SlidersHorizontal } from "lucide-react";
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

const JobTracking = () => {
  const { jobs, updateJobStatus, toggleFavorite } = useJobs();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("dateApplied");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFavorites, setShowFavorites] = useState(false);

  // Filter and sort jobs
  const filteredJobs = jobs.filter(job => {
    // Search filter
    const searchMatch = 
      job.title.toLowerCase().includes(search.toLowerCase()) || 
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase());
    
    // Status filter
    const statusMatch = statusFilter ? job.status === statusFilter : true;
    
    // Favorites filter
    const favoriteMatch = showFavorites ? job.favorite : true;
    
    return searchMatch && statusMatch && favoriteMatch;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === "dateApplied") {
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
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
  };

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
          <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
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
