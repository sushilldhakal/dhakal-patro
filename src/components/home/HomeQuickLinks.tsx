import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, CalendarRange, PartyPopper, Sprout, Sunrise, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrentRitu } from "@/lib/ritu-display";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
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
] as const satisfies {
  to: string;
  labelKey: string;
  descKey: string;
  icon: LucideIcon;
  iconClass: string;
}[];

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
  className,
}: {
  location: PanchangaLocation;
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
      <RituQuickLink location={location} />
    </div>
  );
}
