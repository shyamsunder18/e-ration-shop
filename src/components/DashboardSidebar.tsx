import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface SidebarItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  onLogout: () => void;
}

const DashboardSidebar = ({ items, onLogout }: DashboardSidebarProps) => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r min-h-screen p-4 hidden md:block">
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.url;
          
          return (
            <Link key={item.url} to={item.url}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-smooth",
                  isActive && "bg-primary text-primary-foreground shadow-sm"
                )}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.title}
              </Button>
            </Link>
          );
        })}
        
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 mt-4"
          onClick={onLogout}
        >
          Logout
        </Button>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
