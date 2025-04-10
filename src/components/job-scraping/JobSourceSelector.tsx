
import { useState, useMemo } from "react";
import { Check, Search, Globe, Building, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { JobSource } from "@/integrations/supabase/client";

interface JobSourceSelectorProps {
  jobSources: JobSource[];
  selectedSourceId: string | null;
  onSelect: (source: JobSource) => void;
  isLoading?: boolean;
}

export const JobSourceSelector = ({
  jobSources,
  selectedSourceId,
  onSelect,
  isLoading = false
}: JobSourceSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const groupedSources = useMemo(() => {
    if (isLoading || !jobSources.length) return {};
    
    const filtered = searchQuery 
      ? jobSources.filter(source => 
          source.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : jobSources;
    
    return filtered.reduce((acc, source) => {
      const type = source.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(source);
      return acc;
    }, {} as Record<string, JobSource[]>);
  }, [jobSources, searchQuery, isLoading]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'job_board': return 'Job Boards';
      case 'company_site': return 'Company Career Sites';
      case 'custom': return 'Custom URLs';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job_board': return <Globe className="h-4 w-4" />;
      case 'company_site': return <Building className="h-4 w-4" />;
      case 'custom': return <Plus className="h-4 w-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search job sources..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-6">
          {Object.keys(groupedSources).length > 0 ? (
            Object.entries(groupedSources).map(([type, sources]) => (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {getTypeIcon(type)}
                  <span>{getTypeLabel(type)}</span>
                </div>
                
                <div className="space-y-1">
                  {sources.map((source) => (
                    <Button
                      key={source.id}
                      variant={selectedSourceId === source.id ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => onSelect(source)}
                    >
                      {selectedSourceId === source.id && (
                        <Check className="h-4 w-4" />
                      )}
                      <span>{source.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No job sources found</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  Try a different search term
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
