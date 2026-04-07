import { Home, Users, Store, TrendingUp, Settings, ArrowLeft, Package, FileText, User, Bell, IdCard } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";

const PlaceholderPage = ({ title, description }: { title: string; description: string }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = location.pathname.startsWith('/admin-dashboard');
    const isDealer = location.pathname.startsWith('/dealer-dashboard');
    const isCitizen = location.pathname.startsWith('/citizen-dashboard');

    let sidebarItems: any[] = [];
    let backUrl = "/";

    if (isAdmin) {
        sidebarItems = [
            { title: "Dashboard", url: "/admin-dashboard", icon: Home },
            { title: "Manage Users", url: "/admin-dashboard/users", icon: Users },
            { title: "Manage Dealers", url: "/admin-dashboard/dealers", icon: Store },
            { title: "Manage Goods", url: "/admin-dashboard/goods", icon: Package },
            { title: "Ration Cards", url: "/admin-dashboard/ration-cards", icon: IdCard },
            { title: "Notifications", url: "/admin-dashboard/notifications", icon: Bell },
            { title: "Reports", url: "/admin-dashboard/reports", icon: TrendingUp },
            { title: "Settings", url: "/admin-dashboard/settings", icon: Settings }
        ];
        backUrl = "/admin-dashboard";
    } else if (isDealer) {
        sidebarItems = [
            { title: "Dashboard", url: "/dealer-dashboard", icon: Home },
            { title: "Inventory", url: "/dealer-dashboard/inventory", icon: Package },
            { title: "Beneficiaries", url: "/dealer-dashboard/beneficiaries", icon: Users },
            { title: "Notifications", url: "/dealer-dashboard/notifications", icon: Bell },
            { title: "Distribution Logs", url: "/dealer-dashboard/logs", icon: FileText }
        ];
        backUrl = "/dealer-dashboard";
    } else if (isCitizen) {
        sidebarItems = [
            { title: "Dashboard", url: "/citizen-dashboard", icon: Home },
            { title: "My Profile", url: "/citizen-dashboard/profile", icon: User },
            { title: "Purchase History", url: "/citizen-dashboard/history", icon: FileText },
            { title: "Notifications", url: "/citizen-dashboard/notifications", icon: Bell }
        ];
        backUrl = "/citizen-dashboard";
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <div className="flex flex-1">
                <DashboardSidebar items={sidebarItems} onLogout={() => navigate("/auth")} />
                <main className="flex-1 p-6 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        <Link to={backUrl} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-primary mb-2">{title}</h1>
                        <p className="text-muted-foreground">{description}</p>
                        <div className="mt-12 p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <TrendingUp className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Module under Construction</h2>
                            <p className="text-muted-foreground max-w-sm">
                                This feature is part of the phase 2 expansion. Data analytics and advanced reports will be available soon.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export const AdminReports = () => <PlaceholderPage title="System Reports" description="Detailed distribution and stock reports" />;
export const AdminSettings = () => <PlaceholderPage title="System Settings" description="Global portal configuration" />;
export const DealerInventory = () => <PlaceholderPage title="Inventory Management" description="Track and update your stock" />;
export const DealerLogs = () => <PlaceholderPage title="Distribution Logs" description="Transaction history for today" />;
export const CitizenProfile = () => <PlaceholderPage title="My Profile" description="Account and Ration Card details" />;
export const CitizenHistory = () => <PlaceholderPage title="Purchase History" description="Your past ration collections" />;
export const CitizenNotifications = () => <PlaceholderPage title="Notifications" description="Alerts from the Food Department" />;
