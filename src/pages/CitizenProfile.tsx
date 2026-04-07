import { useEffect, useState } from "react";
import { Home, User, FileText, Bell, ArrowLeft, MapPin, ShieldCheck, IdCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import api from "@/lib/api-client";
import { toast } from "sonner";

type FamilyMember = {
  name: string;
  age: number;
  relationshipToHead: string;
  aadhaarNumber: string;
  biometricReference?: string;
  fingerprintTemplate?: string;
};

type RationCardData = {
  headOfFamilyName: string;
  rationCardNumber: string;
  aadhaarNumber: string;
  cardType: "AAY" | "BPL" | "APL" | "PHH";
  numberOfFamilyMembers: number;
  addressLine?: string;
  district?: string;
  state?: string;
  familyPhotoUrl?: string;
  biometricReference?: string;
  fingerprintTemplate?: string;
  members: FamilyMember[];
  monthlyQuota?: {
    rice: number;
    wheat: number;
    sugar: number;
    kerosene: number;
  };
  monthlyCollected?: {
    rice: number;
    wheat: number;
    sugar: number;
    kerosene: number;
  };
};

const CitizenProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [rationCard, setRationCard] = useState<RationCardData | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    age: "",
    relationshipToHead: "",
    aadhaarNumber: "",
    biometricReference: ""
  });
  const [savingMember, setSavingMember] = useState(false);

  const sidebarItems = [
    { title: "Dashboard", url: "/citizen-dashboard", icon: Home },
    { title: "My Profile", url: "/citizen-dashboard/profile", icon: User },
    { title: "Purchase History", url: "/citizen-dashboard/history", icon: FileText },
    { title: "Notifications", url: "/citizen-dashboard/notifications", icon: Bell }
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }

    const fetchProfile = async () => {
      try {
        const [user, card] = await Promise.all([
          api.get<any>("/auth/me"),
          api.get<RationCardData>("/ration-card/me")
        ]);
        setUserData(user);
        setRationCard(card);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (error) {
        console.error("Failed to load profile", error);
        toast.error("Failed to load profile details");
      }
    };

    fetchProfile();
  }, []);

  const category = rationCard?.cardType || userData?.cardCategory || "APL";
  const members = rationCard?.numberOfFamilyMembers || userData?.familyMembers || 1;
  const monthlyQuota = rationCard?.monthlyQuota || {
    rice: category === "AAY" || category === "BPL" ? 4 * members : (category === "PHH" ? 5 * members : 0),
    wheat: category === "AAY" || category === "PHH" ? 2 * members : (category === "BPL" ? 1 * members : 0),
    sugar: category === "AAY" || category === "PHH" ? 1 * members : (category === "BPL" ? 0.5 * members : 0),
    kerosene: category === "AAY" || category === "PHH" ? 1 * members : (category === "BPL" ? 0.5 * members : 0),
  };
  const benefitSummary = category === "AAY"
    ? `${monthlyQuota.rice}kg rice, ${monthlyQuota.sugar}kg sugar, ${monthlyQuota.wheat}kg wheat, and ${monthlyQuota.kerosene}L kerosene free every month.`
    : category === "BPL"
      ? `${monthlyQuota.rice}kg rice, ${monthlyQuota.sugar}kg sugar, ${monthlyQuota.wheat}kg wheat, and ${monthlyQuota.kerosene}L kerosene free every month.`
      : category === "PHH"
        ? `${monthlyQuota.rice}kg rice, ${monthlyQuota.sugar}kg sugar, ${monthlyQuota.wheat}kg wheat, and ${monthlyQuota.kerosene}L kerosene free every month.`
        : "No free monthly commodity quota under the current APL rules.";

  const maskAadhaar = (aadhaar: string) => {
    if (!aadhaar) return "N/A";
    const compact = aadhaar.replace(/\s+/g, "");
    if (compact.length <= 4) return compact;
    return `XXXXXXXX${compact.slice(-4)}`;
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {});
      localStorage.removeItem("user");
      navigate("/auth");
    } catch {
      navigate("/auth");
    }
  };

  const handleAddFamilyMember = async () => {
    if (!memberForm.name || !memberForm.relationshipToHead || !memberForm.aadhaarNumber) {
      toast.error("Name, relationship, and Aadhaar are required");
      return;
    }

    const age = Number(memberForm.age || 0);
    if (Number.isNaN(age) || age < 0) {
      toast.error("Please enter a valid age");
      return;
    }

    const existingMembers = rationCard?.members || [];
    const nextMembers = [
      ...existingMembers,
      {
        name: memberForm.name.trim(),
        age,
        relationshipToHead: memberForm.relationshipToHead.trim(),
        aadhaarNumber: memberForm.aadhaarNumber.trim(),
        biometricReference: memberForm.biometricReference.trim() || undefined
      }
    ];

    setSavingMember(true);
    try {
      const updated = await api.put<RationCardData>("/ration-card/me", {
        headOfFamilyName: rationCard?.headOfFamilyName || userData?.name,
        rationCardNumber: rationCard?.rationCardNumber || userData?.rationCardNumber,
        aadhaarNumber: rationCard?.aadhaarNumber || userData?.aadhaar,
        cardType: rationCard?.cardType || userData?.cardCategory || "APL",
        addressLine: rationCard?.addressLine || userData?.address,
        district: rationCard?.district || userData?.district,
        state: rationCard?.state || userData?.state,
        members: nextMembers,
        numberOfFamilyMembers: nextMembers.length
      });
      setRationCard(updated);
      setMemberForm({
        name: "",
        age: "",
        relationshipToHead: "",
        aadhaarNumber: "",
        biometricReference: ""
      });
      toast.success("Family member added to ration card");
    } catch (error: any) {
      toast.error(error.message || "Failed to add family member");
    } finally {
      setSavingMember(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1">
        <DashboardSidebar items={sidebarItems} onLogout={handleLogout} />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mx-auto max-w-6xl">
            <Link to="/citizen-dashboard" className="mb-4 inline-flex items-center text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-primary">My Profile</h1>
                <p className="text-muted-foreground">
                  Household ration identity, family records, benefits, and location details
                </p>
              </div>
              <Badge className={
                category === "AAY" ? "bg-red-600" :
                (category === "BPL" || category === "PHH") ? "bg-saffron" : "bg-blue-600"
              }>
                {category} CARD
              </Badge>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="shadow-sm border-primary/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Digital Ration Card</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{rationCard?.rationCardNumber || userData?.rationCardNumber || "N/A"}</p>
                  <p>Head of family: {rationCard?.headOfFamilyName || userData?.name || "N/A"}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-saffron/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Special Benefits</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{category} category</p>
                  <p>{benefitSummary}</p>
                  <div className="mt-3 space-y-1 text-xs">
                    <p><strong>Rice:</strong> {monthlyQuota.rice} kg</p>
                    <p><strong>Wheat:</strong> {monthlyQuota.wheat} kg</p>
                    <p><strong>Sugar:</strong> {monthlyQuota.sugar} kg</p>
                    <p><strong>Kerosene:</strong> {monthlyQuota.kerosene} L</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-india-green/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Location Details</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{rationCard?.district || userData?.district || "N/A"}</p>
                  <p>{rationCard?.state || userData?.state || "N/A"}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 shadow-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IdCard className="h-5 w-5" />
                    Digital Family Ration Card
                  </CardTitle>
                  <CardDescription>
                    Family identity mapped to one ration card so any registered household member can collect ration.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-1">
                      <p><strong>Head of Family:</strong> {rationCard?.headOfFamilyName || userData?.name || "N/A"}</p>
                      <p><strong>RC Number:</strong> {rationCard?.rationCardNumber || userData?.rationCardNumber || "N/A"}</p>
                      <p><strong>Card Type:</strong> {category}</p>
                      <p><strong>Total Members:</strong> {members}</p>
                    </div>
                    <div className="space-y-1">
                      <p><strong>Head Aadhaar:</strong> {maskAadhaar(rationCard?.aadhaarNumber || userData?.aadhaar || "")}</p>
                      <p><strong>Address:</strong> {rationCard?.addressLine || userData?.address || "N/A"}</p>
                      <p><strong>District:</strong> {rationCard?.district || userData?.district || "N/A"}</p>
                      <p><strong>State:</strong> {rationCard?.state || userData?.state || "N/A"}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="p-3 text-left">Member Name</th>
                          <th className="p-3 text-left">Age</th>
                          <th className="p-3 text-left">Relationship</th>
                          <th className="p-3 text-left">Aadhaar</th>
                          <th className="p-3 text-left">Biometric Mapping</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rationCard?.members || []).map((member, index) => (
                          <tr key={`${member.aadhaarNumber}-${index}`} className="border-t">
                            <td className="p-3">{member.name}</td>
                            <td className="p-3">{member.age}</td>
                            <td className="p-3">{member.relationshipToHead}</td>
                            <td className="p-3">{maskAadhaar(member.aadhaarNumber)}</td>
                            <td className="p-3">
                              {member.biometricReference || member.fingerprintTemplate ? "Available" : "Pending capture"}
                            </td>
                          </tr>
                        ))}
                        {(!rationCard?.members || rationCard.members.length === 0) && (
                          <tr>
                            <td className="p-3 text-muted-foreground" colSpan={5}>
                              No family members mapped yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-4 text-xs text-muted-foreground">
                    Any mapped household member can be identified and allowed to collect ration for this card.
                  </p>

                  <div className="mt-6 border-t pt-4">
                    <h3 className="mb-3 font-semibold">Add Family Member</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                      <Input
                        placeholder="Full Name"
                        value={memberForm.name}
                        onChange={(e) => setMemberForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        type="number"
                        min="0"
                        placeholder="Age"
                        value={memberForm.age}
                        onChange={(e) => setMemberForm((prev) => ({ ...prev, age: e.target.value }))}
                      />
                      <Input
                        placeholder="Relationship"
                        value={memberForm.relationshipToHead}
                        onChange={(e) => setMemberForm((prev) => ({ ...prev, relationshipToHead: e.target.value }))}
                      />
                      <Input
                        placeholder="Aadhaar Number"
                        value={memberForm.aadhaarNumber}
                        onChange={(e) => setMemberForm((prev) => ({ ...prev, aadhaarNumber: e.target.value }))}
                      />
                      <Input
                        placeholder="Biometric Ref (optional)"
                        value={memberForm.biometricReference}
                        onChange={(e) => setMemberForm((prev) => ({ ...prev, biometricReference: e.target.value }))}
                      />
                    </div>
                    <div className="mt-3">
                      <Button onClick={handleAddFamilyMember} disabled={savingMember}>
                        {savingMember ? "Saving..." : "Add Member"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="shadow-sm border-saffron/20 border-t-4 border-t-saffron">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ShieldCheck className="h-5 w-5" />
                      Special Benefits
                    </CardTitle>
                  </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    {benefitSummary}
                </CardContent>
              </Card>

                <Card className="shadow-sm border-india-green/20 border-t-4 border-t-india-green">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5" />
                      Location Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Address:</strong> {rationCard?.addressLine || userData?.address || "N/A"}</p>
                    <p><strong>District:</strong> {rationCard?.district || userData?.district || "N/A"}</p>
                    <p><strong>State:</strong> {rationCard?.state || userData?.state || "N/A"}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CitizenProfile;
