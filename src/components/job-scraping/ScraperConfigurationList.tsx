
import { useState } from "react";
import { Edit, Trash2, Play, Calendar, Building, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScraperConfigurationForm } from "./ScraperConfigurationForm";
import { 
  Industry, 
  JobSource, 
  ScraperConfiguration 
} from "@/integrations/supabase/client";

interface ScraperConfigurationListProps {
  configurations: ScraperConfiguration[];
  jobSources: JobSource[];
  industries: Industry[];
  isLoading: boolean;
  onUpdate: (id: string, data: Partial<ScraperConfiguration>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onRun: (id: string) => Promise<boolean>;
}

export const ScraperConfigurationList = ({
  configurations,
  jobSources,
  industries,
  isLoading,
  onUpdate,
  onDelete,
  onRun,
}: ScraperConfigurationListProps) => {
  const [editConfig, setEditConfig] = useState<ScraperConfiguration | null>(null);
  
  const formatLastRun = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };
  
  const getSourceName = (sourceId: string | null) => {
    if (!sourceId) return "Custom";
    const source = jobSources.find(s => s.id === sourceId);
    return source ? source.name : "Unknown";
  };

  const getIconForFrequency = (frequency: string) => {
    switch (frequency) {
      case "hourly": return <Zap className="h-4 w-4" />;
      case "daily": return <Calendar className="h-4 w-4" />;
      case "weekly": return <Calendar className="h-4 w-4" />;
      case "monthly": return <Calendar className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getColorForStatus = (isActive: boolean, lastError: string | null) => {
    if (!isActive) return "border-muted";
    if (lastError) return "border-l-destructive";
    return "border-l-primary";
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-l-4 border-l-muted">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
            </CardContent>
            <CardFooter>
              <div className="flex justify-between w-full">
                <Skeleton className="h-4 w-1/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (configurations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <Search className="h-10 w-10 text-muted-foreground" />
          <h3 className="text-xl font-semibold">No scrapers configured</h3>
        </div>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Configure your first job scraper to start collecting job opportunities from across the web
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {configurations.map((config) => (
          <Card 
            key={config.id} 
            className={`border-l-4 ${getColorForStatus(config.is_active, config.last_error)}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getSourceName(config.source_id)}
                  {!config.is_active && (
                    <Badge variant="outline" className="ml-2">Inactive</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {getIconForFrequency(config.frequency)}
                  <span className="text-xs text-muted-foreground capitalize">{config.frequency}</span>
                </div>
              </div>
              <CardDescription>
                {config.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {config.keywords && config.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
                {config.industries && config.industries.map((industry, idx) => (
                  <Badge key={idx} variant="outline">
                    {industry}
                  </Badge>
                ))}
                {config.keywords?.length === 0 && config.industries?.length === 0 && (
                  <span className="text-sm text-muted-foreground">No filters configured</span>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Last run:</span> {formatLastRun(config.last_run)}
                {config.last_error && (
                  <div className="mt-2 text-destructive">
                    <span className="font-medium">Error:</span> {config.last_error}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  {config.url && (
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{config.url}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => onRun(config.id)}
                  >
                    <Play className="h-4 w-4" />
                    <span className="sr-only">Run now</span>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => setEditConfig(config)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="outline">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this scraper configuration.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(config.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={!!editConfig} onOpenChange={(open) => !open && setEditConfig(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scraper Configuration</DialogTitle>
            <DialogDescription>
              Update your job scraper settings
            </DialogDescription>
          </DialogHeader>
          {editConfig && (
            <ScraperConfigurationForm
              initialData={editConfig}
              industries={industries}
              jobSources={jobSources}
              onSubmit={async (data) => {
                if (editConfig) {
                  const result = await onUpdate(editConfig.id, data);
                  if (result) {
                    setEditConfig(null);
                  }
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
