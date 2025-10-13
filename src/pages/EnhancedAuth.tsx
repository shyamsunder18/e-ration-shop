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
import usersData from "@/data/users.json";

const EnhancedAuth = () => {
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
    rationCardNo: "",
    address: "",
    district: "",
    state: "",
    familyMembers: "",
    pan: "",
    fpsLicense: "",
    shopAddress: "",
    department: "",
    employeeId: "",
    officeLocation: "",
    contactNo: "",
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateAadhaar = (aadhaar: string) => {
    return /^\d{12}$/.test(aadhaar);
  };

  const validatePAN = (pan: string) => {
    return /^[A-Z]{5}\d{4}[A-Z]{1}$/.test(pan);
  };

  const validatePassword = (password: string, isAdmin: boolean) => {
    if (isAdmin) {
      // Strong password: 8+ chars, 1 uppercase, 1 number, 1 symbol
      return password.length >= 8 &&
             /[A-Z]/.test(password) &&
             /\d/.test(password) &&
             /[!@#$%^&*(),.?":{}|<>]/.test(password);
    }
    return password.length >= 6;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Admin email validation
    if (activeTab === "admin" && !formData.email.includes("@gov.in")) {
      toast.error("Admin email must end with @gov.in");
      return;
    }

    if (mode === "register") {
      // Password validation
      if (!validatePassword(formData.password, activeTab === "admin")) {
        if (activeTab === "admin") {
          toast.error("Password must be 8+ characters with uppercase, number, and symbol");
        } else {
          toast.error("Password must be at least 6 characters");
        }
        return;
      }

      // Password confirmation check
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      // Aadhaar validation
      if ((activeTab === "citizen" || activeTab === "dealer") && !validateAadhaar(formData.aadhaar)) {
        toast.error("Aadhaar must be exactly 12 digits");
        return;
      }

      // PAN validation for dealers
      if (activeTab === "dealer" && !validatePAN(formData.pan)) {
        toast.error("Invalid PAN format (e.g., ABCDE1234F)");
        return;
      }

      toast.success(`Registration submitted successfully! Pending admin approval.`);
      setTimeout(() => navigate("/"), 1500);
    } else {
      // Login - check against demo users
      let userFound = false;
      let userRole = "";

      if (activeTab === "citizen") {
        const user = [...usersData.citizens, ...(usersData.pending || []).filter((u: any) => u.role === "citizen")].find(
          (u: any) => u.email === formData.email && u.password === formData.password
        );
        if (user) {
          if ((user as any).status === "pending") {
            toast.error("Your registration is pending admin approval");
            return;
          }
          userFound = true;
          userRole = "citizen";
        }
      } else if (activeTab === "dealer") {
        const user = [...usersData.dealers, ...(usersData.pending || []).filter((u: any) => u.role === "dealer")].find(
          (u: any) => u.email === formData.email && u.password === formData.password
        );
        if (user) {
          if ((user as any).status === "pending") {
            toast.error("Your registration is pending admin approval");
            return;
          }
          userFound = true;
          userRole = "dealer";
        }
      } else if (activeTab === "admin") {
        const user = usersData.admins.find(
          (u: any) => u.email === formData.email && u.password === formData.password
        );
        if (user) {
          userFound = true;
          userRole = "admin";
        }
      }

      if (!userFound) {
        toast.error("Invalid email or password");
        return;
      }

      toast.success(`Logged in successfully`);
      
      const routes = {
        citizen: "/citizen-dashboard",
        dealer: "/dealer-dashboard",
        admin: "/admin-dashboard"
      };
      navigate(routes[activeTab]);
    }
  };

  const userTypes = [
    { value: "citizen", label: t.auth.citizen, icon: Users },
    { value: "dealer", label: t.auth.dealer, icon: Store },
    { value: "admin", label: t.auth.admin, icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen gradient-header flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />
      </div>

      <div className="w-full max-w-2xl relative z-10 animate-scale-in">
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
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
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

            <div className="mb-6 flex gap-2">
              <Button
                variant={mode === "login" ? "default" : "outline"}
                onClick={() => setMode("login")}
                className="flex-1"
              >
                {t.auth.login}
              </Button>
              <Button
                variant={mode === "register" ? "default" : "outline"}
                onClick={() => setMode("register")}
                className="flex-1"
              >
                {t.auth.register}
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
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

                  {/* Citizen specific fields */}
                  {activeTab === "citizen" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="aadhaar">{t.auth.aadhaar}</Label>
                        <Input 
                          id="aadhaar" 
                          value={formData.aadhaar}
                          onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                          placeholder={t.auth.aadhaarPlaceholder} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rationCardNo">{t.auth.rationCardNo}</Label>
                        <Input 
                          id="rationCardNo" 
                          value={formData.rationCardNo}
                          onChange={(e) => setFormData({ ...formData, rationCardNo: e.target.value })}
                          placeholder={t.auth.rationCardPlaceholder} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">{t.auth.address}</Label>
                        <Input 
                          id="address" 
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder={t.auth.enterAddress} 
                          required 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="district">{t.auth.district}</Label>
                          <Input 
                            id="district" 
                            value={formData.district}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            placeholder={t.auth.enterDistrict} 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">{t.auth.state}</Label>
                          <Input 
                            id="state" 
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder={t.auth.enterState} 
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="familyMembers">{t.auth.familyMembers}</Label>
                        <Input 
                          id="familyMembers" 
                          type="number"
                          value={formData.familyMembers}
                          onChange={(e) => setFormData({ ...formData, familyMembers: e.target.value })}
                          placeholder="4" 
                          min="1"
                          required 
                        />
                      </div>
                    </>
                  )}

                  {/* Dealer specific fields */}
                  {activeTab === "dealer" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="aadhaar">{t.auth.aadhaar}</Label>
                        <Input 
                          id="aadhaar" 
                          value={formData.aadhaar}
                          onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                          placeholder={t.auth.aadhaarPlaceholder} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pan">{t.auth.pan}</Label>
                        <Input 
                          id="pan" 
                          value={formData.pan}
                          onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase().slice(0, 10) })}
                          placeholder={t.auth.panPlaceholder} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fpsLicense">{t.auth.fpsLicense}</Label>
                        <Input 
                          id="fpsLicense" 
                          value={formData.fpsLicense}
                          onChange={(e) => setFormData({ ...formData, fpsLicense: e.target.value })}
                          placeholder={t.auth.fpsLicensePlaceholder} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shopAddress">{t.auth.shopAddress}</Label>
                        <Input 
                          id="shopAddress" 
                          value={formData.shopAddress}
                          onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                          placeholder={t.auth.enterShopAddress} 
                          required 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="district">{t.auth.district}</Label>
                          <Input 
                            id="district" 
                            value={formData.district}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            placeholder={t.auth.enterDistrict} 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">{t.auth.state}</Label>
                          <Input 
                            id="state" 
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder={t.auth.enterState} 
                            required 
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Admin specific fields */}
                  {activeTab === "admin" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="department">{t.auth.department}</Label>
                        <Input 
                          id="department" 
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          placeholder={t.auth.enterDepartment} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employeeId">{t.auth.employeeId}</Label>
                        <Input 
                          id="employeeId" 
                          value={formData.employeeId}
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          placeholder={t.auth.enterEmployeeId} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="officeLocation">{t.auth.officeLocation}</Label>
                        <Input 
                          id="officeLocation" 
                          value={formData.officeLocation}
                          onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                          placeholder={t.auth.enterOfficeLocation} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactNo">{t.auth.contactNo}</Label>
                        <Input 
                          id="contactNo" 
                          value={formData.contactNo}
                          onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                          placeholder={t.auth.enterContactNo} 
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

              <Button type="submit" className="w-full bg-primary">
                {mode === "login" ? t.auth.login : t.auth.register}
              </Button>
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

export default EnhancedAuth;
