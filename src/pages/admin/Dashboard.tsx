
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UsersList from "@/components/admin/UsersList";
import ScraperConfigsList from "@/components/admin/ScraperConfigsList";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            Loading...
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Scrapers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            Loading...
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Agents</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            Loading...
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
