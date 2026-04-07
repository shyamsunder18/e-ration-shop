import { useEffect, useState } from "react";
import { Home, Users, Store, TrendingUp, Settings, ArrowLeft, Package, CheckCircle, XCircle, Trash2, IdCard, Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

const ManageUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
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

    const fetchData = async () => {
        try {
            const [usersData, vendorsData] = await Promise.all([
                api.get<any[]>('/admin/users'),
                api.get<any[]>('/admin/vendors')
            ]);
            setUsers(usersData);
            setVendors(vendorsData.filter(v => v.status === 'APPROVED'));
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load users or dealers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssignVendor = async (userId: string, vendorId: string) => {
        try {
            await api.put(`/admin/users/${userId}/assign-dealer`, { vendorId });
            toast.success("Dealer assigned successfully");
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to assign dealer");
        }
    };

    const handleUpdateStatus = async (userId: string, status: string) => {
        try {
            await api.put(`/admin/users/${userId}/update-status`, { status });
            toast.success(`User status updated to ${status}`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to update status");
        }
    };

    const handleUpdateCategory = async (userId: string, category: string) => {
        try {
            await api.put(`/admin/users/${userId}/update-category`, { category });
            toast.success(`User category updated to ${category}`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to update category");
        }
    };

    const handleUpdateFamilyMembers = async (userId: string, members: number) => {
        try {
            await api.put(`/admin/users/${userId}/update-family`, { members });
            toast.success(`Family members updated to ${members}`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to update family members");
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        const confirmed = window.confirm(`Remove user "${userName}" permanently? This cannot be undone.`);
        if (!confirmed) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success("User removed successfully");
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to remove user");
        }
    };

    const handleIssueCollectionCode = async (userId: string) => {
        try {
            await api.post(`/admin/users/${userId}/collection-code`, {});
            toast.success("Monthly collection code sent to citizen notifications");
        } catch (error: any) {
            toast.error(error.message || "Failed to issue collection code");
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
                            <h1 className="text-3xl font-bold text-primary mb-2">Manage Users</h1>
                            <p className="text-muted-foreground">View and manage registered citizens</p>
                        </div>

                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle>Registered Citizens</CardTitle>
                                <CardDescription>Total Users: {users.length}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Ration Card</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Members</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Assigned Dealer</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Collection Code</TableHead>
                                            <TableHead>Remove</TableHead>
                                            <TableHead>Joined</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user._id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.rationCardNumber || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={user.cardCategory || "none"}
                                                        onValueChange={(val) => handleUpdateCategory(user._id, val)}
                                                    >
                                                        <SelectTrigger className="w-[100px] h-8 text-xs">
                                                            <SelectValue placeholder="Category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none" disabled>Select</SelectItem>
                                                            <SelectItem value="AAY">AAY</SelectItem>
                                                            <SelectItem value="BPL">BPL</SelectItem>
                                                            <SelectItem value="APL">APL</SelectItem>
                                                            <SelectItem value="PHH">PHH</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-12 h-8 px-1 border rounded text-xs bg-background"
                                                        defaultValue={user.familyMembers || 1}
                                                        onBlur={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (val !== user.familyMembers) {
                                                                handleUpdateFamilyMembers(user._id, val);
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs">
                                                        <p className="font-semibold">{user.state || 'N/A'}</p>
                                                        <p className="text-muted-foreground">{user.district || 'N/A'}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={user.assignedVendor?._id || user.assignedVendor || "none"}
                                                        onValueChange={(val) => handleAssignVendor(user._id, val)}
                                                    >
                                                        <SelectTrigger className="w-[180px] h-8 text-xs">
                                                            <SelectValue placeholder="Assign Dealer" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Unassigned</SelectItem>
                                                            {vendors.map((vendor) => (
                                                                <SelectItem key={vendor._id} value={vendor._id}>
                                                                    {vendor.shopName} ({vendor.state}, {vendor.district})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    {user.status === 'PENDING' ? (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="h-7 text-[10px] bg-india-green hover:bg-india-green/90 px-2"
                                                                onClick={() => handleUpdateStatus(user._id, 'APPROVED')}
                                                            >
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-7 text-[10px] px-2"
                                                                onClick={() => handleUpdateStatus(user._id, 'REJECTED')}
                                                            >
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[10px] px-2 py-0 h-5 font-bold uppercase",
                                                                user.status === 'APPROVED' ? "border-green-500 text-green-600 bg-green-50" :
                                                                    user.status === 'REJECTED' ? "border-red-500 text-red-600 bg-red-50" : "border-saffron text-saffron bg-saffron/5"
                                                            )}
                                                        >
                                                            {user.status || 'Active'}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-[10px]"
                                                        disabled={user.status !== 'APPROVED' || !user.assignedVendor}
                                                        onClick={() => handleIssueCollectionCode(user._id)}
                                                    >
                                                        Send Code
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="h-8"
                                                        onClick={() => handleDeleteUser(user._id, user.name)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                        Remove
                                                    </Button>
                                                </TableCell>
                                                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                        {users.length === 0 && !loading && (
                                            <TableRow>
                                                <TableCell colSpan={11} className="text-center py-4">No users found</TableCell>
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

export default ManageUsers;
