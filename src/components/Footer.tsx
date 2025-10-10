import { Link } from "react-router-dom";
import { Phone, Mail, FileText } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="h-1 gradient-tricolor" />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">E-Ration Shop Portal</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A Digital India initiative for transparent and efficient distribution of essential commodities under the Public Distribution System.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-smooth">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-smooth">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-smooth">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-saffron" />
                <span>Helpline: 1800-XXX-XXXX</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-saffron" />
                <span>support@eration.gov.in</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4 text-saffron" />
                <span>Mon-Fri: 9:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>© 2025 Government of India. All rights reserved.</p>
          <p className="mt-1">Powered by Digital India Initiative</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
