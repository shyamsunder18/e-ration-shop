import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    toast.success(t.contactPage.success);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary mb-3">{t.contactPage.title}</h1>
            <p className="text-muted-foreground">{t.contactPage.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{t.contactPage.formTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.contactPage.name}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t.contactPage.namePlaceholder}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t.contactPage.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t.contactPage.emailPlaceholder}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t.contactPage.message}</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={t.contactPage.messagePlaceholder}
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary">
                    {t.contactPage.submit}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>{t.contactPage.contactInfo}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-saffron mt-0.5" />
                    <div>
                      <p className="font-medium">{t.footer.helpline}</p>
                      <p className="text-sm text-muted-foreground">{t.footer.landline}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-saffron mt-0.5" />
                    <div>
                      <p className="font-medium">{t.footer.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-saffron mt-0.5" />
                    <div>
                      <p className="font-medium">{t.footer.hours}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card bg-gradient-to-br from-saffron/5 to-india-green/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t.footer.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
