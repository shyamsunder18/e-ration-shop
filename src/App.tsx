import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import EnhancedAuth from "./pages/EnhancedAuth";
import CitizenDashboard from "./pages/CitizenDashboard";
import DealerDashboard from "./pages/DealerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ManageUsers from "./pages/ManageUsers";
import ManageDealers from "./pages/ManageDealers";
import ManageGoods from "./pages/ManageGoods";
import AdminRationCards from "./pages/AdminRationCards";
import DealerBeneficiaries from "./pages/DealerBeneficiaries";
import DealerInventory from "./pages/DealerInventory";
import CitizenNotifications from "./pages/CitizenNotifications";
import CitizenProfile from "./pages/CitizenProfile";
import AdminSettings from "./pages/AdminSettings";
import AdminReports from "./pages/AdminReports";
import DealerLogs from "./pages/DealerLogs";
import CitizenHistory from "./pages/CitizenHistory";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
          <Route path="/dealer-dashboard" element={<DealerDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-dashboard/users" element={<ManageUsers />} />
          <Route path="/admin-dashboard/dealers" element={<ManageDealers />} />
          <Route path="/admin-dashboard/goods" element={<ManageGoods />} />
          <Route path="/admin-dashboard/ration-cards" element={<AdminRationCards />} />
          <Route path="/admin-dashboard/notifications" element={<CitizenNotifications />} />
          <Route path="/admin-dashboard/reports" element={<AdminReports />} />
          <Route path="/admin-dashboard/settings" element={<AdminSettings />} />

          <Route path="/dealer-dashboard" element={<DealerDashboard />} />
          <Route path="/dealer-dashboard/inventory" element={<DealerInventory />} />
          <Route path="/dealer-dashboard/beneficiaries" element={<DealerBeneficiaries />} />
          <Route path="/dealer-dashboard/notifications" element={<CitizenNotifications />} />
          <Route path="/dealer-dashboard/logs" element={<DealerLogs />} />

          <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
          <Route path="/citizen-dashboard/profile" element={<CitizenProfile />} />
          <Route path="/citizen-dashboard/history" element={<CitizenHistory />} />
          <Route path="/citizen-dashboard/notifications" element={<CitizenNotifications />} />

          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
