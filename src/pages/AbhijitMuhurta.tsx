import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, Sparkles } from "lucide-react";
import {
  fetchMonthCalendar,
  panchangaKeys,
  type CalendarDay,
} from "@/lib/api";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import {
  resolveLocationTimezone,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { useRouteLoading } from "@/lib/route-loading";
import {
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  getBSMonthLength,
  getCurrentBs,
} from "@/lib/bs-calendar";
import {
  computeAbhijitFromSunTimes,
  formatBsMonthDayPatro,
  toNepaliDigits,
} from "@/lib/panchanga-format";
import { todayAdStringInTimezone } from "@/lib/zoned-time";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

function fmtAdShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

function buildRows(
  days: CalendarDay[],
  bsYear: number,
  bsMonth: number,
): {
  day: CalendarDay;
  abhijit: NonNullable<ReturnType<typeof computeAbhijitFromSunTimes>>;
}[] {
  const monthLen = getBSMonthLength(bsYear, bsMonth);
  const byDay = new Map(days.map((d) => [d.day, d]));

  return Array.from({ length: monthLen }, (_, i) => {
    const bsDay = i + 1;
    const day = byDay.get(bsDay);
    if (!day?.sunrise || !day?.sunset) return null;
    const abhijit = computeAbhijitFromSunTimes(day.sunrise, day.sunset);
    if (!abhijit) return null;
    return { day, abhijit };
  }).filter((row): row is NonNullable<typeof row> => row != null);
}

export function AbhijitMuhurta() {
  const search = useSearch({ strict: false }) as { year?: number; month?: number };
  const yearProp = search.year;
  const monthProp = search.month;
  const { t } = useTranslation();
  const { location, setLocation } = usePanchangaLocation();
  const current = getCurrentBs();
  const [year, setYear] = useState(() => yearProp ?? current.year);
  const [month, setMonth] = useState(() => monthProp ?? current.month);

  useEffect(() => {
    if (yearProp != null) setYear(yearProp);
  }, [yearProp]);

  useEffect(() => {
    if (monthProp != null) setMonth(monthProp);
  }, [monthProp]);

  const todayAd = useMemo(
    () => todayAdStringInTimezone(new Date(), resolveLocationTimezone(location)),
    [location],
  );

  const monthQ = useQuery({
    queryKey: panchangaKeys.month(year, month, location.params, false),
    queryFn: () =>
      fetchMonthCalendar(year, month, location.params, { full: false }),
    staleTime: 1000 * 60 * 60,
  });

  const rows = useMemo(
    () => buildRows(monthQ.data?.calendar ?? [], year, month),
    [monthQ.data?.calendar, year, month],
  );

  useRouteLoading(monthQ.isLoading);

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 mt-2">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("abhijit.back_home")}
          </Link>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-secondary shrink-0" />
            {t("abhijit.title")}
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            {BS_MONTHS_NE[month - 1]} {toNepaliDigits(year)}
            {" · "}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
          <select
            className="pn-select"
            value={year}
            aria-label={t("abhijit.year_label")}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {BS_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            className="pn-select"
            value={month}
            aria-label={t("abhijit.month_label")}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {BS_MONTHS_NE.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <LocationSelector
            compact
            className="shrink-0"
            location={location}
            onLocationChange={setLocation}
          />
        </div>
      </div>

      <p className="pn-abhijit-note">{t("abhijit.note")}</p>

      {monthQ.isError ? (
        <div className="pn-error-box">{t("abhijit.error")}</div>
      ) : monthQ.isLoading ? (
        <div className="pn-aside-tab-skel" style={{ minHeight: 240 }} />
      ) : rows.length === 0 ? (
        <p className="pn-aside-tab-empty">{t("abhijit.none")}</p>
      ) : (
        <div className="pn-abhijit-table-wrap">
          <table className="pn-abhijit-table">
            <thead>
              <tr>
                <th scope="col">{t("abhijit.col_day")}</th>
                <th scope="col">{t("abhijit.col_weekday")}</th>
                <th scope="col">{t("abhijit.col_ad")}</th>
                <th scope="col">{t("abhijit.col_abhijit")}</th>
                <th scope="col">{t("abhijit.col_noon")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ day, abhijit }) => {
                const isToday = day.date_ad === todayAd;
                const isUpcoming = day.date_ad > todayAd;
                return (
                  <tr
                    key={day.date_ad}
                    className={isToday ? "today" : isUpcoming ? "upcoming" : ""}
                  >
                    <td>
                      <span className="pn-abhijit-bs-day">{toNepaliDigits(day.day)}</span>
                      <span className="pn-abhijit-bs-sub">
                        {formatBsMonthDayPatro(year, month, day.day)}
                      </span>
                    </td>
                    <td>{day.weekday_ne ?? day.weekday}</td>
                    <td className="mono">{fmtAdShort(day.date_ad)}</td>
                    <td className="mono pn-abhijit-time">{abhijit.rangeDisplay}</td>
                    <td className="mono">{abhijit.noonDisplay ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
