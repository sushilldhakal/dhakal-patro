import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import { Clock, Flame, MapPin } from "lucide-react";
import {
  fetchShadbala,
  fetchVimshottari,
  kundaliKeys,
  locationCacheKey,
  shadbalaKeys,
  vimshottariKeys,
  type LocationParams,
  type PanchangaDay,
  type PlanetInfo,
} from "@/lib/api";
import { adToBS, BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";
import {
  buildAtTimeDatetime,
  fetchEphemerisPanchangaDay,
} from "@/lib/ephemeris-adapters";
import {
  getLagnaDisplay,
  getPanchangaDetail,
  getVaaraNe,
  formatTithiWithPaksha,
  rashiNeFromNumber,
  toNepaliDigits,
} from "@/lib/panchanga-format";
import {
  getAyanamshaModeInfo,
  matchesPanchangaAngas,
  type AyanamshaMode,
} from "@/lib/ayanamsha";
import { resolveTimeZone } from "@/lib/zoned-time";
import { cn } from "@/lib/utils";
import { DivisionalChartCompare } from "@/components/kundali/DivisionalChartCompare";
import type { KundaliSectionId } from "@/components/kundali/KundaliSectionNav";
import { ShadbalaCard } from "@/components/kundali/ShadbalaCard";
import { KundaliReport } from "@/components/kundali/KundaliReport";
import { ShantiVidhiPanel } from "@/components/kundali/ShantiVidhiPanel";
import { PanchangaSection } from "@/components/panchanga/PanchangaLayout";
import { nakshatraPadaFromLongitude, resolveJanmaNakshatra, yogaFromLongitudes } from "@/lib/panchang-elements";
import { janmaAvakahadaFromLongitude } from "@/lib/avakahada-lagna";
import { buildBirthPanchangaMeta } from "@/lib/birth-panchanga-meta";
import { choghadiyaAtClock } from "@/components/panchanga/day-timeline-data";

function DetailTraitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1 min-w-[9rem] text-[13px] leading-snug">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-muted-foreground/40 shrink-0">:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card px-3.5 py-3 min-w-0 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_5%,transparent)]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 truncate">
        {label}
      </p>
      <p className="text-base font-bold text-foreground leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
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
  "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu",
];

function formatBsDateNe(iso: string, isEn = false): string {
  const bs = adToBS(new Date(iso));
  if (isEn) return `${bs.day} ${BS_MONTH_NAMES[bs.month - 1]} ${bs.year}`;
  return `${toNepaliDigits(bs.day)} ${BS_MONTHS_NE[bs.month - 1]} ${toNepaliDigits(bs.year)}`;
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
  dms_in_rashi?: string;
};

function planetsFromPanchanga(p: PanchangaDay, preferLongitudeNakshatra = false): PlanetCard[] {
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
    const nakshatra =
      key === "moon" && p.mode === "ephemeris" && !preferLongitudeNakshatra
        ? resolveJanmaNakshatra(
            p,
            detail?.nakshatra as { number?: number; name_ne?: string; progress?: number },
            lon,
          )
        : lon != null
          ? nakshatraPadaFromLongitude(lon)
          : undefined;

    const rashi = info.rashi_ne ?? info.rashi_name ?? info.rashi ?? "—";
    const degrees =
      info.dms_in_rashi ??
      (info.deg_in_rashi != null
        ? `${info.deg_in_rashi.toFixed(1)}°`
        : info.degrees != null
          ? `${info.degrees.toFixed(1)}°`
          : lon != null
            ? `${(lon % 30).toFixed(1)}°`
            : undefined);
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

export interface KundaliViewProps {
  /** Birth moment as an AD Date (local civil date at the chart's place). */
  date: Date;
  /** HH:MM birth clock. */
  clock: string;
  /** Resolved observer/location query params for the API. */
  locationParams: LocationParams | undefined;
  /** Human label for the birth place. */
  locationLabel: string;
  /** Ayanamsha mode applied to the chart. */
  ayanamshaMode: AyanamshaMode;
  /** Show the embedded Navagraha Shanti section for this kundali. Default true. */
  showShanti?: boolean;
  /** Hide the birth-moment hero (profile page shows birth facts in sidebar). */
  hideBirthSummary?: boolean;
  /** Profile page: show only this section (tab-style). Omit to show all sections. */
  section?: KundaliSectionId;
}

/**
 * Full birth-chart view for a single applied birth moment: birth summary,
 * panchang essentials, Nava Graha, divisional charts, Vimshottari dasha,
 * Shadbala, the interpretation report, and (optionally) Navagraha Shanti.
 *
 * Self-contained — fetches its own panchanga / dasha / shadbala from the
 * provided inputs. Used inline on /kundali (anonymous) and on /kundali/$id.
 */
export function KundaliView({
  date,
  clock,
  locationParams,
  locationLabel: locationLabelProp,
  ayanamshaMode,
  showShanti = true,
  hideBirthSummary = false,
  section,
}: KundaliViewProps) {
  const { t } = useTranslation();
  const { lang, pick, digits } = useLocale();
  const adDateStr = toAdStr(date);
  const bs = adToBS(date);
  const atTimeDatetime = buildAtTimeDatetime(adDateStr, clock);

  const { data, isLoading, isError } = useQuery({
    queryKey: kundaliKeys.atTime(atTimeDatetime, locationParams, ayanamshaMode),
    queryFn: () =>
      fetchEphemerisPanchangaDay(atTimeDatetime, adDateStr, locationParams, {
        ayanamsha: ayanamshaMode,
      }),
    staleTime: 1000 * 60 * 5,
  });

  const dashaQ = useQuery({
    queryKey: vimshottariKeys.atTime(atTimeDatetime, locationParams, ayanamshaMode),
    queryFn: () =>
      fetchVimshottari(atTimeDatetime, locationParams, { ayanamsha: ayanamshaMode }),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(atTimeDatetime),
  });

  const shadbalaQ = useQuery({
    queryKey: shadbalaKeys.atTime(atTimeDatetime, locationParams),
    queryFn: () => fetchShadbala(atTimeDatetime, locationParams),
    staleTime: 1000 * 60 * 5,
  });

  // Non-Lahiri modes shift graha longitudes while the API's anga blocks stay
  // Lahiri — derive nakshatra fields from the longitudes in that case.
  const lahiriAngas = matchesPanchangaAngas(ayanamshaMode);
  const planets = useMemo(
    () => (data ? planetsFromPanchanga(data, !lahiriAngas) : []),
    [data, lahiriAngas],
  );
  const rawLagna = data ? getLagnaDisplay(data) : undefined;
  const lagna = useMemo(() => {
    if (!rawLagna) return undefined;
    const rashiNum =
      rawLagna.rashiNum ??
      (rawLagna.longitude != null ? Math.floor(rawLagna.longitude / 30) + 1 : undefined);
    return { ...rawLagna, rashiNum };
  }, [rawLagna]);
  const moon = useMemo(() => planets.find((p) => p.key === "moon"), [planets]);

  const janmaNakshatra = useMemo(() => {
    if (!data) return undefined;
    const moonLon = moon?.longitude;
    if (!lahiriAngas && moonLon != null) {
      return nakshatraPadaFromLongitude(moonLon);
    }
    const detail = getPanchangaDetail(data);
    return resolveJanmaNakshatra(
      data,
      detail?.nakshatra as { number?: number; name_ne?: string; progress?: number },
      moonLon,
    );
  }, [data, moon, lahiriAngas]);

  const janmaAvakahada = useMemo(
    () =>
      moon?.longitude != null
        ? janmaAvakahadaFromLongitude(
            moon.longitude,
            lang,
            moon.rashi,
            moon.rashiNum,
            lagna?.rashiNum,
            janmaNakshatra,
          )
        : null,
    [moon, lang, lagna?.rashiNum, janmaNakshatra],
  );

  const birthPanchangaMeta = useMemo(() => {
    if (!data) return null;
    const sun = planets.find((p) => p.key === "sun");
    return buildBirthPanchangaMeta(data, clock, { sun });
  }, [data, clock, planets]);

  const choghadiyaAtBirth = useMemo(
    () => (data ? choghadiyaAtClock(data, clock, data.date_ad ?? adDateStr) : null),
    [data, clock, adDateStr],
  );

  const ayanamshaInfo = getAyanamshaModeInfo(ayanamshaMode);
  const effectiveTimezone = resolveTimeZone(data?.location?.timezone, locationParams?.timezone);
  const locationLabel = data?.location?.name ?? locationLabelProp;

  const chartPlanets = useMemo(
    () =>
      planets
        .filter((p) => p.longitude != null)
        .map((p) => ({
          key: p.key,
          labelNe: p.label,
          longitude: p.longitude,
          retrograde: p.retrograde,
        })),
    [planets],
  );

  const panchangSummary = useMemo(() => {
    if (!data) return undefined;
    const detail = getPanchangaDetail(data);
    const tithiNe = formatTithiWithPaksha(data, "ne");
    const tithiEn = formatTithiWithPaksha(data, "en");
    const vaaraNe = getVaaraNe(data, data.weekday);
    const karanaNe =
      (detail?.karana as { name_ne?: string; name?: string } | undefined)?.name_ne ??
      data.karana?.name_ne ??
      (detail?.karana as { name?: string } | undefined)?.name ??
      data.karana?.name;
    const moonLon = planets.find((p) => p.key === "moon")?.longitude;
    const sunLon = planets.find((p) => p.key === "sun")?.longitude;
    const nakshatra =
      !lahiriAngas && moonLon != null
        ? nakshatraPadaFromLongitude(moonLon)
        : resolveJanmaNakshatra(
            data,
            detail?.nakshatra as { number?: number; name_ne?: string; progress?: number },
            moonLon,
          );
    const yoga = moonLon != null && sunLon != null ? yogaFromLongitudes(sunLon, moonLon) : undefined;
    return { tithiNe, tithiEn, vaaraNe, karanaNe, nakshatra, yoga };
  }, [data, planets, lahiriAngas]);

  const dasha = dashaQ.data;

  const showSection = (id: KundaliSectionId) => section == null || section === id;

  const dateBs =
    data?.date_bs ??
    `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;
  const dateAd = data?.date_ad ?? adDateStr;

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
        {t("kundali.load_error")}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
        <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground animate-pulse" />
        {t("kundali.computing")}
      </div>
    );
  }

  return (
    <div className={section ? undefined : "space-y-6"}>
      {/* Birth summary — anonymous / generator flow only */}
      {!hideBirthSummary && (
        <section className="rounded-2xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:divide-x lg:divide-border">
          <div className="flex-1 px-5 py-4 border-b lg:border-b-0 border-border bg-secondary/[0.09] dark:bg-secondary/20">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {pick("जन्म समय · Birth moment", "Birth moment")}
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
                {digits(clock)}
              </span>
            </div>
          </div>

          {lagna && (
            <div className="flex-1 px-5 py-4 flex flex-col justify-center min-w-[200px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {pick("लग्न · Lagna", "Lagna")}
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
      )}

      {/* Unified birth panchanga + avakahada (profile view) */}
      {showSection("kundali-overview") && hideBirthSummary && (panchangSummary || lagna) && (
        <div className="rounded-2xl border border-secondary/25 bg-gradient-to-br from-secondary/[0.08] to-card p-4 sm:p-5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--secondary)_15%,transparent)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {pick("जन्म पञ्चाङ्ग", "Birth panchanga")}
            </p>
            <span className="text-[11px] font-medium text-muted-foreground bg-card border border-border px-2.5 py-1 rounded-full shrink-0">
              {ayanamshaInfo.labelNe}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {panchangSummary?.tithiNe ? (
              <DetailTraitRow
                label={pick("तिथि", "Tithi")}
                value={pick(panchangSummary.tithiNe, panchangSummary.tithiEn ?? panchangSummary.tithiNe)}
              />
            ) : null}
            {panchangSummary?.nakshatra ? (
              <DetailTraitRow
                label={pick("नक्षत्र", "Nakshatra")}
                value={`${panchangSummary.nakshatra.ne} · ${pick(`पद ${digits(panchangSummary.nakshatra.pada)}`, `Pada ${digits(panchangSummary.nakshatra.pada)}`)}`}
              />
            ) : null}
            {panchangSummary?.yoga ? (
              <DetailTraitRow label={pick("योग", "Yoga")} value={panchangSummary.yoga.ne} />
            ) : null}
            {panchangSummary?.karanaNe ? (
              <DetailTraitRow label={pick("करण", "Karana")} value={panchangSummary.karanaNe} />
            ) : null}
            {choghadiyaAtBirth ? (
              <DetailTraitRow
                label={pick("चौघडिया", "Choghadiya")}
                value={pick(
                  `${choghadiyaAtBirth.nameNe} (${choghadiyaAtBirth.quality})`,
                  `${choghadiyaAtBirth.nameEn ?? choghadiyaAtBirth.nameNe} (${
                    choghadiyaAtBirth.quality === "शुभ"
                      ? "auspicious"
                      : choghadiyaAtBirth.quality === "अशुभ"
                        ? "inauspicious"
                        : "neutral"
                  })`,
                )}
              />
            ) : null}
            {lagna ? (
              <DetailTraitRow
                label={pick("लग्न", "Lagna")}
                value={`${lagna.nameNe}${lagna.degree ? ` ${lagna.degree}°` : ""}`}
              />
            ) : null}
            {moon?.rashi ? (
              <DetailTraitRow label={pick("राशि (चन्द्र)", "Rashi (Moon)")} value={moon.rashi} />
            ) : null}
            {birthPanchangaMeta?.sunriseNe ? (
              <DetailTraitRow
                label={pick("सूर्योदय", "Sunrise")}
                value={birthPanchangaMeta.sunriseNe}
              />
            ) : null}
            {birthPanchangaMeta?.sunsetNe ? (
              <DetailTraitRow
                label={pick("सूर्यास्त", "Sunset")}
                value={birthPanchangaMeta.sunsetNe}
              />
            ) : null}
            {birthPanchangaMeta?.ishtaKalaNe ? (
              <DetailTraitRow
                label={pick("इष्ट काल", "Ishta Kala")}
                value={pick(
                  birthPanchangaMeta.ishtaKalaNe,
                  birthPanchangaMeta.ishtaKalaEn ?? birthPanchangaMeta.ishtaKalaNe,
                )}
              />
            ) : null}
            <DetailTraitRow
              label={pick("अहोरात्र इष्ट काल", "Ahoratri Ishta Kala")}
              value={pick(
                birthPanchangaMeta?.ahoratriIshtaNe ?? "—",
                birthPanchangaMeta?.ahoratriIshtaEn ?? "—",
              )}
            />
            {birthPanchangaMeta?.vaaraNe ? (
              <DetailTraitRow
                label={pick("वार", "Weekday")}
                value={pick(
                  birthPanchangaMeta.vaaraNe,
                  birthPanchangaMeta.vaaraEn ?? birthPanchangaMeta.vaaraNe,
                )}
              />
            ) : null}
            {birthPanchangaMeta?.suryaRashiNe ? (
              <DetailTraitRow
                label={pick("सूर्य राशि", "Sun sign")}
                value={pick(
                  birthPanchangaMeta.suryaRashiNe,
                  birthPanchangaMeta.suryaRashiEn ?? birthPanchangaMeta.suryaRashiNe,
                )}
              />
            ) : null}
            {birthPanchangaMeta?.suryaNakshatra ? (
              <DetailTraitRow
                label={pick("सूर्य नक्षत्र", "Surya Nakshatra")}
                value={
                  birthPanchangaMeta.suryaNakshatra.pada != null
                    ? pick(
                        `${birthPanchangaMeta.suryaNakshatra.ne} · पद ${digits(birthPanchangaMeta.suryaNakshatra.pada)}`,
                        `${birthPanchangaMeta.suryaNakshatra.en ?? birthPanchangaMeta.suryaNakshatra.ne} · Pada ${digits(birthPanchangaMeta.suryaNakshatra.pada)}`,
                      )
                    : pick(
                        birthPanchangaMeta.suryaNakshatra.ne,
                        birthPanchangaMeta.suryaNakshatra.en ?? birthPanchangaMeta.suryaNakshatra.ne,
                      )
                }
              />
            ) : null}
          </div>

          {janmaAvakahada ? (
            <div className="mt-4 pt-4 border-t border-border/70">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {pick("अवकहडा", "Avakahada")}
                <span className="mx-1.5 font-normal text-muted-foreground/50">·</span>
                <span className="normal-case tracking-normal font-semibold text-foreground">
                  {janmaAvakahada.nakshatraNe}
                  <span className="mx-1 text-muted-foreground/40">·</span>
                  {pick(`पद ${digits(janmaAvakahada.pada)}`, `Pada ${digits(janmaAvakahada.pada)}`)}
                </span>
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <DetailTraitRow
                  label={pick("राशि पाय", "Rashi Paya")}
                  value={janmaAvakahada.rashiPaya}
                />
                <DetailTraitRow
                  label={pick("नक्षत्र पाय", "Nakshatra Paya")}
                  value={janmaAvakahada.nakshatraPaya}
                />
                <DetailTraitRow label={pick("तत्त्व", "Tattva")} value={janmaAvakahada.tattva} />
                <DetailTraitRow label={pick("युञ्ज", "Yunja")} value={janmaAvakahada.yunja} />
                <DetailTraitRow label={pick("वश्य", "Vashya")} value={janmaAvakahada.vashya} />
                <DetailTraitRow label={pick("तारा", "Tara")} value={janmaAvakahada.tara} />
                <DetailTraitRow label={pick("अक्षर", "Akshara")} value={janmaAvakahada.akshara} />
                <DetailTraitRow label={pick("गण", "Gana")} value={janmaAvakahada.gana} />
                <DetailTraitRow label={pick("नाडी", "Nadi")} value={janmaAvakahada.nadi} />
                <DetailTraitRow label={pick("आसन", "Asana")} value={janmaAvakahada.asana} />
                <DetailTraitRow label={pick("योनी", "Yoni")} value={janmaAvakahada.yoni} />
                <DetailTraitRow label={pick("जात", "Jati")} value={janmaAvakahada.jati} />
              </div>
            </div>
          ) : null}
        </div>
      )}

      {panchangSummary && !hideBirthSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatTile label={pick("राशि (चन्द्र)", "Rashi (Moon)")} value={planets.find((p) => p.key === "moon")?.rashi ?? "—"} />
          <StatTile
            label={pick("नक्षत्र (चन्द्र)", "Nakshatra (Moon)")}
            value={panchangSummary.nakshatra ? `${panchangSummary.nakshatra.ne}` : "—"}
            sub={panchangSummary.nakshatra ? pick(`पद ${digits(panchangSummary.nakshatra.pada)}`, `Pada ${digits(panchangSummary.nakshatra.pada)}`) : undefined}
          />
          <StatTile
            label={pick("तिथि", "Tithi")}
            value={pick(panchangSummary.tithiNe ?? "—", panchangSummary.tithiEn ?? panchangSummary.tithiNe ?? "—")}
          />
          <StatTile label={pick("वार", "Day")} value={panchangSummary.vaaraNe ?? "—"} />
          <StatTile label={pick("योग", "Yoga")} value={panchangSummary.yoga?.ne ?? "—"} />
        </div>
      )}


      {showSection("kundali-charts") && (lagna?.longitude != null || moon?.longitude != null) && (
        <div id="kundali-charts" className="scroll-mt-24">
          <PanchangaSection titleNe="कुण्डली चक्र" titleEn="Divisional Charts">
            <DivisionalChartCompare
              lagnaLongitude={lagna?.longitude}
              planets={chartPlanets}
              rashiNeFromNumber={rashiNeFromNumber}
            />
          </PanchangaSection>
        </div>
      )}

      {showSection("kundali-dasha") && dasha && (
        <div id="kundali-dasha" className="scroll-mt-24">
        <PanchangaSection titleNe="विंशोत्तरी दशा" titleEn="Vimshottari Dasha">
          <div className="p-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <StatTile
                label={pick("महादशा सुरु (जन्मकालीन)", "Mahadasha at birth")}
                value={dasha.mahadasha_lord_ne}
                sub={pick(`बाँकी अवधि: ${dasha.balance_label}`, `Balance: ${dasha.balance_label}`)}
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground text-[11px] uppercase tracking-wide bg-muted/40">
                    <th className="py-2 px-3 font-semibold">{pick("दशा", "Dasha")}</th>
                    <th className="py-2 px-3 font-semibold">{pick("सुरु", "Start")}</th>
                    <th className="py-2 px-3 font-semibold">{pick("अन्त्य", "End")}</th>
                  </tr>
                </thead>
                <tbody>
                  {dasha.sequence.map((period, i) => (
                    <tr key={i} className={cn("border-t border-border", i % 2 === 1 && "bg-muted/20")}>
                      <td className="py-2 px-3 font-medium text-foreground">{period.lord_ne}</td>
                      <td className="py-2 px-3 text-muted-foreground">{formatBsDateNe(period.start, lang === "en")}</td>
                      <td className="py-2 px-3 text-muted-foreground">{formatBsDateNe(period.end, lang === "en")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </PanchangaSection>
        </div>
      )}

      {showSection("kundali-dasha") && !dasha && dashaQ.isLoading && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground animate-pulse" />
          {pick("दशा गणना हुँदै…", "Computing dasha…")}
        </div>
      )}

      {showSection("kundali-shadbala") && shadbalaQ.data && (
        <div id="kundali-shadbala" className="scroll-mt-24 rounded-2xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 sm:p-5">
          <ShadbalaCard data={shadbalaQ.data} />
        </div>
      )}

      {showSection("kundali-shadbala") && !shadbalaQ.data && shadbalaQ.isLoading && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground animate-pulse" />
          {pick("षड्बल गणना हुँदै…", "Computing shadbala…")}
        </div>
      )}

      {showSection("kundali-shanti") && showShanti && (
        <div id="kundali-shanti" className="scroll-mt-24">
        <PanchangaSection titleNe="शान्ति विधि" titleEn="Navagraha Shanti">
          <div className="p-4">
            <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Flame className="h-4 w-4 text-secondary" />
              {pick(
                "यस कुण्डलीको दशा र ग्रहबल अनुसार सुझाव गरिएको नवग्रह शान्ति।",
                "Navagraha Shanti suggested from this chart's dasha and planetary strength.",
              )}
            </div>
            <ShantiVidhiPanel
              vimshottari={dashaQ.data}
              shadbala={shadbalaQ.data}
              isError={dashaQ.isError && shadbalaQ.isError}
            />
          </div>
        </PanchangaSection>
        </div>
      )}

      {showSection("kundali-report") && (
      <div id="kundali-report" className="scroll-mt-24">
      <KundaliReport
        key={`${atTimeDatetime}|${locationCacheKey(locationParams)}|${ayanamshaMode}`}
        datetime={atTimeDatetime}
        location={locationParams}
        ayanamsha={ayanamshaMode}
        disabled={isLoading || isError}
      />
      </div>
      )}
    </div>
  );
}

export default KundaliView;
