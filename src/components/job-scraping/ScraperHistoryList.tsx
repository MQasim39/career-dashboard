
import { Clock, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScraperConfiguration, ScraperQueueItem } from "@/integrations/supabase/client";

interface ScraperHistoryListProps {
  historyItems: ScraperQueueItem[];
  configurations: ScraperConfiguration[];
  isLoading: boolean;
}

export const ScraperHistoryList = ({
  historyItems,
  configurations,
  isLoading
}: ScraperHistoryListProps) => {
  const getConfigName = (configId: string) => {
    const config = configurations.find(c => c.id === configId);
    return config ? config.name : "Unknown Configuration";
  };
  
  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Processing</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-500 border-green-500">Completed</Badge>;
      case "failed":
        return <Badge variant="outline" className="text-red-500 border-red-500">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <Clock className="h-10 w-10 text-muted-foreground" />
          <h3 className="text-xl font-semibold">No scraper history</h3>
        </div>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          History will appear once your scrapers have been run
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {historyItems.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                {getConfigName(item.configuration_id)}
              </CardTitle>
              {getStatusBadge(item.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Scheduled for:</span>
                  <span>{formatDate(item.scheduled_for)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Started:</span>
                  <span>{formatDate(item.started_at)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Completed:</span>
                  <span>{formatDate(item.completed_at)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {item.result_stats && item.status === "completed" && (
                  <div className="text-sm">
                    <span className="font-medium">Results:</span>
                    <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                      <div>Pages scraped:</div>
                      <div>{item.result_stats.pages_scraped || 0}</div>
                      
                      <div>Jobs found:</div>
                      <div>{item.result_stats.jobs_found || 0}</div>
                      
                      <div>Jobs saved:</div>
                      <div>{item.result_stats.jobs_saved || 0}</div>
                    </div>
                  </div>
                )}
                
                {item.error_message && (
                  <div className="text-sm text-destructive">
                    <span className="font-medium">Error:</span>
                    <div className="mt-1">{item.error_message}</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
