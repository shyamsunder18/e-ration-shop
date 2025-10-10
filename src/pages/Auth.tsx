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

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") || "citizen";
  const [activeTab, setActiveTab] = useState<"citizen" | "dealer" | "admin">(userType as any);
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`${mode === "login" ? "Logged in" : "Registered"} successfully as ${activeTab}`);
    
    // Navigate to appropriate dashboard
    const routes = {
      citizen: "/citizen-dashboard",
      dealer: "/dealer-dashboard",
      admin: "/admin-dashboard"
    };
    navigate(routes[activeTab]);
  };

  const userTypes = [
    { value: "citizen", label: "Citizen", icon: Users, color: "saffron" },
    { value: "dealer", label: "Dealer", icon: Store, color: "primary" },
    { value: "admin", label: "Admin", icon: ShieldCheck, color: "india-green" }
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
          Back to Home
        </Link>

        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-saffron rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">अ</span>
            </div>
            <CardTitle className="text-2xl">E-Ration Shop Portal</CardTitle>
            <CardDescription>Government of India</CardDescription>
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
                Login
              </Button>
              <Button
                variant={mode === "register" ? "default" : "outline"}
                onClick={() => setMode("register")}
                className="flex-1"
              >
                Register
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter your full name" required />
                  </div>
                  {activeTab === "citizen" && (
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar">Aadhaar Number</Label>
                      <Input id="aadhaar" placeholder="XXXX-XXXX-XXXX" maxLength={14} required />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email / Mobile</Label>
                <Input id="email" type="text" placeholder="Enter email or mobile" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter password" required />
              </div>

              {mode === "login" && (
                <div className="text-right">
                  <Button variant="link" className="text-xs p-0 h-auto" type="button">
                    Forgot Password?
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full bg-primary">
                {mode === "login" ? "Login" : "Register"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-white/80 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;
