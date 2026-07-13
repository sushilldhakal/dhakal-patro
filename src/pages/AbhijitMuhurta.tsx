import { useEffect, useMemo, useState } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CalendarDays, MapPin, Sparkles, Sun } from "lucide-react";
import {
  fetchMonthCalendar,
  panchangaKeys,
  type CalendarDay,
} from "@/lib/api";
import { PageShell } from "@/components/PageShell";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import {
  displayLocationLabel,
  resolveLocationTimezone,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { useRouteLoading } from "@/lib/route-loading";
import {
  BS_MONTHS_NE,
  BS_MONTH_NAMES,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  getBSMonthLength,
  getCurrentBs,
} from "@/lib/bs-calendar";
import { useLocale } from "@/i18n/locale";
import {
  computeAbhijitFromSunTimes,
  formatBsMonthDayPatro,
  formatClockNepali,
} from "@/lib/panchanga-format";
import { todayAdStringInTimezone } from "@/lib/zoned-time";
import {
  locationToSearch,
  sameLocationParams,
  sameSearch,
  searchToLocation,
  type AbhijitSearch,
} from "@/lib/url-state";
import {
  patroEmpty,
  patroErrorBox,
  patroSelect,
  patroSkel,
} from "@/lib/patro-classes";
import { cn } from "@/lib/utils";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

const routeApi = getRouteApi("/abhijit-muhurta");

type AbhijitRow = {
  day: CalendarDay;
  abhijit: NonNullable<ReturnType<typeof computeAbhijitFromSunTimes>>;
};

function fmtAdShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

function initialYearFromSearch(searchYear?: number): number {
  if (
    searchYear != null &&
    searchYear >= BS_SUPPORTED_START_YEAR &&
    searchYear <= BS_SUPPORTED_END_YEAR
  ) {
    return searchYear;
  }
  return getCurrentBs().year;
}

function initialMonthFromSearch(searchMonth?: number): number {
  if (searchMonth != null && searchMonth >= 1 && searchMonth <= 12) {
    return searchMonth;
  }
  return getCurrentBs().month;
}

function buildRows(
  days: CalendarDay[],
  bsYear: number,
  bsMonth: number,
): AbhijitRow[] {
  const monthLen = getBSMonthLength(bsYear, bsMonth);
  const byDay = new Map(days.map((d) => [d.day, d]));

  return Array.from({ length: monthLen }, (_, i) => {
    const bsDay = i + 1;
    const day = byDay.get(bsDay);
    if (!day?.sunrise || !day?.sunset) return null;
    const abhijit = computeAbhijitFromSunTimes(day.sunrise, day.sunset);
    if (!abhijit) return null;
    return { day, abhijit };
  }).filter((row): row is AbhijitRow => row != null);
}

function AbhijitDayCard({
  row,
  isToday,
}: {
  row: AbhijitRow;
  isToday: boolean;
}) {
  const { t } = useTranslation();
  const { pick, digits } = useLocale();
  const { day, abhijit } = row;
  const adDay = new Date(`${day.date_ad}T12:00:00`).getDate();
  const sunrise = formatClockNepali(day.sunrise) ?? day.sunrise ?? "—";
  const sunset = formatClockNepali(day.sunset) ?? day.sunset ?? "—";
  const weekday = pick(day.weekday_ne ?? day.weekday, day.weekday_en ?? day.weekday);

  return (
    <article
      className={cn(
        "group flex min-h-[132px] flex-col rounded-xl border bg-card p-2.5 shadow-xs transition-colors sm:min-h-[140px] sm:p-3",
        isToday
          ? "border-secondary/50 bg-secondary/10 ring-2 ring-secondary/30 dark:border-primary/40 dark:bg-primary/10 dark:ring-primary/25"
          : "border-border hover:border-secondary/30 hover:bg-muted/20 dark:hover:border-primary/30",
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className="truncate text-sm font-semibold sm:text-sm">
          {weekday}
        </span>
        {isToday ? (
          <span className="shrink-0 rounded-full bg-secondary/20 px-1.5 py-px text-sm font-bold uppercase text-secondary dark:bg-primary/20 dark:text-primary">
            {t("abhijit.jump_today")}
          </span>
        ) : null}
      </div>

      <div className="mb-2 flex items-baseline justify-center gap-1.5">
        <span className="font-num text-lg font-bold leading-none tabular-nums sm:text-2xl">
          {digits(day.day)}
        </span>
        <span className="font-num text-sm tabular-nums">/{digits(adDay)}</span>
      </div>

      <div className="mt-auto space-y-1.5">
        <p className="mono m-0 text-center text-sm font-bold leading-tight text-secondary sm:text-xs dark:text-primary">
          {abhijit.rangeDisplay}
        </p>
        <p className="m-0 text-center text-sm sm:text-sm">
          {t("abhijit.col_noon")}{" "}
          <span className="mono text-base text-foreground">{abhijit.noonDisplay ?? "—"}</span>
        </p>
        <p className="mono m-0 truncate text-center text-sm sm:text-sm">
          ↑{sunrise} · ↓{sunset}
        </p>
      </div>
    </article>
  );
}

function AbhijitMonthGrid({
  rows,
  todayAd,
}: {
  rows: AbhijitRow[];
  todayAd: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
      {rows.map((row) => (
        <AbhijitDayCard
          key={row.day.date_ad}
          row={row}
          isToday={row.day.date_ad === todayAd}
        />
      ))}
    </div>
  );
}

export function AbhijitMuhurta() {
  const { t } = useTranslation();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { pick, digits } = useLocale();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const todayBs = useMemo(() => adToBS(new Date()), []);
  const [year, setYear] = useState(() => initialYearFromSearch(search.year));
  const [month, setMonth] = useState(() => initialMonthFromSearch(search.month));

  useEffect(() => {
    const desired: AbhijitSearch = {
      ...locationToSearch(location),
      year,
      month,
    };
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [location, year, month, search, navigate]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (search.year != null) {
      const next = initialYearFromSearch(search.year);
      setYear((current) => (current === next ? current : next));
    }
    if (search.month != null) {
      const next = initialMonthFromSearch(search.month);
      setMonth((current) => (current === next ? current : next));
    }
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  const todayRow = useMemo(
    () => rows.find(({ day }) => day.date_ad === todayAd) ?? null,
    [rows, todayAd],
  );

  const locationLabel = displayLocationLabel(location);
  const monthLabel = pick(BS_MONTHS_NE[month - 1], BS_MONTH_NAMES[month - 1]);
  const viewingTodayMonth = year === todayBs.year && month === todayBs.month;

  useRouteLoading(monthQ.isLoading);

  function goToToday() {
    setYear(todayBs.year);
    setMonth(todayBs.month);
  }

  return (
    <PageShell className="pb-16 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-base hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("abhijit.back_home")}
          </Link>
          <h1 className="text-[clamp(1.75rem,4vw,2.125rem)] font-bold leading-tight tracking-tight m-0 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-secondary shrink-0 dark:text-primary" />
            {t("abhijit.title")}
          </h1>
          <p className="text-sm mt-1.5 max-w-xl leading-relaxed">
            {t("abhijit.subtitle")}
          </p>
          <div className="text-sm mt-2 inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {locationLabel}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto lg:justify-end">
          {!viewingTodayMonth ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted/50 transition-colors"
              onClick={goToToday}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {t("abhijit.jump_today")}
            </button>
          ) : null}
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

      {todayRow ? (
        <section className="relative overflow-hidden rounded-2xl border border-secondary/30 bg-linear-to-br from-secondary/15 via-card to-card p-5 sm:p-6 shadow-xs dark:border-primary/30 dark:from-primary/15">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary/10 blur-2xl dark:bg-primary/10" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-secondary dark:text-primary mb-1">
                {t("abhijit.today_hero")}
              </p>
              <p className="text-sm mb-2">
                {formatBsMonthDayPatro(year, month, todayRow.day.day)}
                {" · "}
                {pick(
                  todayRow.day.weekday_ne ?? todayRow.day.weekday,
                  todayRow.day.weekday_en ?? todayRow.day.weekday,
                )}
              </p>
              <p className="mono text-[clamp(1.5rem,5vw,2rem)] font-bold text-foreground leading-tight">
                {todayRow.abhijit.rangeDisplay}
              </p>
              <p className="mt-2 text-sm">
                {t("abhijit.col_noon")}:{" "}
                <span className="mono font-semibold text-foreground">
                  {todayRow.abhijit.noonDisplay ?? "—"}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  {t("abhijit.sun_context", {
                    sunrise:
                      formatClockNepali(todayRow.day.sunrise) ?? todayRow.day.sunrise ?? "—",
                    sunset:
                      formatClockNepali(todayRow.day.sunset) ?? todayRow.day.sunset ?? "—",
                  })}
                </span>
              </div>
              <p className="mono text-xs">{fmtAdShort(todayRow.day.date_ad)}</p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3.5 text-sm leading-relaxed">
        <div className="flex gap-2.5">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-secondary dark:text-primary" />
          <p className="m-0">{t("abhijit.note")}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-foreground m-0">
          {t("abhijit.month_heading")} — {monthLabel} {digits(year)}
        </h2>
        {!monthQ.isLoading && rows.length > 0 ? (
          <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-sm font-semibold">
            {t("abhijit.days_count", { count: rows.length })}
          </span>
        ) : null}
      </div>

      {monthQ.isError ? (
        <div className={patroErrorBox}>{t("abhijit.error")}</div>
      ) : monthQ.isLoading ? (
        <div className={cn(patroSkel, "h-60 w-full rounded-2xl")} />
      ) : rows.length === 0 ? (
        <p className={patroEmpty}>{t("abhijit.none")}</p>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/15 p-3 sm:p-4">
          <AbhijitMonthGrid rows={rows} todayAd={todayAd} />
        </div>
      )}
    </PageShell>
  );
}
