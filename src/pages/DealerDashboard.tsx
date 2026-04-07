import { useEffect, useState } from "react";
import { Home, Package, Users, FileText, Search, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatsCard from "@/components/StatsCard";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api-client";
import { toast } from "sonner";

const DealerDashboard = () => {
  const navigate = useNavigate();
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [recentDistributions, setRecentDistributions] = useState<any[]>([]);

  const sidebarItems = [
    { title: "Dashboard", url: "/dealer-dashboard", icon: Home },
    { title: "Inventory", url: "/dealer-dashboard/inventory", icon: Package },
    { title: "Beneficiaries", url: "/dealer-dashboard/beneficiaries", icon: Users },
    { title: "Notifications", url: "/dealer-dashboard/notifications", icon: Bell },
    { title: "Distribution Logs", url: "/dealer-dashboard/logs", icon: FileText }
  ];

  const [stats, setStats] = useState({
    beneficiaries: 0,
    todayDistributions: 0,
    stockStatus: "75%",
    pendingRequests: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [beneficiaryResponse, inventoryResponse, distributionResponse] = await Promise.all([
          api.get<{ success: boolean; data: any[] }>('/vendor/beneficiaries'),
          api.get<any>('/inventory'),
          api.get<any>('/distributions'),
        ]);

        const data = (beneficiaryResponse as any).data || beneficiaryResponse;
        const inventory = (inventoryResponse as any).data || inventoryResponse;
        const distributions = (distributionResponse as any).data || distributionResponse;

        const liveInventory = Array.isArray(inventory) ? inventory : [];
        const liveDistributions = Array.isArray(distributions) ? distributions : [];
        const totalItems = liveInventory.length;
        const stableItems = liveInventory.filter((item: any) => item.stockStatus === 'STABLE').length;
        const pendingItems = liveInventory.filter((item: any) => item.stockStatus === 'PENDING_APPROVAL').length;
        const today = new Date().toDateString();
        const todayDistributions = liveDistributions.filter((record: any) => new Date(record.collectedAt).toDateString() === today).length;

        setInventoryData(liveInventory);
        setRecentDistributions(liveDistributions.slice(0, 5));
        setStats(prev => ({
          ...prev,
          beneficiaries: Array.isArray(data) ? data.length : 0,
          todayDistributions,
          stockStatus: totalItems > 0 ? `${Math.round((stableItems / totalItems) * 100)}%` : "0%",
          pendingRequests: pendingItems,
        }));
      } catch (error) {
        console.error("Failed to fetch dealer stats", error);
        toast.error("Failed to load dealer dashboard data");
      }
    };
    fetchStats();
  }, []);

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
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">Dealer Dashboard</h1>
              {/* <p className="text-muted-foreground">Shop ID: DL-SHOP-001 | Sector 15, Delhi</p> */}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Beneficiaries"
                value={stats.beneficiaries}
                icon={Users}
                description="Active ration cards"
                colorClass="text-primary"
              />
              <StatsCard
                title="Today's Distribution"
                value={stats.todayDistributions}
                icon={FileText}
                description="Transactions completed"
                colorClass="text-saffron"
              />
              <StatsCard
                title="Stock Status"
                value={stats.stockStatus}
                icon={Package}
                description="Overall inventory"
                colorClass="text-india-green"
              />
              <StatsCard
                title="Pending Requests"
                value={stats.pendingRequests}
                icon={Package}
                description="Awaiting stock confirmation"
                colorClass="text-destructive"
              />
            </div>

            {/* Verify Beneficiary */}
            <Card className="mb-8 shadow-card">
              <CardHeader>
                <CardTitle>Verify Beneficiary</CardTitle>
                <CardDescription>Scan or enter ration card number</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter ration card number (e.g., DL-01-AAY-123456)"
                    className="flex-1"
                  />
                  <Button className="bg-primary">
                    <Search className="w-4 h-4 mr-2" />
                    Verify
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Status */}
            <Card className="mb-8 shadow-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Current Inventory</CardTitle>
                    <CardDescription>Live stock levels for your dealer account</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/dealer-dashboard/inventory")}>Open Inventory</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Available Stock</TableHead>
                      <TableHead>Pending Release</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">{item.product?.name}</TableCell>
                        <TableCell>{item.quantity} {item.product?.unit}</TableCell>
                        <TableCell>{item.pendingQuantity ? `+${item.pendingQuantity} ${item.product?.unit}` : "-"}</TableCell>
                        <TableCell>
                          {item.stockStatus === "STABLE" && (
                            <Badge variant="secondary" className="bg-india-green/10 text-india-green">Adequate</Badge>
                          )}
                          {item.stockStatus === "PENDING_APPROVAL" && (
                            <Badge className="bg-saffron/10 text-saffron">Awaiting Confirmation</Badge>
                          )}
                          {item.stockStatus === "FLAGGED" && (
                            <Badge variant="destructive">Flagged</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {inventoryData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          No live inventory available yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Distributions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Distributions</CardTitle>
                <CardDescription>Today's transaction log</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDistributions.map((dist) => (
                    <div key={dist._id} className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{dist.user?.name || "Citizen"}</p>
                        <p className="text-xs text-muted-foreground">{dist.rationCardNumber}</p>
                        <p className="text-sm mt-1">{(dist.items || []).map((item: any) => `${item.productName}: ${item.quantity} ${item.unit}`).join(", ")}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(dist.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                  {recentDistributions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No verified distributions recorded yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DealerDashboard;
