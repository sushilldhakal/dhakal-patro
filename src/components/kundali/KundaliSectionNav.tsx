import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarRange, Flame, Scale, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

export const KUNDALI_SECTIONS = [
  { id: "kundali-dasha", labelKey: "kundali.nav_dasha_full", icon: "dasha" as const },
  { id: "kundali-shadbala", labelKey: "kundali.nav_shadbala", icon: "shadbala" as const },
  { id: "kundali-shanti", labelKey: "kundali.nav_shanti_vidhi", icon: "shanti" as const },
  { id: "kundali-report", labelKey: "kundali.nav_analysis", icon: "analysis" as const },
] as const;

const ICONS = {
  dasha: CalendarRange,
  shadbala: Scale,
  shanti: Flame,
  analysis: ScrollText,
} as const;

export function KundaliSectionNav({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string>(KUNDALI_SECTIONS[0]!.id);

  useEffect(() => {
    const sections = KUNDALI_SECTIONS.map(({ id }) => document.getElementById(id)).filter(Boolean);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((el) => observer.observe(el!));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_6%,transparent)]",
        className,
      )}
      aria-label={t("kundali.jump_to")}
    >
      <p className="border-b border-border px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("kundali.submenu_title")}
      </p>
      <ul className="flex flex-col gap-1 p-2">
        {KUNDALI_SECTIONS.map(({ id, labelKey, icon }) => {
          const Icon = ICONS[icon];
          const active = activeId === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary/12 text-secondary ring-1 ring-secondary/25"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-current={active ? "true" : undefined}
              >
                <Icon className={cn("size-4 shrink-0", active && "text-secondary")} />
                {t(labelKey)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
