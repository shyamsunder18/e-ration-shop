import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Terms = () => {
  const { t } = useLanguage();

  const terms = [
    t.terms.term1,
    t.terms.term2,
    t.terms.term3,
    t.terms.term4,
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-3">{t.terms.title}</h1>
            <p className="text-muted-foreground">{t.terms.subtitle}</p>
          </div>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <ul className="space-y-4">
                {terms.map((term, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-saffron text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <p className="text-muted-foreground pt-0.5">{term}</p>
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

export default Terms;
