import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Sparkles } from "lucide-react";
import {
  kundaliKeys,
  type PanchangaDay,
  type PlanetInfo,
} from "@/lib/api";
import { adToBS } from "@/lib/bs-calendar";
import {
  buildAtTimeDatetime,
  fetchEphemerisPanchangaDay,
} from "@/lib/ephemeris-adapters";
import {
  getLagnaDisplay,
  getPanchangaDetail,
  rashiNeFromNumber,
  toNepaliDigits,
} from "@/lib/panchanga-format";
import {
  AYANAMSHA_MODES,
  getAyanamshaModeInfo,
  getAyanamshaOffsetDeg,
  isApproximateMode,
  shiftSiderealLongitude,
  type AyanamshaMode,
} from "@/lib/ayanamsha";
import { resolveTimeZone } from "@/lib/zoned-time";
import { cn } from "@/lib/utils";
import { KundaliControls } from "@/components/kundali/KundaliControls";
import { AyanamshaSelector } from "@/components/kundali/AyanamshaSelector";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { defaultClockForTimezone } from "@/components/panchanga/use-panchanga-mode";

const PLANET_LABELS: Record<string, string> = {
  sun: "☀️ Sun (सूर्य)",
  moon: "🌙 Moon (चन्द्र)",
  mars: "♂️ Mars (मंगल)",
  mercury: "☿ Mercury (बुध)",
  jupiter: "♃ Jupiter (बृहस्पति)",
  venus: "♀ Venus (शुक्र)",
  saturn: "♄ Saturn (शनि)",
  rahu: "☊ Rahu (राहु)",
  ketu: "☋ Ketu (केतु)",
};

const PLANET_ORDER = [
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn",
  "rahu",
  "ketu",
];

const CLOCK_KEY = "dhakalPatroKundaliClock";
const AYANAMSHA_KEY = "dhakalPatroAyanamshaMode";

function loadSavedAyanamshaMode(): AyanamshaMode {
  const saved = localStorage.getItem(AYANAMSHA_KEY);
  return AYANAMSHA_MODES.some((m) => m.id === saved) ? (saved as AyanamshaMode) : "nepal";
}

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type PlanetCard = {
  key: string;
  label: string;
  rashi: string;
  degrees?: string;
  retrograde?: boolean;
};

type RawPlanet = PlanetInfo & {
  rashi_name?: string;
  is_retrograde?: boolean;
  deg_in_rashi?: number;
};

function planetsFromPanchanga(p: PanchangaDay, mode: AyanamshaMode): PlanetCard[] {
  const detail = getPanchangaDetail(p);
  const planets = (detail?.planets ?? p.planets) as Record<string, RawPlanet | string> | undefined;
  if (!planets) return [];

  const offset = getAyanamshaOffsetDeg(mode);

  return PLANET_ORDER.filter((key) => key in planets).map((key) => {
    const info = planets[key];
    if (typeof info === "string") {
      return { key, label: PLANET_LABELS[key] ?? key, rashi: info };
    }

    if (offset !== 0 && info.longitude != null) {
      const shifted = shiftSiderealLongitude(info.longitude, mode);
      const rashiIndex = Math.floor(shifted / 30);
      return {
        key,
        label: PLANET_LABELS[key] ?? key,
        rashi: rashiNeFromNumber(rashiIndex + 1) ?? "—",
        degrees: `${(shifted % 30).toFixed(1)}°`,
        retrograde: info.is_retrograde ?? info.retrograde,
      };
    }

    const rashi = info.rashi_ne ?? info.rashi_name ?? info.rashi ?? "—";
    const degrees =
      info.deg_in_rashi != null
        ? `${info.deg_in_rashi.toFixed(1)}°`
        : info.degrees != null
          ? `${info.degrees.toFixed(1)}°`
          : info.longitude != null
            ? `${(info.longitude % 30).toFixed(1)}°`
            : undefined;
    return {
      key,
      label: PLANET_LABELS[key] ?? key,
      rashi,
      degrees,
      retrograde: info.is_retrograde ?? info.retrograde,
    };
  });
}

export function Kundali() {
  const { location, setLocation } = usePanchangaLocation();
  const [date, setDate] = useState(() => new Date());
  const [era, setEra] = useState<"bs" | "ad">("bs");
  const [ayanamshaMode, setAyanamshaModeState] = useState<AyanamshaMode>(loadSavedAyanamshaMode);

  const setAyanamshaMode = (next: AyanamshaMode) => {
    setAyanamshaModeState(next);
    localStorage.setItem(AYANAMSHA_KEY, next);
  };

  const timezone = location.params.timezone ?? "Asia/Kathmandu";
  const [clock, setClock] = useState(() => {
    const saved = localStorage.getItem(CLOCK_KEY);
    return saved ?? defaultClockForTimezone(timezone);
  });

  const handleClockChange = (next: string) => {
    setClock(next);
    localStorage.setItem(CLOCK_KEY, next);
  };

  const adDateStr = toAdStr(date);
  const bs = adToBS(date);
  const atTimeDatetime = buildAtTimeDatetime(adDateStr, clock);

  const { data, isLoading, isError } = useQuery({
    queryKey: kundaliKeys.atTime(atTimeDatetime, location.params),
    queryFn: () => fetchEphemerisPanchangaDay(atTimeDatetime, adDateStr, location.params),
    staleTime: 1000 * 60 * 5,
  });

  const planets = useMemo(
    () => (data ? planetsFromPanchanga(data, ayanamshaMode) : []),
    [data, ayanamshaMode]
  );
  const rawLagna = data ? getLagnaDisplay(data) : undefined;
  const lagna = useMemo(() => {
    if (!rawLagna) return undefined;
    const offset = getAyanamshaOffsetDeg(ayanamshaMode);
    if (offset === 0 || rawLagna.longitude == null) return rawLagna;
    const shifted = shiftSiderealLongitude(rawLagna.longitude, ayanamshaMode);
    const rashiIndex = Math.floor(shifted / 30);
    return {
      nameNe: rashiNeFromNumber(rashiIndex + 1) ?? rawLagna.nameNe,
      degree: toNepaliDigits((shifted % 30).toFixed(1)),
    };
  }, [rawLagna, ayanamshaMode]);
  const ayanamshaInfo = getAyanamshaModeInfo(ayanamshaMode);
  const effectiveTimezone = resolveTimeZone(data?.location?.timezone, location.params.timezone);
  const locationLabel = data?.location?.name ?? location.label;

  const dateBs =
    data?.date_bs ??
    `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;
  const dateAd = data?.date_ad ?? adDateStr;

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16">
      <div className="mb-4 mt-2">
        <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          नेपाली पात्रो · जन्म कुण्डली
        </div>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0 flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-secondary shrink-0" />
          Janma Kundali
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        <KundaliControls
          date={date}
          onDateChange={setDate}
          era={era}
          onEraChange={setEra}
          clock={clock}
          onClockChange={handleClockChange}
          location={location}
          onLocationChange={setLocation}
        />

        <AyanamshaSelector mode={ayanamshaMode} onModeChange={setAyanamshaMode} />

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-muted/50 animate-pulse rounded-xl h-24" />
            ))}
          </div>
        )}

        {isError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
            Could not load kundali data. Check the date and location, then try again.
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-6">
            <div className="bg-secondary rounded-2xl p-6 text-secondary-foreground">
              <p className="text-primary-foreground/80 text-sm mb-1">Graha at Birth Time</p>
              <p className="text-2xl font-bold">{dateBs}</p>
              <p className="text-secondary-foreground/80 text-sm mt-0.5">{dateAd}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-secondary-foreground/70">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {locationLabel}
                  {effectiveTimezone ? ` (${effectiveTimezone})` : ""}
                </span>
                <span>🕐 {toNepaliDigits(clock)}</span>
              </div>
            </div>

            {lagna && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Lagna (लग्न)
                  </p>
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                    अयनांश: {ayanamshaInfo.labelNe}
                    {isApproximateMode(ayanamshaMode) ? " (अनुमानित)" : ""}
                  </span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {lagna.nameNe}
                  {lagna.degree && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      {lagna.degree}°
                    </span>
                  )}
                </p>
              </div>
            )}

            {planets.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Nava Graha (नव ग्रह)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {planets.map((planet) => (
                    <div
                      key={planet.key}
                      className={cn(
                        "bg-card border rounded-xl p-4 space-y-1.5",
                        planet.retrograde
                          ? "border-secondary/30 bg-secondary/5"
                          : "border-border"
                      )}
                    >
                      <p className="text-xs font-semibold text-muted-foreground">{planet.label}</p>
                      <p className="text-lg font-bold text-foreground">{planet.rashi}</p>
                      {planet.degrees && (
                        <p className="text-xs text-muted-foreground">{planet.degrees}</p>
                      )}
                      {planet.retrograde && (
                        <span className="text-[10px] text-secondary font-semibold bg-secondary/10 px-2 py-0.5 rounded-full">
                          Vakri ↺
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No planet data available for this date.</p>
            )}
          </div>
        )}
      </div>

      <p className="mt-7 text-[11.5px] text-muted-foreground text-center">
        कुण्डलीका मानहरू Dhakal Patro API बाट · Kundali values from live API
      </p>
    </div>
  );
}
