
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import { 
  supabase, 
  Industry, 
  JobSource, 
  ScraperConfiguration,
  ScraperQueueItem,
  fromIndustries,
  fromJobSources,
  fromScraperConfigurations,
  fromScraperQueue
} from '@/integrations/supabase/client';

export const useJobScrapers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [jobSources, setJobSources] = useState<JobSource[]>([]);
  const [scraperConfigurations, setScraperConfigurations] = useState<ScraperConfiguration[]>([]);
  const [queueItems, setQueueItems] = useState<ScraperQueueItem[]>([]);
  const [loading, setLoading] = useState({
    industries: true,
    jobSources: true,
    scraperConfigurations: true,
    queueItems: true
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch industries
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setLoading(prev => ({ ...prev, industries: true }));
        const { data, error } = await fromIndustries()
          .select('*')
          .order('name');

        if (error) throw error;
        setIndustries(data || []);
      } catch (err: any) {
        console.error('Error fetching industries:', err);
        setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, industries: false }));
      }
    };

    fetchIndustries();
  }, []);

  // Fetch job sources
  useEffect(() => {
    const fetchJobSources = async () => {
      try {
        setLoading(prev => ({ ...prev, jobSources: true }));
        const { data, error } = await fromJobSources()
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setJobSources(data || []);
      } catch (err: any) {
        console.error('Error fetching job sources:', err);
        setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, jobSources: false }));
      }
    };

    fetchJobSources();
  }, []);

  // Fetch scraper configurations
  useEffect(() => {
    const fetchScraperConfigurations = async () => {
      if (!user) return;
      
      try {
        setLoading(prev => ({ ...prev, scraperConfigurations: true }));
        const { data, error } = await fromScraperConfigurations()
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setScraperConfigurations(data || []);
      } catch (err: any) {
        console.error('Error fetching scraper configurations:', err);
        setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, scraperConfigurations: false }));
      }
    };

    if (user) {
      fetchScraperConfigurations();
    }
  }, [user]);

  // Fetch queue items
  useEffect(() => {
    const fetchQueueItems = async () => {
      if (!user || !scraperConfigurations.length) return;
      
      try {
        setLoading(prev => ({ ...prev, queueItems: true }));
        const configIds = scraperConfigurations.map(config => config.id);
        
        const { data, error } = await fromScraperQueue()
          .select('*')
          .in('configuration_id', configIds)
          .order('scheduled_for', { ascending: false });

        if (error) throw error;
        setQueueItems(data || []);
      } catch (err: any) {
        console.error('Error fetching queue items:', err);
        setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, queueItems: false }));
      }
    };

    if (user && scraperConfigurations.length > 0) {
      fetchQueueItems();
    }
  }, [user, scraperConfigurations]);

  // Create a new scraper configuration
  const createScraperConfiguration = async (config: Partial<ScraperConfiguration>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a scraper configuration",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await fromScraperConfigurations().insert({
        ...config,
        user_id: user.id
      });

      if (error) throw error;
      
      toast({
        title: "Scraper configuration created",
        description: "Your job scraper has been set up successfully"
      });
      
      // Update the local state
      if (data && data.length > 0) {
        setScraperConfigurations(prev => [data[0], ...prev]);
        return data[0];
      }
      
      return null;
    } catch (err: any) {
      console.error('Error creating scraper configuration:', err);
      toast({
        title: "Failed to create scraper",
        description: err.message,
        variant: "destructive"
      });
      return null;
    }
  };

  // Update a scraper configuration
  const updateScraperConfiguration = async (id: string, config: Partial<ScraperConfiguration>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update a scraper configuration",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data, error } = await fromScraperConfigurations()
        .update(config)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Scraper configuration updated",
        description: "Your job scraper has been updated successfully"
      });
      
      // Update the local state
      setScraperConfigurations(prev => 
        prev.map(config => config.id === id ? { ...config, ...data[0] } : config)
      );
      
      return true;
    } catch (err: any) {
      console.error('Error updating scraper configuration:', err);
      toast({
        title: "Failed to update scraper",
        description: err.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Delete a scraper configuration
  const deleteScraperConfiguration = async (id: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete a scraper configuration",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await fromScraperConfigurations()
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Scraper configuration deleted",
        description: "Your job scraper has been deleted successfully"
      });
      
      // Update the local state
      setScraperConfigurations(prev => prev.filter(config => config.id !== id));
      
      return true;
    } catch (err: any) {
      console.error('Error deleting scraper configuration:', err);
      toast({
        title: "Failed to delete scraper",
        description: err.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Run a scraper immediately
  const runScraper = async (configId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to run a scraper",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Check if the configuration exists and belongs to the user
      const { data: configData, error: configError } = await fromScraperConfigurations()
        .select('*')
        .eq('id', configId)
        .eq('user_id', user.id)
        .single();

      if (configError) throw configError;
      if (!configData) throw new Error('Scraper configuration not found');

      // Add an entry to the queue
      const { data, error } = await fromScraperQueue().insert({
        configuration_id: configId,
        status: 'pending',
        priority: 10, // Higher priority for manual runs
        scheduled_for: new Date().toISOString()
      });

      if (error) throw error;
      
      toast({
        title: "Scraper started",
        description: "Your job scraper has been queued to run"
      });
      
      // Update the local state
      if (data && data.length > 0) {
        setQueueItems(prev => [data[0], ...prev]);
      }
      
      return true;
    } catch (err: any) {
      console.error('Error running scraper:', err);
      toast({
        title: "Failed to run scraper",
        description: err.message,
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    industries,
    jobSources,
    scraperConfigurations,
    queueItems,
    loading,
    error,
    createScraperConfiguration,
    updateScraperConfiguration,
    deleteScraperConfiguration,
    runScraper
  };
};
