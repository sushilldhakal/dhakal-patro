import { Link, type LinkProps } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  CalendarClock,
  CalendarRange,
  Grid3x3,
  Heart,
  Moon,
  PartyPopper,
  Sparkles,
  Sprout,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { type ReactNode } from "react";
import { useCurrentRitu } from "@/lib/ritu-display";
import { buildChandraKrantiSearch } from "@/lib/url-state";
import { defaultPanchakPatroYear } from "@/lib/panchak/panchak-patro-data";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { to: "/holidays" as const, labelKey: "nav.holidays", icon: PartyPopper },
  { to: "/converter" as const, labelKey: "nav.converter", icon: ArrowLeftRight },
  { to: "/suryakranti" as const, labelKey: "nav.suryakranti", icon: Sunrise },
  { to: "/panchanga/year" as const, labelKey: "panchanga_year.title", icon: CalendarRange },
  { to: "/panchanga/avakahada-chakra" as const, labelKey: "nav.avakahada_chakra", icon: Grid3x3 },
  { to: "/abhijit-muhurta" as const, labelKey: "nav.abhijit_muhurta", icon: Sparkles },
  { to: "/kundali" as const, labelKey: "home_quick.kundali_build_title", icon: Sparkles },
  { to: "/jyotish/kundali-milan" as const, labelKey: "home_quick.kundali_milan_title", icon: Heart },
] as const satisfies { to: string; labelKey: string; icon: LucideIcon }[];

const QUICK_LINK_ICON_SIZE = 28;
const QUICK_LINK_ICON_STROKE = 1.75;

const quickLinkCardClass =
  "group flex aspect-square w-[calc((100%-1.5rem)/3)] max-w-[7.25rem] shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-2.5 py-3.5 text-center no-underline transition-[border-color,background-color,transform] duration-200 hover:border-secondary/35 hover:bg-tab-hover active:scale-[0.98] sm:w-[calc((100%-2.25rem)/4)] sm:max-w-[8rem] md:w-[calc((100%-3rem)/5)] lg:max-w-none lg:w-[calc((100%-5.25rem)/8)]";

const quickLinkIconClass = "shrink-0 text-danger dark:text-danger";

function QuickLinkCard({
  label,
  icon: Icon,
  iconNode,
  ...linkProps
}: {
  label: string;
  icon?: LucideIcon;
  iconNode?: ReactNode;
} & Omit<LinkProps, "className" | "children">) {
  return (
    <Link {...linkProps} className={quickLinkCardClass}>
      {iconNode ??
        (Icon ? (
          <Icon
            size={QUICK_LINK_ICON_SIZE}
            strokeWidth={QUICK_LINK_ICON_STROKE}
            className={quickLinkIconClass}
            aria-hidden
          />
        ) : null)}
      <span className="w-full min-w-0 px-0.5 text-xs font-bold leading-snug text-foreground sm:text-[13px] line-clamp-2">
        {label}
      </span>
    </Link>
  );
}

function PanchakPatroQuickLink() {
  const { t } = useTranslation();
  const { digits } = useLocale();
  const year = defaultPanchakPatroYear();

  return (
    <QuickLinkCard
      to="/panchak-patro"
      search={{ year }}
      icon={CalendarClock}
      label={t("panchak.title", { year: digits(year) })}
    />
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

  return (
    <QuickLinkCard
      to="/chandrakranti"
      search={buildChandraKrantiSearch(location, bsYear, bsMonth)}
      icon={Moon}
      label={t("nav.chandrakranti")}
    />
  );
}

function RituQuickLink({ location }: { location: PanchangaLocation }) {
  const { t } = useTranslation();
  const { current, loading } = useCurrentRitu(location);

  return (
    <QuickLinkCard
      to="/ritu"
      label={t("ritu.title")}
      iconNode={
        loading ? (
          <Sprout size={QUICK_LINK_ICON_SIZE} strokeWidth={QUICK_LINK_ICON_STROKE} className={quickLinkIconClass} aria-hidden />
        ) : current?.emoji ? (
          <span className="text-[1.75rem] leading-none" aria-hidden>
            {current.emoji}
          </span>
        ) : (
          <Sprout size={QUICK_LINK_ICON_SIZE} strokeWidth={QUICK_LINK_ICON_STROKE} className={quickLinkIconClass} aria-hidden />
        )
      }
    />
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
        "flex flex-wrap items-stretch justify-center gap-3",
        className,
      )}
    >
      {QUICK_LINKS.map(({ to, labelKey, icon }) => (
        <QuickLinkCard key={to} to={to} icon={icon} label={t(labelKey)} />
      ))}
      <ChandrKrantiQuickLink location={location} bsYear={bsYear} bsMonth={bsMonth} />
      <PanchakPatroQuickLink />
      <RituQuickLink location={location} />
    </div>
  );
}
