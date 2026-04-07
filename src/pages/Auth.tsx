import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Store, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import api from "@/lib/api-client";

type RegistryMember = {
  name: string;
  age: number;
  relationshipToHead: string;
  aadhaarNumber: string;
};

type RegistryPreview = {
  rationCardNumber: string;
  headOfFamilyName: string;
  cardType: "AAY" | "BPL" | "APL" | "PHH";
  district: string;
  state: string;
  numberOfFamilyMembers: number;
  members: RegistryMember[];
};

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const userType = searchParams.get("type") || "citizen";
  const [activeTab, setActiveTab] = useState<"citizen" | "dealer" | "admin">(userType as any);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    aadhaar: "",
    rationCardNumber: "",
    state: "",
    district: "",
    familyMembers: "1",
    relationshipToHead: "",
    shopName: "",
    licenseNumber: "",
  });
  const [registryPreview, setRegistryPreview] = useState<RegistryPreview | null>(null);
  const [checkingRegistry, setCheckingRegistry] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tabToBackendRole: Record<"citizen" | "dealer" | "admin", "USER" | "VENDOR" | "ADMIN"> = {
    citizen: "USER",
    dealer: "VENDOR",
    admin: "ADMIN",
  };

  const loadRegistry = async () => {
    const rc = formData.rationCardNumber.trim();
    if (!rc) {
      toast.error("Enter ration card number first");
      return;
    }

    setCheckingRegistry(true);
    try {
      const data = await api.get<RegistryPreview>(`/auth/ration-registry/${encodeURIComponent(rc)}`);
      setRegistryPreview(data);
      setFormData((prev) => ({
        ...prev,
        state: data.state,
        district: data.district,
        familyMembers: String(data.numberOfFamilyMembers),
      }));
      toast.success("Ration card found. Family details loaded.");
    } catch (error: any) {
      setRegistryPreview(null);
      toast.error(error.message || "Ration card not found");
    } finally {
      setCheckingRegistry(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setSubmitting(true);
      if (mode === "register") {
        // Password confirmation check
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        if (activeTab === "citizen") {
          if (!registryPreview || registryPreview.rationCardNumber !== formData.rationCardNumber.trim()) {
            toast.error("Please verify ration card and load family details first");
            return;
          }

          const aadhaar = formData.aadhaar.trim();
          const member = registryPreview.members.find((m) => m.aadhaarNumber === aadhaar);

          if (!member) {
            toast.error("Aadhaar does not match any member in this ration card");
            return;
          }

          if (formData.name.trim().toLowerCase() !== member.name.toLowerCase()) {
            toast.error("Name must match registry record for this Aadhaar");
            return;
          }

          if (formData.relationshipToHead.trim().toLowerCase() !== member.relationshipToHead.toLowerCase()) {
            toast.error("Relationship must match registry record");
            return;
          }
        }

        // Map frontend role to backend role
        // 'citizen' -> 'USER', 'dealer' -> 'VENDOR', 'admin' -> 'ADMIN' (though admin register usually restricted)
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: tabToBackendRole[activeTab],
          state: formData.state,
          district: formData.district,
          // Add other fields if needed for specific roles
          ...(activeTab === "citizen" && {
            aadhaar: formData.aadhaar,
            rationCardNumber: formData.rationCardNumber,
            familyMembers: parseInt(formData.familyMembers) || 1,
            relationshipToHead: formData.relationshipToHead
          }),
          ...(activeTab === "dealer" && {
            shopName: formData.shopName,
            licenseNumber: formData.licenseNumber
          }),
        };

        const response = await api.post<any>('/auth/register', payload);

        if (activeTab === "dealer" || activeTab === "citizen") {
          toast.success("Registration submitted! Please wait for admin verification.");
          setMode("login");
          return;
        }

        toast.success(`Registered successfully as ${activeTab}`);

        // If successful register auto-logs in (for admins if allowed), we store and navigate
        if (response && response._id) {
          localStorage.setItem('user', JSON.stringify(response));
        }

      } else {
        // Login
        const response = await api.post<any>('/auth/login', {
          email: formData.email,
          password: formData.password
        });

        if (response?.role !== tabToBackendRole[activeTab]) {
          await api.post('/auth/logout', {});
          localStorage.removeItem('user');
          toast.error("Invalid email or password");
          return;
        }

        toast.success(`Logged in successfully`);
        localStorage.setItem('user', JSON.stringify(response));
      }

      // Navigate to appropriate dashboard
      const routes = {
        citizen: "/citizen-dashboard",
        dealer: "/dealer-dashboard",
        admin: "/admin-dashboard"
      };

      navigate(routes[activeTab]);

    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
      console.error("Auth error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const userTypes = [
    { value: "citizen", label: t.auth.citizen, icon: Users, color: "saffron" },
    { value: "dealer", label: t.auth.dealer, icon: Store, color: "primary" },
    { value: "admin", label: t.auth.admin, icon: ShieldCheck, color: "india-green" }
  ];

  return (
    <div className="min-h-screen gradient-header flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <Link to="/" className="inline-flex items-center text-white mb-6 hover:text-white/80 transition-smooth">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.auth.backHome}
        </Link>

        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-saffron rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">अ</span>
            </div>
            <CardTitle className="text-2xl">{t.auth.title}</CardTitle>
            <CardDescription>{t.auth.government}</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => {
              const nextTab = v as any;
              setActiveTab(nextTab);
              if (nextTab === "admin") {
                setMode("login");
              }
            }} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                {userTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <TabsTrigger key={type.value} value={type.value} className="text-xs">
                      <Icon className="w-4 h-4 mr-1" />
                      {type.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>



            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.auth.fullName}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t.auth.enterName}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="Enter State"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        placeholder="Enter District"
                        required
                      />
                    </div>
                  </div>
                  {activeTab === "citizen" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="aadhaar">{t.auth.aadhaar}</Label>
                        <Input
                          id="aadhaar"
                          value={formData.aadhaar}
                          onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                          placeholder={t.auth.aadhaarPlaceholder}
                          maxLength={14}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rationCardNumber">Ration Card ID</Label>
                        <div className="flex gap-2">
                          <Input
                            id="rationCardNumber"
                            value={formData.rationCardNumber}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase();
                              setFormData({ ...formData, rationCardNumber: value });
                              setRegistryPreview(null);
                            }}
                            placeholder="Enter Ration Card Number"
                            required
                          />
                          <Button type="button" variant="outline" onClick={loadRegistry} disabled={checkingRegistry}>
                            {checkingRegistry ? "Checking..." : "Verify"}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relationshipToHead">Relationship to Head</Label>
                        <Input
                          id="relationshipToHead"
                          value={formData.relationshipToHead}
                          onChange={(e) => setFormData({ ...formData, relationshipToHead: e.target.value })}
                          placeholder="Head / Spouse / Son / Daughter..."
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="familyMembers">Number of Family Members</Label>
                        <Input
                          id="familyMembers"
                          type="number"
                          min="1"
                          value={formData.familyMembers}
                          onChange={(e) => setFormData({ ...formData, familyMembers: e.target.value })}
                          placeholder="e.g. 4"
                          required
                          readOnly={!!registryPreview}
                        />
                      </div>
                      {registryPreview && (
                        <div className="rounded-md border p-3 bg-muted/20">
                          <p className="text-xs font-semibold mb-2">
                            Registry Matched: {registryPreview.headOfFamilyName} ({registryPreview.cardType})
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {registryPreview.district}, {registryPreview.state} • {registryPreview.numberOfFamilyMembers} members
                          </p>
                          <div className="max-h-32 overflow-auto rounded border bg-background">
                            <table className="w-full text-xs">
                              <thead className="bg-muted/30">
                                <tr>
                                  <th className="text-left p-2">Name</th>
                                  <th className="text-left p-2">Relation</th>
                                  <th className="text-left p-2">Aadhaar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {registryPreview.members.map((member) => (
                                  <tr key={member.aadhaarNumber} className="border-t">
                                    <td className="p-2">{member.name}</td>
                                    <td className="p-2">{member.relationshipToHead}</td>
                                    <td className="p-2">XXXXXX{member.aadhaarNumber.slice(-4)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {activeTab === "dealer" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="shopName">Shop Name</Label>
                        <Input
                          id="shopName"
                          value={formData.shopName}
                          onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                          placeholder="Enter authorized shop name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                          id="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                          placeholder="Enter valid license number"
                          required
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t.auth.enterEmail}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t.auth.enterPassword}
                  required
                />
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder={t.auth.confirmPassword}
                    required
                  />
                </div>
              )}

              {mode === "login" && (
                <div className="text-right">
                  <Button variant="link" className="text-xs p-0 h-auto" type="button">
                    {t.auth.forgotPassword}
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full bg-primary" disabled={submitting}>
                {submitting ? "Please wait..." : mode === "login" ? t.auth.login : t.auth.register}
              </Button>

              {activeTab !== "admin" && (
                <div className="text-center text-sm mt-4">
                  {mode === "login" ? (
                    <p>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("register")}
                        className="text-primary font-semibold hover:underline"
                      >
                        {t.auth.register}
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-primary font-semibold hover:underline"
                      >
                        {t.auth.login}
                      </button>
                    </p>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-white/80 text-xs mt-6">
          {t.auth.terms}
        </p>
      </div>
    </div>
  );
};

export default Auth;
