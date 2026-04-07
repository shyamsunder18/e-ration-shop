import { useEffect, useMemo, useState } from "react";
import { Home, Users, Store, TrendingUp, Settings, Plus, Download, Package, AlertTriangle, IdCard, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatsCard from "@/components/StatsCard";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "@/lib/api-client";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    activeVendors: 0,
    pendingVendors: 0,
    totalOrders: 0
  });
  const [dealers, setDealers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDealerOpen, setAddDealerOpen] = useState(false);
  const [creatingDealer, setCreatingDealer] = useState(false);
  const [dealerForm, setDealerForm] = useState({
    name: "",
    email: "",
    password: "",
    shopName: "",
    licenseNumber: "",
    state: "Telangana",
    district: "",
  });

  const sidebarItems = [
    { title: "Dashboard", url: "/admin-dashboard", icon: Home },
    { title: "Manage Users", url: "/admin-dashboard/users", icon: Users },
    { title: "Manage Dealers", url: "/admin-dashboard/dealers", icon: Store },
    { title: "Manage Goods", url: "/admin-dashboard/goods", icon: Package },
    { title: "Ration Cards", url: "/admin-dashboard/ration-cards", icon: IdCard },
    { title: "Notifications", url: "/admin-dashboard/notifications", icon: Bell },
    { title: "Reports", url: "/admin-dashboard/reports", icon: TrendingUp },
    { title: "Settings", url: "/admin-dashboard/settings", icon: Settings }
  ];

  const fetchData = async () => {
    try {
      const [statsData, dealersData, alertsData, inventoryData] = await Promise.all([
        api.get<any>('/admin/stats'),
        api.get<any[]>('/admin/vendors'),
        api.get<{ notifications?: any[] }>('/notifications'),
        api.get<any[]>('/admin/inventory/global')
      ]);

      setStats(statsData);
      setDealers(dealersData);
      setInventory(inventoryData);

      const flaggedStockAlerts = (alertsData.notifications || []).filter(a => a.type === 'STOCK_FLAG');
      setAlerts(flaggedStockAlerts);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  // Mock data for charts (Backend avg/analytics not implemented yet)
  const distributionData = [
    { month: "Sep", rice: 4500, wheat: 2800, sugar: 1200 },
    { month: "Oct", rice: 4800, wheat: 3000, sugar: 1300 },
    { month: "Nov", rice: 5200, wheat: 3200, sugar: 1400 },
    { month: "Dec", rice: 5000, wheat: 3100, sugar: 1350 },
    { month: "Jan", rice: 5400, wheat: 3300, sugar: 1450 }
  ];

  const categoryData = useMemo(() => {
    const colorMap: Record<string, string> = {
      rice: "#FF9933",
      wheat: "#003366",
      sugar: "#138808",
      kerosene: "#999999",
    };

    const totals = inventory.reduce((acc: Record<string, { name: string; value: number; color: string }>, item: any) => {
      const productName = String(item.product?.name || "Unknown");
      const key = productName.toLowerCase();
      const releaseTotal = Number(item.quantity || 0) + Number(item.pendingQuantity || 0);

      if (!acc[key]) {
        acc[key] = {
          name: productName,
          value: 0,
          color: colorMap[key] || "#64748b",
        };
      }

      acc[key].value += releaseTotal;
      return acc;
    }, {});

    const values = Object.values(totals).filter((entry) => entry.value > 0);
    return values.length > 0
      ? values
      : [
          { name: "Rice", value: 0, color: "#FF9933" },
          { name: "Wheat", value: 0, color: "#003366" },
          { name: "Sugar", value: 0, color: "#138808" },
          { name: "Kerosene", value: 0, color: "#999999" },
        ];
  }, [inventory]);

  const totalReleased = categoryData.reduce((sum, entry) => sum + entry.value, 0);
  const inventoryStatusById = useMemo(() => {
    return new Map(
      inventory.map((item: any) => [String(item._id), item.stockStatus])
    );
  }, [inventory]);

  const enrichedAlerts = useMemo(() => {
    const getRank = (status: string) => {
      if (status === "NEW") return 0;
      if (status === "UNDER_ENQUIRY") return 1;
      return 2;
    };

    return alerts
      .map((alert) => {
        const inventoryId = String(alert?.metadata?.inventoryId || "");
        const inventoryStatus = inventoryStatusById.get(inventoryId);
        const status = inventoryStatus === "STABLE"
          ? "SOLVED"
          : alert.read
            ? "UNDER_ENQUIRY"
            : "NEW";

        return {
          ...alert,
          displayStatus: status,
        };
      })
      .sort((a, b) => {
        const rankDiff = getRank(a.displayStatus) - getRank(b.displayStatus);
        if (rankDiff !== 0) return rankDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [alerts, inventoryStatusById]);
  const activeAlerts = enrichedAlerts.filter((alert) => alert.displayStatus !== "SOLVED");
  const solvedAlerts = enrichedAlerts.filter((alert) => alert.displayStatus === "SOLVED");

  const unreadAlertCount = enrichedAlerts.filter((alert) => alert.displayStatus === "NEW").length;
  const hasUrgentAlerts = unreadAlertCount > 0;

  const exportReport = () => {
    const lines = [
      ["Report", "Admin Dashboard Summary"],
      ["Generated At", new Date().toISOString()],
      [],
      ["Metric", "Value"],
      ["Total Users", String(stats.totalUsers)],
      ["Pending Users", String(stats.pendingUsers)],
      ["Active Dealers", String(stats.activeVendors)],
      ["Pending Dealers", String(stats.pendingVendors)],
      ["Total Orders", String(stats.totalOrders)],
      [],
      ["Commodity", "Released Total"],
      ...categoryData.map((item) => [item.name, String(item.value)]),
      [],
      ["Dealer", "Email", "District", "State", "Status"],
      ...dealers.map((dealer) => [
        dealer.shopName || dealer.name || "",
        dealer.email || "",
        dealer.district || "",
        dealer.state || "",
        dealer.status || "",
      ]),
    ];

    const csv = lines
      .map((row) => row.map((value = "") => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const handleCreateDealer = async () => {
    if (!dealerForm.name || !dealerForm.email || !dealerForm.password || !dealerForm.shopName || !dealerForm.licenseNumber || !dealerForm.district) {
      toast.error("Please fill all dealer details");
      return;
    }

    setCreatingDealer(true);
    try {
      const createdDealer = await api.post<any>('/auth/register', {
        name: dealerForm.name,
        email: dealerForm.email,
        password: dealerForm.password,
        role: 'VENDOR',
        shopName: dealerForm.shopName,
        licenseNumber: dealerForm.licenseNumber,
        state: dealerForm.state,
        district: dealerForm.district,
      });

      if (createdDealer?._id) {
        await api.put(`/admin/vendors/${createdDealer._id}/status`, { status: 'APPROVED' });
      }

      toast.success("Dealer created and approved successfully");
      setDealerForm({
        name: "",
        email: "",
        password: "",
        shopName: "",
        licenseNumber: "",
        state: "Telangana",
        district: "",
      });
      setAddDealerOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create dealer");
    } finally {
      setCreatingDealer(false);
    }
  };

  const handleEnquiryStarted = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`, {});
      setAlerts((prev) => prev.map((alert) => (
        alert._id === notificationId
          ? { ...alert, read: true }
          : alert
      )));
      toast.success("Enquiry started for this stock discrepancy");
    } catch (error: any) {
      toast.error(error.message || "Failed to update alert status");
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
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">System Overview & Management</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Dialog open={addDealerOpen} onOpenChange={setAddDealerOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-saffron hover:bg-saffron/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Dealer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Dealer</DialogTitle>
                      <DialogDescription>
                        Register a new dealer account and approve it immediately for portal access.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="dealer-name">Dealer Name</Label>
                        <Input id="dealer-name" value={dealerForm.name} onChange={(e) => setDealerForm((prev) => ({ ...prev, name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dealer-email">Email</Label>
                        <Input id="dealer-email" type="email" value={dealerForm.email} onChange={(e) => setDealerForm((prev) => ({ ...prev, email: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dealer-password">Password</Label>
                        <Input id="dealer-password" type="password" value={dealerForm.password} onChange={(e) => setDealerForm((prev) => ({ ...prev, password: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shop-name">Shop Name</Label>
                        <Input id="shop-name" value={dealerForm.shopName} onChange={(e) => setDealerForm((prev) => ({ ...prev, shopName: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="license-number">License Number</Label>
                        <Input id="license-number" value={dealerForm.licenseNumber} onChange={(e) => setDealerForm((prev) => ({ ...prev, licenseNumber: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dealer-district">District</Label>
                        <Input id="dealer-district" value={dealerForm.district} onChange={(e) => setDealerForm((prev) => ({ ...prev, district: e.target.value }))} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddDealerOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateDealer} disabled={creatingDealer} className="bg-saffron hover:bg-saffron/90">
                        {creatingDealer ? "Creating..." : "Create Dealer"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Users"
                value={stats.totalUsers.toLocaleString()}
                icon={Users}
                description={`${stats.pendingUsers} pending verification`}
                colorClass="text-primary"
              />
              <StatsCard
                title="Active Dealers"
                value={stats.activeVendors}
                icon={Store}
                description={`${stats.pendingVendors} pending approval`}
                colorClass="text-saffron"
              />
              <StatsCard
                title="Total Orders"
                value={stats.totalOrders.toString()}
                icon={TrendingUp}
                description="System-wide orders"
                colorClass="text-india-green"
              />
              <StatsCard
                title="System Status"
                value="Online"
                icon={TrendingUp}
                description="Operational"
                colorClass="text-primary"
              />
            </div>

            {/* System Alerts */}
            <div className="flex flex-col gap-6 mb-8">
              {stats.pendingUsers > 0 && (
                <div className="overflow-hidden rounded-xl border border-india-green/20 bg-india-green/5">
                  <div className="p-4 bg-india-green/10 border-b border-india-green/10 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-india-green flex items-center uppercase tracking-wider">
                      <Users className="w-4 h-4 mr-2" />
                      Verification Requests
                    </h2>
                    <Badge variant="secondary" className="bg-india-green text-white animate-pulse">{stats.pendingUsers} CITIZENS</Badge>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">
                      There are {stats.pendingUsers} citizens waiting for account verification and ration card approval.
                    </p>
                    <Button
                      size="sm"
                      className="bg-india-green hover:bg-india-green/90 h-8 text-[10px] font-bold uppercase"
                      onClick={() => navigate('/admin-dashboard/users')}
                    >
                      Process Verifications
                    </Button>
                  </div>
                </div>
              )}

              {activeAlerts.length > 0 && (
                <div className={`overflow-hidden rounded-xl border ${hasUrgentAlerts ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/40"}`}>
                  <div className={`p-4 border-b flex items-center justify-between ${hasUrgentAlerts ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}>
                    <h2 className={`text-sm font-bold flex items-center uppercase tracking-wider ${hasUrgentAlerts ? "text-red-700" : "text-amber-700"}`}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Immediate Action Required: Stock Discrepancies
                    </h2>
                    {hasUrgentAlerts ? (
                      <Badge variant="destructive" className="animate-pulse">{unreadAlertCount} NEW</Badge>
                    ) : (
                      <Badge className="bg-amber-500 text-white">UNDER REVIEW</Badge>
                    )}
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeAlerts.map((alert) => (
                      <Card
                        key={alert._id}
                        className={
                          alert.displayStatus === "SOLVED"
                            ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                            : alert.displayStatus === "UNDER_ENQUIRY"
                              ? "border-amber-200 bg-amber-50/70 shadow-sm"
                              : "border-red-100 bg-red-50/20 shadow-sm"
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(alert.createdAt).toLocaleDateString()} {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                alert.displayStatus === "SOLVED"
                                  ? "border-emerald-300 text-emerald-700"
                                  : alert.displayStatus === "UNDER_ENQUIRY"
                                    ? "border-amber-300 text-amber-700"
                                    : "border-red-200 text-red-700"
                              }
                            >
                              {alert.displayStatus === "SOLVED"
                                ? "Solved"
                                : alert.displayStatus === "UNDER_ENQUIRY"
                                  ? "Under Enquiry"
                                  : "New"}
                            </Badge>
                          </div>
                          <p className="text-xs font-semibold text-foreground line-clamp-3">
                            {alert.message}
                          </p>
                          <div
                            className={`mt-4 pt-3 flex justify-end gap-2 ${
                              alert.displayStatus === "SOLVED"
                                ? "border-t border-emerald-100"
                                : alert.displayStatus === "UNDER_ENQUIRY"
                                  ? "border-t border-amber-100"
                                  : "border-t border-red-50"
                            }`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={alert.displayStatus !== "NEW"}
                              className={
                                alert.displayStatus === "SOLVED"
                                  ? "h-7 border-emerald-300 bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold"
                                  : alert.displayStatus === "UNDER_ENQUIRY"
                                    ? "h-7 border-amber-300 bg-amber-100 text-amber-800 text-[10px] uppercase font-bold"
                                    : "h-7 border-amber-300 text-amber-700 hover:bg-amber-50 text-[10px] uppercase font-bold"
                              }
                              onClick={() => handleEnquiryStarted(alert._id)}
                            >
                              {alert.displayStatus === "SOLVED"
                                ? "Solved"
                                : alert.displayStatus === "UNDER_ENQUIRY"
                                  ? "Under Enquiry"
                                  : "Enquiry Started"}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] uppercase font-bold" onClick={() => navigate('/admin-dashboard/goods')}>
                              Review Stock
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Bar Chart */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Ration Distribution Summary</CardTitle>
                  <CardDescription>Commodity-wise distribution (in kg)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="rice" fill="#FF9933" />
                      <Bar dataKey="wheat" fill="#003366" />
                      <Bar dataKey="sugar" fill="#138808" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Distribution by Category</CardTitle>
                  <CardDescription>Live commodity release totals across dealer stock and pending admin releases</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Total released quantity across commodities: <span className="font-semibold text-foreground">{totalReleased}</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {solvedAlerts.length > 0 && (
              <div className="mb-8 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/40">
                <div className="p-4 border-b border-emerald-100 bg-emerald-50 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-emerald-700 flex items-center uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Solved Stock Discrepancies
                  </h2>
                  <Badge className="bg-emerald-600 text-white">{solvedAlerts.length} SOLVED</Badge>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {solvedAlerts.map((alert) => (
                    <Card key={alert._id} className="border-emerald-200 bg-emerald-50/70 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(alert.createdAt).toLocaleDateString()} {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                            Solved
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-foreground line-clamp-3">
                          {alert.message}
                        </p>
                        <div className="mt-4 pt-3 border-t border-emerald-100 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="h-7 border-emerald-300 bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold"
                          >
                            Solved
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-[10px] uppercase font-bold"
                            onClick={() => navigate('/admin-dashboard/goods')}
                          >
                            View Record
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Dealers Management */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Registered Dealers</CardTitle>
                <CardDescription>Manage approval status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dealers.map((dealer: any, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{dealer.shopName || dealer.name}</TableCell>
                        <TableCell>{dealer.email}</TableCell>
                        <TableCell>{dealer.address || 'N/A'}</TableCell>
                        <TableCell>{dealer.licenseNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {dealer.status === "APPROVED" ? (
                            <Badge variant="secondary" className="bg-india-green/10 text-india-green">Active</Badge>
                          ) : (
                            <Badge className="bg-saffron/10 text-saffron">{dealer.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {dealer.status === "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs mr-2"
                              onClick={async () => {
                                try {
                                  await api.put(`/admin/vendors/${dealer._id}/status`, { status: 'APPROVED' });
                                  toast.success("Dealer Approved");
                                  setDealers(prev => prev.map(d => d._id === dealer._id ? { ...d, status: 'APPROVED' } : d));
                                } catch (e) {
                                  toast.error("Failed to approve");
                                }
                              }}
                            >
                              Approve
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {dealers.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">No dealers found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
