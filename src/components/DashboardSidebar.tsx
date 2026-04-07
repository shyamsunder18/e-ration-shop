import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api-client";

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
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const hasNotificationsLink = items.some((item) => item.url.includes("/notifications"));
    if (!hasNotificationsLink) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await api.get<{ unreadCount?: number }>("/notifications?read=false&limit=1");
        setUnreadCount(response.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    const intervalId = window.setInterval(fetchUnreadCount, 30000);
    const handleNotificationRefresh = () => {
      fetchUnreadCount();
    };

    window.addEventListener("notifications-updated", handleNotificationRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("notifications-updated", handleNotificationRefresh);
    };
  }, [items, location.pathname]);

  return (
    <aside className="w-64 bg-card border-r min-h-screen p-4 hidden md:block">
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.url;
          const isNotificationsItem = item.url.includes("/notifications");
          const hasUnread = isNotificationsItem && unreadCount > 0;
          
          return (
            <Link key={item.url} to={item.url}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "relative w-full justify-start transition-smooth",
                  isActive && "bg-primary text-primary-foreground shadow-sm",
                  hasUnread && !isActive && "border border-primary/40 bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(59,130,246,0.1)] hover:bg-primary/15",
                  hasUnread && isActive && "ring-2 ring-saffron/70 ring-offset-2 ring-offset-background"
                )}
              >
                {hasUnread && (
                  <span className="absolute left-2 top-2 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-saffron opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-saffron" />
                  </span>
                )}
                <Icon className="w-4 h-4 mr-3" />
                <span className="flex-1 text-left">{item.title}</span>
                {hasUnread && (
                  <Badge className={cn("ml-2 h-5 min-w-5 px-1.5 text-[10px]", isActive ? "bg-white/20 text-white" : "bg-primary text-primary-foreground")}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
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
