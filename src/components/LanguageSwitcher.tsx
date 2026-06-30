import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ne", label: "नेपाली" },
  { code: "hi", label: "हिन्दी" },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n: i18nInstance, t } = useTranslation();
  const current = i18nInstance.language?.slice(0, 2) ?? "ne";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0",
            className,
          )}
          aria-label={t("language")}
        >
          <Languages className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-36 p-1">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            className={cn(
              "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
              current === code ? "text-secondary bg-secondary/10" : "text-muted-foreground",
            )}
            onClick={() => i18n.changeLanguage(code)}
          >
            {label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
