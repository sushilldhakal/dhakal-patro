import { useCallback, useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, getRouteApi } from "@tanstack/react-router";
import { CalendarRange } from "lucide-react";
import {
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
import { DayTimeline } from "@/components/panchanga/DayTimeline";
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { LearnMoreCard } from "@/components/LearnMoreCard";
import { PlanetEventsPanel } from "@/components/panchanga/PlanetEventsPanel";
import {
  EphemerisModeBanner,
  MuhurtaNowPanel,
} from "@/components/panchanga/MuhurtaNowPanel";
import { usePanchangaLocation, displayLocationLabel } from "@/components/panchanga/use-panchanga-location";
import { usePanchangaClock } from "@/components/panchanga/use-panchanga-mode";
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
  PanchangCoreSection,
  BalamSection,
  PanchakaLagnaSection,
  RashiSection,
  RituSection,
  SamvatSection,
  SunMoonSection,
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

  const { data, isError } = instantQuery;
  const ephemeris = isEphemerisPanchanga(data);
  const timelineData = instantQuery.data;
  const showTimelineSkeleton = instantQuery.isLoading && !timelineData;

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

  useEffect(() => {
    const syncKey = `${adDateStr}|${locationCacheKey(location.params)}`;
    if (clockSyncedKeyRef.current === syncKey) return;

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
  }, [adDateStr, location.params, udayaQuery.data, setClock]);

  useRouteLoading(PANCHANGA_ROUTE_LOADING);

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-4 max-sm:px-0 max-sm:pb-16 max-sm:pt-0">
      <div className="mt-2 grid grid-cols-1 items-start gap-x-5 gap-y-4 max-sm:px-2.5 max-sm:pt-3 xl:grid-cols-[1fr_330px]">
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
                className="w-full sm:w-auto sm:max-w-[12.5rem]"
              />
            }
          />

          {ephemeris && data && <EphemerisModeBanner p={data} clock={clock} />}

          {(timelineData || showTimelineSkeleton) && (
            <DayTimeline
              p={timelineData}
              loading={showTimelineSkeleton}
              dateAd={chartAd}
              isToday={isToday}
              timezone={effectiveTimezone}
              needleClock={clock}
              showNeedle={clockUserAdjusted}
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
            <>
              <SunMoonSection p={data} />
              <PanchangCoreSection p={data} />
              <SamvatSection p={data} />
              <RashiSection p={data} />
              <BalamSection p={data} />
              <PanchakaLagnaSection p={data} />
              <RituSection p={data} />
              <MuhurtaTimingsSection p={data} />
              <DinVisheshSection p={data} />
              <FestivalsSection p={data} />
            </>
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
