import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  fetchYearWheelCalendar,
  locationCacheKey,
  yearWheelKeys,
} from "@/lib/api";
import {
  adToBS,
  bsToAD,
  BS_MONTH_NAMES,
  BS_MONTHS_NE,
  getBSMonthLength,
  shiftBsMonth,
} from "@/lib/bs-calendar";
import { useLocale, bilingualText } from "@/i18n/locale";
import { formatTimeShort, getSunrise, toNepaliDigits } from "@/lib/panchanga-format";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { useRouteLoading } from "@/lib/route-loading";
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PatroDayTimeNav } from "@/components/patro-date";
import {
  displayLocationLabel,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { defaultClockForTimezone } from "@/components/panchanga/use-panchanga-mode";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { usePatroPanchangaUrlBrowse } from "@/hooks/use-patro-url-browse";
import { civilIsoFromDate } from "@/lib/patro-day";
import { patroDayFetchFromApiBsParts } from "@/lib/patro-day-url";
import {
  buildYearWheelDays,
  sliceWheelWindow,
  wheelWindowAtLimit,
  wheelWindowBounds,
  yearWheelIndexOfAdDate,
} from "@/lib/panchanga-year-wheel";
import {
  currentPatroDayLinkSearch,
  patroDayBrowseNavigateSearch,
  sameSearch,
  searchToLocation,
  type PanchangaSearch,
} from "@/lib/url-state";

const PLAY_BASE_MS = 900;
const MAX_PLAY_SPEED = 32;
const EXTEND_MARGIN = 7;
const MAX_MONTHS_EACH = 3;
const YEAR_ROUTE_LOADING = false;

const routeApi = getRouteApi("/panchanga-shell/panchanga/year");

function toAdStr(d: Date): string {
  return civilIsoFromDate(d);
}

function parseAdStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function shiftAnchorMonths(centre: Date, delta: number): Date {
  const bs = adToBS(centre);
  const next = shiftBsMonth(bs.year, bs.month, delta);
  return bsToAD(next.year, next.month, Math.min(bs.day, getBSMonthLength(next.year, next.month)));
}

function isLegacyYearRangeSearch(search: PanchangaSearch & { to?: number; toMonth?: number }): boolean {
  if (search.to != null || search.toMonth != null) return true;
  return search.year != null && search.month == null && search.day == null;
}

export function PanchangaYear() {
  const { t } = useTranslation();
  const { lang, digits } = useLocale();
  const langEra = useCalendarEra();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));

  const dayBrowse = usePatroPanchangaUrlBrowse(search, navigate, location, setLocation);
  const {
    dayState,
    date,
    setDate,
    setDisplayEra,
    clock,
    setClock,
  } = dayBrowse;
  const browseEra = dayState.display.era;

  const [clockUserAdjusted, setClockUserAdjusted] = useState(false);
  const clockSyncedKeyRef = useRef<string | null>(null);

  const [anchor, setAnchor] = useState(() => new Date(date.getTime()));
  const adDateStr = toAdStr(date);
  const bsYear = adToBS(date).year;

  const tz = resolveTimeZone(undefined, location.params.timezone);
  const todayAd = todayAdStringInTimezone(new Date(), tz);
  const isToday = adDateStr === todayAd;

  const [dayAd, setDayAd] = useState(() => toAdStr(date));
  const [play, setPlay] = useState<{ dir: -1 | 0 | 1; speed: number }>({ dir: 0, speed: 1 });
  const [monthsBack, setMonthsBack] = useState(1);
  const [monthsFwd, setMonthsFwd] = useState(1);

  useEffect(() => {
    const legacy = search as PanchangaSearch & { to?: number; toMonth?: number };
    if (!isLegacyYearRangeSearch(legacy)) return;
    const cur = adToBS(new Date());
    const y = legacy.year ?? cur.year;
    const m = legacy.month ?? (y === cur.year ? cur.month : 1);
    const d = legacy.day ?? (y === cur.year && m === cur.month ? cur.day : 1);
    const desired = patroDayBrowseNavigateSearch(
      location,
      patroDayFetchFromApiBsParts({ year: y, month: m, day: d }, dayState.display),
    );
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [search, location, navigate, dayState.display]);

  useEffect(() => {
    if (scrubbingRef.current || play.dir !== 0) return;
    setDayAd(adDateStr);
    setAnchor(parseAdStr(adDateStr));
  }, [adDateStr, play.dir]);

  const bounds = useMemo(
    () => wheelWindowBounds(anchor, monthsBack, monthsFwd),
    [anchor, monthsBack, monthsFwd],
  );
  const atLimit = useMemo(() => wheelWindowAtLimit(bounds), [bounds]);

  const yearQueries = useQueries({
    queries: bounds.years.map((y) => ({
      queryKey: yearWheelKeys.year(y, location.params, browseEra === "bbs" ? "bbs" : "bs"),
      queryFn: () =>
        fetchYearWheelCalendar(y, location.params, browseEra === "bbs" ? "bbs" : "bs"),
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: 1000 * 60 * 10,
      placeholderData: keepPreviousData,
    })),
  });

  const windowLoading = yearQueries.some((q) => q.isLoading);
  const windowFetching = yearQueries.some((q) => q.isFetching);
  const windowError = yearQueries.some((q) => q.isError);
  const yearsStamp = yearQueries.map((q) => q.dataUpdatedAt).join("|");

  const days = useMemo(() => {
    const all = yearQueries
      .flatMap((q) => buildYearWheelDays(q.data))
      .sort((a, b) => a.dateAd.localeCompare(b.dateAd));
    return sliceWheelWindow(all, bounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearsStamp, bounds]);

  const total = days.length;
  const foundIndex = yearWheelIndexOfAdDate(days, dayAd);
  const clamped = foundIndex ?? 1;
  const current = days[clamped - 1];
  const wheelData = current?.p;

  const scrubbingRef = useRef(false);
  useEffect(() => {
    if (scrubbingRef.current || !current?.dateAd) return;
    if (current.dateAd === adDateStr) return;
    setDate(parseAdStr(current.dateAd));
  }, [current?.dateAd, adDateStr, setDate]);

  useEffect(() => {
    if (play.dir === 0 || !total) return;
    const tick = Math.max(33, Math.round(PLAY_BASE_MS / play.speed));
    const id = setInterval(() => {
      setDayAd((ad) => {
        const i = days.findIndex((d) => d.dateAd === ad);
        const next = (i < 0 ? 0 : i) + play.dir;
        return days[next]?.dateAd ?? ad;
      });
    }, tick);
    return () => clearInterval(id);
  }, [play, total, days]);

  useEffect(() => {
    if (play.dir === 0 || !total || windowFetching) return;
    if (play.dir === 1 && total - clamped <= EXTEND_MARGIN && !atLimit.end) {
      if (monthsFwd < MAX_MONTHS_EACH) setMonthsFwd((m) => m + 1);
      else setAnchor((a) => shiftAnchorMonths(a, 1));
    }
    if (play.dir === -1 && clamped <= EXTEND_MARGIN && !atLimit.start) {
      if (monthsBack < MAX_MONTHS_EACH) setMonthsBack((m) => m + 1);
      else setAnchor((a) => shiftAnchorMonths(a, -1));
    }
  }, [play.dir, clamped, total, windowFetching, atLimit, monthsBack, monthsFwd]);

  const pausePlay = useCallback(() => setPlay({ dir: 0, speed: 1 }), []);

  const jumpToIndex = useCallback(
    (i: number) => {
      const row = days[Math.min(Math.max(1, Math.round(i)), days.length) - 1];
      if (!row) return;
      scrubbingRef.current = true;
      setDayAd(row.dateAd);
      setDate(parseAdStr(row.dateAd));
      requestAnimationFrame(() => {
        scrubbingRef.current = false;
      });
    },
    [days, setDate],
  );

  const stepForward = useCallback(() => {
    setPlay((p) =>
      p.dir === 1 ? { dir: 1, speed: Math.min(p.speed * 2, MAX_PLAY_SPEED) } : { dir: 1, speed: 1 },
    );
  }, []);
  const stepBackward = useCallback(() => {
    setPlay((p) =>
      p.dir === -1
        ? { dir: -1, speed: Math.min(p.speed * 2, MAX_PLAY_SPEED) }
        : { dir: -1, speed: 1 },
    );
  }, []);

  const handleDateChange = useCallback(
    (d: Date) => {
      pausePlay();
      scrubbingRef.current = false;
      setClockUserAdjusted(false);
      setDate(d);
      setAnchor(d);
      setDayAd(toAdStr(d));
      setMonthsBack(1);
      setMonthsFwd(1);
    },
    [pausePlay, setDate],
  );

  const handleClockChange = useCallback(
    (next: string) => {
      setClockUserAdjusted(true);
      setClock(next);
    },
    [setClock],
  );

  useEffect(() => {
    const syncKey = `${adDateStr}|${locationCacheKey(location.params)}`;
    if (clockSyncedKeyRef.current === syncKey) return;
    if (clockUserAdjusted) return;

    if (isToday) {
      clockSyncedKeyRef.current = syncKey;
      setClock(defaultClockForTimezone(tz));
      return;
    }

    const sunriseClock = formatTimeShort(wheelData ? getSunrise(wheelData) : undefined);
    if (!sunriseClock) return;
    clockSyncedKeyRef.current = syncKey;
    setClock(sunriseClock);
  }, [adDateStr, location.params, isToday, tz, clockUserAdjusted, wheelData, setClock]);

  const monthNe = current ? (BS_MONTHS_NE[current.bsMonth - 1] ?? "") : "";
  const locationLabel = displayLocationLabel(location, wheelData?.location?.name, lang);

  const windowLabel = useMemo(() => {
    const from = adToBS(parseAdStr(bounds.startAd));
    const to = adToBS(parseAdStr(bounds.endAd));
    const name = (m: number) =>
      lang === "en" ? BS_MONTH_NAMES[m - 1] ?? "" : BS_MONTHS_NE[m - 1] ?? "";
    return `${name(from.month)} ${digits(from.day)} — ${name(to.month)} ${digits(to.day)}`;
  }, [bounds, lang, digits]);

  useRouteLoading(YEAR_ROUTE_LOADING);

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-4 max-md:px-4 max-md:pb-16 max-md:pt-0">
      <div className="mb-3 mt-2">
        <Link
          to="/panchanga"
          search={currentPatroDayLinkSearch(location, { era: langEra })}
          className="mb-1.5 inline-flex items-center gap-1 text-xs text-base hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("panchanga_year.back")}
        </Link>
        <h1 className="m-0 text-xl font-bold leading-tight tracking-tight">
          {t("panchanga_year.title")}
        </h1>
      </div>

      <PatroDayTimeNav
        era={browseEra}
        date={date}
        vikram={wheelData?.date_parts?.vikram}
        civilDateAd={wheelData?.date_ad}
        gregorian={wheelData?.date_parts?.gregorian}
        onDateChange={handleDateChange}
        onEraChange={setDisplayEra}
        todayAd={todayAd}
        clock={clock}
        onClockChange={handleClockChange}
        location={location}
        onLocationChange={setLocation}
        toolbar={
          <LocationSelector
            compact
            location={location}
            onLocationChange={setLocation}
            className="h-[30px] min-w-0 w-auto max-w-[10rem] shrink-0 px-1.5 md:h-8 md:max-w-[12.5rem] md:px-3"
          />
        }
      />

      <div className="mt-4 flex flex-col gap-4">
        <PanchangaWheel
          p={wheelData}
          loading={windowLoading || !current}
          bsYear={current?.bsYear ?? bsYear}
          bsMonthNe={monthNe || BS_MONTHS_NE[0]!}
          bsDay={current?.bsDay ?? 1}
          isToday={current?.dateAd === todayAd}
          timezone={tz}
          locationLabel={locationLabel}
          clock={clock}
          atTimeDayState={dayState.kind === "input" ? dayState : undefined}
          yearScrub={{
            day: clamped,
            totalDays: total || 1,
            direction: play.dir,
            speed: play.speed,
            onForward: stepForward,
            onBackward: stepBackward,
            onPause: pausePlay,
            onDayChange: (d) => {
              pausePlay();
              jumpToIndex(d);
            },
            onJumpDay: (d) => {
              pausePlay();
              jumpToIndex(d);
            },
            onScrubStart: () => {
              pausePlay();
              scrubbingRef.current = true;
            },
            onScrubEnd: () => {
              scrubbingRef.current = false;
            },
          }}
        />

        {windowError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {t("panchanga_year.error")}
          </div>
        ) : windowFetching ? (
          <p className="m-0 px-1 text-xs text-base">
            {bilingualText(lang, "लोड हुँदै…", "Loading…")}
          </p>
        ) : total ? (
          <p className="m-0 px-1 text-xs text-base">
            {windowLabel} · {bilingualText(lang, `${toNepaliDigits(total)} दिन`, `${total} days`)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
