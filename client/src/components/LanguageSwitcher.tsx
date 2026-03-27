import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

interface LanguageSwitcherProps {
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "lg" | "icon";
  showLabel?: boolean;
}

export default function LanguageSwitcher({
  variant = "ghost",
  size = "sm",
  showLabel = true,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ??
    LANGUAGES.find((l) => i18n.language.startsWith(l.code)) ??
    LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5 font-medium">
          <Globe className="w-4 h-4 shrink-0" />
          {showLabel && (
            <span className="hidden sm:inline">{currentLang.label}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[130px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={`gap-2 cursor-pointer ${
              currentLang.code === lang.code ? "font-semibold bg-accent" : ""
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
