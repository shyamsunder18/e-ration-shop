import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

const Privacy = () => {
  const { t } = useLanguage();

  const policies = [
    t.privacy.policy1,
    t.privacy.policy2,
    t.privacy.policy3,
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-india-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-india-green" />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-3">{t.privacy.title}</h1>
            <p className="text-muted-foreground">{t.privacy.subtitle}</p>
          </div>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <ul className="space-y-4">
                {policies.map((policy, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-india-green flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{policy}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
