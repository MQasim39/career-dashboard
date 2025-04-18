
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
import { Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserDetailsDialog from "./UserDetailsDialog";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  resume_count?: number;
  notification_count?: number;
}

export default function UsersList() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      // Fetch all users from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      
      // Enhanced users with additional stats
      const enhancedUsers = await Promise.all((profilesData || []).map(async (profile) => {
        // Count resumes for this user
        const { count: resumeCount, error: resumeError } = await supabase
          .from('resumes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        if (resumeError) console.error('Error fetching resume count:', resumeError);
        
        // We could add similar queries for notifications when that table exists
        // For now we'll use a placeholder
        const notificationCount = 0;
        
        return {
          ...profile,
          resume_count: resumeCount || 0,
          notification_count: notificationCount
        };
      }));

      setUsers(enhancedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error loading users",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // This will be updated to use an RPC function for proper deletion
      // when such function is available, for now it just removes from profiles
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User deleted",
        description: "The user has been successfully deleted",
      });

      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error deleting user",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const viewUserDetails = (user: Profile) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="flex items-center">
      <div className="mr-2">Loading users...</div>
      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
    </div></div>;
  }

  return (
    <div>
      {selectedUser && (
        <UserDetailsDialog 
          user={selectedUser} 
          open={showUserDetails} 
          onClose={() => setShowUserDetails(false)} 
        />
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Resumes</TableHead>
            <TableHead>Notifications</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name || 'N/A'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{user.resume_count}</TableCell>
                <TableCell>{user.notification_count}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewUserDetails(user)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
