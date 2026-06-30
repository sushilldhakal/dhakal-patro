import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n: i18nInstance, t } = useTranslation();
  const isNepali = (i18nInstance.language?.slice(0, 2) ?? "ne") !== "en";

  const toggle = () => {
    void i18n.changeLanguage(isNepali ? "en" : "ne");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "h-9 px-2.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0",
        className,
      )}
      aria-label={isNepali ? t("switch_to_english") : t("switch_to_nepali")}
    >
      {isNepali ? t("switch_to_english") : t("switch_to_nepali")}
    </button>
  );
}
