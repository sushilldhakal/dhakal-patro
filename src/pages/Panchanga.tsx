import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import {
  fetchPanchanga,
  panchangaKeys,
} from "@/lib/api";
import { BS_MONTHS_NE, adToBS } from "@/lib/bs-calendar";
import { getBsMonthAdSpanLabel } from "@/lib/local-calendar";
import {
  buildAtTimeDatetime,
  chartDateAd,
  fetchEphemerisPanchangaDay,
  isEphemerisPanchanga,
} from "@/lib/ephemeris-adapters";
import { getSunrise, getSunset, toNepaliDigits } from "@/lib/panchanga-format";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { cn } from "@/lib/utils";
import { PanchangaDateNav, QuickDateStrip } from "@/components/panchanga/PanchangaDateNav";
import { GhatiClock } from "@/components/panchanga/GhatiClock";
import { DayTimeline } from "@/components/panchanga/DayTimeline";
import { PanchangaCircularDiagram } from "@/components/panchanga/PanchangaCircularDiagram";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PanchangaMonthGrid } from "@/components/panchanga/PanchangaMonthGrid";
import { PlanetEventsPanel } from "@/components/panchanga/PlanetEventsPanel";
import { PanchangaModeControls } from "@/components/panchanga/PanchangaModeControls";
import {
  EphemerisModeBanner,
  MuhurtaNowPanel,
} from "@/components/panchanga/MuhurtaNowPanel";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { usePanchangaMode } from "@/components/panchanga/use-panchanga-mode";
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

type ViewMode = "day" | "month";

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtAdFull(d: Date): string {
  return d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
}

export function Panchanga() {
  const { location, setLocation } = usePanchangaLocation();
  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("dhakalPatroPanchView");
    return saved === "month" ? "month" : "day";
  });

  const timezoneForMode = location.params.timezone ?? "Asia/Kathmandu";
  const { mode: dataMode, setMode: setDataMode, clock, setClock } =
    usePanchangaMode(timezoneForMode);

  const adDateStr = toAdStr(date);
  const bs = adToBS(date);
  const isInstant = dataMode === "instant";
  const atTimeDatetime = buildAtTimeDatetime(adDateStr, clock);

  const switchView = (v: ViewMode) => {
    setView(v);
    localStorage.setItem("dhakalPatroPanchView", v);
  };

  const udayaQuery = useQuery({
    queryKey: panchangaKeys.day(adDateStr, "ad", location.params),
    queryFn: () => fetchPanchanga(adDateStr, "ad", location.params),
    staleTime: 1000 * 60 * 30,
    enabled: !isInstant,
  });

  const instantQuery = useQuery({
    queryKey: panchangaKeys.atTime(atTimeDatetime, location.params),
    queryFn: () => fetchEphemerisPanchangaDay(atTimeDatetime, adDateStr, location.params),
    staleTime: 1000 * 60 * 5,
    enabled: isInstant,
  });

  const activeQuery = isInstant ? instantQuery : udayaQuery;
  const { data, isLoading, isError } = activeQuery;
  const ephemeris = isEphemerisPanchanga(data);

  const sunrise = data ? getSunrise(data) : undefined;
  const sunset = data ? getSunset(data) : undefined;
  const effectiveTimezone = resolveTimeZone(data?.location?.timezone, location.params.timezone);
  const isToday = adDateStr === todayAdStringInTimezone(new Date(), effectiveTimezone);

  const adMonthSpan = useMemo(
    () => getBsMonthAdSpanLabel(bs.year, bs.month),
    [bs.year, bs.month]
  );

  const locationLabel = data?.location?.name ?? location.label;
  const adDateLabel = data?.display?.gregorian_en ?? fmtAdFull(date);

  const titleSuffix =
    isInstant && view === "day"
      ? ` — ${toNepaliDigits(clock)} बजे`
      : isInstant && view === "month"
        ? ` — ${toNepaliDigits(clock)} बजे`
        : "";

  const chartAd = data ? chartDateAd(data, adDateStr) : adDateStr;

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 mt-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            नेपाली पात्रो · पञ्चाङ्ग
            {isInstant && (
              <span className="ml-2 text-secondary normal-case tracking-normal font-semibold">
                · समय-आधारित
              </span>
            )}
          </div>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0">
            {view === "month"
              ? `${BS_MONTHS_NE[bs.month - 1]} ${toNepaliDigits(bs.year)} — मासिक पञ्चाङ्ग${titleSuffix}`
              : isToday && !isInstant
                ? "आजको पञ्चाङ्ग"
                : `पञ्चाङ्ग विवरण${titleSuffix}`}
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            {view === "month" ? (
              <>
                {bs.monthName} {bs.year}
                {" · "}
                {adMonthSpan}
              </>
            ) : (
              <>
                {bs.monthName} {bs.day}, {bs.year}
                {" · "}
                {adDateLabel}
              </>
            )}
            {" · "}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {locationLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
          <PanchangaModeControls
            mode={dataMode}
            onModeChange={setDataMode}
            clock={clock}
            onClockChange={setClock}
          />
          <LocationSelector
            compact
            className="shrink-0"
            location={location}
            onLocationChange={setLocation}
          />
          <div
            className="inline-flex p-0.5 gap-0.5 border border-border rounded-lg bg-card"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "month"}
              className={cn(
                "h-[26px] px-3 rounded-[calc(var(--radius-lg)-2px)] border-0 text-[12.5px] font-semibold cursor-pointer transition-colors",
                view === "month"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => switchView("month")}
            >
              महिना
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "day"}
              className={cn(
                "h-[26px] px-3 rounded-[calc(var(--radius-lg)-2px)] border-0 text-[12.5px] font-semibold cursor-pointer transition-colors",
                view === "day"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => switchView("day")}
            >
              दिन
            </button>
          </div>
        </div>
      </div>

      {view === "month" ? (
        <div className="flex flex-col gap-4">
          <QuickDateStrip date={date} onDateChange={setDate} />
          <PanchangaMonthGrid
            date={date}
            locationParams={location.params}
            dataMode={dataMode}
            clock={clock}
            onPickDay={(d) => {
              setDate(d);
              switchView("day");
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_330px] gap-5 items-start">
          <div className="flex flex-col gap-4 min-w-0">
            <PanchangaDateNav date={date} onDateChange={setDate} />
            <QuickDateStrip date={date} onDateChange={setDate} />

            {ephemeris && data && !isLoading && (
              <EphemerisModeBanner p={data} clock={clock} />
            )}

            {data && !isLoading && (
              <DayTimeline
                p={data}
                dateAd={chartAd}
                isToday={isToday && !ephemeris}
                timezone={effectiveTimezone}
                needleClock={ephemeris ? clock : undefined}
              />
            )}

            {data && !isLoading && (
              <PanchangaCircularDiagram
                p={data}
                dateAd={chartAd}
                isToday={isToday && !ephemeris}
                timezone={effectiveTimezone}
                needleClock={ephemeris ? clock : undefined}
              />
            )}

            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 text-destructive p-4 text-sm">
                Could not load panchanga. Check the date or try again.
              </div>
            )}

            {data && !isLoading && (
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

          <aside className="flex flex-col gap-4 xl:sticky xl:top-[76px]">
            <GhatiClock sunrise={sunrise} sunset={sunset} timezone={effectiveTimezone} />
            {ephemeris && data && <MuhurtaNowPanel p={data} clock={clock} />}
            <PlanetEventsPanel dateAd={chartAd} location={location.params} />
          </aside>
        </div>
      )}

      <p className="mt-7 text-[11.5px] text-muted-foreground text-center">
        पञ्चाङ्गका मानहरू Dhakal Patro API बाट · Panchanga values from live API
      </p>
    </div>
  );
}
