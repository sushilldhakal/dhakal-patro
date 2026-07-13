import { useTranslation } from "react-i18next";
import {
  CalendarRange,
  CircleDot,
  Flame,
  Grid3x3,
  Home,
  Scale,
  ScrollText,
  Sparkles,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const KUNDALI_SECTIONS = [
  { id: "kundali-overview", labelKey: "kundali.nav_overview", icon: "overview" as const },
  { id: "kundali-graha", labelKey: "kundali.nav_graha_details", icon: "graha" as const },
  { id: "kundali-yoga", labelKey: "kundali.nav_yoga", icon: "yoga" as const },
  { id: "kundali-dasha", labelKey: "kundali.nav_dasha", icon: "dasha" as const },
  { id: "kundali-shadbala", labelKey: "kundali.nav_shadbala", icon: "shadbala" as const },
  {
    id: "kundali-bhava-bala",
    labelKey: "kundali.nav_bhava_bala",
    icon: "bhava" as const,
    parentId: "kundali-shadbala" as const,
  },
  {
    id: "kundali-ashtakavarga",
    labelKey: "kundali.nav_ashtakavarga",
    icon: "ashtakavarga" as const,
    parentId: "kundali-shadbala" as const,
  },
  { id: "kundali-shanti", labelKey: "kundali.nav_shanti_vidhi", icon: "shanti" as const },
  { id: "kundali-report", labelKey: "kundali.nav_analysis", icon: "analysis" as const },
] as const;

export type KundaliSectionId = (typeof KUNDALI_SECTIONS)[number]["id"];

export const DEFAULT_KUNDALI_SECTION: KundaliSectionId = "kundali-overview";

const ICONS = {
  overview: Sparkles,
  graha: CircleDot,
  yoga: Star,
  dasha: CalendarRange,
  shadbala: Scale,
  bhava: Home,
  ashtakavarga: Grid3x3,
  shanti: Flame,
  analysis: ScrollText,
} as const;

export function parseKundaliSectionFromHash(hash: string): KundaliSectionId {
  const id = hash.replace(/^#/, "");
  return KUNDALI_SECTIONS.some((s) => s.id === id) ? (id as KundaliSectionId) : DEFAULT_KUNDALI_SECTION;
}

export function setKundaliSectionHash(id: KundaliSectionId) {
  if (typeof window === "undefined") return;
  const url = `${window.location.pathname}${window.location.search}#${id}`;
  window.history.replaceState(null, "", url);
}

type KundaliSectionNavProps = {
  activeId: KundaliSectionId;
  onNavigate: (id: KundaliSectionId) => void;
  className?: string;
  variant?: "sidebar" | "horizontal";
};

export function KundaliSectionNav({
  activeId,
  onNavigate,
  className,
  variant = "sidebar",
}: KundaliSectionNavProps) {
  const { t } = useTranslation();

  const items = KUNDALI_SECTIONS.map(({ id, labelKey, icon, ...rest }) => {
    const Icon = ICONS[icon];
    const active = activeId === id;
    const isChild = "parentId" in rest && rest.parentId != null;
    return (
      <li key={id} className={variant === "horizontal" ? "shrink-0" : undefined}>
        <button
          type="button"
          onClick={() => onNavigate(id)}
          className={cn(
            "text-base transition-colors",
            variant === "sidebar"
              ? cn(
                  "flex w-full items-center gap-2.5 rounded-xl py-2.5 text-sm text-left",
                  isChild ? "pl-8 pr-3" : "px-3",
                  active
                    ? "bg-secondary/12 text-secondary ring-1 ring-secondary/25"
                    : "hover:bg-muted hover:text-foreground",
                )
              : cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap",
                  isChild && "ml-3 border-dashed",
                  active
                    ? "border-secondary/40 bg-secondary/12 text-secondary"
                    : "border-border bg-card hover:bg-muted hover:text-foreground",
                ),
          )}
          aria-current={active ? "page" : undefined}
        >
          {variant === "sidebar" ? (
            <Icon className={cn("size-4 shrink-0", active && "text-secondary", isChild && "size-3.5")} />
          ) : null}
          {t(labelKey)}
        </button>
      </li>
    );
  });

  if (variant === "horizontal") {
    return (
      <nav className={cn("overflow-x-auto", className)} aria-label={t("kundali.jump_to")}>
        <ul className="flex gap-2 pb-1 min-w-max">{items}</ul>
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_6%,transparent)]",
        className,
      )}
      aria-label={t("kundali.jump_to")}
    >
      <p className="border-b border-border px-4 py-3 text-sm font-semibold uppercase tracking-wider">
        {t("kundali.submenu_title")}
      </p>
      <ul className="flex flex-col gap-1 p-2">{items}</ul>
    </nav>
  );
}
