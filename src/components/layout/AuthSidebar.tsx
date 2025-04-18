
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Briefcase, 
  FileText, 
  Home, 
  LogOut, 
  Settings, 
  User, 
  Bot, 
  Bell,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  collapsed: boolean;
}

const SidebarLink = ({ to, icon, text, collapsed }: SidebarLinkProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center px-3 py-2 rounded-md transition-colors group",
          collapsed ? "justify-center" : "gap-3",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted text-muted-foreground",
          // Ensure text color is consistent with active/inactive states
          "text-sm"
        )
      }
    >
      {icon}
      {!collapsed && <span>{text}</span>}
    </NavLink>
  );
};

const AuthSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // Extract user's name or email for display
  const displayName = user?.user_metadata?.full_name || user?.email || "User";
  const userEmail = user?.email || "";

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive",
      });
    }
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* User section */}
      <div className="flex items-center p-4 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <User className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <p className="font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        <TooltipProvider delayDuration={0}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SidebarLink
                    to="/dashboard"
                    icon={<Home className="h-5 w-5" />}
                    text="Dashboard"
                    collapsed={collapsed}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover">
                <p>Dashboard</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <SidebarLink
              to="/dashboard"
              icon={<Home className="h-5 w-5" />}
              text="Dashboard"
              collapsed={collapsed}
            />
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SidebarLink
                    to="/dashboard/jobs"
                    icon={<Briefcase className="h-5 w-5" />}
                    text="Jobs"
                    collapsed={collapsed}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover">
                <p>Jobs</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <SidebarLink
              to="/dashboard/jobs"
              icon={<Briefcase className="h-5 w-5" />}
              text="Jobs"
              collapsed={collapsed}
            />
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SidebarLink
                    to="/dashboard/resumes"
                    icon={<FileText className="h-5 w-5" />}
                    text="Resumes"
                    collapsed={collapsed}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover">
                <p>Resumes</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <SidebarLink
              to="/dashboard/resumes"
              icon={<FileText className="h-5 w-5" />}
              text="Resumes"
              collapsed={collapsed}
            />
          )}
          
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SidebarLink
                    to="/dashboard/agent"
                    icon={<Bot className="h-5 w-5" />}
                    text="Agent"
                    collapsed={collapsed}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover">
                <p>Agent</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <SidebarLink
              to="/dashboard/agent"
              icon={<Bot className="h-5 w-5" />}
              text="Agent"
              collapsed={collapsed}
            />
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SidebarLink
                    to="/dashboard/settings"
                    icon={<Settings className="h-5 w-5" />}
                    text="Settings"
                    collapsed={collapsed}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <SidebarLink
              to="/dashboard/settings"
              icon={<Settings className="h-5 w-5" />}
              text="Settings"
              collapsed={collapsed}
            />
          )}
        </TooltipProvider>
      </nav>

      {/* Feature toggles */}
      <div className="p-3 border-t border-sidebar-border space-y-3">
        {/* Agent toggle */}
        <div className={cn(
          "flex items-center justify-between",
          collapsed ? "flex-col gap-2" : ""
        )}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Bot className="h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover">
                <p>AI Agent</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="text-sm">AI Agent</span>
            </div>
          )}
          <Switch
            checked={agentEnabled}
            onCheckedChange={setAgentEnabled}
            className="scale-75"
          />
        </div>

        {/* Notifications toggle */}
        <div className={cn(
          "flex items-center justify-between",
          collapsed ? "flex-col gap-2" : ""
        )}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Bell className="h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover">
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span className="text-sm">Notifications</span>
            </div>
          )}
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
            className="scale-75"
          />
        </div>
      </div>

      {/* Logout */}
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

export default AuthSidebar;
