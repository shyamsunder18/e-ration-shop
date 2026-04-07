import { useEffect, useState } from "react";
import { Home, Users, Store, TrendingUp, Settings, ArrowLeft, Package, Edit2, Save, X, IdCard, Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api-client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DemandCommodity = {
    commodityKey: string;
    commodityName: string;
    unit: string;
    productId: string | null;
    inventoryId: string | null;
    approvedCitizens: number;
    activeRationCards: number;
    monthlyDemand: number;
    currentStock: number;
    pendingRelease: number;
    availableAfterPending: number;
    shortfall: number;
    stockStatus: "STABLE" | "PENDING_APPROVAL" | "FLAGGED";
};

type DealerDemandPlan = {
    vendorId: string;
    dealerName: string;
    shopName: string;
    district: string;
    state: string;
    approvedCitizens: number;
    activeRationCards: number;
    commodities: DemandCommodity[];
};

type CentralStockItem = {
    _id: string;
    commodityKey: string;
    commodityName: string;
    unit: string;
    monthlyQuota: number;
    availableQuantity: number;
    monthKey: string;
};

const ManageGoods = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [demandPlans, setDemandPlans] = useState<DealerDemandPlan[]>([]);
    const [centralStock, setCentralStock] = useState<CentralStockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [editingStock, setEditingStock] = useState<string | null>(null);
    const [stockEditValue, setStockEditValue] = useState<string>("");
    const [releaseInputs, setReleaseInputs] = useState<Record<string, string>>({});
    const allowedCommodities = new Set(["Rice", "Wheat", "Sugar", "Kerosene"]);

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
            const [productsData, inventoryData, demandPlanData, centralStockData] = await Promise.all([
                api.get<any[]>('/admin/products'),
                api.get<any[]>('/admin/inventory/global'),
                api.get<DealerDemandPlan[]>('/admin/inventory/demand-plan'),
                api.get<CentralStockItem[]>('/admin/inventory/central-stock')
            ]);
            setProducts(productsData.filter((product) => allowedCommodities.has(product?.name)));
            setInventory(inventoryData.filter((item) => allowedCommodities.has(item?.product?.name)));
            setDemandPlans(demandPlanData);
            setCentralStock(centralStockData);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load goods and dealer allocation data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const startEditing = (product: any) => {
        setEditingProduct(product._id);
        setEditValue(product.price.toString());
    };

    const cancelEditing = () => {
        setEditingProduct(null);
    };

    const savePrice = async (productId: string) => {
        try {
            await api.put(`/admin/products/${productId}`, { price: parseFloat(editValue) });
            toast.success("Price updated successfully");
            setEditingProduct(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to update price");
        }
    };

    const saveStock = async (inventoryId: string) => {
        try {
            await api.put(`/admin/inventory/${inventoryId}`, { quantity: parseFloat(stockEditValue) });
            toast.success("Stock release queued for dealer confirmation");
            setEditingStock(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to queue stock release");
        }
    };

    const resolveStockIssue = async (inventoryId: string) => {
        try {
            await api.post(`/admin/inventory/${inventoryId}/resolve`, {});
            toast.success("Stock discrepancy marked as resolved");
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to resolve stock issue");
        }
    };

    const queueDemandRelease = async (commodity: DemandCommodity, vendorId: string, quantity: number) => {
        if (!commodity.productId) {
            toast.error(`No configured product found for ${commodity.commodityName}`);
            return;
        }

        try {
            await api.post('/admin/inventory/release', {
                vendorId,
                productId: commodity.productId,
                quantity,
            });
            toast.success(`${quantity} ${commodity.unit} of ${commodity.commodityName} released to dealer`);
            setReleaseInputs((prev) => ({
                ...prev,
                [`${vendorId}:${commodity.commodityKey}`]: "",
            }));
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to release stock");
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
                            <h1 className="text-3xl font-bold text-primary mb-2">Manage Goods</h1>
                            <p className="text-muted-foreground">Regulate prices, watch central stock, and release commodities to dealers</p>
                        </div>

                        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {centralStock.map((stock) => (
                                <Card key={stock._id} className="shadow-sm border-primary/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">{stock.commodityName}</CardTitle>
                                        <CardDescription>Monthly stock for {stock.monthKey}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="text-2xl font-bold text-foreground">
                                            {stock.availableQuantity} {stock.unit}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Remaining from {stock.monthlyQuota} {stock.unit}
                                        </p>
                                        <div className="h-2 rounded-full bg-muted">
                                            <div
                                                className="h-2 rounded-full bg-primary transition-smooth"
                                                style={{
                                                    width: `${stock.monthlyQuota > 0 ? Math.max(0, Math.min(100, (stock.availableQuantity / stock.monthlyQuota) * 100)) : 0}%`,
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Tabs defaultValue="prices" className="w-full">
                            <TabsList className="mb-6">
                                <TabsTrigger value="prices">Manage Prices</TabsTrigger>
                                <TabsTrigger value="allocation">Demand Allocation</TabsTrigger>
                                <TabsTrigger value="stocks">Dealer Releases</TabsTrigger>
                            </TabsList>

                            <TabsContent value="prices">
                                <Card className="shadow-card">
                                    <CardHeader>
                                        <CardTitle>Global Price List</CardTitle>
                                        <CardDescription>All prices are set centrally by the administration</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Commodity</TableHead>
                                                    <TableHead>Unit</TableHead>
                                                    <TableHead>Current Price (₹)</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {products.map((p) => (
                                                    <TableRow key={p._id}>
                                                        <TableCell className="font-medium">{p.name}</TableCell>
                                                        <TableCell>{p.unit}</TableCell>
                                                        <TableCell>
                                                            {editingProduct === p._id ? (
                                                                <Input
                                                                    type="number"
                                                                    value={editValue}
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    className="w-24 h-8"
                                                                />
                                                            ) : (
                                                                `₹${p.price}`
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {editingProduct === p._id ? (
                                                                <div className="flex justify-end gap-2">
                                                                    <Button size="sm" variant="outline" onClick={cancelEditing}>
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button size="sm" onClick={() => savePrice(p._id)} className="bg-india-green hover:bg-india-green/90">
                                                                        <Save className="w-3.5 h-3.5 mr-1" />
                                                                        Save
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button size="sm" variant="ghost" onClick={() => startEditing(p)}>
                                                                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                                                                    Update Price
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="allocation">
                                <Card className="shadow-card">
                                    <CardHeader>
                                        <CardTitle>Demand-Based Dealer Allocation</CardTitle>
                                        <CardDescription>
                                            Commodity demand is calculated from approved citizens assigned to each dealer and grouped by active ration cards.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {demandPlans.map((plan) => (
                                            <div key={plan.vendorId} className="rounded-xl border border-primary/10">
                                                <div className="flex flex-col gap-2 border-b bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-foreground">{plan.shopName}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {plan.dealerName} · {plan.district}, {plan.state}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 text-xs">
                                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                                                            {plan.approvedCitizens} approved citizens
                                                        </span>
                                                        <span className="rounded-full bg-saffron/10 px-3 py-1 text-saffron">
                                                            {plan.activeRationCards} ration cards
                                                        </span>
                                                    </div>
                                                </div>

                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Commodity</TableHead>
                                                            <TableHead>Monthly Demand</TableHead>
                                                            <TableHead>Current Stock</TableHead>
                                                            <TableHead>Pending Release</TableHead>
                                                            <TableHead>Shortfall</TableHead>
                                                            <TableHead className="text-right">Release</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {plan.commodities.map((commodity) => {
                                                            const releaseKey = `${plan.vendorId}:${commodity.commodityKey}`;
                                                            const customValue = releaseInputs[releaseKey] ?? "";

                                                            return (
                                                                <TableRow key={releaseKey}>
                                                                    <TableCell className="font-medium">
                                                                        <div>{commodity.commodityName}</div>
                                                                        <div className="text-xs text-muted-foreground">{commodity.unit}</div>
                                                                    </TableCell>
                                                                    <TableCell>{commodity.monthlyDemand} {commodity.unit}</TableCell>
                                                                    <TableCell>{commodity.currentStock} {commodity.unit}</TableCell>
                                                                    <TableCell>
                                                                        {commodity.pendingRelease > 0 ? `${commodity.pendingRelease} ${commodity.unit}` : "-"}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <span className={commodity.shortfall > 0 ? "font-semibold text-red-600" : "text-india-green"}>
                                                                            {commodity.shortfall} {commodity.unit}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex justify-end gap-2">
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                className="h-8 w-24"
                                                                                placeholder="Qty"
                                                                                value={customValue}
                                                                                onChange={(e) => setReleaseInputs((prev) => ({
                                                                                    ...prev,
                                                                                    [releaseKey]: e.target.value,
                                                                                }))}
                                                                            />
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                disabled={commodity.shortfall <= 0 || !commodity.productId}
                                                                                onClick={() => queueDemandRelease(commodity, plan.vendorId, commodity.shortfall)}
                                                                            >
                                                                                Release Needed
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                className="bg-india-green hover:bg-india-green/90"
                                                                                disabled={!commodity.productId || !customValue || parseFloat(customValue) <= 0}
                                                                                onClick={() => queueDemandRelease(commodity, plan.vendorId, parseFloat(customValue))}
                                                                            >
                                                                                Send
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ))}

                                        {demandPlans.length === 0 && !loading && (
                                            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                                No approved dealer demand plans available yet.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="stocks">
                                <Card className="shadow-card">
                                    <CardHeader>
                                        <CardTitle>Dealer Release Queue</CardTitle>
                                        <CardDescription>Queue stock increments for dealers and wait for dealer confirmation</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Dealer / Shop</TableHead>
                                                    <TableHead>Commodity</TableHead>
                                                    <TableHead>Current Stock</TableHead>
                                                    <TableHead>Pending Release</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Unit</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {inventory.map((inv, idx) => (
                                                    <TableRow key={inv._id || idx}>
                                                        <TableCell className="font-medium">
                                                            <div>{inv.vendor?.shopName || "N/A"}</div>
                                                            <div className="text-xs text-muted-foreground">{inv.vendor?.name}</div>
                                                        </TableCell>
                                                        <TableCell>{inv.product?.name}</TableCell>
                                                        <TableCell className={inv.quantity < 100 ? "text-red-500 font-bold" : ""}>{inv.quantity}</TableCell>
                                                        <TableCell>
                                                            {inv.pendingQuantity ? (
                                                                <span className="font-semibold text-primary">
                                                                    +{inv.pendingQuantity}
                                                                </span>
                                                            ) : editingStock === inv._id ? (
                                                                <Input
                                                                    type="number"
                                                                    value={stockEditValue}
                                                                    onChange={(e) => setStockEditValue(e.target.value)}
                                                                    className="w-24 h-8"
                                                                />
                                                            ) : (
                                                                "-"
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {inv.stockStatus === "FLAGGED" ? (
                                                                <span className="font-semibold text-red-600">Flagged</span>
                                                            ) : inv.stockStatus === "PENDING_APPROVAL" ? (
                                                                <span className="font-semibold text-saffron">Pending Approval</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">Stable</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{inv.product?.unit}</TableCell>
                                                        <TableCell className="text-right">
                                                            {inv.stockStatus === "FLAGGED" ? (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-india-green hover:bg-india-green/90"
                                                                    onClick={() => resolveStockIssue(inv._id)}
                                                                >
                                                                    Issue Resolved
                                                                </Button>
                                                            ) : editingStock === inv._id ? (
                                                                <div className="flex justify-end gap-2">
                                                                    <Button size="sm" variant="outline" onClick={() => setEditingStock(null)}>
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button size="sm" onClick={() => saveStock(inv._id)} className="bg-india-green hover:bg-india-green/90">
                                                                        <Save className="w-3.5 h-3.5 mr-1" />
                                                                        Save
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button size="sm" variant="ghost" onClick={() => {
                                                                    setEditingStock(inv._id);
                                                                    setStockEditValue("");
                                                                }}>
                                                                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                                                                    Queue Release
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {inventory.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8">
                                                            No inventory records found.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ManageGoods;
