
import { NavLink } from "react-router-dom";
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
      end
      className={({ isActive }) =>
        cn(
          "flex items-center px-3 py-2 rounded-md transition-colors group",
          collapsed ? "justify-center" : "gap-3",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted text-muted-foreground",
          "text-sm"
        )
      }
    >
      {icon}
      {!collapsed && <span>{text}</span>}
    </NavLink>
  );
};

export default SidebarLink;
