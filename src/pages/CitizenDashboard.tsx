import { Home, User, FileText, Bell, LogOut, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatsCard from "@/components/StatsCard";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const CitizenDashboard = () => {
  const navigate = useNavigate();

  const sidebarItems = [
    { title: "Dashboard", url: "/citizen-dashboard", icon: Home },
    { title: "My Profile", url: "/citizen-dashboard/profile", icon: User },
    { title: "Purchase History", url: "/citizen-dashboard/history", icon: FileText },
    { title: "Notifications", url: "/citizen-dashboard/notifications", icon: Bell }
  ];

  const rationData = [
    { item: "Rice", quota: 10, consumed: 6, unit: "kg" },
    { item: "Wheat", quota: 5, consumed: 3, unit: "kg" },
    { item: "Sugar", quota: 2, consumed: 1.5, unit: "kg" },
    { item: "Kerosene", quota: 3, consumed: 2, unit: "L" }
  ];

  const recentTransactions = [
    { date: "2025-01-15", items: "Rice: 3kg, Wheat: 2kg", amount: "₹85" },
    { date: "2025-01-08", items: "Sugar: 1kg, Kerosene: 1L", amount: "₹52" },
    { date: "2024-12-28", items: "Rice: 3kg", amount: "₹45" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex flex-1">
        <DashboardSidebar items={sidebarItems} onLogout={() => navigate("/auth")} />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">Welcome, Rajesh Kumar</h1>
              <p className="text-muted-foreground">Ration Card: DL-01-AAY-123456</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                title="Family Members"
                value={4}
                icon={User}
                description="Registered beneficiaries"
                colorClass="text-primary"
              />
              <StatsCard
                title="Monthly Budget"
                value="₹450"
                icon={FileText}
                description="Subsidized allocation"
                colorClass="text-saffron"
              />
              <StatsCard
                title="Items Collected"
                value="65%"
                icon={Download}
                description="This month"
                colorClass="text-india-green"
              />
            </div>

            {/* Ration Quota */}
            <Card className="mb-8 shadow-card">
              <CardHeader>
                <CardTitle>Monthly Ration Quota</CardTitle>
                <CardDescription>January 2025 - Track your consumption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {rationData.map((item, index) => {
                  const percentage = (item.consumed / item.quota) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.item}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.consumed} / {item.quota} {item.unit}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-end">
                        {percentage >= 80 ? (
                          <Badge variant="destructive" className="text-xs">Almost Full</Badge>
                        ) : percentage >= 50 ? (
                          <Badge className="text-xs bg-saffron">Moderate</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Available</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Purchases</CardTitle>
                    <CardDescription>Your distribution history</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((txn, index) => (
                    <div key={index} className="flex justify-between items-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-smooth">
                      <div>
                        <p className="font-medium text-sm">{txn.date}</p>
                        <p className="text-sm text-muted-foreground">{txn.items}</p>
                      </div>
                      <Badge variant="secondary">{txn.amount}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CitizenDashboard;
