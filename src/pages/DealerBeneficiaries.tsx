import { useEffect, useMemo, useState } from "react";
import { Home, Package, Users, FileText, ArrowLeft, Search, Bell, Send, CheckSquare } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api-client";
import { toast } from "sonner";

const DealerBeneficiaries = () => {
    const navigate = useNavigate();
    const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCitizen, setSelectedCitizen] = useState<any | null>(null);
    const [slot, setSlot] = useState("");
    const [personalMessage, setPersonalMessage] = useState("");
    const [sendingPersonal, setSendingPersonal] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [distributionCitizen, setDistributionCitizen] = useState<any | null>(null);
    const [verificationMethod, setVerificationMethod] = useState("AADHAAR");
    const [verificationReference, setVerificationReference] = useState("");
    const [verificationAadhaar, setVerificationAadhaar] = useState("");
    const [collectionCode, setCollectionCode] = useState("");
    const [distributionSlot, setDistributionSlot] = useState("");
    const [distributionQuantities, setDistributionQuantities] = useState<Record<string, string>>({});
    const [submittingDistribution, setSubmittingDistribution] = useState(false);

    const sidebarItems = [
        { title: "Dashboard", url: "/dealer-dashboard", icon: Home },
        { title: "Inventory", url: "/dealer-dashboard/inventory", icon: Package },
        { title: "Beneficiaries", url: "/dealer-dashboard/beneficiaries", icon: Users },
        { title: "Notifications", url: "/dealer-dashboard/notifications", icon: Bell },
        { title: "Distribution Logs", url: "/dealer-dashboard/logs", icon: FileText }
    ];

    useEffect(() => {
        const fetchBeneficiaries = async () => {
            try {
                const currentUser = await api.get<any>('/auth/me');
                if (currentUser?.role !== 'VENDOR') {
                    await api.post('/auth/logout', {});
                    localStorage.removeItem('user');
                    toast.error("Please log in with a dealer account");
                    navigate('/auth?type=dealer');
                    return;
                }

                const [response, productResponse] = await Promise.all([
                    api.get<{ success: boolean; data: any[] }>('/vendor/beneficiaries'),
                    api.get<any[]>('/products'),
                ]);
                // Response might be direct array or { success, data } based on api-client handling
                // Our api-client returns responseData.data || responseData
                const data = (response as any).data || response;
                setBeneficiaries(Array.isArray(data) ? data : []);
                setProducts(Array.isArray(productResponse) ? productResponse : []);
            } catch (error: any) {
                console.error("Failed to fetch beneficiaries", error);
                if (error?.status === 401 || error?.status === 403) {
                    localStorage.removeItem('user');
                    toast.error("Please log in with a dealer account");
                    navigate('/auth?type=dealer');
                    return;
                }
                toast.error("Failed to load your assigned citizens");
            } finally {
                setLoading(false);
            }
        };

        fetchBeneficiaries();
    }, [navigate]);

    const filteredBeneficiaries = beneficiaries.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.rationCardNumber && b.rationCardNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout', {});
            localStorage.removeItem('user');
            navigate("/auth");
        } catch (e) {
            navigate("/auth");
        }
    };

    const handleSendPersonalNotification = async () => {
        if (!selectedCitizen) return;

        setSendingPersonal(true);
        try {
            await api.post(`/vendor/notify-citizen/${selectedCitizen._id}`, {
                slot,
                message: personalMessage,
            });
            toast.success(`Personal notification sent to ${selectedCitizen.name}`);
            setSelectedCitizen(null);
            setSlot("");
            setPersonalMessage("");
        } catch (error: any) {
            toast.error(error.message || "Failed to send personal notification");
        } finally {
            setSendingPersonal(false);
        }
    };

    const productOptions = useMemo(() => {
        return products.filter((product) => ["rice", "wheat", "sugar", "kerosene"].some((keyword) => product.name?.toLowerCase().includes(keyword)));
    }, [products]);

    const handleRecordCollection = async () => {
        if (!distributionCitizen) return;

        const items = productOptions
            .map((product) => ({
                productId: product._id,
                quantity: Number(distributionQuantities[product._id] || 0),
            }))
            .filter((item) => item.quantity > 0);

        if (!verificationAadhaar) {
            toast.error("Verified Aadhaar is required");
            return;
        }

        if (items.length === 0) {
            toast.error("Enter at least one commodity quantity");
            return;
        }

        setSubmittingDistribution(true);
        try {
            await api.post('/distributions/collect', {
                userId: distributionCitizen._id,
                aadhaarNumber: verificationAadhaar,
                verificationMethod,
                verificationReference: verificationReference || undefined,
                collectionCode,
                slot: distributionSlot || undefined,
                items,
            });
            toast.success("Verified ration collection recorded");
            setDistributionCitizen(null);
            setVerificationAadhaar("");
            setVerificationReference("");
            setCollectionCode("");
            setDistributionSlot("");
            setDistributionQuantities({});
        } catch (error: any) {
            if (error?.status === 401 || error?.status === 403) {
                await api.post('/auth/logout', {}).catch(() => undefined);
                localStorage.removeItem('user');
                toast.error("Dealer session expired or incorrect. Please log in again.");
                navigate('/auth?type=dealer');
                return;
            }
            toast.error(error.message || "Failed to record ration collection");
        } finally {
            setSubmittingDistribution(false);
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
                            <Link to="/dealer-dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-primary mb-2">My Beneficiaries</h1>
                            <p className="text-muted-foreground">Citizens assigned to your ration shop</p>
                        </div>

                        <div className="mb-6 flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    className="pl-10"
                                    placeholder="Search by name or Ration Card ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle>Assigned Citizens</CardTitle>
                                <CardDescription>Total Managed: {filteredBeneficiaries.length}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Citizen Name</TableHead>
                                            <TableHead>Ration Card ID</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Members</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBeneficiaries.map((citizen) => (
                                            <TableRow key={citizen._id}>
                                                <TableCell className="font-medium">{citizen.name}</TableCell>
                                                <TableCell>{citizen.rationCardNumber || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        citizen.cardCategory === 'AAY' ? "bg-red-600" :
                                                            (citizen.cardCategory === 'BPL' ? "bg-saffron" : "bg-blue-600")
                                                    }>
                                                        {citizen.cardCategory || 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{citizen.familyMembers || 1}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-india-green border-india-green/30 px-2 py-0 h-5">Verified</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Dialog
                                                            open={distributionCitizen?._id === citizen._id}
                                                            onOpenChange={(open) => {
                                                                if (!open) {
                                                                    setDistributionCitizen(null);
                                                                    setVerificationAadhaar("");
                                                                    setVerificationReference("");
                                                                    setCollectionCode("");
                                                                    setDistributionSlot("");
                                                                    setDistributionQuantities({});
                                                                } else {
                                                                    setDistributionCitizen(citizen);
                                                                }
                                                            }}
                                                        >
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-8">
                                                                    <CheckSquare className="w-3.5 h-3.5 mr-1" />
                                                                    Record Collection
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-2xl">
                                                                <DialogHeader>
                                                                    <DialogTitle>Verified Ration Collection</DialogTitle>
                                                                    <DialogDescription>
                                                                        Record the actual handover for {citizen.name}. This deducts dealer stock and becomes visible to admin audit.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                    <div className="space-y-2">
                                                                        <Label>Verified Aadhaar</Label>
                                                                        <Input value={verificationAadhaar} onChange={(e) => setVerificationAadhaar(e.target.value)} placeholder="Enter collecting member Aadhaar" />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Admin Collection Code</Label>
                                                                        <Input value={collectionCode} onChange={(e) => setCollectionCode(e.target.value)} placeholder="Enter code shared by citizen" />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Verification Method</Label>
                                                                        <Select value={verificationMethod} onValueChange={setVerificationMethod}>
                                                                            <SelectTrigger>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="AADHAAR">AADHAAR</SelectItem>
                                                                                <SelectItem value="BIOMETRIC">BIOMETRIC</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Biometric Reference</Label>
                                                                        <Input value={verificationReference} onChange={(e) => setVerificationReference(e.target.value)} placeholder="Required for biometric verification" />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Collection Slot</Label>
                                                                        <Input value={distributionSlot} onChange={(e) => setDistributionSlot(e.target.value)} placeholder="Optional collection slot" />
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                                    {productOptions.map((product) => (
                                                                        <div key={product._id} className="space-y-2 rounded-lg border p-3">
                                                                            <Label>{product.name} ({product.unit})</Label>
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                step="0.1"
                                                                                value={distributionQuantities[product._id] || ""}
                                                                                onChange={(e) => setDistributionQuantities((prev) => ({ ...prev, [product._id]: e.target.value }))}
                                                                                placeholder={`Enter ${product.unit}`}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button variant="outline" onClick={() => setDistributionCitizen(null)}>Cancel</Button>
                                                                    <Button onClick={handleRecordCollection} disabled={submittingDistribution}>
                                                                        {submittingDistribution ? "Recording..." : "Record Verified Collection"}
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>

                                                        <Dialog
                                                            open={selectedCitizen?._id === citizen._id}
                                                            onOpenChange={(open) => {
                                                                if (!open) {
                                                                    setSelectedCitizen(null);
                                                                    setSlot("");
                                                                    setPersonalMessage("");
                                                                } else {
                                                                    setSelectedCitizen(citizen);
                                                                }
                                                            }}
                                                        >
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8">
                                                                    <Send className="w-3.5 h-3.5 mr-1" />
                                                                    Personal Notify
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Personal Slot Notification</DialogTitle>
                                                                    <DialogDescription>
                                                                        Send a personal message or collection slot to {citizen.name}.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-2">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="slot">Collection Slot</Label>
                                                                        <Input
                                                                            id="slot"
                                                                            placeholder="Example: 10:00 AM - 10:30 AM, Monday"
                                                                            value={slot}
                                                                            onChange={(e) => setSlot(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="personal-message">Personal Message</Label>
                                                                        <Textarea
                                                                            id="personal-message"
                                                                            placeholder="Write a custom personal notification or leave blank for the default slot message..."
                                                                            value={personalMessage}
                                                                            onChange={(e) => setPersonalMessage(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button variant="outline" onClick={() => setSelectedCitizen(null)}>Cancel</Button>
                                                                    <Button onClick={handleSendPersonalNotification} disabled={sendingPersonal}>
                                                                        {sendingPersonal ? "Sending..." : "Send Personal Notification"}
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredBeneficiaries.length === 0 && !loading && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No citizens found.
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

export default DealerBeneficiaries;
