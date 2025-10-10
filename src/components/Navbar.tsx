import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/hooks/useLanguage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { t, language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'hi' as const, name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'te' as const, name: 'తెలుగు', flag: '🇮🇳' },
  ];

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
                <span className="text-xs text-white/90 font-medium">{t.nav.government}</span>
                <span className="text-lg font-bold text-white">{t.nav.portal}</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <Globe className="w-4 h-4 mr-2" />
                    {languages.find(l => l.code === language)?.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={language === lang.code ? "bg-accent" : ""}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to="/auth">
                <Button variant="secondary" size="sm" className="font-medium">
                  {t.nav.loginRegister}
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
                  {languages.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={language === lang.code ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => setLanguage(lang.code)}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </Button>
                  ))}
                  <Link to="/auth">
                    <Button className="w-full">{t.nav.loginRegister}</Button>
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
