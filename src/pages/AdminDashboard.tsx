
import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client'; // Adjust path
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/use-auth';

// Define interfaces for the data you expect
interface UserProfile {
  id: string;
  email?: string;
  // Add other profile fields if you have a separate profiles table
  status?: string; // e.g., 'active', 'banned'
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

  useEffect(() => {
    // Check if the logged-in user is admin
    const checkAndFetch = async () => {
      if (user && isAdmin) {
        fetchAnalytics();
      } else {
        // Redirect non-admins away (or show an error)
        setError("Access Denied. You are not authorized to view this page.");
        setLoading(false);
        // Optionally redirect: navigate('/dashboard');
      }
    };

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- Fetching Data ---
        // This likely requires a custom Supabase Function (RPC) or View
        // for security and efficiency.

        // Example using a hypothetical RPC function 'get_user_analytics'
        const { data, error: rpcError } = await supabase.rpc('get_user_analytics');

        if (rpcError) throw rpcError;

        // You might need to fetch users and resume counts separately
        // if you don't have a dedicated function/view.
        // Example:
        // const { data: users, error: usersError } = await supabase.from('profiles').select('*'); // Or auth.users if no profiles table
        // const { data: resumes, error: resumesError } = await supabase.from('resumes').select('user_id, id, is_active'); // Assuming 'resumes' table
        // Then process and combine this data in the frontend (less ideal)

        if (data) {
          setAnalytics(data as UserAnalytics[]); // Adjust based on actual return type
        } else {
          setAnalytics([]);
        }
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
      // Example using RPC:
      const { error } = await supabase.rpc('ban_user', { target_user_id: userId });
      // Or direct update if RLS allows:
      // const { error } = await supabase.from('profiles').update({ status: 'banned' }).eq('id', userId);
      if (error) throw error;
      // Refresh data or update state locally
      setAnalytics(prev => prev.map(u => u.id === userId ? { ...u, status: 'banned' } : u));
      alert('User banned successfully.');
    } catch (err: any) {
      alert(`Failed to ban user: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(`Are you sure you want to DELETE user ${userId}? This is irreversible.`)) return;
    try {
      // IMPORTANT: Deleting from auth.users requires service_role key or specific setup.
      // Usually done via a Supabase Function running with elevated privileges.
      const { error } = await supabase.rpc('delete_user_data', { target_user_id: userId });
      if (error) throw error;
      // Refresh data or update state locally
      setAnalytics(prev => prev.filter(u => u.id !== userId));
      alert('User deleted successfully.');
    } catch (err: any) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };


  if (loading) return <div>Loading admin data...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!user || !isAdmin) return <div>Unauthorized access</div>; // Extra security check

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Total Users: {analytics.length}</p>

      <h2>User Details</h2>
      <table>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Email</th>
            <th>Status</th>
            <th>Resume Count</th>
            <th>Active Resume ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {analytics.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email || 'N/A'}</td>
              <td>{user.status || 'active'}</td>
              <td>{user.resume_count}</td>
              <td>{user.active_resume_id || 'None'}</td>
              <td>
                {user.status !== 'banned' && (
                  <button onClick={() => handleBanUser(user.id)} disabled={user.id === user?.id}>
                    Ban
                  </button>
                )}
                <button onClick={() => handleDeleteUser(user.id)} disabled={user.id === user?.id} style={{ marginLeft: '5px', color: 'red' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
