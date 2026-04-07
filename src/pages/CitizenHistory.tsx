import { useEffect, useState } from "react";
import { ArrowLeft, Bell, FileText, Home, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api-client";
import { toast } from "sonner";

const CitizenHistory = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);

  const sidebarItems = [
    { title: "Dashboard", url: "/citizen-dashboard", icon: Home },
    { title: "My Profile", url: "/citizen-dashboard/profile", icon: User },
    { title: "Purchase History", url: "/citizen-dashboard/history", icon: FileText },
    { title: "Notifications", url: "/citizen-dashboard/notifications", icon: Bell },
  ];

  useEffect(() => {
    api.get<any>("/distributions")
      .then((response) => setRecords(response.data || response))
      .catch(() => toast.error("Failed to load collection history"));
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
          <div className="mx-auto max-w-6xl">
            <Link to="/citizen-dashboard" className="mb-4 inline-flex items-center text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="mb-2 text-3xl font-bold text-primary">Purchase History</h1>
            <p className="mb-8 text-muted-foreground">Verified ration collections recorded against your ration card.</p>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Collection History</CardTitle>
                <CardDescription>These entries are verified by the dealer and visible to the department audit team.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Dealer</TableHead>
                      <TableHead>Verified Person</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Items</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>{new Date(record.collectedAt).toLocaleString()}</TableCell>
                        <TableCell>{record.vendor?.shopName || record.vendor?.name || "Dealer"}</TableCell>
                        <TableCell>{record.verifiedPersonName}</TableCell>
                        <TableCell><Badge variant="outline">{record.verificationMethod}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {(record.items || []).map((item: any) => `${item.productName}: ${item.quantity} ${item.unit}`).join(", ")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {records.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No ration collection history available yet.
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

export default CitizenHistory;
