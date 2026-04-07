import { useEffect, useMemo, useState } from "react";
import { Home, Users, Store, TrendingUp, Settings, ArrowLeft, Package, IdCard, Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api-client";
import { toast } from "sonner";

type Member = {
    name: string;
    age: number;
    relationshipToHead: string;
    aadhaarNumber: string;
    biometricReference?: string;
};

type RationCardRecord = {
    _id: string;
    user?: {
        name?: string;
        email?: string;
        status?: string;
        district?: string;
        state?: string;
    };
    headOfFamilyName: string;
    rationCardNumber: string;
    aadhaarNumber: string;
    cardType: "AAY" | "BPL" | "APL" | "PHH";
    numberOfFamilyMembers: number;
    district?: string;
    state?: string;
    addressLine?: string;
    members: Member[];
    updatedAt: string;
};

const maskAadhaar = (aadhaar?: string) => {
    if (!aadhaar) return "N/A";
    const compact = aadhaar.replace(/\s+/g, "");
    if (compact.length <= 4) return compact;
    return `XXXXXXXX${compact.slice(-4)}`;
};

const AdminRationCards = () => {
    const navigate = useNavigate();
    const [rationCards, setRationCards] = useState<RationCardRecord[]>([]);
    const [selectedCard, setSelectedCard] = useState<RationCardRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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

    const fetchCards = async () => {
        try {
            const data = await api.get<RationCardRecord[]>("/admin/ration-cards");
            setRationCards(data);
            if (data.length > 0) setSelectedCard(data[0]);
        } catch (error) {
            console.error("Failed to fetch ration cards", error);
            toast.error("Failed to load ration card database");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCards();
    }, []);

    const filteredCards = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return rationCards;
        return rationCards.filter((card) =>
            card.rationCardNumber.toLowerCase().includes(query) ||
            card.headOfFamilyName.toLowerCase().includes(query) ||
            (card.user?.email || "").toLowerCase().includes(query)
        );
    }, [rationCards, search]);

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
                            <h1 className="text-3xl font-bold text-primary mb-2">Ration Card Database</h1>
                            <p className="text-muted-foreground">View all individual ration cards and complete family member mappings.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="shadow-card">
                                <CardHeader>
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <CardTitle>All Ration Cards</CardTitle>
                                            <CardDescription>Total Records: {rationCards.length}</CardDescription>
                                        </div>
                                        <Input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search RC / Head / Email"
                                            className="max-w-[260px]"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>RC Number</TableHead>
                                                <TableHead>Head</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Members</TableHead>
                                                <TableHead>Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredCards.map((card) => (
                                                <TableRow key={card._id}>
                                                    <TableCell className="font-medium">{card.rationCardNumber}</TableCell>
                                                    <TableCell>
                                                        <div>{card.headOfFamilyName}</div>
                                                        <div className="text-xs text-muted-foreground">{card.user?.email || "N/A"}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{card.cardType}</Badge>
                                                    </TableCell>
                                                    <TableCell>{card.numberOfFamilyMembers}</TableCell>
                                                    <TableCell>
                                                        <Button size="sm" variant="outline" onClick={() => setSelectedCard(card)}>
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredCards.length === 0 && !loading && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                        No ration card records found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card className="shadow-card">
                                <CardHeader>
                                    <CardTitle>Individual Ration Card</CardTitle>
                                    <CardDescription>Full card data with mapped family members.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {!selectedCard && (
                                        <p className="text-sm text-muted-foreground">Select a card to view details.</p>
                                    )}

                                    {selectedCard && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p><strong>Head:</strong> {selectedCard.headOfFamilyName}</p>
                                                    <p><strong>RC Number:</strong> {selectedCard.rationCardNumber}</p>
                                                    <p><strong>Card Type:</strong> {selectedCard.cardType}</p>
                                                    <p><strong>Members:</strong> {selectedCard.numberOfFamilyMembers}</p>
                                                </div>
                                                <div>
                                                    <p><strong>Head Aadhaar:</strong> {maskAadhaar(selectedCard.aadhaarNumber)}</p>
                                                    <p><strong>District:</strong> {selectedCard.district || selectedCard.user?.district || "N/A"}</p>
                                                    <p><strong>State:</strong> {selectedCard.state || selectedCard.user?.state || "N/A"}</p>
                                                    <p><strong>Address:</strong> {selectedCard.addressLine || "N/A"}</p>
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto rounded-md border">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/40">
                                                        <tr>
                                                            <th className="text-left p-3">Member</th>
                                                            <th className="text-left p-3">Age</th>
                                                            <th className="text-left p-3">Relationship</th>
                                                            <th className="text-left p-3">Aadhaar</th>
                                                            <th className="text-left p-3">Biometric</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedCard.members.map((member, idx) => (
                                                            <tr key={`${member.aadhaarNumber}-${idx}`} className="border-t">
                                                                <td className="p-3">{member.name}</td>
                                                                <td className="p-3">{member.age}</td>
                                                                <td className="p-3">{member.relationshipToHead}</td>
                                                                <td className="p-3">{maskAadhaar(member.aadhaarNumber)}</td>
                                                                <td className="p-3">{member.biometricReference ? "Mapped" : "Pending"}</td>
                                                            </tr>
                                                        ))}
                                                        {selectedCard.members.length === 0 && (
                                                            <tr>
                                                                <td className="p-3 text-muted-foreground" colSpan={5}>No members mapped.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminRationCards;
