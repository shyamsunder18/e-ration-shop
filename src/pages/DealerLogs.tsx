import { useEffect, useState } from "react";
import { ArrowLeft, Bell, FileText, Home, Package, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api-client";
import { toast } from "sonner";

const DealerLogs = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);

  const sidebarItems = [
    { title: "Dashboard", url: "/dealer-dashboard", icon: Home },
    { title: "Inventory", url: "/dealer-dashboard/inventory", icon: Package },
    { title: "Beneficiaries", url: "/dealer-dashboard/beneficiaries", icon: Users },
    { title: "Notifications", url: "/dealer-dashboard/notifications", icon: Bell },
    { title: "Distribution Logs", url: "/dealer-dashboard/logs", icon: FileText },
  ];

  useEffect(() => {
    api.get<any>("/distributions")
      .then((response) => setRecords(response.data || response))
      .catch(() => toast.error("Failed to load distribution logs"));
  }, []);

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
            <Link to="/dealer-dashboard" className="mb-4 inline-flex items-center text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="mb-2 text-3xl font-bold text-primary">Distribution Logs</h1>
            <p className="mb-8 text-muted-foreground">Verified ration collections recorded by your shop.</p>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Verified Collections</CardTitle>
                <CardDescription>Every entry deducts stock and becomes visible to admin audit.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Citizen</TableHead>
                      <TableHead>Ration Card</TableHead>
                      <TableHead>Verified Person</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Collected At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell className="font-medium">{record.user?.name || "Citizen"}</TableCell>
                        <TableCell>{record.rationCardNumber}</TableCell>
                        <TableCell>{record.verifiedPersonName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.verificationMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {(record.items || []).map((item: any) => `${item.productName}: ${item.quantity} ${item.unit}`).join(", ")}
                        </TableCell>
                        <TableCell>{new Date(record.collectedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {records.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          No verified ration collections recorded yet.
                        </TableCell>
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

export default DealerLogs;
