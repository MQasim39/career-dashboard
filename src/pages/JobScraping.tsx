
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings, History } from "lucide-react";
import { useJobScrapers } from "@/hooks/use-job-scrapers";
import { ScraperConfigurationForm } from "@/components/job-scraping/ScraperConfigurationForm";
import { ScraperConfigurationList } from "@/components/job-scraping/ScraperConfigurationList";
import { ScraperHistoryList } from "@/components/job-scraping/ScraperHistoryList";

const JobScraping = () => {
  const [activeTab, setActiveTab] = useState("configurations");
  const [isCreating, setIsCreating] = useState(false);
  const { 
    industries, 
    jobSources, 
    scraperConfigurations, 
    queueItems,
    loading, 
    createScraperConfiguration,
    updateScraperConfiguration,
    deleteScraperConfiguration,
    runScraper
  } = useJobScrapers();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Scraping</h1>
          <p className="text-muted-foreground">
            Configure and run job scrapers to find opportunities across the web
          </p>
        </div>
        
        {!isCreating && activeTab === "configurations" && (
          <Button className="gap-2" onClick={() => setIsCreating(true)}>
            <PlusCircle className="h-4 w-4" />
            <span>New Scraper</span>
          </Button>
        )}
      </div>

      {isCreating ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Create New Scraper</h2>
            <Button 
              variant="ghost" 
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
          </div>
          
          <ScraperConfigurationForm 
            industries={industries}
            jobSources={jobSources}
            onSubmit={async (data) => {
              const result = await createScraperConfiguration(data);
              if (result) {
                setIsCreating(false);
              }
            }}
            isLoading={loading.industries || loading.jobSources}
          />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configurations" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>My Scrapers</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>History & Results</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="configurations" className="space-y-6">
            <ScraperConfigurationList 
              configurations={scraperConfigurations}
              jobSources={jobSources}
              industries={industries}
              isLoading={loading.scraperConfigurations}
              onUpdate={updateScraperConfiguration}
              onDelete={deleteScraperConfiguration}
              onRun={runScraper}
            />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <ScraperHistoryList 
              historyItems={queueItems}
              configurations={scraperConfigurations}
              isLoading={loading.queueItems}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default JobScraping;
