import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export const KUNDALI_SECTIONS = [
  { id: "kundali-graha", labelKey: "kundali.nav_graha" },
  { id: "kundali-charts", labelKey: "kundali.nav_charts" },
  { id: "kundali-dasha", labelKey: "kundali.nav_dasha" },
  { id: "kundali-shadbala", labelKey: "kundali.nav_shadbala" },
  { id: "kundali-shanti", labelKey: "kundali.nav_shanti" },
  { id: "kundali-report", labelKey: "kundali.nav_report" },
] as const;

export function KundaliSectionNav({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <nav className={cn("rounded-xl border border-border bg-card p-2", className)} aria-label={t("kundali.jump_to")}>
      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("kundali.jump_to")}
      </p>
      <ul className="flex flex-col gap-0.5">
        {KUNDALI_SECTIONS.map(({ id, labelKey }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="block rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t(labelKey)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
