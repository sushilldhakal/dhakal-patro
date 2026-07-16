import { useCallback, useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, getRouteApi } from "@tanstack/react-router";
import { CalendarRange } from "lucide-react";
import {
  fetchCivilTimeline,
  fetchPanchanga,
  locationCacheKey,
  panchangaKeys,
} from "@/lib/api";
import { adToBS } from "@/lib/bs-calendar";
import {
  buildAtTimeDatetime,
  chartDateAd,
  fetchEphemerisPanchangaDay,
  isEphemerisPanchanga,
} from "@/lib/ephemeris-adapters";
import { formatTimeShort, getSunrise, getSunset } from "@/lib/panchanga-format";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { GhatiClock } from "@/components/panchanga/GhatiClock";
import { DayTimeline, type DayCycleMode } from "@/components/panchanga/DayTimeline";
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { LearnMoreCard } from "@/components/LearnMoreCard";
import { PlanetEventsPanel } from "@/components/panchanga/PlanetEventsPanel";
import {
  EphemerisModeBanner,
  MuhurtaNowPanel,
} from "@/components/panchanga/MuhurtaNowPanel";
import { usePanchangaLocation, displayLocationLabel } from "@/components/panchanga/use-panchanga-location";
import {
  defaultClockForTimezone,
  usePanchangaClock,
} from "@/components/panchanga/use-panchanga-mode";
import {
  locationToSearch,
  sameLocationParams,
  sameSearch,
  searchToLocation,
  type PanchangaSearch,
} from "@/lib/url-state";
import {
  DinVisheshSection,
  FestivalsSection,
  MuhurtaTimingsSection,
  NivasShoolSection,
  PanchangCoreSection,
  BalamSection,
  PanchakaLagnaSection,
  RashiSection,
  RituSection,
  SunMoonSamvatSection,
} from "@/components/panchanga/PanchangaSections";
import { useRouteLoading } from "@/lib/route-loading";

/** Panchanga scrubs date/time in-place; never block the whole page with the route overlay. */
const PANCHANGA_ROUTE_LOADING = false;

const routeApi = getRouteApi("/panchanga");

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse "YYYY-MM-DD" into a Date in the local zone (no UTC shift). */
function parseAdStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function Panchanga() {
  const { t } = useTranslation();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  // Seed every selection from the URL on first render so a shared link opens on
  // exactly the date/time/view/location it encodes; otherwise fall back to the
  // stored preference / today.
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const [date, setDate] = useState(() =>
    search.date ? parseAdStr(search.date) : new Date()
  );
  const timezoneForMode = location.params.timezone ?? "Asia/Kathmandu";
  const { clock, setClock } = usePanchangaClock(timezoneForMode, { clock: search.time });
  const [clockUserAdjusted, setClockUserAdjusted] = useState(false);

  const adDateStr = toAdStr(date);
  const bs = adToBS(date);
  const atTimeDatetime = buildAtTimeDatetime(adDateStr, clock);

  useEffect(() => {
    const desired: PanchangaSearch = {
      ...locationToSearch(location),
      date: adDateStr,
      time: clock,
    };
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [location, adDateStr, clock, search, navigate]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (search.date && search.date !== adDateStr) setDate(parseAdStr(search.date));
    if (search.time && search.time !== clock) setClock(search.time);
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const udayaQuery = useQuery({
    queryKey: panchangaKeys.day(adDateStr, "ad", location.params),
    queryFn: () => fetchPanchanga(adDateStr, "ad", location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const instantQuery = useQuery({
    queryKey: panchangaKeys.atTime(atTimeDatetime, location.params),
    queryFn: () => fetchEphemerisPanchangaDay(atTimeDatetime, adDateStr, location.params),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  // दिन-चक्र day boundary: sunrise→sunrise (default) vs midnight→midnight.
  // The civil timeline is fetched lazily, only when Calendar Day is active.
  const [dayCycleMode, setDayCycleMode] = useState<DayCycleMode>("Day-Night");
  const civilQuery = useQuery({
    queryKey: panchangaKeys.civil(adDateStr, location.params),
    queryFn: () => fetchCivilTimeline(adDateStr, "ad", location.params),
    enabled: dayCycleMode === "Calendar Day",
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const { data, isError } = instantQuery;
  const ephemeris = isEphemerisPanchanga(data);

  const wheelData = udayaQuery.data;
  const showWheelSkeleton = udayaQuery.isLoading && !wheelData;

  const sunrise = udayaQuery.data
    ? getSunrise(udayaQuery.data)
    : data
      ? getSunrise(data)
      : undefined;
  const sunset = udayaQuery.data
    ? getSunset(udayaQuery.data)
    : data
      ? getSunset(data)
      : undefined;
  const effectiveTimezone = resolveTimeZone(data?.location?.timezone, location.params.timezone);
  const isToday = adDateStr === todayAdStringInTimezone(new Date(), effectiveTimezone);

  const locationLabel = displayLocationLabel(location, data?.location?.name);
  const chartAd = data ? chartDateAd(data, adDateStr) : adDateStr;
  const todayAd = todayAdStringInTimezone(new Date(), effectiveTimezone);

  const hadUrlTimeRef = useRef(Boolean(search.time));
  const clockSyncedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setClockUserAdjusted(false);
  }, [adDateStr]);

  const handleClockChange = useCallback(
    (next: string) => {
      setClockUserAdjusted(true);
      setClock(next);
    },
    [setClock],
  );

  // Seed the chosen time once per date/location. When the viewed date is today,
  // open at the current wall-clock time in that place so the दिन-चक्र needle and
  // the wheel point at "now" without the user having to scrub. Other days fall
  // back to that day's sunrise. A manual pick (clockUserAdjusted) is preserved.
  useEffect(() => {
    const syncKey = `${adDateStr}|${locationCacheKey(location.params)}`;
    if (clockSyncedKeyRef.current === syncKey) return;
    if (clockUserAdjusted) return;

    if (isToday) {
      clockSyncedKeyRef.current = syncKey;
      hadUrlTimeRef.current = false;
      setClock(defaultClockForTimezone(effectiveTimezone));
      return;
    }

    // Non-today: honor an explicitly shared time on the very first load, then
    // default a subsequent day/location change to that day's sunrise.
    const sunrise = formatTimeShort(
      udayaQuery.data ? getSunrise(udayaQuery.data) : undefined,
    );
    if (!sunrise) return;

    if (hadUrlTimeRef.current && clockSyncedKeyRef.current === null) {
      hadUrlTimeRef.current = false;
      clockSyncedKeyRef.current = syncKey;
      return;
    }

    clockSyncedKeyRef.current = syncKey;
    setClock(sunrise);
  }, [
    adDateStr,
    location.params,
    isToday,
    effectiveTimezone,
    clockUserAdjusted,
    udayaQuery.data,
    setClock,
  ]);

  useRouteLoading(PANCHANGA_ROUTE_LOADING);

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-4 max-md:px-0 max-md:pb-16 max-md:pt-0">
      <div className="mt-2 grid grid-cols-1 items-start gap-x-5 gap-y-4 max-md:pt-3 xl:grid-cols-[1fr_330px]">
        <div className="flex min-w-0 flex-col gap-4">
          <PanchangaDateNav
            date={date}
            onDateChange={setDate}
            todayAd={todayAd}
            clock={clock}
            onClockChange={handleClockChange}
            toolbar={
              <LocationSelector
                compact
                location={location}
                onLocationChange={setLocation}
                className="h-[30px] min-w-0 w-auto max-w-[6.5rem] shrink-0 px-2 md:h-8 md:max-w-[12.5rem]"
              />
            }
          />

          {ephemeris && data && <EphemerisModeBanner p={data} clock={clock} />}

          {/* Timeline shares the wheel's udaya (sunrise-to-sunrise) day for the
              viewed civil date so the two never disagree. Feeding it the
              ephemeris at-time day instead made a near-sunrise time (e.g. the
              default clock) roll to the previous vedic day, desyncing it from
              the wheel. On today the needle tracks the live current time; once
              the user scrubs, it pins to their chosen time. */}
          {(wheelData || showWheelSkeleton) && (
            <DayTimeline
              p={wheelData}
              loading={showWheelSkeleton}
              dateAd={adDateStr}
              isToday={isToday}
              timezone={effectiveTimezone}
              needleClock={clockUserAdjusted ? clock : undefined}
              showNeedle={clockUserAdjusted || isToday}
              mode={dayCycleMode}
              onModeChange={setDayCycleMode}
              civil={civilQuery.data}
              civilLoading={civilQuery.isLoading}
            />
          )}

          {(wheelData || showWheelSkeleton) && (
            <>
              <PanchangaWheel
                p={wheelData}
                loading={showWheelSkeleton}
                bsYear={bs.year}
                bsMonthNe={bs.monthName}
                bsDay={bs.day}
                isToday={isToday}
                timezone={effectiveTimezone}
                locationLabel={locationLabel}
              />
              {wheelData ? (
                <Link
                  to="/panchanga/year"
                  search={{ ...locationToSearch(location), year: bs.year }}
                  className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/10 hover:text-secondary"
                >
                  <CalendarRange className="h-4 w-4" />
                  {t("panchanga.year_link")}
                </Link>
              ) : null}
            </>
          )}

          {isError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {t("panchanga.error_load")}
            </div>
          )}

          {data && (
            <div className="flex flex-col gap-3">
              <SunMoonSamvatSection p={data} />
              <PanchangCoreSection p={data} />
              <RashiSection p={data} />
              <RituSection p={data} />
              <BalamSection p={data} />
              <PanchakaLagnaSection p={data} />
              <MuhurtaTimingsSection p={data} />
              <NivasShoolSection p={data} fallback={wheelData} />
              <DinVisheshSection p={data} />
              <FestivalsSection p={data} />
            </div>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-[76px]">
          <GhatiClock sunrise={sunrise} sunset={sunset} timezone={effectiveTimezone} />
          {ephemeris && data && <MuhurtaNowPanel p={data} clock={clock} />}
          <PlanetEventsPanel dateAd={chartAd} location={location.params} />
        </aside>
      </div>

      <LearnMoreCard
        className="mt-7 max-sm:px-2.5"
        heading={t("panchanga.learn_heading")}
        slugs={["what-is-panchang", "tithi", "nakshatra", "yoga", "karana", "hora"]}
      />
    </div>
  );
}
