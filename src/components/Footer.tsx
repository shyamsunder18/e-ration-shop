import { Link } from "react-router-dom";
import { Phone, Mail, Clock } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="h-1 gradient-tricolor" />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">{t.footer.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.footer.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">{t.footer.quickLinks}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-smooth">
                  {t.footer.faq}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-smooth">
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-smooth">
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-smooth">
                  {t.footer.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">{t.footer.contactTitle}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-saffron" />
                <span>{t.footer.helpline}</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-saffron" />
                <span>{t.footer.landline}</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-saffron" />
                <span>{t.footer.email}</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-saffron" />
                <span>{t.footer.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>{t.footer.copyright}</p>
          <p className="mt-1">{t.footer.poweredBy}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
