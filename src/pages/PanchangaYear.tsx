import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";
import { fetchPanchanga, panchangaKeys } from "@/lib/api";
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
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";

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

/** How long to wait after the slider stops moving before fetching that day's data. */
const SCRUB_DEBOUNCE_MS = 180;

export function PanchangaYear() {
  const { location, setLocation } = usePanchangaLocation();
  const queryClient = useQueryClient();
  const todayBs = useMemo(() => adToBS(new Date()), []);
  const [year, setYear] = useState(() => getCurrentBs().year);
  const [dayOfYear, setDayOfYear] = useState(() =>
    dayOfYearFromBs(todayBs.year, todayBs.month, todayBs.day)
  );
  // Decoupled from dayOfYear so the slider thumb tracks the pointer instantly
  // while the (much heavier) network fetch only fires once dragging settles —
  // otherwise every day crossed while dragging fires its own request and they
  // all queue up behind each other.
  const [queryDay, setQueryDay] = useState(dayOfYear);

  const totalDays = useMemo(() => daysInBsYear(year), [year]);
  const clampedDay = Math.min(dayOfYear, totalDays);
  const clampedQueryDay = Math.min(queryDay, totalDays);

  useEffect(() => {
    const id = setTimeout(() => setQueryDay(dayOfYear), SCRUB_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [dayOfYear]);

  const { month: bsMonth, day: bsDay } = useMemo(
    () => bsMonthDayFromDayOfYear(year, clampedQueryDay),
    [year, clampedQueryDay]
  );
  const adDateStr = useMemo(
    () => adDateStrForDay(year, clampedQueryDay),
    [year, clampedQueryDay]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: panchangaKeys.day(adDateStr, "ad", location.params),
    queryFn: () => fetchPanchanga(adDateStr, "ad", location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  // Warm the cache for the immediate neighbours once the scrub settles, so
  // small nudges right after a drag feel instant too.
  useEffect(() => {
    for (let d = clampedQueryDay - 3; d <= clampedQueryDay + 3; d++) {
      if (d < 1 || d > totalDays || d === clampedQueryDay) continue;
      const neighborDateStr = adDateStrForDay(year, d);
      queryClient.prefetchQuery({
        queryKey: panchangaKeys.day(neighborDateStr, "ad", location.params),
        queryFn: () => fetchPanchanga(neighborDateStr, "ad", location.params),
        staleTime: 1000 * 60 * 30,
      });
    }
  }, [year, clampedQueryDay, totalDays, location.params, queryClient]);

  // Slowly warm the whole year in the background, spiraling outward from
  // wherever the scrub currently sits. The backend computes each day's
  // panchanga on first request and caches it, so a day that's never been
  // requested before can take well over a second - prefetching the rest of
  // the year ahead of time means most drags land on an already-warm day.
  useEffect(() => {
    let cancelled = false;
    const startDay = clampedQueryDay;
    const order = Array.from({ length: totalDays }, (_, i) => i + 1).sort(
      (a, b) => Math.abs(a - startDay) - Math.abs(b - startDay)
    );

    async function worker(queue: number[]) {
      while (!cancelled && queue.length) {
        const d = queue.shift();
        if (d == null) return;
        const dateStr = adDateStrForDay(year, d);
        try {
          await queryClient.prefetchQuery({
            queryKey: panchangaKeys.day(dateStr, "ad", location.params),
            queryFn: () => fetchPanchanga(dateStr, "ad", location.params),
            staleTime: 1000 * 60 * 30,
          });
        } catch {
          // Ignore - this is a best-effort cache warm, not a user-facing fetch.
        }
      }
    }

    const queue = [...order];
    const WARM_CONCURRENCY = 3;
    for (let i = 0; i < WARM_CONCURRENCY; i++) worker(queue);

    return () => {
      cancelled = true;
    };
    // Only re-sweep when the year or location changes, not on every scrub
    // settle - the neighbour-prefetch effect above already covers that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, location.params, queryClient, totalDays]);

  const effectiveTimezone = resolveTimeZone(data?.location?.timezone, location.params.timezone);
  const isToday = adDateStr === todayAdStringInTimezone(new Date(), effectiveTimezone);
  const locationLabel = data?.location?.name ?? location.label;

  function handleYearChange(nextYear: number) {
    setYear(nextYear);
    setDayOfYear((d) => Math.min(d, daysInBsYear(nextYear)));
    setQueryDay((d) => Math.min(d, daysInBsYear(nextYear)));
  }

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 mt-2">
        <div>
          <Link
            to="/panchanga"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            दिन हेराइमा फर्कनुहोस्
          </Link>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0">
            वार्षिक पञ्चाङ्ग चक्र
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            {BS_MONTHS_NE[bsMonth - 1]} {toNepaliDigits(bsDay)}, {toNepaliDigits(year)}
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
            aria-label="वि.सं. वर्ष"
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
        {data && !isLoading && (
          <PanchangaWheel
            p={data}
            bsYear={year}
            bsMonthNe={BS_MONTHS_NE[bsMonth - 1]!}
            bsDay={bsDay}
            isToday={isToday}
            timezone={effectiveTimezone}
            locationLabel={locationLabel}
          />
        )}

        {isLoading && (
          <div className="h-[600px] rounded-2xl bg-muted/50 animate-pulse" />
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 text-destructive p-4 text-sm">
            Could not load panchanga for this date.
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              वर्षभरि चलाउनुहोस्
            </span>
            <span className="text-sm font-mono font-semibold tabular-nums">
              {toNepaliDigits(clampedDay)} / {toNepaliDigits(totalDays)}
            </span>
          </div>
          <input
            type="range"
            className="w-full"
            min={1}
            max={totalDays}
            step={1}
            value={clampedDay}
            onChange={(e) => setDayOfYear(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
