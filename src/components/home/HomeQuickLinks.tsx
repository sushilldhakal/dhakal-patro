import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, CalendarClock, CalendarRange, Heart, Moon, PartyPopper, Sparkles, Sprout, Sunrise, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrentRitu } from "@/lib/ritu-display";
import { BS_MONTH_NAMES, BS_MONTHS_NE } from "@/lib/bs-calendar";
import { buildChandraKrantiSearch } from "@/lib/url-state";
import { defaultPanchakPatroYear } from "@/lib/panchak/panchak-patro-data";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  {
    to: "/holidays" as const,
    labelKey: "nav.holidays",
    descKey: "home_quick.holidays_desc",
    icon: PartyPopper,
    iconClass: "bg-chip-festival/80 text-accent dark:text-[#7fd6db]",
  },
  {
    to: "/converter" as const,
    labelKey: "nav.converter",
    descKey: "home_quick.converter_desc",
    icon: ArrowLeftRight,
    iconClass: "bg-secondary/12 text-secondary",
  },
  {
    to: "/suryakranti" as const,
    labelKey: "nav.suryakranti",
    descKey: "home_quick.suryakranti_desc",
    icon: Sunrise,
    iconClass: "bg-chip-public/70 text-danger",
  },
  {
    to: "/panchanga/year" as const,
    labelKey: "panchanga_year.title",
    descKey: "home_quick.panchanga_year_desc",
    icon: CalendarRange,
    iconClass: "bg-chip-festival/50 text-secondary dark:text-[#7fd6db]",
  },
  {
    to: "/abhijit-muhurta" as const,
    labelKey: "nav.abhijit_muhurta",
    descKey: "home_quick.abhijit_muhurta_desc",
    icon: Sparkles,
    iconClass: "bg-chip-festival/60 text-accent dark:text-[#7fd6db]",
  },
  {
    to: "/kundali" as const,
    labelKey: "home_quick.kundali_build_title",
    descKey: "home_quick.kundali_build_desc",
    icon: Sparkles,
    iconClass: "bg-secondary/12 text-secondary",
  },
  {
    to: "/jyotish/kundali-milan" as const,
    labelKey: "home_quick.kundali_milan_title",
    descKey: "home_quick.kundali_milan_desc",
    icon: Heart,
    iconClass: "bg-chip-festival/70 text-danger dark:text-[#f0a0a8]",
  },
] as const satisfies {
  to: string;
  labelKey: string;
  descKey: string;
  icon: LucideIcon;
  iconClass: string;
}[];

function PanchakPatroQuickLink() {
  const { t } = useTranslation();
  const { digits } = useLocale();
  const year = defaultPanchakPatroYear();

  return (
    <Link
      to="/panchak-patro"
      search={{ year }}
      className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2.5 text-center no-underline shadow-xs shadow-ring-soft transition-colors hover:border-secondary/35 hover:bg-tab-hover"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 transition-transform group-hover:scale-105"
        aria-hidden
      >
        <CalendarClock size={18} strokeWidth={1.9} />
      </span>
      <span className="w-full min-w-0 text-[11px] font-bold leading-tight text-foreground line-clamp-2">
        {t("panchak.title", { year: digits(year) })}
      </span>
      <span className="w-full min-w-0 text-[9.5px] font-medium leading-snug text-muted-foreground line-clamp-2">
        {t("home_quick.panchak_patro_desc")}
      </span>
    </Link>
  );
}

function ChandrKrantiQuickLink({
  location,
  bsYear,
  bsMonth,
}: {
  location: PanchangaLocation;
  bsYear: number;
  bsMonth: number;
}) {
  const { t } = useTranslation();
  const { pick } = useLocale();
  const monthLabel = pick(BS_MONTHS_NE[bsMonth - 1], BS_MONTH_NAMES[bsMonth - 1]);

  return (
    <Link
      to="/chandrakranti"
      search={buildChandraKrantiSearch(location, bsYear, bsMonth)}
      className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2.5 text-center no-underline shadow-xs shadow-ring-soft transition-colors hover:border-secondary/35 hover:bg-tab-hover"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/12 text-secondary transition-transform group-hover:scale-105"
        aria-hidden
      >
        <Moon size={18} strokeWidth={1.9} />
      </span>
      <span className="w-full min-w-0 text-[11px] font-bold leading-tight text-foreground line-clamp-2">
        {t("nav.chandrakranti")}
      </span>
      <span className="w-full min-w-0 text-[9.5px] font-medium leading-snug text-muted-foreground line-clamp-2">
        {monthLabel} · {t("home_quick.chandrakranti_desc")}
      </span>
    </Link>
  );
}

function RituQuickLink({ location }: { location: PanchangaLocation }) {
  const { t } = useTranslation();
  const { current, loading } = useCurrentRitu(location);

  const title = t("ritu.title");
  const desc = current
    ? `${t(`ritu.${current.seasonKey}`)} · ${t("home_quick.ritu_see_all")}`
    : t("home_quick.ritu_desc");

  return (
    <Link
      to="/ritu"
      className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2.5 text-center no-underline shadow-xs shadow-ring-soft transition-colors hover:border-secondary/35 hover:bg-tab-hover"
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg text-lg leading-none transition-transform group-hover:scale-105",
          current ? "bg-secondary/12" : "bg-secondary/12 text-secondary",
        )}
        aria-hidden
      >
        {loading ? (
          <Sprout size={18} strokeWidth={1.9} className="text-secondary" />
        ) : (
          current?.emoji ?? "🌿"
        )}
      </span>
      <span className="w-full min-w-0 text-[11px] font-bold leading-tight text-foreground line-clamp-2">
        {title}
      </span>
      <span className="w-full min-w-0 text-[9.5px] font-medium leading-snug text-muted-foreground line-clamp-2">
        {desc}
      </span>
    </Link>
  );
}

export function HomeQuickLinks({
  location,
  bsYear,
  bsMonth,
  className,
}: {
  location: PanchangaLocation;
  bsYear: number;
  bsMonth: number;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
        className,
      )}
    >
      {QUICK_LINKS.map(({ to, labelKey, descKey, icon: Icon, iconClass }) => (
        <Link
          key={to}
          to={to}
          className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2.5 text-center no-underline shadow-xs shadow-ring-soft transition-colors hover:border-secondary/35 hover:bg-tab-hover"
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
              iconClass,
            )}
            aria-hidden
          >
            <Icon size={18} strokeWidth={1.9} />
          </span>
          <span className="w-full min-w-0 text-[11px] font-bold leading-tight text-foreground line-clamp-2">
            {t(labelKey)}
          </span>
          <span className="w-full min-w-0 text-[9.5px] font-medium leading-snug text-muted-foreground line-clamp-2">
            {t(descKey)}
          </span>
        </Link>
      ))}
      <ChandrKrantiQuickLink location={location} bsYear={bsYear} bsMonth={bsMonth} />
      <PanchakPatroQuickLink />
      <RituQuickLink location={location} />
    </div>
  );
}
