
import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client'; // Adjust path
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/use-auth';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';

// Define interfaces for the data you expect
interface UserProfile {
  id: string;
  email?: string;
  // Add other profile fields if you have a separate profiles table
  status?: string; // e.g., 'active', 'banned'
  role?: string;
  full_name?: string;
}

interface UserAnalytics extends UserProfile {
  resume_count: number;
  active_resume_id?: string; // Assuming you have a way to track this
}

function AdminDashboard() {
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if the logged-in user is admin
    const checkAndFetch = async () => {
      if (user && isAdmin) {
        fetchAnalytics();
      } else {
        // Redirect non-admins away (or show an error)
        setError("Access Denied. You are not authorized to view this page.");
        setLoading(false);
      }
    };

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        if (profilesError) throw profilesError;

        // For each profile, fetch resume counts
        const enhancedProfiles = await Promise.all((profilesData || []).map(async (profile) => {
          // Count resumes for this user
          const { count: resumeCount, error: resumeError } = await supabase
            .from('resumes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          if (resumeError) throw resumeError;

          // Get active resume if any
          const { data: activeResume, error: activeResumeError } = await supabase
            .from('resumes')
            .select('id')
            .eq('user_id', profile.id)
            .eq('is_selected', true)
            .maybeSingle();

          if (activeResumeError) throw activeResumeError;

          return {
            ...profile,
            resume_count: resumeCount || 0,
            active_resume_id: activeResume?.id || undefined
          };
        }));

        setAnalytics(enhancedProfiles);
      } catch (err: any) {
        console.error("Error fetching admin analytics:", err);
        setError("Failed to load user analytics. " + err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAndFetch();

  }, [user, isAdmin]); // Run when user or isAdmin changes

  const handleBanUser = async (userId: string) => {
    if (!window.confirm(`Are you sure you want to ban user ${userId}?`)) return;
    try {
      // Direct update to profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'banned' })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      setAnalytics(prev => prev.map(u => u.id === userId ? { ...u, status: 'banned' } : u));
      
      toast({
        title: "User banned successfully",
        description: "The user has been banned from the platform.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to ban user",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(`Are you sure you want to DELETE user ${userId}? This is irreversible.`)) return;
    try {
      // For deletion, we'll just remove the profile
      // Note: In a production app, you'd want this to trigger cascading deletes
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      // Remove from local state
      setAnalytics(prev => prev.filter(u => u.id !== userId));
      
      toast({
        title: "User deleted successfully",
        description: "The user has been removed from the platform.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to delete user",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) return <div className="p-8 flex justify-center items-center">Loading admin data...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!user || !isAdmin) return <div className="p-8">Unauthorized access</div>; // Extra security check

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-4">Total Users: {analytics.length}</p>

      <h2 className="text-2xl font-semibold mb-4">User Details</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resume Count</TableHead>
              <TableHead>Active Resume ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analytics.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-sm">{user.id}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>{user.full_name || 'N/A'}</TableCell>
                <TableCell>{user.status || 'active'}</TableCell>
                <TableCell>{user.resume_count}</TableCell>
                <TableCell className="font-mono text-sm">{user.active_resume_id || 'None'}</TableCell>
                <TableCell>
                  {user.status !== 'banned' && (
                    <Button 
                      onClick={() => handleBanUser(user.id)} 
                      disabled={user.id === user?.id}
                      variant="outline"
                      className="mr-2"
                    >
                      Ban
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleDeleteUser(user.id)} 
                    disabled={user.id === user?.id} 
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default AdminDashboard;
