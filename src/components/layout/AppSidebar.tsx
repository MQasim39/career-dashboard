
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Briefcase, 
  FileText, 
  Home, 
  LogOut, 
  Menu, 
  Settings, 
  User, 
  Bot, 
  Bell
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
          "flex items-center px-3 py-2 rounded-md transition-colors",
          collapsed ? "justify-center" : "gap-3",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-secondary"
        )
      }
    >
      {icon}
      {!collapsed && <span>{text}</span>}
    </NavLink>
  );
};

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar sticky top-0 left-0 flex flex-col border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && <h1 className="text-xl font-bold">JobTrackr</h1>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* User section */}
      <div className="flex items-center p-4 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <p className="font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">john@example.com</p>
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
                    to="/"
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
              to="/"
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
                    to="/jobs"
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
              to="/jobs"
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
                    to="/resumes"
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
              to="/resumes"
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
                    to="/settings"
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
              to="/settings"
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
        <Button variant="ghost" className={cn(
          "w-full",
          collapsed ? "justify-center p-2" : "justify-start"
        )}>
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
