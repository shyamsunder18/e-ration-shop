import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, Home, IdCard, Package, Settings, Store, TrendingUp, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api-client";
import { toast } from "sonner";

const AdminReports = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

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

  useEffect(() => {
    Promise.all([
      api.get<any>("/distributions"),
      api.get<any[]>("/admin/inventory/global"),
    ])
      .then(([distributionResponse, inventoryResponse]) => {
        setRecords(distributionResponse.data || distributionResponse);
        setInventory(inventoryResponse);
      })
      .catch(() => toast.error("Failed to load audit reports"));
  }, []);

  const auditRows = useMemo(() => {
    const byDealer = new Map<string, { dealer: string; collections: number; totalItems: number; stockLeft: number }>();

    for (const record of records) {
      const key = record.vendor?._id || record.vendor?.shopName || "unknown";
      if (!byDealer.has(key)) {
        byDealer.set(key, {
          dealer: record.vendor?.shopName || record.vendor?.name || "Dealer",
          collections: 0,
          totalItems: 0,
          stockLeft: 0,
        });
      }
      const row = byDealer.get(key)!;
      row.collections += 1;
      row.totalItems += (record.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
    }

    for (const item of inventory) {
      const key = item.vendor?._id || item.vendor?.shopName || "unknown";
      if (!byDealer.has(key)) {
        byDealer.set(key, {
          dealer: item.vendor?.shopName || item.vendor?.name || "Dealer",
          collections: 0,
          totalItems: 0,
          stockLeft: 0,
        });
      }
      byDealer.get(key)!.stockLeft += Number(item.quantity || 0);
    }

    return Array.from(byDealer.values()).sort((a, b) => b.collections - a.collections);
  }, [records, inventory]);

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
          <div className="mx-auto max-w-7xl">
            <Link to="/admin-dashboard" className="mb-4 inline-flex items-center text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="mb-2 text-3xl font-bold text-primary">Distribution Audit Reports</h1>
            <p className="mb-8 text-muted-foreground">Track verified citizen collections and monitor dealer-level stock movement.</p>

            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Dealer Audit Summary</CardTitle>
                  <CardDescription>Monitor collections recorded and current stock held by each dealer.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dealer</TableHead>
                        <TableHead>Collections</TableHead>
                        <TableHead>Distributed Qty</TableHead>
                        <TableHead>Stock Left</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditRows.map((row) => (
                        <TableRow key={row.dealer}>
                          <TableCell className="font-medium">{row.dealer}</TableCell>
                          <TableCell>{row.collections}</TableCell>
                          <TableCell>{row.totalItems}</TableCell>
                          <TableCell>{row.stockLeft}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Latest Verified Collections</CardTitle>
                  <CardDescription>Every collection here has verification evidence and dealer attribution.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {records.slice(0, 8).map((record) => (
                    <div key={record._id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{record.user?.name || "Citizen"} collected from {record.vendor?.shopName || record.vendor?.name || "Dealer"}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.rationCardNumber} · {record.verifiedPersonName} · {new Date(record.collectedAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{record.verificationMethod}</Badge>
                      </div>
                    </div>
                  ))}
                  {records.length === 0 && <p className="text-sm text-muted-foreground">No verified collections yet.</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminReports;
