
import { useState, useEffect } from "react";
import { Briefcase, FileText, Home, LogOut, Settings, Bot, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import SidebarLink from "./sidebar/SidebarLink";
import SidebarToggle from "./sidebar/SidebarToggle";
import SidebarUserProfile from "./sidebar/SidebarUserProfile";
import SidebarFeatureToggles from "./sidebar/SidebarFeatureToggles";

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      const { data, error } = await supabase.rpc('is_admin', { uid: user.id });
      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }
      
      setIsAdmin(data);
    };

    checkAdminStatus();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar sticky top-0 left-0 flex flex-col border-r border-sidebar-border transition-all duration-300 shadow-md",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && <h1 className="text-xl font-heading font-bold">JobMatch</h1>}
        <SidebarToggle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      <SidebarUserProfile collapsed={collapsed} />

      <nav className="flex-1 p-2 space-y-1">
        <TooltipProvider delayDuration={0}>
          <SidebarLink to="/dashboard" icon={<Home className="h-5 w-5" />} text="Dashboard" collapsed={collapsed} />
          <SidebarLink to="/dashboard/jobs" icon={<Briefcase className="h-5 w-5" />} text="Jobs" collapsed={collapsed} />
          <SidebarLink to="/dashboard/resumes" icon={<FileText className="h-5 w-5" />} text="Resumes" collapsed={collapsed} />
          <SidebarLink to="/dashboard/agent" icon={<Bot className="h-5 w-5" />} text="Agent" collapsed={collapsed} />
          <SidebarLink to="/dashboard/settings" icon={<Settings className="h-5 w-5" />} text="Settings" collapsed={collapsed} />
          {isAdmin && (
            <SidebarLink to="/admin" icon={<Shield className="h-5 w-5" />} text="Admin" collapsed={collapsed} />
          )}
        </TooltipProvider>
      </nav>

      <SidebarFeatureToggles
        collapsed={collapsed}
        agentEnabled={agentEnabled}
        notificationsEnabled={notificationsEnabled}
        onAgentChange={setAgentEnabled}
        onNotificationsChange={setNotificationsEnabled}
      />

      <div className="p-2 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full",
            collapsed ? "justify-center p-2" : "justify-start"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
