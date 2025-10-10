import { Home, Users, Store, TrendingUp, Settings, Plus, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatsCard from "@/components/StatsCard";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const sidebarItems = [
    { title: "Dashboard", url: "/admin-dashboard", icon: Home },
    { title: "Manage Users", url: "/admin-dashboard/users", icon: Users },
    { title: "Manage Dealers", url: "/admin-dashboard/dealers", icon: Store },
    { title: "Reports", url: "/admin-dashboard/reports", icon: TrendingUp },
    { title: "Settings", url: "/admin-dashboard/settings", icon: Settings }
  ];

  const distributionData = [
    { month: "Sep", rice: 4500, wheat: 2800, sugar: 1200 },
    { month: "Oct", rice: 4800, wheat: 3000, sugar: 1300 },
    { month: "Nov", rice: 5200, wheat: 3200, sugar: 1400 },
    { month: "Dec", rice: 5000, wheat: 3100, sugar: 1350 },
    { month: "Jan", rice: 5400, wheat: 3300, sugar: 1450 }
  ];

  const categoryData = [
    { name: "Rice", value: 45, color: "#FF9933" },
    { name: "Wheat", value: 30, color: "#003366" },
    { name: "Sugar", value: 15, color: "#138808" },
    { name: "Kerosene", value: 10, color: "#999999" }
  ];

  const recentDealers = [
    { id: "DL-001", name: "Ram Provision Store", location: "Sector 15, Delhi", status: "active", beneficiaries: 248 },
    { id: "DL-002", name: "Krishna Traders", location: "Rohini, Delhi", status: "active", beneficiaries: 312 },
    { id: "DL-003", name: "Sharma General Store", location: "Dwarka, Delhi", status: "pending", beneficiaries: 0 }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex flex-1">
        <DashboardSidebar items={sidebarItems} onLogout={() => navigate("/auth")} />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">System Overview & Management</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button size="sm" className="bg-saffron hover:bg-saffron/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Dealer
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Beneficiaries"
                value="12,450"
                icon={Users}
                description="+5.2% from last month"
                colorClass="text-primary"
              />
              <StatsCard
                title="Active Dealers"
                value={48}
                icon={Store}
                description="3 pending approval"
                colorClass="text-saffron"
              />
              <StatsCard
                title="Monthly Distribution"
                value="5,400 kg"
                icon={TrendingUp}
                description="Total commodities"
                colorClass="text-india-green"
              />
              <StatsCard
                title="System Efficiency"
                value="94%"
                icon={TrendingUp}
                description="Operational uptime"
                colorClass="text-primary"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Bar Chart */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Monthly Distribution Trends</CardTitle>
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
                  <CardDescription>Current month breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
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
                </CardContent>
              </Card>
            </div>

            {/* Dealers Management */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Dealers</CardTitle>
                <CardDescription>Newly registered and pending approvals</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dealer ID</TableHead>
                      <TableHead>Shop Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Beneficiaries</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDealers.map((dealer, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{dealer.id}</TableCell>
                        <TableCell>{dealer.name}</TableCell>
                        <TableCell>{dealer.location}</TableCell>
                        <TableCell>{dealer.beneficiaries}</TableCell>
                        <TableCell>
                          {dealer.status === "active" ? (
                            <Badge variant="secondary" className="bg-india-green/10 text-india-green">Active</Badge>
                          ) : (
                            <Badge className="bg-saffron/10 text-saffron">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
