import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import { getCurrentBs } from "@/lib/bs-calendar";
import { defaultPanchakPatroYear } from "@/lib/panchak/panchak-patro-data";
import {
  preloadAllPanchangaRoutes,
  preloadPanchangaRoute,
  resolveSidebarLinkPath,
} from "@/lib/panchanga-route-preload";
import {
  getPanchangaSidebarSections,
  type PanchangaSidebarItem,
  type PanchangaSidebarSection,
} from "@/lib/panchanga-sidebar-nav";
import { buildDainikKrantiSearch } from "@/lib/url-state";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { cn } from "@/lib/utils";

function itemSearch(
  item: PanchangaSidebarItem,
  location: ReturnType<typeof usePanchangaLocation>["location"],
): Record<string, unknown> | undefined {
  if (item.id === "dainikkranti") {
    const { year, month } = getCurrentBs();
    return buildDainikKrantiSearch(location, year, month) as Record<string, unknown>;
  }
  if (item.id === "panchak-patro") {
    return { year: defaultPanchakPatroYear() };
  }
  return undefined;
}

export function isSidebarItemActive(pathname: string, item: PanchangaSidebarItem): boolean {
  if (item.to === "/panchanga/element/$name" && item.params?.name) {
    return pathname === `/panchanga/element/${item.params.name}`;
  }
  if (item.to === "/sait/$category" && item.params?.category) {
    return pathname === `/sait/${item.params.category}`;
  }
  return pathname === item.to;
}

function findActiveSectionId(
  pathname: string,
  sections: PanchangaSidebarSection[],
): string | null {
  for (const section of sections) {
    if (section.items.some((item) => isSidebarItemActive(pathname, item))) {
      return section.id;
    }
  }
  return null;
}

function SidebarLink({
  item,
  active,
  label,
  blurb,
  search,
  onPrefetch,
}: {
  item: PanchangaSidebarItem;
  active: boolean;
  label: string;
  blurb?: string;
  search?: Record<string, unknown>;
  onPrefetch: () => void;
}) {
  const linkProps = item.params
    ? { to: item.to as "/panchanga/element/$name" | "/sait/$category", params: item.params }
    : { to: item.to as "/" };

  return (
    <li>
      <Link
        {...linkProps}
        {...(search ? { search } : {})}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
        className={cn(
          "block rounded-xl px-3 py-2 text-left transition-colors",
          active
            ? "bg-secondary/12 text-secondary ring-1 ring-secondary/25"
            : "text-foreground hover:bg-muted",
        )}
        aria-current={active ? "page" : undefined}
      >
        <span className="block text-sm font-medium leading-snug">{label}</span>
        {blurb ? (
          <span className="mt-0.5 block text-[0.68rem] leading-snug text-muted-foreground">
            {blurb}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function SidebarSection({
  section,
  expanded,
  onToggle,
  pathname,
  location,
  panchakYear,
  digits,
  t,
  pick,
}: {
  section: PanchangaSidebarSection;
  expanded: boolean;
  onToggle: () => void;
  pathname: string;
  location: ReturnType<typeof usePanchangaLocation>["location"];
  panchakYear: number;
  digits: (v: number | string) => string;
  t: ReturnType<typeof useTranslation>["t"];
  pick: (ne: string, en: string) => string;
}) {
  const title = pick(section.titleNe, section.titleEn);
  const hasActiveItem = section.items.some((item) => isSidebarItemActive(pathname, item));

  return (
    <section className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
          expanded || hasActiveItem
            ? "text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          hasActiveItem && !expanded && "bg-secondary/6 text-secondary",
        )}
      >
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform duration-200",
            expanded ? "rotate-0" : "-rotate-90",
            hasActiveItem ? "text-secondary" : "text-muted-foreground",
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1 text-sm font-bold uppercase leading-snug tracking-wide">
          {title}
        </span>
      </button>

      {expanded ? (
        <ul className="flex flex-col gap-0.5 px-1 pb-2">
          {section.items.map((item) => {
            let label = pick(item.labelNe, item.labelEn);
            if (item.id === "panchak-patro") {
              label = t("panchak.title", { year: digits(panchakYear) });
            }
            const blurb = item.blurbNe
              ? pick(item.blurbNe, item.blurbEn ?? "")
              : undefined;
            const search = itemSearch(item, location);
            const active = isSidebarItemActive(pathname, item);
            const prefetch = () =>
              preloadPanchangaRoute(resolveSidebarLinkPath(item.to, item.params));

            return (
              <SidebarLink
                key={item.id}
                item={item}
                active={active}
                label={label}
                blurb={blurb}
                search={search}
                onPrefetch={prefetch}
              />
            );
          })}
        </ul>
      ) : hasActiveItem ? (
        <ul className="flex flex-col gap-0.5 px-1 pb-2">
          {section.items
            .filter((item) => isSidebarItemActive(pathname, item))
            .map((item) => {
              let label = pick(item.labelNe, item.labelEn);
              if (item.id === "panchak-patro") {
                label = t("panchak.title", { year: digits(panchakYear) });
              }
              const blurb = item.blurbNe
                ? pick(item.blurbNe, item.blurbEn ?? "")
                : undefined;
              const search = itemSearch(item, location);
              const prefetch = () =>
                preloadPanchangaRoute(resolveSidebarLinkPath(item.to, item.params));

              return (
                <SidebarLink
                  key={item.id}
                  item={item}
                  active
                  label={label}
                  blurb={blurb}
                  search={search}
                  onPrefetch={prefetch}
                />
              );
            })}
        </ul>
      ) : null}
    </section>
  );
}

export function PanchangaSidebarNav({ className }: { className?: string }) {
  const { pick, digits } = useLocale();
  const { t } = useTranslation();
  const { location } = usePanchangaLocation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const sections = getPanchangaSidebarSections();
  const panchakYear = defaultPanchakPatroYear();

  const activeSectionId = findActiveSectionId(pathname, sections);
  const [expandedId, setExpandedId] = useState<string | null>(activeSectionId);

  useEffect(() => {
    if (activeSectionId) {
      setExpandedId(activeSectionId);
    }
  }, [activeSectionId]);

  useEffect(() => {
    const run = () => preloadAllPanchangaRoutes();
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run);
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(run, 400);
    return () => globalThis.clearTimeout(id);
  }, []);

  return (
    <nav
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_6%,transparent)]",
        className,
      )}
      aria-label={pick("पञ्चाङ्ग नेभिगेसन", "Panchanga navigation")}
    >
      <p className="border-b border-border px-4 py-3 text-md font-semibold uppercase tracking-wider text-muted-foreground">
        {pick("पञ्चाङ्ग", "Panchanga")}
      </p>
      <div className="flex max-h-[calc(100vh-6.5rem)] flex-col overflow-y-auto p-1">
        {sections.map((section) => (
          <SidebarSection
            key={section.id}
            section={section}
            expanded={expandedId === section.id}
            onToggle={() =>
              setExpandedId((current) => (current === section.id ? null : section.id))
            }
            pathname={pathname}
            location={location}
            panchakYear={panchakYear}
            digits={digits}
            t={t}
            pick={pick}
          />
        ))}
      </div>
    </nav>
  );
}
