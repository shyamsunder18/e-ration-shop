import { useEffect, useState } from "react";
import { Home, User, FileText, Bell, Download, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatsCard from "@/components/StatsCard";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [rationCard, setRationCard] = useState<RationCardData | null>(null);

  const sidebarItems = [
    { title: "Dashboard", url: "/citizen-dashboard", icon: Home },
    { title: "My Profile", url: "/citizen-dashboard/profile", icon: User },
    { title: "Purchase History", url: "/citizen-dashboard/history", icon: FileText },
    { title: "Notifications", url: "/citizen-dashboard/notifications", icon: Bell }
  ];

  const category = rationCard?.cardType || userData?.cardCategory || "APL";
  const members = rationCard?.numberOfFamilyMembers || userData?.familyMembers || 1;
  const monthlyQuota = rationCard?.monthlyQuota || {
    rice: category === "AAY" || category === "BPL" ? 4 * members : (category === "PHH" ? 5 * members : 0),
    wheat: category === "AAY" || category === "PHH" ? 2 * members : (category === "BPL" ? 1 * members : 0),
    sugar: category === "AAY" || category === "PHH" ? 1 * members : (category === "BPL" ? 0.5 * members : 0),
    kerosene: category === "AAY" || category === "PHH" ? 1 * members : (category === "BPL" ? 0.5 * members : 0),
  };
  const monthlyCollected = rationCard?.monthlyCollected || {
    rice: 0,
    wheat: 0,
    sugar: 0,
    kerosene: 0,
  };

  const rationData = [
    { item: "Rice", quota: monthlyQuota.rice || 0, consumed: monthlyCollected.rice || 0, unit: "kg", isFree: category !== "APL" },
    { item: "Wheat", quota: monthlyQuota.wheat || 0, consumed: monthlyCollected.wheat || 0, unit: "kg", isFree: monthlyQuota.wheat > 0 },
    { item: "Sugar", quota: monthlyQuota.sugar || 0, consumed: monthlyCollected.sugar || 0, unit: "kg", isFree: monthlyQuota.sugar > 0 },
    { item: "Kerosene", quota: monthlyQuota.kerosene || 0, consumed: monthlyCollected.kerosene || 0, unit: "L", isFree: monthlyQuota.kerosene > 0 }
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }

    const fetchMe = async () => {
      try {
        const [user, card] = await Promise.all([
          api.get<any>('/auth/me'),
          api.get<RationCardData>('/ration-card/me')
        ]);
        setUserData(user);
        setRationCard(card);
        localStorage.setItem('user', JSON.stringify(user));
      } catch (error) {
        console.error("Failed to fetch user data", error);
        toast.error("Failed to load ration card details");
      }
    };
    fetchMe();
  }, []);
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
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">Welcome, {userData?.name || "Citizen"}</h1>
                <p className="text-muted-foreground">Ration Card: {rationCard?.rationCardNumber || userData?.rationCardNumber || "Fetching..."}</p>
              </div>
              <div className="text-right">
                <Badge className={
                  category === "AAY" ? "bg-red-600" :
                    ((category === "BPL" || category === "PHH") ? "bg-saffron" : "bg-blue-600")
                }>
                  {category} CARD
                </Badge>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                title="Family Members"
                value={members}
                icon={User}
                description="Registered beneficiaries"
                colorClass="text-primary"
              />
              <StatsCard
                title="Benefit Level"
                value={category === "AAY" ? "MAX" : ((category === "BPL" || category === "PHH") ? "MID" : "NONE")}
                icon={ShieldCheck}
                description={category === "APL" ? "General Class" : `${category} Priority`}
                colorClass="text-india-green"
              />
              <StatsCard
                title="Active Quota"
                value={`${monthlyQuota.rice}kg`}
                icon={Download}
                description="Monthly Rice Entitlement"
                colorClass="text-saffron"
              />
            </div>

            {/* Ration Quota */}
            <Card className="mb-8 shadow-card">
              <CardHeader>
                <CardTitle>Monthly Ration Quota</CardTitle>
                <CardDescription>Based on your {category} category and {members} members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {rationData.map((item, index) => {
                  const percentage = item.quota > 0 ? (item.consumed / item.quota) * 100 : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.item}</span>
                          {item.isFree && <Badge className="bg-india-green text-[10px] h-4">FREE</Badge>}
                          {item.discount && <Badge variant="outline" className="text-red-500 border-red-200 text-[10px] h-4">{item.discount} OFF</Badge>}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {item.consumed} / {item.quota} {item.unit}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Profile Details Moved</CardTitle>
                <CardDescription>
                  Digital ration card, family members, special benefits, and location details are now available under My Profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Open your profile to review family records, biometric mapping status, and full household identity details.
                </p>
                <Badge
                  className="w-fit cursor-pointer bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate("/citizen-dashboard/profile")}
                >
                  Go to My Profile
                </Badge>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CitizenDashboard;
