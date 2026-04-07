import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeSelectorProps = {
  className?: string;
  mobile?: boolean;
};

const themeOptions = [
  { value: "system", label: "Default", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

const ThemeSelector = ({ className, mobile = false }: ThemeSelectorProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme || "system";
  const activeOption = themeOptions.find((option) => option.value === currentTheme) || themeOptions[0];
  const ActiveIcon = mounted
    ? (resolvedTheme === "dark" ? Moon : currentTheme === "system" ? Monitor : activeOption.icon)
    : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={mobile ? "outline" : "ghost"}
          size="sm"
          className={className}
        >
          <ActiveIcon className="mr-2 h-4 w-4" />
          {activeOption.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={currentTheme === option.value ? "bg-accent" : ""}
            >
              <Icon className="mr-2 h-4 w-4" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;
