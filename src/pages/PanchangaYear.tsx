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
import { BS_MONTHS_NE, adToBS } from "@/lib/bs-calendar";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { useLocale, bilingualText } from "@/i18n/locale";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { useRouteLoading } from "@/lib/route-loading";
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PatroBrowseRangePicker } from "@/components/panchanga/PatroBrowseRangePicker";
import {
  adMonthLabel,
  bsMonthLabel,
  isGregorianEraBrowse,
} from "@/components/patro-date/patro-month-labels";
import {
  displayLocationLabel,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import type { Era } from "@/lib/era";
import {
  browsePositionToAdDateStr,
  browsePositionToGlobalDay,
  distinctBrowseYearsInRange,
  globalDayToBrowsePosition,
  listBrowseRangeMonthSegments,
  normalizePatroBrowseRange,
  totalDaysInBrowseRange,
  type PatroBrowseRange,
} from "@/lib/patro-browse-range";
import { signedPatroYearFromBrowse } from "@/lib/patro-year-axis";
import {
  buildPatroYearRangeSearch,
  currentPatroDayLinkSearch,
  panchangaYearSearchToBrowseRange,
  sameLocationParams,
  sameSearch,
  searchToLocation,
} from "@/lib/url-state";
import {
  panchangaYearBulkKey,
  seedYearPanchangaCache,
} from "@/lib/panchanga-year-cache";

const SCRUB_DEBOUNCE_MS = 90;
const SCRUB_FETCH_MS = 120;
const YEAR_ROUTE_LOADING = false;

const routeApi = getRouteApi("/panchanga-shell/panchanga/year");

function isVikramBrowseEra(era: Era): boolean {
  return era === "bs" || era === "bbs";
}

function todayBrowseAnchor(era: Era): { year: number; month: number; day: number } {
  if (isGregorianEraBrowse(era)) {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
  const bs = adToBS(new Date());
  return { year: bs.year, month: bs.month, day: bs.day };
}

function initialGlobalDay(range: PatroBrowseRange): number {
  const r = normalizePatroBrowseRange(range);
  const t = todayBrowseAnchor(r.era);
  const g = browsePositionToGlobalDay(r, t.year, t.month, t.day);
  const total = totalDaysInBrowseRange(r);
  if (g >= 1 && g <= total) return g;
  return 1;
}

export function PanchangaYear() {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const langEra = useCalendarEra();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const queryClient = useQueryClient();

  const [browseRange, setBrowseRange] = useState(() =>
    panchangaYearSearchToBrowseRange(search, langEra),
  );
  const normalizedRange = useMemo(
    () => normalizePatroBrowseRange(browseRange),
    [browseRange],
  );
  const browseEra = normalizedRange.era;
  const vikramBulk = isVikramBrowseEra(browseEra);

  const [globalDay, setGlobalDay] = useState(() => initialGlobalDay(normalizedRange));
  const [queryGlobalDay, setQueryGlobalDay] = useState(globalDay);
  const [play, setPlay] = useState<{ dir: -1 | 0 | 1; speed: number }>({
    dir: 0,
    speed: 1,
  });
  const [isScrubbing, setIsScrubbing] = useState(false);

  const locKey = locationCacheKey(location.params);
  const rangeTotal = useMemo(
    () => totalDaysInBrowseRange(normalizedRange),
    [normalizedRange],
  );
  const clampedGlobal = Math.min(Math.max(1, globalDay), rangeTotal);
  const clampedQueryGlobal = Math.min(Math.max(1, queryGlobalDay), rangeTotal);

  const position = useMemo(
    () => globalDayToBrowsePosition(normalizedRange, clampedGlobal),
    [normalizedRange, clampedGlobal],
  );
  const queryPosition = useMemo(
    () => globalDayToBrowsePosition(normalizedRange, clampedQueryGlobal),
    [normalizedRange, clampedQueryGlobal],
  );

  const browseYear = position.year;
  const bsMonth = position.month;
  const bsDay = position.day;

  const distinctYears = useMemo(
    () => distinctBrowseYearsInRange(normalizedRange),
    [normalizedRange],
  );
  const yearIndex = Math.max(0, distinctYears.indexOf(browseYear));
  const rangeYearSpan = distinctYears.length;

  const daysInActiveBrowseYear = useMemo(() => {
    let n = 0;
    for (const seg of listBrowseRangeMonthSegments(normalizedRange)) {
      if (seg.browseYear === browseYear) n += seg.days;
    }
    return n;
  }, [normalizedRange, browseYear]);

  const dayInActiveBrowseYear = useMemo(() => {
    let n = 0;
    for (const seg of listBrowseRangeMonthSegments(normalizedRange)) {
      if (seg.browseYear === browseYear) {
        if (seg.month === bsMonth) return n + bsDay;
        n += seg.days;
      }
    }
    return bsDay;
  }, [normalizedRange, browseYear, bsMonth, bsDay]);

  useEffect(() => {
    const desired = buildPatroYearRangeSearch(
      location,
      normalizedRange.era,
      normalizedRange.startYear,
      normalizedRange.startMonth,
      normalizedRange.endYear,
      normalizedRange.endMonth,
    );
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [location, normalizedRange, search, navigate]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const next = panchangaYearSearchToBrowseRange(search, langEra);
    setBrowseRange((cur) => {
      const a = normalizePatroBrowseRange(cur);
      const b = normalizePatroBrowseRange(next);
      if (
        a.era === b.era &&
        a.startYear === b.startYear &&
        a.startMonth === b.startMonth &&
        a.endYear === b.endYear &&
        a.endMonth === b.endMonth
      ) {
        return cur;
      }
      return b;
    });
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const wheelSignedYear = vikramBulk
    ? signedPatroYearFromBrowse(browseEra, browseYear)
    : browseYear;

  const yearBulkQ = useQuery({
    queryKey: panchangaYearBulkKey(browseYear, location.params, browseEra),
    queryFn: () => seedYearPanchangaCache(browseYear, location.params, browseEra),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: vikramBulk,
  });

  const yearFullyCached = vikramBulk && yearBulkQ.isSuccess;
  const [rangeReadyThroughIdx, setRangeReadyThroughIdx] = useState(-1);
  const readyCount = Math.max(0, Math.min(rangeReadyThroughIdx + 1, rangeYearSpan));

  useEffect(() => {
    setRangeReadyThroughIdx(-1);
  }, [normalizedRange, locKey]);

  useEffect(() => {
    if (!vikramBulk || !yearFullyCached) return;
    let cancelled = false;
    const run = async () => {
      const idx = distinctYears.indexOf(browseYear);
      setRangeReadyThroughIdx((p) => Math.max(p, idx));
      for (let i = idx + 1; i < distinctYears.length; i++) {
        const y = distinctYears[i]!;
        if (cancelled) return;
        try {
          await queryClient.prefetchQuery({
            queryKey: panchangaYearBulkKey(y, location.params, browseEra),
            queryFn: () => seedYearPanchangaCache(y, location.params, browseEra),
            staleTime: Number.POSITIVE_INFINITY,
            gcTime: 1000 * 60 * 60 * 24 * 7,
          });
        } catch {
          return;
        }
        if (cancelled) return;
        setRangeReadyThroughIdx((p) => Math.max(p, i));
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    vikramBulk,
    yearFullyCached,
    browseYear,
    distinctYears,
    browseEra,
    locKey,
    queryClient,
    location.params,
  ]);

  const adDateStrForPosition = useCallback(
    (pos: { year: number; month: number; day: number }) =>
      browsePositionToAdDateStr(browseEra, pos.year, pos.month, pos.day),
    [browseEra],
  );

  const prefetchDayAtGlobal = useCallback(
    (g: number) => {
      if (yearFullyCached || g < 1 || g > rangeTotal) return;
      const pos = globalDayToBrowsePosition(normalizedRange, g);
      const dateStr = adDateStrForPosition(pos);
      void queryClient.prefetchQuery({
        queryKey: panchangaKeys.day(dateStr, "ad", location.params),
        queryFn: () =>
          fetchPanchangaDay(patroDayFetchFromApiDateAd(dateStr, AD_DISPLAY), location.params),
        staleTime: 1000 * 60 * 30,
      });
    },
    [
      yearFullyCached,
      rangeTotal,
      normalizedRange,
      adDateStrForPosition,
      location.params,
      queryClient,
    ],
  );

  const prefetchAroundGlobal = useCallback(
    (center: number, radius = 5) => {
      for (let d = center - radius; d <= center + radius; d++) {
        prefetchDayAtGlobal(d);
      }
    },
    [prefetchDayAtGlobal],
  );

  const finishScrub = useCallback(() => {
    setIsScrubbing(false);
    setQueryGlobalDay(clampedGlobal);
    prefetchAroundGlobal(clampedGlobal);
  }, [clampedGlobal, prefetchAroundGlobal]);

  const jumpToDay = useCallback(
    (dayInYear: number) => {
      const target = Math.min(Math.max(1, Math.round(dayInYear)), daysInActiveBrowseYear);
      let acc = 0;
      for (const seg of listBrowseRangeMonthSegments(normalizedRange)) {
        if (seg.browseYear !== browseYear) continue;
        if (target <= acc + seg.days) {
          const dayInMonth = target - acc;
          setPlay({ dir: 0, speed: 1 });
          const g = browsePositionToGlobalDay(
            normalizedRange,
            browseYear,
            seg.month,
            dayInMonth,
          );
          setGlobalDay(g);
          setQueryGlobalDay(g);
          prefetchAroundGlobal(g);
          return;
        }
        acc += seg.days;
      }
    },
    [daysInActiveBrowseYear, normalizedRange, browseYear, prefetchAroundGlobal],
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
    const id = setTimeout(() => setQueryGlobalDay(globalDay), delay);
    return () => clearTimeout(id);
  }, [globalDay, isScrubbing]);

  useEffect(() => {
    if (!isScrubbing) return;
    prefetchDayAtGlobal(clampedGlobal);
  }, [isScrubbing, clampedGlobal, prefetchDayAtGlobal]);

  const PLAY_BASE_MS = 900;
  useEffect(() => {
    if (play.dir === 0) return;
    const tick = Math.max(70, Math.round(PLAY_BASE_MS / play.speed));
    const id = setTimeout(() => {
      setGlobalDay((g) => {
        const cur = Math.min(Math.max(1, g), rangeTotal);
        if (play.dir === 1) {
          return cur >= rangeTotal ? 1 : cur + 1;
        }
        return cur <= 1 ? rangeTotal : cur - 1;
      });
    }, tick);
    return () => clearTimeout(id);
  }, [play, rangeTotal]);

  const debouncedDateStr = useMemo(
    () => adDateStrForPosition(queryPosition),
    [adDateStrForPosition, queryPosition],
  );

  const { data, isError } = useQuery({
    queryKey: panchangaKeys.day(debouncedDateStr, "ad", location.params),
    queryFn: () =>
      fetchPanchangaDay(patroDayFetchFromApiDateAd(debouncedDateStr, AD_DISPLAY), location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
    enabled: !yearFullyCached,
  });

  const liveDateStr = useMemo(
    () => adDateStrForPosition(position),
    [adDateStrForPosition, position],
  );

  const cachedLiveData =
    yearBulkQ.data?.days.get(liveDateStr) ??
    queryClient.getQueryData<PanchangaDay>(
      panchangaKeys.day(liveDateStr, "ad", location.params),
    );

  const { data: fetchingLiveData, isPlaceholderData: fetchingIsPlaceholder } = useQuery({
    queryKey: panchangaKeys.day(liveDateStr, "ad", location.params),
    queryFn: () =>
      fetchPanchangaDay(patroDayFetchFromApiDateAd(liveDateStr, AD_DISPLAY), location.params),
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

  const wheelAtTimeDayState = useMemo(
    () => patroDayFetchFromApiDateAd(displayDateStr, AD_DISPLAY),
    [displayDateStr],
  );

  const yearLoading = vikramBulk && yearBulkQ.isFetching && !yearFullyCached;

  const effectiveTimezone = resolveTimeZone(displayData?.location?.timezone, location.params.timezone);
  const isToday = displayDateStr === todayAdStringInTimezone(new Date(), effectiveTimezone);
  const locationLabel = displayLocationLabel(location, displayData?.location?.name, lang);

  const monthHeadline = isGregorianEraBrowse(browseEra)
    ? adMonthLabel(bsMonth, lang)
    : bsMonthLabel(bsMonth, lang);

  const goToBrowseYear = useCallback(
    (nextYear: number) => {
      const idx = distinctYears.indexOf(nextYear);
      if (idx < 0) return;
      const seg = listBrowseRangeMonthSegments(normalizedRange).find(
        (s) => s.browseYear === nextYear,
      );
      if (!seg) return;
      setGlobalDay(seg.globalStart + 1);
      setQueryGlobalDay(seg.globalStart + 1);
    },
    [distinctYears, normalizedRange],
  );

  const handleGlobalDayChange = useCallback(
    (globalDayValue: number) => {
      setGlobalDay(Math.min(Math.max(1, globalDayValue), rangeTotal));
    },
    [rangeTotal],
  );

  function applyBrowseRange(next: PatroBrowseRange) {
    const r = normalizePatroBrowseRange(next);
    setBrowseRange(r);
    const g = initialGlobalDay(r);
    setGlobalDay(g);
    setQueryGlobalDay(g);
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
            {monthHeadline} {toNepaliDigits(bsDay)}, {toNepaliDigits(browseYear)}
            {" · "}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {locationLabel}
            </span>
          </div>

          {rangeYearSpan > 1 && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
              <button
                type="button"
                onClick={() => goToBrowseYear(distinctYears[yearIndex - 1]!)}
                disabled={yearIndex <= 0}
                aria-label={bilingualText(lang, "अघिल्लो वर्ष", "Previous year")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-secondary/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-1.5 text-sm font-semibold tabular-nums">
                {toNepaliDigits(browseYear)}
                <span className="ml-1 text-sm text-base">
                  {toNepaliDigits(yearIndex + 1)}/{toNepaliDigits(rangeYearSpan)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => goToBrowseYear(distinctYears[yearIndex + 1]!)}
                disabled={yearIndex >= rangeYearSpan - 1}
                aria-label={bilingualText(lang, "अर्को वर्ष", "Next year")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-secondary/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
          <PatroBrowseRangePicker range={normalizedRange} onApply={applyBrowseRange} />
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
            bsYear={wheelSignedYear}
            bsMonthNe={
              isGregorianEraBrowse(browseEra)
                ? adMonthLabel(bsMonth, "ne")
                : BS_MONTHS_NE[bsMonth - 1]!
            }
            bsDay={bsDay}
            isToday={isToday}
            timezone={effectiveTimezone}
            locationLabel={locationLabel}
            atTimeScrubOnly
            atTimeDayState={wheelAtTimeDayState}
            yearScrub={{
              day: clampedGlobal,
              totalDays: rangeTotal,
              direction: play.dir,
              speed: play.speed,
              onForward: stepForward,
              onBackward: stepBackward,
              onPause: pausePlay,
              onDayChange: handleGlobalDayChange,
              onJumpDay: jumpToDay,
              onScrubStart: () => setIsScrubbing(true),
              onScrubEnd: finishScrub,
              ...(rangeYearSpan > 1 && {
                yearLabel: toNepaliDigits(browseYear),
                dayInYear: dayInActiveBrowseYear,
                daysInYear: daysInActiveBrowseYear,
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
            {rangeYearSpan > 1
              ? readyCount >= rangeYearSpan
                ? bilingualText(
                    lang,
                    `दायरा तयार · सबै ${toNepaliDigits(rangeYearSpan)} वर्ष`,
                    `Range ready · all ${rangeYearSpan} years cached`,
                  )
                : bilingualText(
                    lang,
                    `${toNepaliDigits(readyCount)}/${toNepaliDigits(rangeYearSpan)} वर्ष तयार · अर्को वर्ष पूर्वलोड हुँदै…`,
                    `${readyCount}/${rangeYearSpan} years ready · preloading ahead…`,
                  )
              : yearBulkQ.data?.fromPersistentCache
                ? t("panchanga_year.year_from_cache")
                : t("panchanga_year.year_ready")}
          </p>
        ) : !vikramBulk ? (
          <p className="text-xs m-0 px-1 text-base">
            {bilingualText(
              lang,
              "यो दायरा दिन-दिन पञ्चाङ्ग लोड गर्छ (वर्ष बल्क क्यास BS/BBS मात्र)।",
              "This range loads panchanga day-by-day (year bulk cache is BS/BBS only).",
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}
