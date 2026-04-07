import { useEffect, useState } from "react";
import { Home, Package, Users, FileText, ArrowLeft, Check, AlertTriangle, Send, Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import api from "@/lib/api-client";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const DealerInventory = () => {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [flagReason, setFlagReason] = useState("");
    const [notifMessage, setNotifMessage] = useState("");
    const [isNotifying, setIsNotifying] = useState(false);
    const [globalDialogOpen, setGlobalDialogOpen] = useState(false);

    const sidebarItems = [
        { title: "Dashboard", url: "/dealer-dashboard", icon: Home },
        { title: "Inventory", url: "/dealer-dashboard/inventory", icon: Package },
        { title: "Beneficiaries", url: "/dealer-dashboard/beneficiaries", icon: Users },
        { title: "Notifications", url: "/dealer-dashboard/notifications", icon: Bell },
        { title: "Distribution Logs", url: "/dealer-dashboard/logs", icon: FileText }
    ];

    const fetchInventory = async () => {
        try {
            const response = await api.get<any>('/inventory');
            const data = response.data || response;
            setInventory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleConfirm = async (id: string) => {
        try {
            await api.post(`/vendor/inventory/${id}/confirm`, {});
            toast.success("Stock updated successfully");
            fetchInventory();
        } catch (error: any) {
            toast.error(error.message || "Confirmation failed");
        }
    };

    const handleFlag = async (id: string, overrideReason?: string) => {
        try {
            const reason = (overrideReason ?? flagReason).trim();
            await api.post(`/vendor/inventory/${id}/flag`, { reason });
            toast.success(overrideReason ? "Status shared with Admin" : "Issue flagged to Admin");
            setFlagReason("");
            fetchInventory();
        } catch (error: any) {
            toast.error(error.message || "Flagging failed");
        }
    };

    const handleNotifyCitizens = async () => {
        setIsNotifying(true);
        try {
            await api.post('/vendor/notify-citizens', { message: notifMessage });
            toast.success("Global citizen notification sent");
            setNotifMessage("");
            setGlobalDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to send notifications");
        } finally {
            setIsNotifying(false);
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
                        <div className="mb-8 flex justify-between items-end">
                            <div>
                                <Link to="/dealer-dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Dashboard
                                </Link>
                                <h1 className="text-3xl font-bold text-primary mb-2">Inventory Management</h1>
                                <p className="text-muted-foreground">Confirm admin stock releases or raise discrepancies</p>
                            </div>

                            <Dialog open={globalDialogOpen} onOpenChange={setGlobalDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-india-green">
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Global Notification
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Global Citizen Notification</DialogTitle>
                                        <DialogDescription>
                                            Send one message to all citizens assigned to your shop. Personal slot notifications are sent from the Beneficiaries page.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Textarea
                                            placeholder="Write a message for all assigned citizens..."
                                            value={notifMessage}
                                            onChange={(e) => setNotifMessage(e.target.value)}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleNotifyCitizens} disabled={isNotifying}>
                                            {isNotifying ? "Sending..." : "Send Global Notification"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle>Current Stock & New Releases</CardTitle>
                                <CardDescription>Confirm stock increments from Admin before they are added to your balance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Commodity</TableHead>
                                            <TableHead>Current Balance</TableHead>
                                            <TableHead>Pending Admin Release</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {inventory.map((item) => (
                                            <TableRow key={item._id}>
                                                <TableCell className="font-medium">{item.product?.name}</TableCell>
                                                <TableCell>{item.quantity} {item.product?.unit}</TableCell>
                                                <TableCell>
                                                    {item.stockStatus === 'PENDING_APPROVAL' ? (
                                                        <span className="font-bold text-primary">+{item.pendingQuantity} {item.product?.unit}</span>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {item.stockStatus === 'STABLE' ? (
                                                        <Badge variant="outline" className="text-muted-foreground">Stable</Badge>
                                                    ) : item.stockStatus === 'PENDING_APPROVAL' ? (
                                                        <Badge className="bg-saffron animate-pulse">Awaiting Confirmation</Badge>
                                                    ) : (
                                                        <Badge variant="destructive">Flagged</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.stockStatus === 'PENDING_APPROVAL' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="h-8 border-red-200 text-red-600 hover:bg-red-50">
                                                                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                                                        Flag Issue
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Raise a Discrepancy</DialogTitle>
                                                                        <DialogDescription>
                                                                            Report why this stock update needs attention. You can either flag a discrepancy or inform admin that the issue is already being handled.
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="py-4">
                                                                        <Textarea
                                                                            placeholder="Enter reason for flagging..."
                                                                            value={flagReason}
                                                                            onChange={(e) => setFlagReason(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <DialogFooter>
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => handleFlag(item._id, "Issue is being handled at the shop level and admin has been informed.")}
                                                                        >
                                                                            Issue Being Handled
                                                                        </Button>
                                                                        <Button variant="destructive" onClick={() => handleFlag(item._id)}>
                                                                            Flag to Admin
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>

                                                            <Button size="sm" onClick={() => handleConfirm(item._id)} className="bg-india-green h-8">
                                                                <Check className="w-3.5 h-3.5 mr-1" />
                                                                Confirm Receipt
                                                            </Button>
                                                        </div>
                                                    )}
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

export default DealerInventory;
