import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/useLanguage";

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'hi' as const, name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'te' as const, name: 'తెలుగు', flag: '🇮🇳' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
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
  );
};

export default LanguageSelector;
