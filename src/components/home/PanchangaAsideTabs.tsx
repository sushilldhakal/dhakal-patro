import type { ReactNode } from "react";
import { useMemo } from "react";
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
import { PanchangaVivaranPanel } from "@/components/home/PanchangaVivaranPanel";
import { SaitAsidePanel } from "@/components/home/SaitAsidePanel";
import { MuhurtaAsidePanel } from "@/components/home/MuhurtaAsidePanel";

export type AsideTabId = "panchanga" | "festivals" | "sait" | "muhurta";

export const ASIDE_TAB_IDS: AsideTabId[] = ["panchanga", "festivals", "sait", "muhurta"];

function AsideEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="pn-aside-tab-empty">{children}</p>
  );
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
    return <div className="pn-aside-tab-skel" />;
  }

  if (!entries.length) {
    return <AsideEmpty>{t("panchanga.no_festivals_month")}</AsideEmpty>;
  }

  return (
    <ul className="pn-aside-fest-compact">
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
            key={`${entry.bsDay}-${entry.name}`}
            className={`pn-aside-fest-compact-row${entry.isPublicHoliday ? " public" : ""}${isToday ? " today" : ""}${isPast ? " past" : ""}`}
            title={formatBsMonthDayPatro(bsYear, bsMonth, entry.bsDay)}
          >
            <span className="pn-aside-fest-compact-day" aria-hidden>
              {toNepaliDigits(entry.bsDay)}
            </span>
            <span className="pn-aside-fest-compact-name">{entry.name}</span>
            {countLabel ? (
              <span className="pn-aside-fest-compact-count">
                {countLabel}
                {daysLeft != null && daysLeft > 1 ? (
                  <span className="pn-aside-fest-compact-count-unit">{t("rel.days_unit")}</span>
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
      <SaitAsidePanel defaultYear={bsYear} />
    ) : tab === "festivals" ? (
      <div className="pn-aside-tab-skel" />
    ) : (
      <div className="pn-aside-tab-skel" />
    );
  }

  if (tab === "festivals") {
    return (
      <FestivalsTab
        bsYear={bsYear}
        bsMonth={bsMonth}
        monthDays={monthDays}
        todayAd={todayAd}
      />
    );
  }

  if (tab === "sait") {
    return (
      <SaitAsidePanel
        defaultYear={bsYear}
        highlightMonth={bsMonth}
        highlightDay={selectedDay?.day}
      />
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
      return <MuhurtaAsidePanel p={p} dateAd={selectedAdDate} />;
    default:
      return null;
  }
}
