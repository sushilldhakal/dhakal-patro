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
import { currentPatroMonthLinkSearch, currentPatroYearLinkSearch, patroRouteLinkSearch } from "@/lib/url-state";
import { defaultPanchakPatroYear } from "@/lib/panchak/panchak-patro-data";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { group: "patro", to: "/holidays" as const, labelKey: "nav.holidays", icon: PartyPopper },
  { group: "patro", to: "/converter" as const, labelKey: "nav.converter", icon: ArrowLeftRight },
  { group: "patro", to: "/suryakranti" as const, labelKey: "nav.suryakranti", icon: Sunrise },
  { group: "patro", to: "/panchanga/year" as const, labelKey: "panchanga_year.title", icon: CalendarRange },
  { group: "jyotish", to: "/panchanga/avakahada-chakra" as const, labelKey: "nav.avakahada_chakra", icon: Grid3x3 },
  { group: "jyotish", to: "/abhijit-muhurta" as const, labelKey: "nav.abhijit_muhurta", icon: Sparkles },
  { group: "jyotish", to: "/kundali" as const, labelKey: "home_quick.kundali_build_title", icon: Sparkles },
  { group: "jyotish", to: "/jyotish/kundali-milan" as const, labelKey: "home_quick.kundali_milan_title", icon: Heart },
] as const satisfies {
  group: "patro" | "jyotish";
  to: string;
  labelKey: string;
  icon: LucideIcon;
}[];

const QUICK_LINK_ICON_SIZE = 28;
const QUICK_LINK_ICON_STROKE = 1.75;

export const quickLinkCardClass =
  "group flex aspect-square w-[calc((100%-1.5rem)/3)] max-w-[7.25rem] shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-2.5 py-3.5 text-center no-underline transition-[border-color,background-color,transform] duration-200 hover:border-secondary/35 hover:bg-tab-hover active:scale-[0.98] sm:w-[calc((100%-2.25rem)/4)] sm:max-w-[8rem] md:w-[calc((100%-3rem)/5)] lg:max-w-none lg:w-[calc((100%-5.25rem)/8)]";

export const quickLinkIconClass = "shrink-0 text-danger dark:text-danger";

export function QuickLinkCard({
  label,
  description,
  icon: Icon,
  iconNode,
  ...linkProps
}: {
  label: string;
  description?: string;
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
      <span className="w-full min-w-0 px-0.5 text-xs font-bold leading-snug text-foreground sm:text-sm line-clamp-2">
        {label}
      </span>
      {description ? (
        <span className="w-full min-w-0 text-[0.68rem] leading-snug text-muted-foreground line-clamp-2">
          {description}
        </span>
      ) : null}
    </Link>
  );
}

function LinkCategory({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-wrap items-stretch justify-center gap-3">{children}</div>
    </section>
  );
}

function PanchakPatroQuickLink({ location, era }: { location: PanchangaLocation; era: ReturnType<typeof useCalendarEra> }) {
  const { t } = useTranslation();
  const { digits } = useLocale();
  const year = defaultPanchakPatroYear();

  return (
    <QuickLinkCard
      to="/panchak-patro"
      search={currentPatroYearLinkSearch(location, era)}
      icon={CalendarClock}
      label={t("panchak.title", { year: digits(year) })}
    />
  );
}

function ChandrKrantiQuickLink({ location, era }: { location: PanchangaLocation; era: ReturnType<typeof useCalendarEra> }) {
  const { t } = useTranslation();

  return (
    <QuickLinkCard
      to="/dainikkranti"
      search={currentPatroMonthLinkSearch(location, era)}
      icon={Moon}
      label={t("nav.dainikkranti")}
    />
  );
}

function RituQuickLink({ location }: { location: PanchangaLocation }) {
  const { t } = useTranslation();
  const era = useCalendarEra();
  const { current, loading } = useCurrentRitu(location);

  return (
    <QuickLinkCard
      to="/ritu"
      search={patroRouteLinkSearch("/ritu", location, era)}
      label={t("ritu.title")}
      iconNode={
        loading ? (
          <Sprout size={QUICK_LINK_ICON_SIZE} strokeWidth={QUICK_LINK_ICON_STROKE} className={quickLinkIconClass} aria-hidden />
        ) : current?.emoji ? (
          <span className="text-base leading-none" aria-hidden>
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
  className,
}: {
  location: PanchangaLocation;
  className?: string;
}) {
  const { t } = useTranslation();
  const { pick } = useLocale();
  const era = useCalendarEra();

  return (
    <div
      className={cn(
        "space-y-8",
        className,
      )}
    >
      <LinkCategory title={pick("पात्रो तथा मिति", "Patro & dates")}>
        {QUICK_LINKS.filter(({ group }) => group === "patro").map(({ to, labelKey, icon }) => (
          <QuickLinkCard
            key={to}
            to={to}
            search={patroRouteLinkSearch(to, location, era)}
            icon={icon}
            label={t(labelKey)}
          />
        ))}
        <ChandrKrantiQuickLink location={location} era={era} />
        <PanchakPatroQuickLink location={location} era={era} />
        <RituQuickLink location={location} />
      </LinkCategory>

      <LinkCategory title={pick("ज्योतिष तथा मुहूर्त", "Jyotish & moment")}>
        {QUICK_LINKS.filter(({ group }) => group === "jyotish").map(({ to, labelKey, icon }) => (
          <QuickLinkCard
            key={to}
            to={to}
            search={patroRouteLinkSearch(to, location, era)}
            icon={icon}
            label={t(labelKey)}
          />
        ))}
      </LinkCategory>
    </div>
  );
}
