import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/hooks/useLanguage";
import notificationsData from "@/data/notifications.json";

interface Notification {
  id: number;
  title: string;
  message: string;
  role: string;
  timestamp: string;
  read: boolean;
}

interface NotificationPanelProps {
  userRole: "citizen" | "dealer" | "admin";
}

const NotificationPanel = ({ userRole }: NotificationPanelProps) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Filter notifications for current user role
    const roleMap = {
      citizen: "Citizen",
      dealer: "Dealer",
      admin: "All"
    };
    
    const filtered = notificationsData.filter(
      (notif) => notif.role === roleMap[userRole] || notif.role === "All"
    );
    
    setNotifications(filtered);
    setUnreadCount(filtered.filter(n => !n.read).length);
  }, [userRole]);

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">{t.dashboard.notifications}</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No notifications
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-lg border transition-smooth ${
                    notif.read ? "bg-background" : "bg-accent/20 border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!notif.read && (
                          <span className="w-2 h-2 bg-primary rounded-full" />
                        )}
                        <h4 className="font-semibold text-sm">{notif.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(notif.timestamp)}
                      </p>
                    </div>
                    {!notif.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notif.id)}
                        className="shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotificationPanel;
