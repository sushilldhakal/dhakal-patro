import type { ReactNode } from "react";
import { lazy, Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { CalendarDay, PanchangaDay } from "@/lib/api";
import { fetchFestivals, holidayKeys } from "@/lib/api";
import {
  buildMonthFestivalEntries,
  daysDiffFromAd,
  formatBsMonthDayPatro,
  toNepaliDigits,
} from "@/lib/panchanga-format";
import { patroEmpty, patroFestRow } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";
import { importWithRetry } from "@/lib/lazy-route";
import { PanchangaVivaranPanel } from "@/components/home/PanchangaVivaranPanel";

// Secondary tabs — only mount when the user selects them, so keep their code
// (and the heavy timeline/sait data they pull in) out of the eager home bundle.
const SaitAsidePanel = lazy(() =>
  importWithRetry(() => import("@/components/home/SaitAsidePanel")).then((m) => ({
    default: m.SaitAsidePanel,
  })),
);
const MuhurtaAsidePanel = lazy(() =>
  importWithRetry(() => import("@/components/home/MuhurtaAsidePanel")).then((m) => ({
    default: m.MuhurtaAsidePanel,
  })),
);

function TabFallback() {
  return <div className="h-40 animate-pulse rounded-md bg-muted" />;
}

export type AsideTabId = "panchanga" | "festivals" | "sait" | "muhurta";

export const ASIDE_TAB_IDS: AsideTabId[] = ["panchanga", "festivals", "sait", "muhurta"];

function AsideEmpty({ children }: { children: ReactNode }) {
  return <p className={patroEmpty}>{children}</p>;
}

function FestivalsTab({
  bsYear,
  bsMonth,
  monthDays,
  todayAd,
}: {
  bsYear: number;
  bsMonth: number;
  monthDays: CalendarDay[];
  todayAd: string;
}) {
  const { t } = useTranslation();
  const festivalsQ = useQuery({
    queryKey: holidayKeys.festivals(bsYear, bsMonth),
    queryFn: () => fetchFestivals(bsYear, bsMonth),
    staleTime: 1000 * 60 * 60,
  });

  const adByBsDay = useMemo(
    () => new Map(monthDays.map((day) => [day.day, day.date_ad])),
    [monthDays],
  );

  const entries = useMemo(
    () => buildMonthFestivalEntries(bsYear, bsMonth, monthDays, festivalsQ.data?.festivals ?? []),
    [bsYear, bsMonth, monthDays, festivalsQ.data?.festivals],
  );

  if (festivalsQ.isLoading && !entries.length) {
    return <div className="h-40 animate-pulse rounded-md bg-muted" />;
  }

  if (!entries.length) {
    return <AsideEmpty>{t("panchanga.no_festivals_month")}</AsideEmpty>;
  }

  return (
    <ul className="m-0 list-none overflow-hidden rounded-lg bg-surface-inset p-0 shadow-ring-soft">
      {entries.map((entry) => {
        const festAd = adByBsDay.get(entry.bsDay);
        const daysLeft = festAd != null ? daysDiffFromAd(todayAd, festAd) : null;
        const isToday = daysLeft === 0;
        const isPast = daysLeft != null && daysLeft < 0;

        let countLabel: string | null = null;
        if (daysLeft != null) {
          if (daysLeft === 0) countLabel = t("rel.today");
          else if (daysLeft === 1) countLabel = t("rel.tomorrow");
          else if (daysLeft > 1) countLabel = toNepaliDigits(daysLeft);
          else if (daysLeft === -1) countLabel = t("rel.yesterday");
          else countLabel = toNepaliDigits(Math.abs(daysLeft));
        }

        return (
          <li
            key={entry.bsDay}
            className={patroFestRow({
              today: isToday,
              past: isPast,
            })}
            title={formatBsMonthDayPatro(bsYear, bsMonth, entry.bsDay)}
          >
            <span className="font-num text-center text-[13px] font-bold leading-none text-muted-foreground" aria-hidden>
              {toNepaliDigits(entry.bsDay)}
            </span>
            <span
              className={cn(
                "min-w-0 text-[12.5px] leading-snug font-semibold text-foreground",
                entry.isPublicHoliday && "text-danger",
                isToday && !entry.isPublicHoliday && "text-accent",
              )}
            >
              {entry.name}
            </span>
            {countLabel ? (
              <span
                className={cn(
                  "font-num inline-flex min-w-8 shrink-0 items-baseline justify-end gap-px text-xs font-bold text-accent",
                  isPast && "text-[10px] font-semibold text-muted-foreground",
                  isToday && "text-[10px] font-bold text-accent",
                )}
              >
                {countLabel}
                {daysLeft != null && daysLeft > 1 ? (
                  <span className="text-[9px] font-semibold text-muted-foreground">{t("rel.days_unit")}</span>
                ) : null}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  tab: AsideTabId;
  p?: PanchangaDay;
  selectedDay: CalendarDay | null;
  selectedAdDate: string;
  bsYear: number;
  bsMonth: number;
  monthDays: CalendarDay[];
  todayAd: string;
  loading?: boolean;
};

export function PanchangaAsideTabPanel({
  tab,
  p,
  selectedDay,
  selectedAdDate,
  bsYear,
  bsMonth,
  monthDays,
  todayAd,
  loading,
}: Props) {
  if (loading) {
    return tab === "panchanga" ? (
      <PanchangaVivaranPanel loading bsYear={bsYear} bsMonth={bsMonth} />
    ) : tab === "sait" ? (
      <Suspense fallback={<TabFallback />}>
        <SaitAsidePanel defaultYear={bsYear} />
      </Suspense>
    ) : (
      <TabFallback />
    );
  }

  if (tab === "festivals") {
    return (
      <FestivalsTab bsYear={bsYear} bsMonth={bsMonth} monthDays={monthDays} todayAd={todayAd} />
    );
  }

  if (tab === "sait") {
    return (
      <Suspense fallback={<TabFallback />}>
        <SaitAsidePanel
          defaultYear={bsYear}
          highlightMonth={bsMonth}
          highlightDay={selectedDay?.day}
        />
      </Suspense>
    );
  }

  if (!p) return null;

  switch (tab) {
    case "panchanga":
      return (
        <PanchangaVivaranPanel
          p={p}
          selectedDay={selectedDay}
          bsYear={bsYear}
          bsMonth={bsMonth}
        />
      );
    case "muhurta":
      return (
        <Suspense fallback={<TabFallback />}>
          <MuhurtaAsidePanel p={p} dateAd={selectedAdDate} />
        </Suspense>
      );
    default:
      return null;
  }
}
