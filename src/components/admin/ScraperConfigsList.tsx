
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScraperConfig {
  id: string;
  name: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  last_run: string | null;
}

export default function ScraperConfigsList() {
  const [configs, setConfigs] = useState<ScraperConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('scraper_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast({
        title: "Error loading configurations",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    try {
      const { error } = await supabase
        .from('scraper_configurations')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      toast({
        title: "Configuration deleted",
        description: "The configuration has been successfully deleted",
      });

      loadConfigs();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast({
        title: "Error deleting configuration",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  if (loading) {
    return <div>Loading configurations...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>User ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Run</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {configs.map((config) => (
          <TableRow key={config.id}>
            <TableCell>{config.name}</TableCell>
            <TableCell>{config.user_id}</TableCell>
            <TableCell>{config.is_active ? 'Active' : 'Inactive'}</TableCell>
            <TableCell>
              {config.last_run ? new Date(config.last_run).toLocaleDateString() : 'Never'}
            </TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteConfig(config.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
