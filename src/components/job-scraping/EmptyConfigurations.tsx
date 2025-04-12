
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

const EmptyConfigurations = () => {
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
};

export default EmptyConfigurations;
