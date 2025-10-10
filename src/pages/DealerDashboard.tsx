import { Home, Package, Users, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatsCard from "@/components/StatsCard";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const DealerDashboard = () => {
  const navigate = useNavigate();

  const sidebarItems = [
    { title: "Dashboard", url: "/dealer-dashboard", icon: Home },
    { title: "Inventory", url: "/dealer-dashboard/inventory", icon: Package },
    { title: "Beneficiaries", url: "/dealer-dashboard/beneficiaries", icon: Users },
    { title: "Distribution Logs", url: "/dealer-dashboard/logs", icon: FileText }
  ];

  const inventoryData = [
    { item: "Rice", stock: 500, allocated: 350, unit: "kg", status: "adequate" },
    { item: "Wheat", stock: 200, allocated: 280, unit: "kg", status: "low" },
    { item: "Sugar", stock: 150, allocated: 100, unit: "kg", status: "adequate" },
    { item: "Kerosene", stock: 80, allocated: 120, unit: "L", status: "critical" }
  ];

  const recentDistributions = [
    { cardNo: "DL-01-AAY-123456", name: "Rajesh Kumar", items: "Rice: 3kg", time: "10:30 AM" },
    { cardNo: "DL-01-BPL-789012", name: "Sunita Devi", items: "Wheat: 2kg, Sugar: 1kg", time: "11:15 AM" },
    { cardNo: "DL-01-AAY-345678", name: "Mohan Singh", items: "Kerosene: 1L", time: "12:00 PM" }
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
              <h1 className="text-3xl font-bold text-primary mb-2">Dealer Dashboard</h1>
              <p className="text-muted-foreground">Shop ID: DL-SHOP-001 | Sector 15, Delhi</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Beneficiaries"
                value={248}
                icon={Users}
                description="Active ration cards"
                colorClass="text-primary"
              />
              <StatsCard
                title="Today's Distribution"
                value={32}
                icon={FileText}
                description="Transactions completed"
                colorClass="text-saffron"
              />
              <StatsCard
                title="Stock Status"
                value="75%"
                icon={Package}
                description="Overall inventory"
                colorClass="text-india-green"
              />
              <StatsCard
                title="Pending Requests"
                value={5}
                icon={FileText}
                description="Awaiting verification"
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
                    <CardDescription>Stock levels and allocation</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">Update Stock</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Available Stock</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.item}</TableCell>
                        <TableCell>{item.stock} {item.unit}</TableCell>
                        <TableCell>{item.allocated} {item.unit}</TableCell>
                        <TableCell>
                          {item.status === "adequate" && (
                            <Badge variant="secondary" className="bg-india-green/10 text-india-green">Adequate</Badge>
                          )}
                          {item.status === "low" && (
                            <Badge className="bg-saffron/10 text-saffron">Low</Badge>
                          )}
                          {item.status === "critical" && (
                            <Badge variant="destructive">Critical</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
                  {recentDistributions.map((dist, index) => (
                    <div key={index} className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{dist.name}</p>
                        <p className="text-xs text-muted-foreground">{dist.cardNo}</p>
                        <p className="text-sm mt-1">{dist.items}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{dist.time}</span>
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

export default DealerDashboard;
