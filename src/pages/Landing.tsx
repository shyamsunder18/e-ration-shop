import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Store, ShieldCheck, CheckCircle, FileText, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";

const Landing = () => {
  const { t } = useLanguage();
  const userTypes = [
    {
      title: t.landing.citizenPortalTitle,
      description: t.landing.citizenPortalDesc,
      icon: Users,
      route: "/auth?type=citizen",
      color: "saffron"
    },
    {
      title: t.landing.dealerPortalTitle,
      description: t.landing.dealerPortalDesc,
      icon: Store,
      route: "/auth?type=dealer",
      color: "primary"
    },
    {
      title: t.landing.adminPortalTitle,
      description: t.landing.adminPortalDesc,
      icon: ShieldCheck,
      route: "/auth?type=admin",
      color: "india-green"
    }
  ];

  const features = [
    { icon: CheckCircle, text: t.landing.feature1 },
    { icon: FileText, text: t.landing.feature2 },
    { icon: TrendingUp, text: t.landing.feature3 },
    { icon: ShieldCheck, text: t.landing.feature4 }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-header py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }} />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in">
            {t.landing.welcome}
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-fade-in">
            {t.landing.slogan}
          </p>
          <div className="flex flex-wrap gap-4 justify-center animate-fade-in">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Icon className="w-4 h-4 text-saffron" />
                  <span className="text-sm text-white font-medium">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-primary">
          {t.landing.selectPortal}
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          {t.landing.selectPortalDesc}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {userTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <Card 
                key={index} 
                className="shadow-card hover:shadow-elevated transition-smooth group cursor-pointer animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${type.color}/10 flex items-center justify-center group-hover:scale-110 transition-smooth`}>
                    <Icon className={`w-8 h-8 text-${type.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{type.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{type.description}</p>
                  <Link to={type.route}>
                    <Button className={`w-full bg-${type.color} hover:bg-${type.color}/90`}>
                      {t.landing.accessPortal}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">
            {t.landing.whyTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { title: t.landing.benefit1, desc: t.landing.benefit1Detail },
              { title: t.landing.benefit2, desc: t.landing.benefit2Detail },
              { title: t.landing.benefit3, desc: t.landing.benefit3Detail },
              { title: t.landing.benefit4, desc: t.landing.benefit4Detail }
            ].map((benefit, index) => (
              <Card key={index} className="text-center shadow-card">
                <CardContent className="p-6">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-saffron/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-saffron" />
                  </div>
                  <h3 className="font-bold mb-2 text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
