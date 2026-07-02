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
  BS_MONTH_NAMES,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  getBSMonthLength,
  getCurrentBs,
} from "@/lib/bs-calendar";
import { useLocale } from "@/i18n/locale";
import {
  computeAbhijitFromSunTimes,
  formatBsMonthDayPatro,
} from "@/lib/panchanga-format";
import { todayAdStringInTimezone } from "@/lib/zoned-time";
import {
  patroDataTableWrap,
  patroEmpty,
  patroErrorBox,
  patroNoteBox,
  patroSelect,
  patroSkel,
} from "@/lib/patro-classes";
import { cn } from "@/lib/utils";

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
  const { pick, digits } = useLocale();
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
            {pick(BS_MONTHS_NE[month - 1], BS_MONTH_NAMES[month - 1])} {digits(year)}
            {" · "}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
          <select
            className={patroSelect}
            value={year}
            aria-label={t("abhijit.year_label")}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {BS_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {digits(y)}
              </option>
            ))}
          </select>
          <select
            className={patroSelect}
            value={month}
            aria-label={t("abhijit.month_label")}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {BS_MONTHS_NE.map((name, i) => (
              <option key={name} value={i + 1}>
                {pick(name, BS_MONTH_NAMES[i])}
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

      <p className={patroNoteBox}>{t("abhijit.note")}</p>

      {monthQ.isError ? (
        <div className={patroErrorBox}>{t("abhijit.error")}</div>
      ) : monthQ.isLoading ? (
        <div className={cn(patroSkel, "h-60 w-full rounded-lg")} />
      ) : rows.length === 0 ? (
        <p className={patroEmpty}>{t("abhijit.none")}</p>
      ) : (
        <div className={patroDataTableWrap}>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th scope="col" className="border-b border-foreground/8 bg-foreground/4 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  {t("abhijit.col_day")}
                </th>
                <th scope="col" className="border-b border-foreground/8 bg-foreground/4 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  {t("abhijit.col_weekday")}
                </th>
                <th scope="col" className="border-b border-foreground/8 bg-foreground/4 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  {t("abhijit.col_ad")}
                </th>
                <th scope="col" className="border-b border-foreground/8 bg-foreground/4 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  {t("abhijit.col_abhijit")}
                </th>
                <th scope="col" className="border-b border-foreground/8 bg-foreground/4 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  {t("abhijit.col_noon")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ day, abhijit }) => {
                const isToday = day.date_ad === todayAd;
                return (
                  <tr
                    key={day.date_ad}
                    className={isToday ? "bg-secondary/12 dark:bg-primary/10" : undefined}
                  >
                    <td className="border-b border-foreground/8 px-3 py-2.5 align-top last:border-b-0">
                      <span className="block text-[15px] font-bold font-num">{digits(day.day)}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {formatBsMonthDayPatro(year, month, day.day)}
                      </span>
                    </td>
                    <td className="border-b border-foreground/8 px-3 py-2.5 align-top last:border-b-0">
                      {pick(day.weekday_ne ?? day.weekday, day.weekday_en ?? day.weekday)}
                    </td>
                    <td className="mono border-b border-foreground/8 px-3 py-2.5 align-top last:border-b-0">
                      {fmtAdShort(day.date_ad)}
                    </td>
                    <td className="mono border-b border-foreground/8 px-3 py-2.5 align-top font-bold text-secondary last:border-b-0 dark:text-primary">
                      {abhijit.rangeDisplay}
                    </td>
                    <td className="mono border-b border-foreground/8 px-3 py-2.5 align-top last:border-b-0">
                      {abhijit.noonDisplay ?? "—"}
                    </td>
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
