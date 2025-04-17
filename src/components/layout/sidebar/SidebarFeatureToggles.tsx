
import { Bot, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarFeatureTogglesProps {
  collapsed: boolean;
  agentEnabled: boolean;
  notificationsEnabled: boolean;
  onAgentChange: (enabled: boolean) => void;
  onNotificationsChange: (enabled: boolean) => void;
}

const SidebarFeatureToggles = ({
  collapsed,
  agentEnabled,
  notificationsEnabled,
  onAgentChange,
  onNotificationsChange,
}: SidebarFeatureTogglesProps) => {
  return (
    <div className="p-3 border-t border-sidebar-border space-y-3">
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
          onCheckedChange={onAgentChange}
          className="scale-75"
        />
      </div>

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
          onCheckedChange={onNotificationsChange}
          className="scale-75"
        />
      </div>
    </div>
  );
};

export default SidebarFeatureToggles;
