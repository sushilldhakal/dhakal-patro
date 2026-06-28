import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchShadbala,
  fetchVimshottari,
  kundaliKeys,
  locationCacheKey,
  shadbalaKeys,
  vimshottariKeys,
  type PanchangaDay,
  type PlanetInfo,
} from "@/lib/api";
import { adToBS, bsToAD } from "@/lib/bs-calendar";
import { parseBirthDateParts } from "@/lib/birth-date";
import {
  buildAtTimeDatetime,
  fetchEphemerisPanchangaDay,
} from "@/lib/ephemeris-adapters";
import {
  getLagnaDisplay,
  getPanchangaDetail,
  getVaaraNe,
  rashiNeFromNumber,
  toNepaliDigits,
} from "@/lib/panchanga-format";
import {
  AYANAMSHA_MODES,
  getAyanamshaModeInfo,
  type AyanamshaMode,
} from "@/lib/ayanamsha";
import { resolveTimeZone } from "@/lib/zoned-time";
import { cn } from "@/lib/utils";
import { KundaliControls } from "@/components/kundali/KundaliControls";
import {
  KundaliProfilePicker,
  type KundaliProfilePickerHandle,
} from "@/components/kundali/KundaliProfilePicker";
import { AyanamshaSelector } from "@/components/kundali/AyanamshaSelector";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Profile } from "@/lib/auth/client";
import { D1Chart } from "@/components/kundali/D1Chart";
import { ShadbalaCard } from "@/components/kundali/ShadbalaCard";
import { KundaliReport } from "@/components/kundali/KundaliReport";
import { LearnMoreCard } from "@/components/LearnMoreCard";
import { PanchangaSection } from "@/components/panchanga/PanchangaLayout";
import {
  usePanchangaLocation,
  type PanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { defaultClockForTimezone } from "@/components/panchanga/use-panchanga-mode";
import { buildBhavaChart } from "@/lib/bhava";
import { navamsaRashiFromLongitude } from "@/lib/navamsa";
import { drekkanaRashiFromLongitude } from "@/lib/drekkana";
import { nakshatraPadaFromLongitude, yogaFromLongitudes } from "@/lib/panchang-elements";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 dark:bg-background/30 px-3.5 py-3 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 truncate">
        {label}
      </p>
      <p className="text-base font-bold text-foreground leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function ChartPanel({ titleNe, titleEn, houses }: { titleNe: string; titleEn: string; houses: ReturnType<typeof buildBhavaChart> }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 dark:bg-background/20 p-4 flex flex-col items-center gap-2">
      <div className="text-center">
        <p className="text-base font-bold text-foreground">{titleNe}</p>
        <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{titleEn}</p>
      </div>
      <D1Chart houses={houses} />
    </div>
  );
}

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
  rashiNum?: number;
  degrees?: string;
  retrograde?: boolean;
  longitude?: number;
  nakshatra?: string;
  pada?: number;
  nakshatresh?: string;
};

type RawPlanet = PlanetInfo & {
  rashi_name?: string;
  is_retrograde?: boolean;
  deg_in_rashi?: number;
};

function planetsFromPanchanga(p: PanchangaDay): PlanetCard[] {
  const detail = getPanchangaDetail(p);
  const planets = (detail?.planets ?? p.planets) as Record<string, RawPlanet | string> | undefined;
  if (!planets) return [];

  return PLANET_ORDER.filter((key) => key in planets).map((key) => {
    const info = planets[key];
    if (typeof info === "string") {
      return { key, label: PLANET_LABELS[key] ?? key, rashi: info };
    }

    const lon = info.longitude;
    const rashiNum = lon != null ? Math.floor(lon / 30) + 1 : undefined;
    const nakshatra = lon != null ? nakshatraPadaFromLongitude(lon) : undefined;

    const rashi = info.rashi_ne ?? info.rashi_name ?? info.rashi ?? "—";
    const degrees =
      info.deg_in_rashi != null
        ? `${info.deg_in_rashi.toFixed(1)}°`
        : info.degrees != null
          ? `${info.degrees.toFixed(1)}°`
          : lon != null
            ? `${(lon % 30).toFixed(1)}°`
            : undefined;
    return {
      key,
      label: PLANET_LABELS[key] ?? key,
      rashi,
      rashiNum,
      degrees,
      retrograde: info.is_retrograde ?? info.retrograde,
      longitude: lon,
      nakshatra: nakshatra?.ne,
      pada: nakshatra?.pada,
      nakshatresh: nakshatra?.lordNe,
    };
  });
}

/** Parse a saved profile's birth date (BS or AD, any separator) into an AD Date. */
function parseBirthDate(p: Profile): Date | null {
  if (!p.birth_date) return null;
  const parts = parseBirthDateParts(p.birth_date);
  if (!parts) return null;
  try {
    return p.birth_era === "ad"
      ? new Date(parts.y, parts.m - 1, parts.d)
      : bsToAD(parts.y, parts.m, parts.d);
  } catch {
    return null;
  }
}

/** Build a location from a profile's saved coordinates, falling back if absent. */
function profileLocation(p: Profile, fallback: PanchangaLocation): PanchangaLocation {
  if (p.latitude != null && p.longitude != null) {
    return {
      label: p.location_label || p.city || "Birth place",
      params: {
        lat: p.latitude,
        lon: p.longitude,
        ...(p.timezone ? { timezone: p.timezone } : {}),
      },
    };
  }
  return fallback;
}

export function Kundali() {
  const { isAuthenticated } = useAuth();
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

  // Nothing is computed until the visitor enters their birth details and presses
  // "Generate". This snapshot captures the exact inputs used for the displayed
  // chart, so editing the form afterwards doesn't silently recompute — the user
  // generates again when ready.
  const [applied, setApplied] = useState<{
    date: Date;
    clock: string;
    location: PanchangaLocation;
    ayanamshaMode: AyanamshaMode;
  } | null>(null);

  const generate = () => {
    setApplied({ date, clock, location, ayanamshaMode });
  };

  // ─── Saved-profile mode (signed-in users) ──────────────────────────────────
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const pickerRef = useRef<KundaliProfilePickerHandle>(null);

  const applyProfile = useCallback(
    (p: Profile) => {
      setSelectedProfileId(p.id);
      const birthDate = parseBirthDate(p);
      const loc = profileLocation(p, location);
      setLocation(loc);
      if (!birthDate) {
        // Profile has no usable birth date yet — prompt the user to add it.
        setApplied(null);
        return;
      }
      const clk =
        p.birth_time && /^\d{1,2}:\d{2}/.test(p.birth_time) ? p.birth_time : clock;
      setDate(birthDate);
      if (p.birth_era === "bs" || p.birth_era === "ad") setEra(p.birth_era);
      setClock(clk);
      setApplied({ date: birthDate, clock: clk, location: loc, ayanamshaMode });
    },
    [location, clock, ayanamshaMode, setLocation]
  );

  // Recompute when the ayanamsha changes while a profile is selected.
  useEffect(() => {
    if (selectedProfileId) {
      setApplied((a) => (a ? { ...a, ayanamshaMode } : a));
    }
  }, [ayanamshaMode, selectedProfileId]);

  const adDateStr = applied ? toAdStr(applied.date) : "";
  const bs = applied ? adToBS(applied.date) : null;
  const atTimeDatetime = applied ? buildAtTimeDatetime(adDateStr, applied.clock) : "";
  const appliedLocationParams = applied?.location.params;
  const appliedAyanamsha = applied?.ayanamshaMode ?? ayanamshaMode;
  const appliedClock = applied?.clock ?? clock;

  const { data, isLoading, isError } = useQuery({
    queryKey: kundaliKeys.atTime(atTimeDatetime, appliedLocationParams, appliedAyanamsha),
    queryFn: () =>
      fetchEphemerisPanchangaDay(atTimeDatetime, adDateStr, appliedLocationParams, {
        ayanamsha: appliedAyanamsha,
      }),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(applied),
  });

  const dashaQ = useQuery({
    queryKey: vimshottariKeys.atTime(atTimeDatetime, appliedLocationParams, appliedAyanamsha),
    queryFn: () =>
      fetchVimshottari(atTimeDatetime, appliedLocationParams, {
        ayanamsha: appliedAyanamsha,
      }),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(applied && atTimeDatetime),
  });

  const shadbalaQ = useQuery({
    queryKey: shadbalaKeys.atTime(atTimeDatetime, appliedLocationParams),
    queryFn: () => fetchShadbala(atTimeDatetime, appliedLocationParams),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(applied),
  });

  const planets = useMemo(() => (data ? planetsFromPanchanga(data) : []), [data]);
  const rawLagna = data ? getLagnaDisplay(data) : undefined;
  const lagna = useMemo(() => {
    if (!rawLagna) return undefined;
    const rashiNum =
      rawLagna.longitude != null
        ? Math.floor(rawLagna.longitude / 30) + 1
        : undefined;
    return { ...rawLagna, rashiNum, longitude: rawLagna.longitude };
  }, [rawLagna]);
  const ayanamshaInfo = getAyanamshaModeInfo(appliedAyanamsha);
  const effectiveTimezone = resolveTimeZone(data?.location?.timezone, appliedLocationParams?.timezone);
  const locationLabel = data?.location?.name ?? applied?.location.label ?? location.label;

  const bhavaHouses = useMemo(() => {
    if (!lagna?.rashiNum) return [];
    const planetRashis = planets
      .filter((p) => p.rashiNum != null)
      .map((p) => ({ key: p.key, labelNe: p.label, rashi: p.rashiNum! }));
    return buildBhavaChart(lagna.rashiNum, planetRashis, rashiNeFromNumber);
  }, [lagna, planets]);

  const d9Houses = useMemo(() => {
    if (lagna?.longitude == null) return [];
    const d9LagnaRashi = navamsaRashiFromLongitude(lagna.longitude);
    const planetNavamsas = planets
      .filter((p) => p.longitude != null)
      .map((p) => ({
        key: p.key,
        labelNe: p.label,
        rashi: navamsaRashiFromLongitude(p.longitude!),
      }));
    return buildBhavaChart(d9LagnaRashi, planetNavamsas, rashiNeFromNumber);
  }, [lagna, planets]);

  // Chandra (Moon) chart — same rashi positions as D1 but reckoned from the
  // Moon's sign as the 1st house, the classical way to read a horoscope from
  // the mind/Moon rather than the rising sign.
  const moonChartHouses = useMemo(() => {
    const moonRashi = planets.find((p) => p.key === "moon")?.rashiNum;
    if (moonRashi == null) return [];
    const planetRashis = planets
      .filter((p) => p.rashiNum != null)
      .map((p) => ({ key: p.key, labelNe: p.label, rashi: p.rashiNum! }));
    return buildBhavaChart(moonRashi, planetRashis, rashiNeFromNumber);
  }, [planets]);

  const d3Houses = useMemo(() => {
    if (lagna?.longitude == null) return [];
    const d3LagnaRashi = drekkanaRashiFromLongitude(lagna.longitude);
    const planetDrekkanas = planets
      .filter((p) => p.longitude != null)
      .map((p) => ({
        key: p.key,
        labelNe: p.label,
        rashi: drekkanaRashiFromLongitude(p.longitude!),
      }));
    return buildBhavaChart(d3LagnaRashi, planetDrekkanas, rashiNeFromNumber);
  }, [lagna, planets]);

  const panchangSummary = useMemo(() => {
    if (!data) return undefined;
    const detail = getPanchangaDetail(data);
    const tithiNe = (detail?.tithi as { name_ne?: string } | undefined)?.name_ne ?? data.tithi?.name_ne;
    const vaaraNe = getVaaraNe(data, data.weekday);

    const moonLon = planets.find((p) => p.key === "moon")?.longitude;
    const sunLon = planets.find((p) => p.key === "sun")?.longitude;

    const nakshatra = moonLon != null ? nakshatraPadaFromLongitude(moonLon) : undefined;
    const yoga = moonLon != null && sunLon != null ? yogaFromLongitudes(sunLon, moonLon) : undefined;

    return { tithiNe, vaaraNe, nakshatra, yoga };
  }, [data, planets]);

  const dasha = dashaQ.data;

  const dateBs =
    data?.date_bs ??
    (bs
      ? `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`
      : "");
  const dateAd = data?.date_ad ?? adDateStr;

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16">
      <div className="mb-4 mt-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            नेपाली पात्रो · जन्म कुण्डली
          </div>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-secondary shrink-0" />
            Janma Kundali
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            जन्म मिति, समय र स्थान अनुसार राशि, ग्रह र दशा विवरण
          </p>
        </div>
        {isAuthenticated && (
          <Button className="shrink-0" onClick={() => pickerRef.current?.openAdd()}>
            <Plus className="size-4" /> Add profile
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {isAuthenticated ? (
          <KundaliProfilePicker ref={pickerRef} selectedId={selectedProfileId} onSelect={applyProfile} />
        ) : (
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
        )}

        <AyanamshaSelector mode={ayanamshaMode} onModeChange={setAyanamshaMode} />

        {!isAuthenticated && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-secondary px-5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              <Sparkles className="h-4 w-4" />
              {applied ? "Update kundali" : "Generate kundali"}
            </button>
            <p className="text-xs text-muted-foreground">
              जन्म मिति, समय र स्थान भरेर “Generate” थिच्नुहोस् · Set your birth date,
              time and place, then generate.
            </p>
          </div>
        )}

        {!applied && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center">
            <Clock className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              कुण्डली देखाउन जन्म विवरण आवश्यक छ
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {isAuthenticated
                ? selectedProfileId
                  ? "This profile has no birth date yet — add the birth date, time and place to it, then it'll generate."
                  : "Pick a profile above (or add one) to generate its kundali."
                : "Enter the birth date, time and place above, then press Generate kundali. Nothing is calculated until you do."}
            </p>
          </div>
        )}

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
          <div className="space-y-5">
            {/* Birth summary */}
            <section className="rounded-xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
              <div className="flex flex-col lg:flex-row lg:items-stretch lg:divide-x lg:divide-border">
                <div className="flex-1 px-5 py-4 border-b lg:border-b-0 border-border bg-secondary/[0.09] dark:bg-secondary/20">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    जन्म समय · Birth moment
                  </p>
                  <p className="text-2xl font-bold text-foreground font-[family-name:var(--pn-num)] leading-tight">
                    {dateBs}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{dateAd}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {locationLabel}
                      {effectiveTimezone ? ` · ${effectiveTimezone}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-mono font-semibold text-foreground">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {toNepaliDigits(appliedClock)}
                    </span>
                  </div>
                </div>

                {lagna && (
                  <div className="flex-1 px-5 py-4 flex flex-col justify-center min-w-[200px]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        लग्न · Lagna
                      </p>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                        {ayanamshaInfo.labelNe}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {lagna.nameNe}
                      {lagna.degree && (
                        <span className="text-base font-normal text-muted-foreground ml-2 font-mono">
                          {lagna.degree}°
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Panchang essentials */}
            {panchangSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatTile
                  label="राशि (चन्द्र)"
                  value={planets.find((p) => p.key === "moon")?.rashi ?? "—"}
                />
                <StatTile
                  label="नक्षत्र"
                  value={
                    panchangSummary.nakshatra
                      ? `${panchangSummary.nakshatra.ne}`
                      : "—"
                  }
                  sub={
                    panchangSummary.nakshatra
                      ? `पाद ${toNepaliDigits(panchangSummary.nakshatra.pada)}`
                      : undefined
                  }
                />
                <StatTile label="तिथि" value={panchangSummary.tithiNe ?? "—"} />
                <StatTile label="वार" value={panchangSummary.vaaraNe ?? "—"} />
                <StatTile label="योग" value={panchangSummary.yoga?.ne ?? "—"} />
              </div>
            )}

            {/* Nava Graha */}
            {planets.length > 0 ? (
              <PanchangaSection titleNe="नव ग्रह" titleEn="Nava Graha">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border">
                  {planets.map((planet) => (
                    <div
                      key={planet.key}
                      className={cn(
                        "bg-card px-4 py-3.5 flex items-start justify-between gap-3 min-h-[88px]",
                        planet.retrograde && "bg-secondary/[0.06] dark:bg-secondary/10"
                      )}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="text-[12px] font-semibold text-muted-foreground leading-snug">
                            {planet.label}
                          </p>
                          {planet.retrograde && (
                            <span className="text-[9.5px] text-secondary font-bold bg-secondary/15 dark:text-secondary px-1.5 py-0.5 rounded-full shrink-0">
                              वक्री
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-foreground leading-tight">{planet.rashi}</p>
                        {planet.degrees && (
                          <p className="text-xs font-mono text-muted-foreground">{planet.degrees}</p>
                        )}
                      </div>
                      {planet.nakshatra && (
                        <div className="flex flex-col items-end text-right shrink-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                            नक्षत्र
                          </p>
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            {planet.nakshatra}
                          </p>
                          {planet.pada != null && (
                            <p className="text-[11px] text-muted-foreground">
                              पाद {toNepaliDigits(planet.pada)}
                            </p>
                          )}
                          {planet.nakshatresh && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              <span className="text-muted-foreground/70">नक्षत्रेश: </span>
                              <span className="font-semibold text-foreground">{planet.nakshatresh}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </PanchangaSection>
            ) : (
              <p className="text-muted-foreground text-sm">No planet data available for this date.</p>
            )}

            {/* Charts */}
            {bhavaHouses.length > 0 && (
              <PanchangaSection titleNe="कुण्डली चक्र" titleEn="Divisional Charts">
                <div className="grid sm:grid-cols-2 gap-4 p-4">
                  <ChartPanel titleNe="राशि कुण्डली" titleEn="D1 Rashi" houses={bhavaHouses} />
                  {moonChartHouses.length > 0 && (
                    <ChartPanel titleNe="चन्द्र कुण्डली" titleEn="Chandra" houses={moonChartHouses} />
                  )}
                  {d9Houses.length > 0 && (
                    <ChartPanel titleNe="नवांश" titleEn="D9 Navamsha" houses={d9Houses} />
                  )}
                  {d3Houses.length > 0 && (
                    <ChartPanel titleNe="द्रेष्काण" titleEn="D3 Drekkana" houses={d3Houses} />
                  )}
                </div>
              </PanchangaSection>
            )}

            {/* Vimshottari Dasha */}
            {dasha && (
              <PanchangaSection titleNe="विंशोत्तरी दशा" titleEn="Vimshottari Dasha">
                <div className="p-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <StatTile
                      label="महादशा सुरु (जन्मकालीन)"
                      value={dasha.mahadasha_lord_ne}
                      sub={`बाँकी अवधि: ${dasha.balance_label}`}
                    />
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground text-[11px] uppercase tracking-wide bg-muted/40">
                          <th className="py-2 px-3 font-semibold">दशा</th>
                          <th className="py-2 px-3 font-semibold">सुरु</th>
                          <th className="py-2 px-3 font-semibold">अन्त्य</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dasha.sequence.map((period, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="py-2 px-3 font-medium text-foreground">{period.lord_ne}</td>
                            <td className="py-2 px-3 text-muted-foreground">
                              {new Date(period.start).toLocaleDateString("en", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">
                              {new Date(period.end).toLocaleDateString("en", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </PanchangaSection>
            )}

            {/* Shadbala */}
            {shadbalaQ.isLoading && (
              <div className="bg-muted/50 animate-pulse rounded-xl h-40" />
            )}
            {shadbalaQ.data && (
              <div className="rounded-xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 sm:p-5">
                <ShadbalaCard data={shadbalaQ.data} />
              </div>
            )}

            {/* Deterministic interpretation report with confidence indicator.
                Keyed on the chart inputs so it remounts (and clears any stale
                report) whenever the birth moment, place or ayanamsha changes. */}
            <KundaliReport
              key={`${atTimeDatetime}|${locationCacheKey(appliedLocationParams)}|${appliedAyanamsha}`}
              datetime={atTimeDatetime}
              location={appliedLocationParams}
              ayanamsha={appliedAyanamsha}
              disabled={isLoading || isError}
            />
          </div>
        )}
      </div>

      <LearnMoreCard
        className="mt-7"
        heading="कुण्डली बुझ्न आवश्यक आधार"
        slugs={["ayanamsha", "nakshatra", "solar-system"]}
      />

      <p className="mt-7 text-[11.5px] text-muted-foreground text-center">
        कुण्डलीका मानहरू Vedic Patro API बाट · Kundali values from live API
      </p>
    </div>
  );
}
