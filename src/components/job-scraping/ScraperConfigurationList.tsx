
import { useState } from "react";
import { 
  Industry, 
  JobSource, 
  ScraperConfiguration 
} from "@/integrations/supabase/client";
import ConfigurationsLoading from "./ConfigurationsLoading";
import EmptyConfigurations from "./EmptyConfigurations";
import ConfigurationCard from "./ConfigurationCard";
import EditConfigurationDialog from "./EditConfigurationDialog";

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
  
  if (isLoading) {
    return <ConfigurationsLoading />;
  }

  if (configurations.length === 0) {
    return <EmptyConfigurations />;
  }

  return (
    <>
      <div className="grid gap-4">
        {configurations.map((config) => (
          <ConfigurationCard 
            key={config.id}
            config={config}
            jobSources={jobSources}
            onEdit={setEditConfig}
            onDelete={onDelete}
            onRun={onRun}
          />
        ))}
      </div>

      <EditConfigurationDialog 
        editConfig={editConfig}
        industries={industries}
        jobSources={jobSources}
        onUpdate={onUpdate}
        onClose={() => setEditConfig(null)}
      />
    </>
  );
};
