import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ensureEnglishBundle } from "@/i18n";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n: i18nInstance, t, ready } = useTranslation();
  const lang = i18nInstance.resolvedLanguage?.slice(0, 2) ?? i18nInstance.language?.slice(0, 2) ?? "ne";
  const isNepali = lang !== "en";

  const toggle = () => {
    if (isNepali) {
      void ensureEnglishBundle().then(() => i18nInstance.changeLanguage("en"));
      return;
    }
    void i18nInstance.changeLanguage("ne");
  };

  const label = isNepali ? t("switch_to_english") : t("switch_to_nepali");

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!ready}
      className={cn(
        "h-9 px-2.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 disabled:opacity-60",
        className,
      )}
      aria-label={label}
    >
      {ready ? label : "…"}
    </button>
  );
}
