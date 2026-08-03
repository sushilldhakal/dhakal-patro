import type { LinkProps } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Clock3,
  Eclipse,
  Grid3x3,
  Heart,
  HeartHandshake,
  Home,
  Layers,
  Moon,
  MoonStar,
  Orbit,
  PartyPopper,
  RotateCcw,
  Route,
  Sparkles,
  Sprout,
  Star,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { DrawerClose } from "@/components/ui/drawer";
import { NavDrawerLinkCard } from "@/components/home/HomeQuickLinks";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { parseEraFromUrl } from "@/lib/era";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { useCurrentRitu } from "@/lib/ritu-display";
import { elementTitle } from "@/lib/panchanga-i18n";
import { defaultPanchakPatroYear } from "@/lib/panchak/panchak-patro-data";
import { resolveSidebarLinkPath } from "@/lib/panchanga-route-preload";
import {
  getPanchangaSidebarSections,
  type PanchangaSidebarItem,
} from "@/lib/panchanga-sidebar-nav";
import {
  currentPatroYearLinkSearch,
  patroRouteLinkSearch,
} from "@/lib/url-state";
import { useLocale, bilingualText } from "@/i18n/locale";
import { cn } from "@/lib/utils";

const PATRO_ITEM_ICONS: Record<string, LucideIcon> = {
  holidays: PartyPopper,
  converter: ArrowLeftRight,
  suryakranti: Sunrise,
  "panchanga-year": CalendarRange,
  dainikkranti: Moon,
  "panchak-patro": CalendarClock,
  ritu: Sprout,
};

const JYOTISH_ITEM_ICONS: Record<string, LucideIcon> = {
  avakahada: Grid3x3,
  abhijit: Sparkles,
  kundali: Sparkles,
  "kundali-milan": Heart,
};

const SPAN_ITEM_ICONS: Record<string, LucideIcon> = {
  tithi: Moon,
  nakshatra: Star,
  yoga: Sparkles,
  karana: Layers,
  "chandra-rashi": MoonStar,
};

const TABLE_ITEM_ICONS: Record<string, LucideIcon> = {
  choghadiya: Clock3,
  hora: Clock3,
  lagna: Sunrise,
  "udaya-lagna": Sunrise,
  chandrabala: MoonStar,
  tarabala: Star,
  "panchaka-rahita": CalendarClock,
  pushkara: Sparkles,
};

const GRAHA_ITEM_ICONS: Record<string, LucideIcon> = {
  gochar: Route,
  "graha-sthiti": Orbit,
  "graha-asta": Sunrise,
  "graha-vakri": RotateCcw,
  "chandra-grahan": MoonStar,
  "surya-grahan": Eclipse,
};

function itemSearch(
  item: PanchangaSidebarItem,
  location: ReturnType<typeof usePanchangaLocation>["location"],
  era: ReturnType<typeof useCalendarEra>,
  urlBrowse: { year?: number; month?: number },
): Record<string, unknown> | undefined {
  if (item.id === "kundali" || item.id === "kundali-milan" || item.id === "avakahada" || item.id === "converter") {
    return undefined;
  }
  if (item.id === "panchak-patro") {
    return currentPatroYearLinkSearch(location, era) as Record<string, unknown>;
  }
  const path = item.params
    ? resolveSidebarLinkPath(item.to, item.params)
    : item.to;
  return patroRouteLinkSearch(path, location, era, urlBrowse) as Record<string, unknown>;
}

function resolveIcon(sectionId: string, itemId: string): LucideIcon {
  if (sectionId === "patro") return PATRO_ITEM_ICONS[itemId] ?? CalendarDays;
  if (sectionId === "jyotish") return JYOTISH_ITEM_ICONS[itemId] ?? Sparkles;
  if (sectionId === "spans") return SPAN_ITEM_ICONS[itemId] ?? MoonStar;
  if (sectionId === "tables") return TABLE_ITEM_ICONS[itemId] ?? CalendarClock;
  if (sectionId === "graha") return GRAHA_ITEM_ICONS[itemId] ?? Orbit;
  if (sectionId === "sait") return HeartHandshake;
  return CalendarDays;
}

function NavSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-3 pb-4", className)}>
      <h2 className="mb-2 text-center text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>
  );
}

function DrawerNavLink({
  item,
  label,
  icon,
  iconNode,
  search,
  onNavigate,
}: {
  item: PanchangaSidebarItem;
  label: string;
  icon?: LucideIcon;
  iconNode?: ReactNode;
  search?: Record<string, unknown>;
  onNavigate?: () => void;
}) {
  const shared = {
    label,
    icon,
    iconNode,
    onClick: onNavigate,
    ...(search ? { search } : {}),
  };

  if (item.params) {
    return (
      <DrawerClose asChild>
        <NavDrawerLinkCard
          {...shared}
          to={item.to as "/panchanga/element/$name" | "/sait/$category"}
          params={item.params}
        />
      </DrawerClose>
    );
  }

  return (
    <DrawerClose asChild>
      <NavDrawerLinkCard {...shared} to={item.to as LinkProps["to"]} />
    </DrawerClose>
  );
}

export function MobileNavMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { digits, lang } = useLocale();
  const era = useCalendarEra();
  const { location } = usePanchangaLocation();
  const rawSearch = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });
  const fallbackLang = lang === "en" ? "en" : "ne";
  const urlBrowse = parseEraFromUrl(rawSearch, fallbackLang);
  const { current: ritu, loading: rituLoading } = useCurrentRitu(location);
  const sections = getPanchangaSidebarSections();
  const panchakYear = defaultPanchakPatroYear();

  const labelForItem = (item: PanchangaSidebarItem) => {
    if (item.id === "panchak-patro") {
      return t("panchak.title", { year: digits(panchakYear) });
    }
    if (item.to === "/panchanga/element/$name" && item.params?.name) {
      return elementTitle(item.params.name);
    }
    if (item.to === "/sait/$category" && item.params?.category) {
      return t(`sait.categories.${item.params.category}`);
    }
    return t(item.labelKey);
  };

  return (
    <nav className="flex flex-col gap-1 pb-3 pt-2" aria-label={t("sidebar_nav.nav_aria")}>
      <NavSection title={bilingualText(lang, "मुख्य", "Main")} className="pb-2">
        <DrawerClose asChild>
          <NavDrawerLinkCard to="/" label={t("home")} icon={Home} onClick={onNavigate} />
        </DrawerClose>
        <DrawerClose asChild>
          <NavDrawerLinkCard to="/panchanga" search={patroRouteLinkSearch("/panchanga", location, era, { year: urlBrowse.year, month: urlBrowse.month })} label={t("nav.surya_panchanga")} icon={Star} onClick={onNavigate} />
        </DrawerClose>
        <DrawerClose asChild>
          <NavDrawerLinkCard to="/learn" label={t("nav.learn")} icon={BookOpen} onClick={onNavigate} />
        </DrawerClose>
      </NavSection>

      {sections.map((section) => (
        <NavSection key={section.id} title={t(section.titleKey)}>
          {section.items.map((item) => {
            const label = labelForItem(item);
            const search = itemSearch(item, location, era, {
              year: urlBrowse.year,
              month: urlBrowse.month,
            });
            const icon = resolveIcon(section.id, item.id);

            if (item.id === "ritu") {
              return (
                <DrawerNavLink
                  key={item.id}
                  item={item}
                  label={label}
                  search={search}
                  onNavigate={onNavigate}
                  iconNode={
                    rituLoading ? (
                      <Sprout size={20} strokeWidth={1.75} className="shrink-0 text-danger dark:text-danger" aria-hidden />
                    ) : ritu?.emoji ? (
                      <span className="text-sm leading-none" aria-hidden>
                        {ritu.emoji}
                      </span>
                    ) : (
                      <Sprout size={20} strokeWidth={1.75} className="shrink-0 text-danger dark:text-danger" aria-hidden />
                    )
                  }
                />
              );
            }

            return (
              <DrawerNavLink
                key={item.id}
                item={item}
                label={label}
                icon={icon}
                search={search}
                onNavigate={onNavigate}
              />
            );
          })}
        </NavSection>
      ))}
    </nav>
  );
}
