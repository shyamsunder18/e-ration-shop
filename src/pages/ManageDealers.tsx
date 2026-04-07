import { useEffect, useState } from "react";
import { Home, Users, Store, TrendingUp, Settings, ArrowLeft, CheckCircle, XCircle, Package, Trash2, IdCard, Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api-client";
import { toast } from "sonner";

const ManageDealers = () => {
    const navigate = useNavigate();
    const [dealers, setDealers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const fetchDealers = async () => {
        try {
            const data = await api.get<any[]>('/admin/vendors');
            setDealers(data);
        } catch (error) {
            console.error("Failed to fetch dealers", error);
            toast.error("Failed to load dealers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDealers();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await api.put(`/admin/vendors/${id}/status`, { status: newStatus });
            toast.success(`Dealer status updated to ${newStatus}`);
            fetchDealers();
        } catch (error: any) {
            toast.error(error.message || "Failed to update status");
        }
    };

    const handleDeleteDealer = async (dealerId: string, dealerName: string) => {
        const confirmed = window.confirm(`Remove dealer "${dealerName}" permanently? This cannot be undone.`);
        if (!confirmed) return;

        try {
            await api.delete(`/admin/vendors/${dealerId}`);
            toast.success("Dealer removed successfully");
            fetchDealers();
        } catch (error: any) {
            toast.error(error.message || "Failed to remove dealer");
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
                        <div className="mb-8">
                            <Link to="/admin-dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-primary mb-2">Manage Dealers</h1>
                            <p className="text-muted-foreground">Approve or manage ration shop dealers</p>
                        </div>

                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle>Government Authorized Dealers</CardTitle>
                                <CardDescription>Total Dealers: {dealers.length}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shop Name</TableHead>
                                            <TableHead>License No.</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dealers.map((dealer, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    <div>{dealer.shopName || dealer.name}</div>
                                                    <div className="text-xs text-muted-foreground">{dealer.email}</div>
                                                </TableCell>
                                                <TableCell>{dealer.licenseNumber || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <div className="text-xs">
                                                        <p className="font-semibold">{dealer.state || 'N/A'}</p>
                                                        <p className="text-muted-foreground">{dealer.district || 'N/A'}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {dealer.status === "APPROVED" ? (
                                                        <Badge variant="secondary" className="bg-india-green/10 text-india-green">Approved</Badge>
                                                    ) : dealer.status === "PENDING" ? (
                                                        <Badge className="bg-saffron/10 text-saffron">Pending</Badge>
                                                    ) : (
                                                        <Badge variant="destructive">{dealer.status}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {dealer.status === "PENDING" && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-india-green hover:bg-india-green/90 h-8"
                                                                    onClick={() => handleStatusUpdate(dealer._id, 'APPROVED')}
                                                                >
                                                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    className="h-8"
                                                                    onClick={() => handleStatusUpdate(dealer._id, 'REJECTED')}
                                                                >
                                                                    <XCircle className="w-3.5 h-3.5 mr-1" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8"
                                                            onClick={() => handleDeleteDealer(dealer._id, dealer.shopName || dealer.name)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {dealers.length === 0 && !loading && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4">No dealers found</TableCell>
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

export default ManageDealers;
