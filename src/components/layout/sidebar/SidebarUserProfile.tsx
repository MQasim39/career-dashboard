
import { User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarUserProfileProps {
  collapsed: boolean;
}

const SidebarUserProfile = ({ collapsed }: SidebarUserProfileProps) => {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email || "User";
  const userEmail = user?.email || "";

  return (
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
  );
};

export default SidebarUserProfile;
