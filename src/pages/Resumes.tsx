
import { useState, useEffect } from "react";
import { 
  Search, 
  SlidersHorizontal,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ResumeCard from "@/components/resumes/ResumeCard";
import ResumeUpload from "@/components/resumes/ResumeUpload";
import { useResumes } from "@/hooks/use-resumes";

const Resumes = () => {
  const { resumes } = useResumes();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("dateUploaded");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);

  // Add loading state management
  useEffect(() => {
    // Simulate data loading with a short timeout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Filter and sort resumes
  const filteredResumes = resumes.filter(resume => {
    // Search filter
    const searchMatch = 
      resume.name.toLowerCase().includes(search.toLowerCase());
    
    // Type filter
    const typeMatch = typeFilter ? resume.type === typeFilter : true;
    
    return searchMatch && typeMatch;
  });

  // Sort resumes
  const sortedResumes = [...filteredResumes].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === "dateUploaded") {
      comparison = new Date(a.dateUploaded).getTime() - new Date(b.dateUploaded).getTime();
    } else if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "type") {
      comparison = a.type.localeCompare(b.type);
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading resumes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Resume Management</h1>
        <p className="text-muted-foreground">
          Upload, organize, and manage your resumes for job applications
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resumes..."
            className="w-full sm:w-[300px] pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? null : value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="entry-level">Entry Level</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortBy === "dateUploaded"}
                onCheckedChange={() => setSortBy("dateUploaded")}
              >
                Date Uploaded
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "name"}
                onCheckedChange={() => setSortBy("name")}
              >
                Name
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "type"}
                onCheckedChange={() => setSortBy("type")}
              >
                Type
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
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ResumeUpload />
        </div>
      </div>
      
      {sortedResumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedResumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium mb-2">No Resumes Found</h3>
          <p className="text-muted-foreground mb-6">
            {resumes.length > 0 
              ? "Try adjusting your search or filter criteria" 
              : "Upload your first resume to get started with your job search"}
          </p>
          {resumes.length === 0 && <ResumeUpload />}
        </div>
      )}
    </div>
  );
};

export default Resumes;
