import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Pause, Play } from "lucide-react";
import { fetchPanchanga, panchangaKeys, type PanchangaDay } from "@/lib/api";
import {
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsToAD,
  getBSMonthLength,
  getCurrentBs,
} from "@/lib/bs-calendar";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { useRouteLoading } from "@/lib/route-loading";
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import {
  panchangaYearBulkKey,
  seedYearPanchangaCache,
} from "@/lib/panchanga-year-cache";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i
);

function daysInBsYear(year: number): number {
  let total = 0;
  for (let m = 1; m <= 12; m++) total += getBSMonthLength(year, m);
  return total;
}

function bsMonthDayFromDayOfYear(year: number, dayOfYear: number): { month: number; day: number } {
  let remaining = dayOfYear;
  for (let m = 1; m <= 12; m++) {
    const len = getBSMonthLength(year, m);
    if (remaining <= len) return { month: m, day: remaining };
    remaining -= len;
  }
  return { month: 12, day: getBSMonthLength(year, 12) };
}

function dayOfYearFromBs(year: number, month: number, day: number): number {
  let d = day;
  for (let m = 1; m < month; m++) d += getBSMonthLength(year, m);
  return d;
}

function adDateStrForDay(year: number, dayOfYear: number): string {
  const { month, day } = bsMonthDayFromDayOfYear(year, dayOfYear);
  const date = bsToAD(year, month, day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Debounce before fetching a cold day over the network. Cached days render live
 * via synchronous cache reads while the thumb moves.
 */
const SCRUB_DEBOUNCE_MS = 90;
/** Shorter debounce while dragging so uncached days start loading before release. */
const SCRUB_FETCH_MS = 120;
/** PanchangaYear never blocks the page with the route overlay while scrubbing. */
const YEAR_ROUTE_LOADING = false;

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

function readYearFromLocationSearch(search: unknown): number | undefined {
  const raw = (search as { year?: unknown } | undefined)?.year;
  const year = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : undefined;
  if (year == null || !Number.isFinite(year)) return undefined;
  return year;
}

export function PanchangaYear() {
  const { t } = useTranslation();
  const { location, setLocation } = usePanchangaLocation();
  const searchYear = useRouterState({
    select: (state) => readYearFromLocationSearch(state.location.search),
  });
  const queryClient = useQueryClient();
  const todayBs = useMemo(() => adToBS(new Date()), []);
  const [year, setYear] = useState(() => initialYearFromSearch(searchYear));
  const [dayOfYear, setDayOfYear] = useState(() =>
    dayOfYearFromBs(todayBs.year, todayBs.month, todayBs.day)
  );
  // Decoupled from dayOfYear so the slider thumb tracks the pointer instantly
  // while the (much heavier) network fetch only fires once dragging settles —
  // otherwise every day crossed while dragging fires its own request and they
  // all queue up behind each other.
  const [queryDay, setQueryDay] = useState(dayOfYear);
  const [playing, setPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    if (searchYear == null) return;
    const next = initialYearFromSearch(searchYear);
    setYear((current) => (current === next ? current : next));
  }, [searchYear]);

  const totalDays = useMemo(() => daysInBsYear(year), [year]);
  const clampedDay = Math.min(dayOfYear, totalDays);
  const clampedQueryDay = Math.min(queryDay, totalDays);

  const yearBulkQ = useQuery({
    queryKey: panchangaYearBulkKey(year, location.params),
    queryFn: () => seedYearPanchangaCache(year, location.params, queryClient),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const yearFullyCached = yearBulkQ.isSuccess;

  const prefetchDay = useCallback(
    (day: number) => {
      if (yearFullyCached || day < 1 || day > totalDays) return;
      const dateStr = adDateStrForDay(year, day);
      void queryClient.prefetchQuery({
        queryKey: panchangaKeys.day(dateStr, "ad", location.params),
        queryFn: () => fetchPanchanga(dateStr, "ad", location.params),
        staleTime: 1000 * 60 * 30,
      });
    },
    [yearFullyCached, year, totalDays, location.params, queryClient],
  );

  const prefetchAround = useCallback(
    (centerDay: number, radius = 5) => {
      for (let d = centerDay - radius; d <= centerDay + radius; d++) {
        prefetchDay(d);
      }
    },
    [prefetchDay],
  );

  const finishScrub = useCallback(() => {
    setIsScrubbing(false);
    setQueryDay(clampedDay);
    prefetchAround(clampedDay);
  }, [clampedDay, prefetchAround]);

  useEffect(() => {
    const delay = isScrubbing ? SCRUB_FETCH_MS : SCRUB_DEBOUNCE_MS;
    const id = setTimeout(() => setQueryDay(dayOfYear), delay);
    return () => clearTimeout(id);
  }, [dayOfYear, isScrubbing]);

  // Kick off fetch for the thumb day while dragging so the wheel can update
  // before pointer-up when that day is not yet in the cache.
  useEffect(() => {
    if (!isScrubbing) return;
    prefetchDay(clampedDay);
  }, [isScrubbing, clampedDay, prefetchDay]);

  // Playback: advance one day per second, looping back to day 1 at year's end.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setDayOfYear((d) => (d >= totalDays ? 1 : d + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [playing, totalDays]);

  // The debounced day drives the actual network subscription: it only changes
  // once dragging settles, so we never fire a request per crossed day.
  const debouncedDateStr = useMemo(
    () => adDateStrForDay(year, clampedQueryDay),
    [year, clampedQueryDay]
  );

  const { data, isError } = useQuery({
    queryKey: panchangaKeys.day(debouncedDateStr, "ad", location.params),
    queryFn: () => fetchPanchanga(debouncedDateStr, "ad", location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
    enabled: !yearFullyCached,
  });

  const liveDateStr = useMemo(
    () => adDateStrForDay(year, clampedDay),
    [year, clampedDay]
  );
  const cachedLiveData = queryClient.getQueryData<PanchangaDay>(
    panchangaKeys.day(liveDateStr, "ad", location.params)
  );

  const { data: fetchingLiveData, isPlaceholderData: fetchingIsPlaceholder } = useQuery({
    queryKey: panchangaKeys.day(liveDateStr, "ad", location.params),
    queryFn: () => fetchPanchanga(liveDateStr, "ad", location.params),
    staleTime: 1000 * 60 * 30,
    enabled: isScrubbing && !cachedLiveData && !yearFullyCached,
    placeholderData: keepPreviousData,
  });

  const displayData =
    cachedLiveData ??
    (fetchingLiveData && !fetchingIsPlaceholder ? fetchingLiveData : undefined) ??
    data;
  const displayDateStr = cachedLiveData
    ? liveDateStr
    : fetchingLiveData && !fetchingIsPlaceholder
      ? liveDateStr
      : debouncedDateStr;

  // Wheel header tracks the slider thumb; panchanga data may trail on cold days.
  const { month: bsMonth, day: bsDay } = useMemo(
    () => bsMonthDayFromDayOfYear(year, clampedDay),
    [year, clampedDay]
  );
  const { month: liveMonth, day: liveDay } = bsMonthDayFromDayOfYear(year, clampedDay);
  const yearLoading = yearBulkQ.isFetching && !yearFullyCached;

  const effectiveTimezone = resolveTimeZone(displayData?.location?.timezone, location.params.timezone);
  const isToday = displayDateStr === todayAdStringInTimezone(new Date(), effectiveTimezone);
  const locationLabel = displayData?.location?.name ?? location.label;

  function handleYearChange(nextYear: number) {
    setYear(nextYear);
    setDayOfYear((d) => Math.min(d, daysInBsYear(nextYear)));
    setQueryDay((d) => Math.min(d, daysInBsYear(nextYear)));
  }

  useRouteLoading(YEAR_ROUTE_LOADING);

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 mt-2">
        <div>
          <Link
            to="/panchanga"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("panchanga_year.back")}
          </Link>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0">
            {t("panchanga_year.title")}
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            {BS_MONTHS_NE[liveMonth - 1]} {toNepaliDigits(liveDay)}, {toNepaliDigits(year)}
            {" · "}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {locationLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
          <select
            className="pn-select"
            value={year}
            aria-label={t("common.bs_year")}
            onChange={(e) => handleYearChange(Number(e.target.value))}
          >
            {BS_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
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

      <div className="flex flex-col gap-4">
        {displayData && (
          <PanchangaWheel
            p={displayData}
            bsYear={year}
            bsMonthNe={BS_MONTHS_NE[bsMonth - 1]!}
            bsDay={bsDay}
            isToday={isToday}
            timezone={effectiveTimezone}
            locationLabel={locationLabel}
            atTimeScrubOnly
          />
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 text-destructive p-4 text-sm">
            {t("panchanga_year.error")}
          </div>
        )}

        {yearLoading ? (
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {t("panchanga_year.loading_year")}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-secondary animate-pulse" />
            </div>
          </div>
        ) : yearFullyCached ? (
          <p className="text-xs text-muted-foreground m-0 px-1">
            {yearBulkQ.data?.fromPersistentCache
              ? t("panchanga_year.year_from_cache")
              : t("panchanga_year.year_ready")}
          </p>
        ) : null}

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {t("panchanga_year.scrub_label")}
            </span>
            <span className="text-sm font-mono font-semibold tabular-nums">
              {toNepaliDigits(clampedDay)} / {toNepaliDigits(totalDays)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? t("panchanga_year.pause") : t("panchanga_year.play")}
              title={playing ? t("panchanga_year.pause") : t("panchanga_year.play_title")}
              className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              {playing ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 translate-x-[1px]" />
              )}
            </button>
            <input
              type="range"
              className="w-full"
              min={1}
              max={totalDays}
              step={1}
              value={clampedDay}
              onPointerDown={() => setIsScrubbing(true)}
              onPointerUp={finishScrub}
              onPointerCancel={finishScrub}
              onLostPointerCapture={finishScrub}
              onChange={(e) => setDayOfYear(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
