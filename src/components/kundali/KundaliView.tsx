import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import { Clock, Flame, MapPin } from "lucide-react";
import {
  fetchKundaliDetail,
  kundaliDetailKeys,
  locationCacheKey,
  type BilingualValue,
  type KundaliDetailResponse,
  type LocationParams,
  type PanchangaDay,
  type PlanetInfo,
} from "@/lib/api";
import { formatBsDateLong } from "@/lib/bs-calendar";
import { buildAtTimeDatetime, normalizeEphemerisDay } from "@/lib/ephemeris-adapters";
import {
  getInstantLagna,
  getLagnaDisplay,
  getPanchangaDetail,
  getSunriseDisplay,
  getSunsetDisplay,
  getSuryaRashi,
  getVaaraNe,
  formatTithiWithPaksha,
  rashiNeFromNumber,
} from "@/lib/panchanga-format";
import { getAyanamshaModeInfo, type AyanamshaMode } from "@/lib/ayanamsha";
import { resolveTimeZone } from "@/lib/zoned-time";
import { DivisionalChartCompare } from "@/components/kundali/DivisionalChartCompare";
import { GrahaAstroTable, type GrahaAstroPoint } from "@/components/kundali/GrahaAstroTable";
import { UpagrahaTable } from "@/components/kundali/UpagrahaTable";
import { YogaList } from "@/components/kundali/YogaList";
import { DashaSystemPanel } from "@/components/kundali/DashaSystemPanel";
import type { KundaliSectionId } from "@/components/kundali/KundaliSectionNav";
import { ShadbalaCard } from "@/components/kundali/ShadbalaCard";
import { BhavaBalaCard } from "@/components/kundali/BhavaBalaCard";
import { VimshopakaCard } from "@/components/kundali/VimshopakaCard";
import { AshtakavargaCard } from "@/components/kundali/AshtakavargaCard";
import { KundaliReport } from "@/components/kundali/KundaliReport";
import { ShantiVidhiPanel } from "@/components/kundali/ShantiVidhiPanel";
import { PanchangaSection } from "@/components/panchanga/PanchangaLayout";
import { formatGhadiPalaVipala } from "@/lib/birth-panchanga-meta";
import { RASHI_EN_NAMES } from "@/lib/graha-details";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { WHEEL_YOGAS } from "@/lib/tithi-wheel-data";

function DetailTraitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1 min-w-[9rem] text-sm leading-snug">
      <span className="shrink-0">{label}</span>
      <span className="shrink-0">:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card px-3.5 py-3 min-w-0 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_5%,transparent)]">
      <p className="text-sm font-semibold uppercase tracking-wider mb-1 truncate">
        {label}
      </p>
      <p className="text-base font-bold text-foreground leading-tight">{value}</p>
      {sub && <p className="text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

type RawPlanet = PlanetInfo & {
  rashi_name?: string;
  is_retrograde?: boolean;
  latitude?: number;
  right_ascension?: number;
  declination?: number;
  speed?: number;
};

/** Astronomical extras per graha from the at-time panchanga planet block. */
function astroPointsFromPanchanga(p: PanchangaDay): Partial<Record<string, GrahaAstroPoint>> {
  const detail = getPanchangaDetail(p);
  const planets = (detail?.planets ?? p.planets) as Record<string, RawPlanet | string> | undefined;
  if (!planets) return {};
  const out: Partial<Record<string, GrahaAstroPoint>> = {};
  for (const [key, info] of Object.entries(planets)) {
    if (typeof info === "string") continue;
    out[key] = {
      longitude: info.longitude,
      retrograde: info.is_retrograde ?? info.retrograde,
      latitude: info.latitude,
      rightAscension: info.right_ascension,
      declination: info.declination,
      speed: info.speed,
    };
  }
  return out;
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

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Full birth-chart view for a single applied birth moment. Everything is
 * computed by the API's /kundali/detail endpoint — panchanga, divisional
 * charts, yogas, dasha tree, shadbala, bhava bala, ashtakavarga, avakahada —
 * so this component (and any future mobile client) only renders.
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
  const atTimeDatetime = buildAtTimeDatetime(adDateStr, clock);

  const detailQ = useQuery({
    queryKey: kundaliDetailKeys.atTime(atTimeDatetime, locationParams, ayanamshaMode),
    queryFn: () =>
      fetchKundaliDetail(atTimeDatetime, locationParams, { ayanamsha: ayanamshaMode }),
    staleTime: 1000 * 60 * 5,
  });

  const detail: KundaliDetailResponse | undefined = detailQ.data;
  const isLoading = detailQ.isLoading;
  const isError = detailQ.isError;

  const data = useMemo(
    () => (detail?.panchanga ? normalizeEphemerisDay(detail.panchanga) : undefined),
    [detail],
  );

  const rawLagna = data ? getLagnaDisplay(data) : undefined;
  const lagna = useMemo(() => {
    if (!rawLagna) return undefined;
    const rashiNum = rawLagna.rashiNum ?? detail?.lagnaRashi ?? undefined;
    return { ...rawLagna, rashiNum };
  }, [rawLagna, detail?.lagnaRashi]);

  const d1Rows = useMemo(
    () => detail?.vargaCharts.entries["1"] ?? [],
    [detail],
  );
  const moonRow = useMemo(() => d1Rows.find((r) => r.key === "moon"), [d1Rows]);
  const sunRow = useMemo(() => d1Rows.find((r) => r.key === "sun"), [d1Rows]);

  const janmaNakshatra = useMemo(() => {
    const meta = detail?.birthMeta.moonNakshatra;
    const index = meta?.index ?? moonRow?.nakshatraIndex;
    const pada = meta?.pada ?? moonRow?.pada;
    if (index == null || pada == null) return undefined;
    return {
      index,
      pada,
      ne: NAKSHATRA_ICONS[index]?.ne ?? "—",
      en: NAKSHATRA_ICONS[index]?.en ?? "—",
    };
  }, [detail, moonRow]);

  const moonRashiLabel = useMemo(() => {
    if (!moonRow) return undefined;
    return pick(
      rashiNeFromNumber(moonRow.vargaRashi) ?? "—",
      rashiNeFromNumber(moonRow.vargaRashi) ?? "—",
    );
  }, [moonRow, pick]);

  const pickBi = (v?: BilingualValue | null) => (v ? pick(v.ne, v.en) : "—");
  const janmaAvakahada = detail?.avakahada ?? null;

  const birthMeta = detail?.birthMeta;
  const ishtaKalaLabel = birthMeta?.ishtaKala
    ? formatGhadiPalaVipala(birthMeta.ishtaKala, lang)
    : undefined;
  const ahoratriIshtaLabel = birthMeta?.ahoratriIshtaKala
    ? formatGhadiPalaVipala(birthMeta.ahoratriIshtaKala, lang)
    : undefined;
  const choghadiyaAtBirth = birthMeta?.choghadiyaAtBirth ?? null;

  const astroPlanets = useMemo(() => (data ? astroPointsFromPanchanga(data) : {}), [data]);

  const astroLagna = useMemo<GrahaAstroPoint | undefined>(() => {
    if (lagna?.longitude == null) return undefined;
    const instant = data ? getInstantLagna(data) : undefined;
    return {
      longitude: lagna.longitude,
      latitude: instant?.latitude,
      rightAscension: instant?.right_ascension,
      declination: instant?.declination,
      speed: instant?.speed,
    };
  }, [lagna, data]);

  const panchangSummary = useMemo(() => {
    if (!data) return undefined;
    const pDetail = getPanchangaDetail(data);
    const tithiNe = formatTithiWithPaksha(data, "ne");
    const tithiEn = formatTithiWithPaksha(data, "en");
    const vaaraNe = getVaaraNe(data, data.weekday);
    const karanaNe =
      (pDetail?.karana as { name_ne?: string; name?: string } | undefined)?.name_ne ??
      data.karana?.name_ne ??
      (pDetail?.karana as { name?: string } | undefined)?.name ??
      data.karana?.name;
    const yogaIndex = detail?.birthMeta.yoga?.index;
    const yoga = yogaIndex != null ? { index: yogaIndex, ne: WHEEL_YOGAS[yogaIndex] ?? "—" } : undefined;
    return { tithiNe, tithiEn, vaaraNe, karanaNe, nakshatra: janmaNakshatra, yoga };
  }, [data, detail, janmaNakshatra]);

  const suryaMeta = useMemo(() => {
    if (!data) return undefined;
    const suryaRashi = getSuryaRashi(data);
    return {
      rashiNe: suryaRashi?.name_ne,
      rashiEn: suryaRashi?.name,
      nakshatra: sunRow
        ? {
            ne: NAKSHATRA_ICONS[sunRow.nakshatraIndex]?.ne ?? "—",
            en: NAKSHATRA_ICONS[sunRow.nakshatraIndex]?.en,
            pada: sunRow.pada,
          }
        : undefined,
    };
  }, [data, sunRow]);

  const vaaraEn = useMemo(() => {
    if (!data) return undefined;
    const pDetail = getPanchangaDetail(data);
    return (pDetail?.vaara as { name_english?: string } | undefined)?.name_english ?? data.weekday;
  }, [data]);

  const navamshaLagnaLabel = useMemo(() => {
    const d9 = detail?.vargaCharts?.entries?.["9"];
    const lagnaRow = d9?.find((row) => row.key === "lagna");
    if (!lagnaRow?.vargaRashi) return undefined;
    const ne = rashiNeFromNumber(lagnaRow.vargaRashi) ?? "—";
    const en = RASHI_EN_NAMES[lagnaRow.vargaRashi - 1] ?? ne;
    return { ne, en };
  }, [detail]);

  const aayanLabel = useMemo(() => {
    if (!data) return undefined;
    const pDetail = getPanchangaDetail(data);
    const aayan = pDetail?.aayan as { name_ne?: string; name?: string } | undefined;
    const topAayan = data.aayan;
    const ne =
      aayan?.name_ne ??
      (typeof topAayan === "object" && topAayan ? topAayan.name_ne : undefined);
    const en =
      aayan?.name ??
      (typeof topAayan === "object" && topAayan ? topAayan.name : undefined) ??
      ne;
    return ne ? { ne, en: en ?? ne } : undefined;
  }, [data]);

  const dasha = detail?.dasha ?? undefined;
  const tribhagiDasha = detail?.tribhagiDasha ?? undefined;
  const yoginiDasha = detail?.yoginiDasha ?? undefined;
  const ayanamshaInfo = getAyanamshaModeInfo(ayanamshaMode);
  const effectiveTimezone = resolveTimeZone(data?.location?.timezone, locationParams?.timezone);
  const locationLabel = data?.location?.name ?? locationLabelProp;

  const showSection = (id: KundaliSectionId) => section == null || section === id;

  const birthBsLabel = useMemo(
    () => formatBsDateLong(date, lang, digits),
    [date, lang, digits],
  );

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
        {t("kundali.load_error")}
      </div>
    );
  }

  if (!detail || !data) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm">
        <Clock className="mx-auto mb-3 h-8 w-8 animate-pulse" />
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
            <p className="text-sm font-semibold uppercase tracking-wider mb-1.5">
              {pick("जन्म समय", "Birth moment")}
            </p>
            <p className="text-2xl font-bold text-foreground font-[family-name:var(--pn-num)] leading-tight">
              {birthBsLabel}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {locationLabel}
                {effectiveTimezone ? ` · ${effectiveTimezone}` : ""}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-mono font-semibold text-foreground">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {digits(clock)}
              </span>
            </div>
          </div>

          {lagna && (
            <div className="flex-1 px-5 py-4 flex flex-col justify-center min-w-[200px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold uppercase tracking-wider">
                  {pick("लग्न", "Lagna")}
                </p>
                <span className="text-sm text-base bg-muted px-2 py-0.5 rounded-full shrink-0">
                  {ayanamshaInfo.labelNe}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {lagna.nameNe}
                {lagna.degree && (
                  <span className="text-base font-normal ml-2 font-mono">
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
            <p className="text-sm font-semibold uppercase tracking-wider">
              {pick("जन्म पञ्चाङ्ग", "Birth panchanga")}
            </p>
            <span className="text-sm text-base bg-card border border-border px-2.5 py-1 rounded-full shrink-0">
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
                value={`${pick(panchangSummary.nakshatra.ne, panchangSummary.nakshatra.en)} · ${pick(`पद ${digits(panchangSummary.nakshatra.pada)}`, `Pada ${digits(panchangSummary.nakshatra.pada)}`)}`}
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
            {navamshaLagnaLabel ? (
              <DetailTraitRow
                label={pick("नवांश लग्न", "Navamsha Lagna")}
                value={pick(navamshaLagnaLabel.ne, navamshaLagnaLabel.en)}
              />
            ) : null}
            {moonRashiLabel ? (
              <DetailTraitRow label={pick("राशि (चन्द्र)", "Rashi (Moon)")} value={moonRashiLabel} />
            ) : null}
            {getSunriseDisplay(data) ? (
              <DetailTraitRow
                label={pick("सूर्योदय", "Sunrise")}
                value={getSunriseDisplay(data) ?? "—"}
              />
            ) : null}
            {getSunsetDisplay(data) ? (
              <DetailTraitRow
                label={pick("सूर्यास्त", "Sunset")}
                value={getSunsetDisplay(data) ?? "—"}
              />
            ) : null}
            <DetailTraitRow label={pick("इष्ट काल", "Ishta Kala")} value={ishtaKalaLabel ?? "—"} />
            <DetailTraitRow
              label={pick("अहोरात्र इष्ट काल", "Ahoratri Ishta Kala")}
              value={ahoratriIshtaLabel ?? "—"}
            />
            {panchangSummary?.vaaraNe ? (
              <DetailTraitRow
                label={pick("वार", "Weekday")}
                value={pick(panchangSummary.vaaraNe, vaaraEn ?? panchangSummary.vaaraNe)}
              />
            ) : null}
            {aayanLabel ? (
              <DetailTraitRow
                label={pick("अयन", "Ayana")}
                value={pick(aayanLabel.ne, aayanLabel.en)}
              />
            ) : null}
            {suryaMeta?.rashiNe ? (
              <DetailTraitRow
                label={pick("सूर्य राशि", "Sun sign")}
                value={pick(suryaMeta.rashiNe, suryaMeta.rashiEn ?? suryaMeta.rashiNe)}
              />
            ) : null}
            {suryaMeta?.nakshatra ? (
              <DetailTraitRow
                label={pick("सूर्य नक्षत्र", "Surya Nakshatra")}
                value={pick(
                  `${suryaMeta.nakshatra.ne} · पद ${digits(suryaMeta.nakshatra.pada)}`,
                  `${suryaMeta.nakshatra.en ?? suryaMeta.nakshatra.ne} · Pada ${digits(suryaMeta.nakshatra.pada)}`,
                )}
              />
            ) : null}
          </div>

          {janmaAvakahada ? (
            <div className="mt-4 pt-4 border-t border-border/70">
              <p className="text-sm font-semibold uppercase tracking-wider mb-2">
                {pick("अवकहडा", "Avakahada")}
                <span className="mx-1.5 font-normal">·</span>
                <span className="normal-case tracking-normal font-semibold text-foreground">
                  {pickBi(janmaAvakahada.nakshatra)}
                  <span className="mx-1">·</span>
                  {pick(`पद ${digits(janmaAvakahada.pada)}`, `Pada ${digits(janmaAvakahada.pada)}`)}
                </span>
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <DetailTraitRow
                  label={pick("राशि पाय", "Rashi Paya")}
                  value={pickBi(janmaAvakahada.rashiPaya)}
                />
                <DetailTraitRow
                  label={pick("नक्षत्र पाय", "Nakshatra Paya")}
                  value={pickBi(janmaAvakahada.nakshatraPaya)}
                />
                <DetailTraitRow label={pick("तत्त्व", "Tattva")} value={pickBi(janmaAvakahada.tattva)} />
                <DetailTraitRow label={pick("युञ्ज", "Yunja")} value={pickBi(janmaAvakahada.yunja)} />
                <DetailTraitRow label={pick("वश्य", "Vashya")} value={pickBi(janmaAvakahada.vashya)} />
                <DetailTraitRow label={pick("तारा", "Tara")} value={pickBi(janmaAvakahada.tara)} />
                <DetailTraitRow label={pick("अक्षर", "Akshara")} value={pickBi(janmaAvakahada.akshara)} />
                <DetailTraitRow label={pick("गण", "Gana")} value={pickBi(janmaAvakahada.gana)} />
                <DetailTraitRow label={pick("नाडी", "Nadi")} value={pickBi(janmaAvakahada.nadi)} />
                <DetailTraitRow label={pick("आसन", "Asana")} value={pickBi(janmaAvakahada.asana)} />
                <DetailTraitRow label={pick("योनी", "Yoni")} value={pickBi(janmaAvakahada.yoni)} />
                <DetailTraitRow label={pick("जात", "Jati")} value={pickBi(janmaAvakahada.jati)} />
              </div>
            </div>
          ) : null}
        </div>
      )}

      {panchangSummary && !hideBirthSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatTile label={pick("राशि (चन्द्र)", "Rashi (Moon)")} value={moonRashiLabel ?? "—"} />
          <StatTile
            label={pick("नक्षत्र (चन्द्र)", "Nakshatra (Moon)")}
            value={panchangSummary.nakshatra ? pick(panchangSummary.nakshatra.ne, panchangSummary.nakshatra.en) : "—"}
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


      {showSection("kundali-overview") && d1Rows.length > 0 && (
        <div id="kundali-charts" className="scroll-mt-24">
          <PanchangaSection titleNe="कुण्डली चक्र" titleEn="Divisional Charts">
            <DivisionalChartCompare
              vargaCharts={detail.vargaCharts}
              rashiNeFromNumber={rashiNeFromNumber}
            />
          </PanchangaSection>
        </div>
      )}

      {/* Graha details — astronomical readout for the birth instant (D1), with upagraha (shadow points) as a separate table in the same section */}
      {showSection("kundali-graha") && d1Rows.length > 0 && (
        <div id="kundali-graha" className="scroll-mt-24">
          <PanchangaSection titleNe="ग्रह विवरण" titleEn="Graha Details">
            <GrahaAstroTable
              planets={astroPlanets}
              lagna={astroLagna}
              d1Rows={d1Rows}
              combustion={detail.combustion}
            />
            {detail.upagrahas.length > 0 && (
              <div className="border-t border-border">
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider">
                  {pick("उपग्रह", "Upagraha")}
                </p>
                <UpagrahaTable upagrahas={detail.upagrahas} />
              </div>
            )}
          </PanchangaSection>
        </div>
      )}

      {/* Kundali yogas — classical combinations detected in this chart */}
      {showSection("kundali-yoga") && detail.yogas.length > 0 && (
        <div id="kundali-yoga" className="scroll-mt-24">
          <PanchangaSection titleNe="कुण्डली योग" titleEn="Kundali Yoga">
            <YogaList yogas={detail.yogas} />
          </PanchangaSection>
        </div>
      )}

      {showSection("kundali-dasha") && (dasha || tribhagiDasha || yoginiDasha) && (
        <div id="kundali-dasha" className="scroll-mt-24">
        <PanchangaSection titleNe="दशा" titleEn="Dasha">
          <div className="p-4">
            <DashaSystemPanel
              vimshottari={dasha}
              tribhagi={tribhagiDasha}
              yogini={yoginiDasha}
              timeZone={effectiveTimezone}
            />
          </div>
        </PanchangaSection>
        </div>
      )}

      {showSection("kundali-shadbala") && (
        <div id="kundali-shadbala" className="scroll-mt-24 rounded-2xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 sm:p-5">
          <ShadbalaCard
            data={detail.shadbala}
            yuddha={detail.yuddha}
            bhavaBala={detail.bhavaBala}
          />
        </div>
      )}

      {showSection("kundali-bhava-bala") && (
        <div
          id="kundali-bhava-bala"
          className="scroll-mt-24 rounded-2xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 sm:p-5"
        >
          {detail.bhavaBala ? (
            <BhavaBalaCard data={detail.bhavaBala} />
          ) : (
            <p className="py-8 text-center text-sm">
              {t("kundali.section_unavailable")}
            </p>
          )}
        </div>
      )}

      {showSection("kundali-ashtakavarga") && (
        <div
          id="kundali-ashtakavarga"
          className="scroll-mt-24 rounded-2xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 sm:p-5"
        >
          {detail.ashtakavarga ? (
            <AshtakavargaCard data={detail.ashtakavarga} />
          ) : (
            <p className="py-8 text-center text-sm">
              {t("kundali.section_unavailable")}
            </p>
          )}
        </div>
      )}

      {showSection("kundali-vimshopaka") && (
        <div
          id="kundali-vimshopaka"
          className="scroll-mt-24 rounded-2xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 sm:p-5"
        >
          {detail.vimshopaka && detail.vimshopaka.classifications.length > 0 ? (
            <VimshopakaCard data={detail.vimshopaka} />
          ) : (
            <p className="py-8 text-center text-sm">
              {t("kundali.section_unavailable")}
            </p>
          )}
        </div>
      )}

      {showSection("kundali-shanti") && showShanti && (
        <div id="kundali-shanti" className="scroll-mt-24">
        <PanchangaSection titleNe="शान्ति विधि" titleEn="Navagraha Shanti">
          <div className="p-4">
            <div className="mb-3 flex items-center gap-1.5 text-sm">
              <Flame className="h-4 w-4 text-secondary" />
              {pick(
                "यस कुण्डलीको दशा र ग्रहबल अनुसार सुझाव गरिएको नवग्रह शान्ति।",
                "Navagraha Shanti suggested from this chart's dasha and planetary strength.",
              )}
            </div>
            <ShantiVidhiPanel
              vimshottari={dasha}
              shadbala={detail.shadbala}
              isError={isError}
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
