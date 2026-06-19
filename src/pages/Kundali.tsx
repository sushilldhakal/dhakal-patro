import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, MapPin, Sparkles } from "lucide-react";
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
  getVaaraNe,
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
import { D1Chart } from "@/components/kundali/D1Chart";
import { LearnMoreCard } from "@/components/LearnMoreCard";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { defaultClockForTimezone } from "@/components/panchanga/use-panchanga-mode";
import { buildBhavaChart } from "@/lib/bhava";
import { navamsaRashiFromLongitude } from "@/lib/navamsa";
import { drekkanaRashiFromLongitude } from "@/lib/drekkana";
import { nakshatraPadaFromLongitude, yogaFromLongitudes } from "@/lib/panchang-elements";
import { vimshottariDasha } from "@/lib/dasha";

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

    const shifted = info.longitude != null ? shiftSiderealLongitude(info.longitude, mode) : undefined;
    const rashiNum = shifted != null ? Math.floor(shifted / 30) + 1 : undefined;

    if (offset !== 0 && shifted != null) {
      return {
        key,
        label: PLANET_LABELS[key] ?? key,
        rashi: rashiNeFromNumber(rashiNum) ?? "—",
        rashiNum,
        degrees: `${(shifted % 30).toFixed(1)}°`,
        retrograde: info.is_retrograde ?? info.retrograde,
        longitude: shifted,
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
      rashiNum,
      degrees,
      retrograde: info.is_retrograde ?? info.retrograde,
      longitude: shifted,
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
    if (rawLagna.longitude == null) return { ...rawLagna, rashiNum: undefined as number | undefined };
    const shifted = shiftSiderealLongitude(rawLagna.longitude, ayanamshaMode);
    const rashiNum = Math.floor(shifted / 30) + 1;
    const offset = getAyanamshaOffsetDeg(ayanamshaMode);
    if (offset === 0) return { ...rawLagna, rashiNum, longitude: shifted };
    return {
      nameNe: rashiNeFromNumber(rashiNum) ?? rawLagna.nameNe,
      degree: toNepaliDigits((shifted % 30).toFixed(1)),
      rashiNum,
      longitude: shifted,
    };
  }, [rawLagna, ayanamshaMode]);
  const ayanamshaInfo = getAyanamshaModeInfo(ayanamshaMode);
  const effectiveTimezone = resolveTimeZone(data?.location?.timezone, location.params.timezone);
  const locationLabel = data?.location?.name ?? location.label;

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

  const dasha = useMemo(() => {
    const moonLon = planets.find((p) => p.key === "moon")?.longitude;
    if (moonLon == null) return undefined;
    const birthDate = new Date(atTimeDatetime);
    return vimshottariDasha(moonLon, birthDate);
  }, [planets, atTimeDatetime]);

  const [showAdvanced, setShowAdvanced] = useState(false);

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

            {panchangSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-card border border-border rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">राशि (चन्द्र)</p>
                  <p className="text-base font-bold text-foreground">
                    {planets.find((p) => p.key === "moon")?.rashi ?? "—"}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">नक्षत्र</p>
                  <p className="text-base font-bold text-foreground">
                    {panchangSummary.nakshatra
                      ? `${panchangSummary.nakshatra.ne} (पाद ${toNepaliDigits(panchangSummary.nakshatra.pada)})`
                      : "—"}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">तिथि</p>
                  <p className="text-base font-bold text-foreground">{panchangSummary.tithiNe ?? "—"}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">वार</p>
                  <p className="text-base font-bold text-foreground">{panchangSummary.vaaraNe ?? "—"}</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
              className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-secondary hover:text-secondary/80"
            >
              विस्तृत विवरण (Advanced)
              <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
            </button>

            {showAdvanced && (
              <div className="space-y-6">
                {panchangSummary?.yoga && (
                  <div className="bg-card border border-border rounded-xl p-3.5">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">योग</p>
                    <p className="text-base font-bold text-foreground">{panchangSummary.yoga.ne}</p>
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

                {bhavaHouses.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        D1 Rashi Chart
                      </h3>
                      <D1Chart houses={bhavaHouses} />
                    </div>
                    {moonChartHouses.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Chandra Kundali (चन्द्र)
                        </h3>
                        <D1Chart houses={moonChartHouses} />
                      </div>
                    )}
                    {d9Houses.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          D9 Navamsha (नवांश)
                        </h3>
                        <D1Chart houses={d9Houses} />
                      </div>
                    )}
                    {d3Houses.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          D3 Drekkana (द्रेष्काण)
                        </h3>
                        <D1Chart houses={d3Houses} />
                      </div>
                    )}
                  </div>
                )}

                {dasha && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Vimshottari Dasha
                    </h3>
                    <div className="bg-card border border-border rounded-xl p-4 mb-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">महादशा सुरु (जन्मकालीन)</p>
                      <p className="text-xl font-bold text-foreground">{dasha.mahadashaLordNe}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">बाँकी अवधि: {dasha.balanceLabel}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground text-xs uppercase">
                            <th className="py-1.5 pr-3">दशा</th>
                            <th className="py-1.5 pr-3">सुरु</th>
                            <th className="py-1.5">अन्त्य</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dasha.sequence.map((period, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="py-1.5 pr-3 font-medium text-foreground">{period.lordNe}</td>
                              <td className="py-1.5 pr-3 text-muted-foreground">
                                {period.startDate.toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="py-1.5 text-muted-foreground">
                                {period.endDate.toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <LearnMoreCard
        className="mt-7"
        heading="कुण्डली बुझ्न आवश्यक आधार"
        slugs={["ayanamsha", "nakshatra", "solar-system"]}
      />

      <p className="mt-7 text-[11.5px] text-muted-foreground text-center">
        कुण्डलीका मानहरू Dhakal Patro API बाट · Kundali values from live API
      </p>
    </div>
  );
}
