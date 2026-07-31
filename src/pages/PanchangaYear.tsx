import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import {
  fetchPanchangaDay,
  locationCacheKey,
  panchangaKeys,
  type PanchangaDay,
} from "@/lib/api";
import { AD_DISPLAY, patroDayFetchFromApiDateAd } from "@/lib/patro-day-url";
import {
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsToAD,
  getBSMonthLength,
  getCurrentBs,
} from "@/lib/bs-calendar";
import { toAdStr } from "@/lib/patro-day";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { useLocale, bilingualText } from "@/i18n/locale";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { useRouteLoading } from "@/lib/route-loading";
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { YearRangePicker } from "@/components/panchanga/YearRangePicker";
import {
  displayLocationLabel,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import {
  buildPatroYearRangeSearch,
  currentPatroDayLinkSearch,
  sameLocationParams,
  sameSearch,
  searchToLocation,
  type PanchangaYearSearch,
} from "@/lib/url-state";
import {
  panchangaYearBulkKey,
  seedYearPanchangaCache,
} from "@/lib/panchanga-year-cache";

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
  return toAdStr(bsToAD(year, month, day));
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

const routeApi = getRouteApi("/panchanga-shell/panchanga/year");

function initialYearFromSearch(search: PanchangaYearSearch): number {
  return search.year ?? getCurrentBs().year;
}

/** Clamp a range-end year to [start, BS_SUPPORTED_END_YEAR]. */
function clampRangeEnd(start: number, to?: number): number {
  if (to == null || to < start) return start;
  return Math.min(to, BS_SUPPORTED_END_YEAR);
}

const clampYear = (y: number) =>
  Math.min(Math.max(y, BS_SUPPORTED_START_YEAR), BS_SUPPORTED_END_YEAR);

export function PanchangaYear() {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const langEra = useCalendarEra();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const queryClient = useQueryClient();
  const todayBs = useMemo(() => adToBS(new Date()), []);
  // A range of BS years: `rangeStart`..`rangeEnd`, viewed one active year at a
  // time. `year` (the clamped active year) drives every downstream day/wheel
  // calc, so the existing single-year logic below is unchanged.
  const [rangeStart, setRangeStart] = useState(() => initialYearFromSearch(search));
  const [rangeEnd, setRangeEnd] = useState(() =>
    clampRangeEnd(initialYearFromSearch(search), search.to)
  );
  const [activeYear, setActiveYear] = useState(rangeStart);
  const year = Math.min(Math.max(activeYear, rangeStart), rangeEnd);
  const rangeSpan = rangeEnd - rangeStart + 1;
  const locKey = locationCacheKey(location.params);

  const [dayOfYear, setDayOfYear] = useState(() =>
    dayOfYearFromBs(todayBs.year, todayBs.month, todayBs.day)
  );
  // Decoupled from dayOfYear so the slider thumb tracks the pointer instantly
  // while the (much heavier) network fetch only fires once dragging settles —
  // otherwise every day crossed while dragging fires its own request and they
  // all queue up behind each other.
  const [queryDay, setQueryDay] = useState(dayOfYear);
  // Autoplay: direction (-1 back, 0 paused, 1 forward) + speed multiplier.
  // Pressing forward/back repeatedly ramps the speed 1×→2×→4×→8× (like a media
  // player's fast-forward / rewind), until the user pauses.
  const [play, setPlay] = useState<{ dir: -1 | 0 | 1; speed: number }>({
    dir: 0,
    speed: 1,
  });
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    const desired = buildPatroYearRangeSearch(
      location,
      langEra,
      rangeStart,
      rangeEnd > rangeStart ? rangeEnd : undefined,
    );
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [location, rangeStart, rangeEnd, langEra, search, navigate]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (search.year != null) {
      const nextStart = initialYearFromSearch(search);
      setRangeStart((cur) => (cur === nextStart ? cur : nextStart));
      const nextEnd = clampRangeEnd(nextStart, search.to);
      setRangeEnd((cur) => (cur === nextEnd ? cur : nextEnd));
    }
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const totalDays = useMemo(() => daysInBsYear(year), [year]);
  const clampedDay = Math.min(dayOfYear, totalDays);
  const clampedQueryDay = Math.min(queryDay, totalDays);

  // A continuous day index across the whole range, so the wheel's day slider
  // rolls straight from one year's last day into the next year's first.
  const rangeDayIndex = useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (let y = rangeStart; y <= rangeEnd; y++) {
      offsets.push(acc);
      acc += daysInBsYear(y);
    }
    return { offsets, total: acc };
  }, [rangeStart, rangeEnd]);
  const activeIndex = year - rangeStart;
  const globalDay = (rangeDayIndex.offsets[activeIndex] ?? 0) + clampedDay;

  const yearBulkQ = useQuery({
    queryKey: panchangaYearBulkKey(year, location.params),
    queryFn: () => seedYearPanchangaCache(year, location.params),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const yearFullyCached = yearBulkQ.isSuccess;

  // Lazy-load the rest of the range: once the active year is ready, prefetch the
  // next year, then the one after, … up to `rangeEnd`, one at a time so a wide
  // range never floods the network. Each lands in IndexedDB + the bulk-query
  // cache, so stepping to the next year (manually or via autoplay) is instant.
  const [rangeReadyThrough, setRangeReadyThrough] = useState(rangeStart - 1);
  const readyCount = Math.max(0, Math.min(rangeReadyThrough - rangeStart + 1, rangeSpan));

  useEffect(() => {
    // A new range start / location resets readiness; the chained effect refills.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRangeReadyThrough(rangeStart - 1);
  }, [rangeStart, locKey]);

  useEffect(() => {
    if (!yearFullyCached) return;
    let cancelled = false;
    const run = async () => {
      setRangeReadyThrough((p) => Math.max(p, year));
      for (let y = year + 1; y <= rangeEnd; y++) {
        if (cancelled) return;
        try {
          await queryClient.prefetchQuery({
            queryKey: panchangaYearBulkKey(y, location.params),
            queryFn: () => seedYearPanchangaCache(y, location.params),
            staleTime: Number.POSITIVE_INFINITY,
            gcTime: 1000 * 60 * 60 * 24 * 7,
          });
        } catch {
          return; // network hiccup — a later render retries the chain
        }
        if (cancelled) return;
        setRangeReadyThrough((p) => Math.max(p, y));
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearFullyCached, year, rangeEnd, locKey, queryClient]);

  const prefetchDay = useCallback(
    (day: number) => {
      if (yearFullyCached || day < 1 || day > totalDays) return;
      const dateStr = adDateStrForDay(year, day);
      void queryClient.prefetchQuery({
        queryKey: panchangaKeys.day(dateStr, "ad", location.params),
        queryFn: () => fetchPanchangaDay(patroDayFetchFromApiDateAd(dateStr, AD_DISPLAY), location.params),
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

  // Jump straight to a day-in-year (from the editable dock readout): pause any
  // autoplay, clamp to the active year's length, and fetch that day.
  const jumpToDay = useCallback(
    (dayInYear: number) => {
      const clamped = Math.min(Math.max(1, Math.round(dayInYear)), totalDays);
      setPlay({ dir: 0, speed: 1 });
      setDayOfYear(clamped);
      setQueryDay(clamped);
      prefetchAround(clamped);
    },
    [totalDays, prefetchAround],
  );

  const MAX_PLAY_SPEED = 8;
  const stepForward = useCallback(() => {
    setPlay((p) =>
      p.dir === 1
        ? { dir: 1, speed: Math.min(p.speed * 2, MAX_PLAY_SPEED) }
        : { dir: 1, speed: 1 },
    );
  }, []);
  const stepBackward = useCallback(() => {
    setPlay((p) =>
      p.dir === -1
        ? { dir: -1, speed: Math.min(p.speed * 2, MAX_PLAY_SPEED) }
        : { dir: -1, speed: 1 },
    );
  }, []);
  const pausePlay = useCallback(() => setPlay({ dir: 0, speed: 1 }), []);

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

  // Playback: base ~one day/second, divided by the speed multiplier (2×/4×/8×).
  // Forward rolls off a year's last day into the next range year (preloaded) for
  // a continuous multi-year animation, wrapping the whole range at the ends;
  // backward mirrors it. `setTimeout` re-arms each tick, so the callback always
  // reads the current day/year/speed.
  const PLAY_BASE_MS = 900;
  useEffect(() => {
    if (play.dir === 0) return;
    const tick = Math.max(70, Math.round(PLAY_BASE_MS / play.speed));
    const id = setTimeout(() => {
      if (play.dir === 1) {
        if (dayOfYear < totalDays) {
          setDayOfYear(dayOfYear + 1);
        } else if (year < rangeEnd) {
          setActiveYear(year + 1);
          setDayOfYear(1);
          setQueryDay(1);
        } else if (rangeStart < year) {
          // End of a multi-year range → wrap to its first year.
          setActiveYear(rangeStart);
          setDayOfYear(1);
          setQueryDay(1);
        } else {
          setDayOfYear(1); // single year → loop
        }
      } else {
        if (dayOfYear > 1) {
          setDayOfYear(dayOfYear - 1);
        } else if (year > rangeStart) {
          const prevLen = daysInBsYear(year - 1);
          setActiveYear(year - 1);
          setDayOfYear(prevLen);
          setQueryDay(prevLen);
        } else if (rangeEnd > year) {
          // Start of a multi-year range → wrap to its last year's last day.
          const lastLen = daysInBsYear(rangeEnd);
          setActiveYear(rangeEnd);
          setDayOfYear(lastLen);
          setQueryDay(lastLen);
        } else {
          setDayOfYear(totalDays); // single year → loop
        }
      }
    }, tick);
    return () => clearTimeout(id);
  }, [play, dayOfYear, totalDays, year, rangeEnd, rangeStart]);

  // The debounced day drives the actual network subscription: it only changes
  // once dragging settles, so we never fire a request per crossed day.
  const debouncedDateStr = useMemo(
    () => adDateStrForDay(year, clampedQueryDay),
    [year, clampedQueryDay]
  );

  const { data, isError } = useQuery({
    queryKey: panchangaKeys.day(debouncedDateStr, "ad", location.params),
    queryFn: () => fetchPanchangaDay(patroDayFetchFromApiDateAd(debouncedDateStr, AD_DISPLAY), location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
    enabled: !yearFullyCached,
  });

  const liveDateStr = useMemo(
    () => adDateStrForDay(year, clampedDay),
    [year, clampedDay]
  );
  // Read from the bulk query's own day map first: it's held by an observed,
  // long-lived query, so it survives the `gcTime` eviction that clears the
  // individually seeded `panchangaKeys.day` entries after a few idle minutes
  // (which used to freeze the wheel until a page refresh re-seeded them).
  const cachedLiveData =
    yearBulkQ.data?.days.get(liveDateStr) ??
    queryClient.getQueryData<PanchangaDay>(
      panchangaKeys.day(liveDateStr, "ad", location.params)
    );

  const { data: fetchingLiveData, isPlaceholderData: fetchingIsPlaceholder } = useQuery({
    queryKey: panchangaKeys.day(liveDateStr, "ad", location.params),
    queryFn: () => fetchPanchangaDay(patroDayFetchFromApiDateAd(liveDateStr, AD_DISPLAY), location.params),
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
  const locationLabel = displayLocationLabel(location, displayData?.location?.name, lang);

  // Step the active year within the range (prev/next), resetting to day 1.
  const goToYear = useCallback(
    (nextYear: number) => {
      setActiveYear((cur) => {
        const clamped = Math.min(Math.max(nextYear, rangeStart), rangeEnd);
        if (clamped === cur) return cur;
        setDayOfYear(1);
        setQueryDay(1);
        return clamped;
      });
    },
    [rangeStart, rangeEnd],
  );

  // Map a global (range-wide) day index from the slider back to (year, day),
  // switching the active year on the fly as the thumb crosses a year boundary.
  const handleGlobalDayChange = useCallback(
    (globalDayValue: number) => {
      const g = Math.min(Math.max(1, globalDayValue), rangeDayIndex.total);
      let idx = rangeDayIndex.offsets.length - 1;
      for (let i = 0; i < rangeDayIndex.offsets.length; i++) {
        const end = rangeDayIndex.offsets[i]! + daysInBsYear(rangeStart + i);
        if (g <= end) {
          idx = i;
          break;
        }
      }
      setActiveYear(rangeStart + idx);
      setDayOfYear(g - rangeDayIndex.offsets[idx]!);
    },
    [rangeDayIndex, rangeStart],
  );

  /**
   * Commit a whole range at once. Both bounds land in the same React batch, so
   * the prefetch chain never sees a half-edited range: picking a start of 1700
   * while the end still read 2083 used to widen the live range to 384 years and
   * queue a year payload for every one of them.
   */
  function applyRange(nextStart: number, nextEnd: number) {
    const start = clampYear(nextStart);
    const end = Math.max(clampYear(nextEnd), start);
    setRangeStart(start);
    setRangeEnd(end);
    setActiveYear(start);
    // Land on today when the range opens on today's year, matching the day the
    // page picks on first load; any other year has no "current" day to hold.
    const day =
      start === todayBs.year
        ? dayOfYearFromBs(todayBs.year, todayBs.month, todayBs.day)
        : 1;
    setDayOfYear(day);
    setQueryDay(day);
  }

  useRouteLoading(YEAR_ROUTE_LOADING);

  return (
    <div className="max-w-[1400px] mx-auto py-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 mt-2">
        <div>
          <Link
            to="/panchanga"
            search={currentPatroDayLinkSearch(location)}
            className="inline-flex items-center gap-1 text-xs text-base hover:text-foreground mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("panchanga_year.back")}
          </Link>
          <h1 className="text-xl font-bold leading-tight tracking-tight m-0">
            {t("panchanga_year.title")}
          </h1>
          <div className="text-sm mt-1">
            {BS_MONTHS_NE[liveMonth - 1]} {toNepaliDigits(liveDay)}, {toNepaliDigits(year)}
            {" · "}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {locationLabel}
            </span>
          </div>

          {rangeSpan > 1 && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
              <button
                type="button"
                onClick={() => goToYear(year - 1)}
                disabled={year <= rangeStart}
                aria-label={bilingualText(lang, "अघिल्लो वर्ष", "Previous year")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-secondary/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-1.5 text-sm font-semibold tabular-nums">
                {toNepaliDigits(year)}
                <span className="ml-1 text-sm text-base">
                  {toNepaliDigits(year - rangeStart + 1)}/{toNepaliDigits(rangeSpan)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => goToYear(year + 1)}
                disabled={year >= rangeEnd}
                aria-label={bilingualText(lang, "अर्को वर्ष", "Next year")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-secondary/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
          <YearRangePicker
            start={rangeStart}
            end={rangeEnd}
            minYear={BS_SUPPORTED_START_YEAR}
            maxYear={BS_SUPPORTED_END_YEAR}
            currentYear={todayBs.year}
            onApply={applyRange}
          />
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
            yearScrub={{
              day: globalDay,
              totalDays: rangeDayIndex.total,
              direction: play.dir,
              speed: play.speed,
              onForward: stepForward,
              onBackward: stepBackward,
              onPause: pausePlay,
              onDayChange: handleGlobalDayChange,
              onJumpDay: jumpToDay,
              onScrubStart: () => setIsScrubbing(true),
              onScrubEnd: finishScrub,
              ...(rangeSpan > 1 && {
                yearLabel: toNepaliDigits(year),
                dayInYear: clampedDay,
                daysInYear: totalDays,
              }),
            }}
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
              <span className="text-xs text-base uppercase tracking-[0.1em]">
                {t("panchanga_year.loading_year")}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-secondary animate-pulse" />
            </div>
          </div>
        ) : yearFullyCached ? (
          <p className="text-xs m-0 px-1">
            {rangeSpan > 1
              ? readyCount >= rangeSpan
                ? bilingualText(lang, 
                    `दायरा तयार · सबै ${toNepaliDigits(rangeSpan)} वर्ष`,
                    `Range ready · all ${rangeSpan} years cached`,
                  )
                : bilingualText(lang, 
                    `${toNepaliDigits(readyCount)}/${toNepaliDigits(rangeSpan)} वर्ष तयार · अर्को वर्ष पूर्वलोड हुँदै…`,
                    `${readyCount}/${rangeSpan} years ready · preloading ahead…`,
                  )
              : yearBulkQ.data?.fromPersistentCache
                ? t("panchanga_year.year_from_cache")
                : t("panchanga_year.year_ready")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
