import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 border-b bg-card shadow-card">
      <div className="gradient-header">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-saffron rounded-full flex items-center justify-center shadow-elevated transition-smooth group-hover:scale-105">
                <span className="text-2xl font-bold text-white">अ</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/90 font-medium">Government of India</span>
                <span className="text-lg font-bold text-white">E-Ration Shop Portal</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Globe className="w-4 h-4 mr-2" />
                English
              </Button>
              <Link to="/auth">
                <Button variant="secondary" size="sm" className="font-medium">
                  Login / Register
                </Button>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <Button variant="ghost" className="justify-start">
                    <Globe className="w-4 h-4 mr-2" />
                    English
                  </Button>
                  <Link to="/auth">
                    <Button className="w-full">Login / Register</Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      {/* Tricolor Bar */}
      <div className="h-1 gradient-tricolor" />
    </nav>
  );
};

export default Navbar;
