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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (mode === "register") {
      // Password confirmation check
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      
      toast.success(`Registered successfully as ${activeTab}`);
    } else {
      // Login - check against demo users
      let userFound = false;
      let userRole = "";

      if (activeTab === "citizen") {
        const user = usersData.citizens.find(
          u => u.email === formData.email && u.password === formData.password
        );
        if (user) {
          userFound = true;
          userRole = "citizen";
        }
      } else if (activeTab === "dealer") {
        const user = usersData.dealers.find(
          u => u.email === formData.email && u.password === formData.password
        );
        if (user) {
          userFound = true;
          userRole = "dealer";
        }
      } else if (activeTab === "admin") {
        const user = usersData.admins.find(
          u => u.email === formData.email && u.password === formData.password
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
    }
    
    // Navigate to appropriate dashboard
    const routes = {
      citizen: "/citizen-dashboard",
      dealer: "/dealer-dashboard",
      admin: "/admin-dashboard"
    };
    navigate(routes[activeTab]);
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
                  {activeTab === "citizen" && (
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

export default Auth;
