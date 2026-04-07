import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const { t } = useLanguage();

  const faqs = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
    { q: t.faq.q6, a: t.faq.a6 },
    { q: t.faq.q7, a: t.faq.a7 },
    { q: t.faq.q8, a: t.faq.a8 },
    { q: t.faq.q9, a: t.faq.a9 },
    { q: t.faq.q10, a: t.faq.a10 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-3">{t.faq.title}</h1>
            <p className="text-muted-foreground">{t.faq.subtitle}</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
