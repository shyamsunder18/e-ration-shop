import { Home, Users, Store, TrendingUp, Settings, ArrowLeft, Package, IdCard, Bell, Palette } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import ThemeSelector from "@/components/ThemeSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api-client";

const AdminSettings = () => {
  const navigate = useNavigate();

  const sidebarItems = [
    { title: "Dashboard", url: "/admin-dashboard", icon: Home },
    { title: "Manage Users", url: "/admin-dashboard/users", icon: Users },
    { title: "Manage Dealers", url: "/admin-dashboard/dealers", icon: Store },
    { title: "Manage Goods", url: "/admin-dashboard/goods", icon: Package },
    { title: "Ration Cards", url: "/admin-dashboard/ration-cards", icon: IdCard },
    { title: "Notifications", url: "/admin-dashboard/notifications", icon: Bell },
    { title: "Reports", url: "/admin-dashboard/reports", icon: TrendingUp },
    { title: "Settings", url: "/admin-dashboard/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {});
      localStorage.removeItem("user");
      navigate("/auth");
    } catch {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1">
        <DashboardSidebar items={sidebarItems} onLogout={handleLogout} />

        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-5xl">
            <Link to="/admin-dashboard" className="mb-4 inline-flex items-center text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold text-primary">System Settings</h1>
              <p className="text-muted-foreground">Control portal appearance and personal admin preferences.</p>
            </div>

            <Card className="shadow-card border-primary/15">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme Preferences
                </CardTitle>
                <CardDescription>
                  Choose how the portal looks across admin pages. The same theme selector is also available in the top navigation on every page.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Available modes: Default, Light, and Dark.
                </div>
                <ThemeSelector mobile />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;
