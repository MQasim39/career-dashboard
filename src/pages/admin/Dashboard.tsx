
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UsersList from "@/components/admin/UsersList";
import ScraperConfigsList from "@/components/admin/ScraperConfigsList";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [activeScrapers, setActiveScrapers] = useState<number | null>(null);
  const [activeAgents, setActiveAgents] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch total users count
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;
        setTotalUsers(usersCount);

        // Fetch active scrapers count
        const { count: scrapersCount, error: scrapersError } = await supabase
          .from('scraper_configurations')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        if (scrapersError) throw scrapersError;
        setActiveScrapers(scrapersCount);

        // For active agents, we can use a placeholder or fetch from a relevant table
        // This is a placeholder since the actual agents table may not exist yet
        setActiveAgents(0);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
            ) : (
              totalUsers ?? "N/A"
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Scrapers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
            ) : (
              activeScrapers ?? "N/A"
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Agents</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
            ) : (
              activeAgents ?? "N/A"
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="scrapers">Scraper Configurations</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
            </CardHeader>
            <CardContent>
              <UsersList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scrapers">
          <Card>
            <CardHeader>
              <CardTitle>Scraper Configurations</CardTitle>
            </CardHeader>
            <CardContent>
              <ScraperConfigsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
