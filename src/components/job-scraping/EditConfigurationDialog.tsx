
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScraperConfigurationForm } from "./ScraperConfigurationForm";
import { 
  Industry, 
  JobSource, 
  ScraperConfiguration 
} from "@/integrations/supabase/client";

interface EditConfigurationDialogProps {
  editConfig: ScraperConfiguration | null;
  industries: Industry[];
  jobSources: JobSource[];
  onUpdate: (id: string, data: Partial<ScraperConfiguration>) => Promise<boolean>;
  onClose: () => void;
}

const EditConfigurationDialog = ({
  editConfig,
  industries,
  jobSources,
  onUpdate,
  onClose
}: EditConfigurationDialogProps) => {
  return (
    <Dialog open={!!editConfig} onOpenChange={(open) => !open && onClose()}>
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
                  onClose();
                }
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditConfigurationDialog;
