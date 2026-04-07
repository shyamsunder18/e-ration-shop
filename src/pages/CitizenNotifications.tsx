import { useEffect, useState } from "react";
import { Home, User, FileText, Bell, LogOut, ArrowLeft, MailOpen, Mail, Package, Users, Store, TrendingUp, Settings, IdCard, Trash2 } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api-client";
import { toast } from "sonner";
import { format } from "date-fns";

const CitizenNotifications = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("all");
    const [readFilter, setReadFilter] = useState("all");
    const [latestNotificationIds, setLatestNotificationIds] = useState<string[]>([]);
    const isAdmin = location.pathname.startsWith("/admin-dashboard");
    const isDealer = location.pathname.startsWith("/dealer-dashboard");
    const title = isAdmin ? "Admin Notifications" : isDealer ? "Dealer Notifications" : "My Notifications";
    const description = isAdmin
        ? "Track approvals, mismatches, stock issues, and system alerts."
        : isDealer
            ? "See beneficiary, stock, and broadcast updates for your district."
            : "Stay updated with alerts from your dealer and the Food Department";

    const sidebarItems = isAdmin
        ? [
            { title: "Dashboard", url: "/admin-dashboard", icon: Home },
            { title: "Manage Users", url: "/admin-dashboard/users", icon: Users },
            { title: "Manage Dealers", url: "/admin-dashboard/dealers", icon: Store },
            { title: "Manage Goods", url: "/admin-dashboard/goods", icon: Package },
            { title: "Ration Cards", url: "/admin-dashboard/ration-cards", icon: IdCard },
            { title: "Notifications", url: "/admin-dashboard/notifications", icon: Bell },
            { title: "Reports", url: "/admin-dashboard/reports", icon: TrendingUp },
            { title: "Settings", url: "/admin-dashboard/settings", icon: Settings }
        ]
        : isDealer
            ? [
                { title: "Dashboard", url: "/dealer-dashboard", icon: Home },
                { title: "Inventory", url: "/dealer-dashboard/inventory", icon: Package },
                { title: "Beneficiaries", url: "/dealer-dashboard/beneficiaries", icon: Users },
                { title: "Distribution Logs", url: "/dealer-dashboard/logs", icon: FileText },
                { title: "Notifications", url: "/dealer-dashboard/notifications", icon: Bell }
            ]
            : [
                { title: "Dashboard", url: "/citizen-dashboard", icon: Home },
                { title: "My Profile", url: "/citizen-dashboard/profile", icon: User },
                { title: "Purchase History", url: "/citizen-dashboard/history", icon: FileText },
                { title: "Notifications", url: "/citizen-dashboard/notifications", icon: Bell }
            ];

    const backUrl = isAdmin ? "/admin-dashboard" : isDealer ? "/dealer-dashboard" : "/citizen-dashboard";
    const broadcastNotificationUpdate = () => {
        window.dispatchEvent(new Event("notifications-updated"));
    };

    const fetchNotifications = async () => {
        try {
            const params = new URLSearchParams();
            if (typeFilter !== "all") params.set("type", typeFilter);
            if (readFilter !== "all") params.set("read", readFilter);
            const response = await api.get<any>(`/notifications?${params.toString()}`);
            const nextNotifications = response.notifications || [];
            setNotifications(nextNotifications);
            if (readFilter === "all") {
                setLatestNotificationIds(nextNotifications.filter((notif: any) => !notif.read).map((notif: any) => notif._id));
            }
            broadcastNotificationUpdate();
        } catch (error) {
            console.error("Failed to fetch notifications", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [typeFilter, readFilter]);

    useEffect(() => {
        return () => {
            if (latestNotificationIds.length === 0) return;

            api.put('/notifications/read-all', {})
                .then(() => {
                    broadcastNotificationUpdate();
                })
                .catch(() => {
                    // Ignore cleanup failures; the next inbox visit can retry.
                });
        };
    }, [latestNotificationIds]);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`, {});
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
            setLatestNotificationIds((prev) => prev.filter((notifId) => notifId !== id));
            broadcastNotificationUpdate();
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications((prev) => prev.filter((notif) => notif._id !== id));
            setLatestNotificationIds((prev) => prev.filter((notifId) => notifId !== id));
            broadcastNotificationUpdate();
            toast.success("Notification removed");
        } catch (error) {
            toast.error("Failed to remove notification");
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all', {});
            setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
            setLatestNotificationIds([]);
            broadcastNotificationUpdate();
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to update notifications");
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout', {});
            localStorage.removeItem('user');
            navigate("/auth");
        } catch (e) {
            navigate("/auth");
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <div className="flex flex-1">
                <DashboardSidebar items={sidebarItems} onLogout={handleLogout} />

                <main className="flex-1 p-6 overflow-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <Link to={backUrl} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-primary mb-2">{title}</h1>
                            <p className="text-muted-foreground">{description}</p>
                        </div>

                        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col gap-3 md:flex-row">
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[220px]">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All types</SelectItem>
                                        <SelectItem value="RATION_AVAILABILITY">Ration availability</SelectItem>
                                        <SelectItem value="GLOBAL_COLLECTION_ALERT">Global dealer update</SelectItem>
                                        <SelectItem value="PERSONAL_SLOT_ALLOCATION">Personal slot allocation</SelectItem>
                                        <SelectItem value="COLLECTION_CODE_ISSUED">Collection code</SelectItem>
                                        <SelectItem value="RATION_COLLECTED">Ration collected</SelectItem>
                                        <SelectItem value="REGISTRATION_PENDING">Registration pending</SelectItem>
                                        <SelectItem value="REGISTRATION_MISMATCH">Registration mismatch</SelectItem>
                                        <SelectItem value="STOCK_FLAG">Stock issue</SelectItem>
                                        <SelectItem value="STOCK_UPDATE">Stock update</SelectItem>
                                        <SelectItem value="BENEFICIARY_ASSIGNED">Beneficiary assigned</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={readFilter} onValueChange={setReadFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by read state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="false">Unread</SelectItem>
                                        <SelectItem value="true">Read</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" onClick={markAllAsRead}>
                                Mark All Read
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {notifications.length === 0 && !loading && (
                                <Card className="p-12 text-center border-dashed">
                                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                    <h3 className="text-lg font-medium">No notifications yet</h3>
                                    <p className="text-muted-foreground">We'll notify you here when your ration is ready or there are system updates.</p>
                                </Card>
                            )}

                            {notifications.map((notif) => (
                                <Card
                                    key={notif._id}
                                    className={`transition-smooth border-l-4 ${notif.read ? 'border-l-muted opacity-80' : 'border-l-primary shadow-md'}`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.read ? 'bg-muted' : 'bg-primary/10'}`}>
                                                {notif.read ? <MailOpen className="w-5 h-5 text-muted-foreground" /> : <Mail className="w-5 h-5 text-primary" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start gap-4 mb-1">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            {latestNotificationIds.includes(notif._id) && (
                                                                <span className="h-2.5 w-2.5 rounded-full bg-india-green" />
                                                            )}
                                                            <p className={`text-sm ${notif.read ? 'text-muted-foreground' : 'text-foreground font-semibold'}`}>
                                                                {notif.title || notif.type.replace(/_/g, ' ')}
                                                            </p>
                                                        </div>
                                                        <Badge variant={notif.type === 'RATION_AVAILABILITY' ? 'default' : 'secondary'} className="mt-1 text-[10px] uppercase">
                                                            {notif.type.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground italic shrink-0">
                                                        {format(new Date(notif.createdAt), 'PPp')}
                                                    </span>
                                                </div>
                                                <p className={`text-sm ${notif.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                                                    {notif.message}
                                                </p>
                                                <div className="mt-3 flex gap-2">
                                                    {!notif.read && (
                                                        <Button size="sm" variant="outline" onClick={() => markAsRead(notif._id)}>
                                                            Mark Read
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteNotification(notif._id)}>
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CitizenNotifications;
