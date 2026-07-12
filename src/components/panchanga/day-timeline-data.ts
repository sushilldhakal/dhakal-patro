import type { ApiHoraSlot, CivilTimeline, PanchangaDay } from "@/lib/api";
import {
  formatPakshaNepaliDisplay,
  getLagnaSpans,
  getHoraSlots,
  getMoonrise,
  getMoonset,
  getPanchangaDetail,
  getPlanetRows,
  getSunrise,
  getSunset,
  toNepaliDigits,
} from "@/lib/panchanga-format";
import { KARANA_EN } from "@/lib/tithi-wheel-data";

/** Devanagari rashi names → English, for the timeline graha row. */
export const TL_RASHI_EN: Record<string, string> = {
  मेष: "Mesha",
  वृष: "Vrishabha",
  वृषभ: "Vrishabha",
  मिथुन: "Mithuna",
  कर्कट: "Karka",
  कर्क: "Karka",
  सिंह: "Simha",
  कन्या: "Kanya",
  तुला: "Tula",
  वृश्चिक: "Vrishchika",
  धनु: "Dhanu",
  मकर: "Makara",
  कुम्भ: "Kumbha",
  मीन: "Meena",
};

export interface TimelineSegment {
  name: string;
  /** English variant of `name` for the English locale. */
  nameEn?: string;
  endG?: number | null;
  bad?: boolean;
  /** Wall-clock label at segment end (used for lagna transitions). */
  transitionLocal?: string;
  /** Planet name above rashi (ग्रह स्थिति row). */
  subLabel?: string;
  /** English variant of `subLabel`. */
  subLabelEn?: string;
}

/** Choghadiya muhurta names (Nepali → English). */
export const CHOGHADIYA_EN: Record<string, string> = {
  उद्वेग: "Udvega",
  चर: "Chara",
  लाभ: "Labha",
  अमृत: "Amrita",
  काल: "Kala",
  शुभ: "Shubha",
  रोग: "Roga",
};

/** Devanagari graha names → English, for the timeline graha row. */
export const TL_GRAHA_EN: Record<string, string> = {
  सूर्य: "Sun",
  चन्द्र: "Moon",
  चन्द्रमा: "Moon",
  मंगल: "Mars",
  मङ्गल: "Mars",
  बुध: "Mercury",
  बृहस्पति: "Jupiter",
  गुरु: "Jupiter",
  शुक्र: "Venus",
  शनि: "Saturn",
  राहु: "Rahu",
  केतु: "Ketu",
};

export interface TimelineRowData {
  label: string;
  en: string;
  kind?: "choghadiya" | "hora" | "lagna" | "graha";
  items: TimelineSegment[];
}

export interface ChoghadiyaSegment {
  name: string;
  startG: number;
  endG: number;
  bad?: boolean;
}

export interface HoraSegment {
  name: string;
  nameEn: string;
  startG: number;
  endG: number;
  bad?: boolean;
}

export interface CivilHourTick {
  hour: number;
  g: number;
}

export interface GrahaSpashtaItem {
  label: string;
  rashiNe?: string;
  /** Patro cells: rashi|deg|min|sec e.g. २|२५|५१|२६ */
  coords?: string;
}

export interface DayTimelineData {
  /** "sunrise" = ghati 0–60 from sunrise (default); "civil" = midnight→midnight. */
  mode?: "sunrise" | "civil";
  /** Civil mode: sunrise/sunset positions on the 0–60 axis, and night bands. */
  sunriseG?: number;
  sunsetG?: number;
  nightBands?: Array<[number, number]>;
  dayG: number;
  gMin: number;
  gMax: number;
  moonriseG: number | null;
  moonsetG: number | null;
  weekdayNe: string;
  weekdayEn: string;
  sunriseMin: number;
  sunriseLabel: string;
  sunsetLabel: string;
  moonriseLabel: string | null;
  moonsetLabel: string | null;
  grahaSpashta: GrahaSpashtaItem[];
  civilHourTicks: CivilHourTick[];
  rows: TimelineRowData[];
  choghadiya: ChoghadiyaSegment[];
  badChoghadiya: ChoghadiyaSegment[];
  hora: HoraSegment[];
}

type AngaBlock = {
  name_ne?: string;
  name?: string;
  end_ghati_clock?: string;
  end_hours_clock?: string;
  end_local_time?: string;
  next?: {
    name_ne?: string;
    name?: string;
    end_ghati_clock?: string;
    end_hours_clock?: string;
    end_local_time?: string;
    next?: {
      name_ne?: string;
      name?: string;
      end_ghati_clock?: string;
      end_hours_clock?: string;
      end_local_time?: string;
    };
  };
};

type LagnaSpanBlock = {
  name_ne?: string;
  name?: string;
  degree_in_rashi?: number;
  start_local_time?: string;
  end_local_time?: string;
  start_ghati_clock?: string;
  start_hours_clock?: string;
  end_ghati_clock?: string;
  end_hours_clock?: string;
};

/** Repeating karana cycle (Nepali names). */
const KARANA_CYCLE_NE = ["बव", "बालव", "कौलव", "तैतिल", "गर", "वणिज", "विष्टि"];

const G_MAX_PAD = 2.5;

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Ghati:pala[:vipala] from sunrise — canonical panchanga position on 0–60 scale. */
function parseGhatiClock(clock?: string | null): number | null {
  if (!clock) return null;
  const parts = clock.split(":").map(Number);
  const gh = parts[0];
  const pa = parts[1] ?? 0;
  if (gh == null || Number.isNaN(gh)) return null;
  return gh + pa / 60;
}

/** Civil hours:minutes:seconds elapsed from sunrise → ghati. */
function parseHoursClockToGhati(clock?: string | null): number | null {
  if (!clock) return null;
  const parts = clock.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const s = parts[2] ?? 0;
  if ([h, m, s].some((n) => Number.isNaN(n))) return null;
  return (h * 60 + m + s / 60) / 24;
}

function ghatiFromBlock(block?: {
  end_ghati_clock?: string;
  end_hours_clock?: string;
}): number | null {
  if (!block) return null;
  return (
    parseHoursClockToGhati(block.end_hours_clock) ??
    parseGhatiClock(block.end_ghati_clock)
  );
}

function minutesToGhati(minutes: number, sunriseMin: number): number {
  let g = (minutes - sunriseMin) / 24;
  while (g < 0) g += 60;
  return Math.min(g, 60);
}

/** Ghati for the "now" needle on a sunrise-to-sunrise chart; null before today's sunrise. */
export function needleGhatiOnVedicChart(
  civilMins: number,
  sunriseMin: number
): number | null {
  if (civilMins < sunriseMin) return null;
  const g = (civilMins - sunriseMin) / 24;
  return g <= 60 ? g : null;
}

function computeGMin(sunriseMin: number): number {
  const sunriseHourFloor = Math.floor(sunriseMin / 60) * 60;
  return (sunriseHourFloor - sunriseMin) / 24;
}

function buildCivilHourTicks(
  sunriseMin: number,
  _gMin: number,
  gMax: number
): CivilHourTick[] {
  const ticks: CivilHourTick[] = [];
  const firstHourMin = Math.ceil(sunriseMin / 60) * 60;
  for (let m = firstHourMin; m < sunriseMin + 1440; m += 60) {
    const g = (m - sunriseMin) / 24;
    if (g > gMax) break;
    const hh = Math.floor((m % 1440) / 60);
    ticks.push({ hour: hh === 0 ? 24 : hh, g });
  }
  return ticks;
}

function nextKaranaNe(name: string): string {
  const norm = name.trim();
  const idx = KARANA_CYCLE_NE.findIndex((k) => k === norm || norm.includes(k));
  if (idx >= 0) return KARANA_CYCLE_NE[(idx + 1) % KARANA_CYCLE_NE.length]!;
  return "कौलव";
}

/**
 * Build timeline segments from API anga block.
 * Uses end_hours_clock / end_ghati_clock (sunrise-relative), not naive local-time compare.
 */
function angaSegments(anga?: AngaBlock | null): TimelineSegment[] {
  if (!anga) return [];
  const current = anga.name_ne ?? anga.name;
  if (!current) return [];

  const items: TimelineSegment[] = [];
  const endG = ghatiFromBlock(anga);

  items.push({ name: current, nameEn: anga.name ?? anga.name_ne ?? current, endG: endG ?? null });

  const next = anga.next;
  if (next?.name_ne || next?.name) {
    const nextEndG = ghatiFromBlock(next);
    items.push({
      name: next.name_ne ?? next.name ?? "",
      nameEn: next.name ?? next.name_ne ?? "",
      endG: nextEndG ?? null,
    });

    const third = next.next;
    if (third?.name_ne || third?.name) {
      const thirdEndG = ghatiFromBlock(third);
      items.push({
        name: third.name_ne ?? third.name ?? "",
        nameEn: third.name ?? third.name_ne ?? "",
        endG: thirdEndG != null && thirdEndG < 60 ? thirdEndG : null,
      });
    }
  }

  return items.filter((s) => s.name);
}

function karanaSegments(anga?: AngaBlock | null): TimelineSegment[] {
  const items = angaSegments(anga);
  if (items.length >= 2) {
    const second = items[1];
    if (second && second.endG != null && second.endG < 60) {
      const ne = nextKaranaNe(second.name);
      items.push({ name: ne, nameEn: KARANA_EN[ne] ?? ne, endG: null });
    }
  }
  return items;
}

function lagnaLocalClock(local?: string | null): string | undefined {
  if (!local) return undefined;
  const m = local.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return local;
  return `${m[1]}:${m[2]}`;
}

function lagnaSegments(spans?: LagnaSpanBlock[] | null): TimelineSegment[] {
  if (!spans?.length) return [];
  return spans.map((span, index) => ({
    name: span.name_ne ?? span.name ?? "",
    nameEn: span.name ?? span.name_ne ?? "",
    endG: index < spans.length - 1 ? ghatiFromBlock(span) : null,
    transitionLocal:
      index < spans.length - 1 ? lagnaLocalClock(span.end_local_time) : undefined,
  }));
}

/** Equal-width columns for Navagraha at Udayakal (sunrise). */
function grahaSegments(planets: GrahaSpashtaItem[]): TimelineSegment[] {
  const list = planets.filter(
    (p) => p.rashiNe && p.coords && p.coords !== "—"
  );
  const n = list.length;
  if (!n) return [];
  return list.map((p, i) => ({
    name: p.coords!,
    subLabel: `${p.label}-${p.rashiNe}`,
    subLabelEn: `${TL_GRAHA_EN[p.label] ?? p.label}-${TL_RASHI_EN[p.rashiNe ?? ""] ?? p.rashiNe ?? ""}`,
    endG: i < n - 1 ? ((i + 1) / n) * 60 : null,
  }));
}

function tithiSegments(tithi: AngaBlock | undefined, p: PanchangaDay): TimelineSegment[] {
  const paksha = formatPakshaNepaliDisplay(p);
  const pakshaEn = /कृष्ण/.test(paksha ?? "") ? "Krishna Paksha" : /शुक्ल/.test(paksha ?? "") ? "Shukla Paksha" : "";
  return angaSegments(tithi).map((seg, i) => ({
    ...seg,
    name: i === 0 && paksha ? `${seg.name}, ${paksha}` : seg.name,
    nameEn: i === 0 && pakshaEn ? `${seg.nameEn ?? seg.name}, ${pakshaEn}` : (seg.nameEn ?? seg.name),
  }));
}

function buildChoghadiyaFromApi(
  segments: Array<{ name_ne: string; start_g: number; end_g: number; bad?: boolean }>
): ChoghadiyaSegment[] {
  return segments.map((c) => ({
    name: c.name_ne,
    startG: c.start_g,
    endG: c.end_g,
    bad: Boolean(c.bad),
  }));
}

/** Server hora slot from the daily panchanga payload. */
export type { ApiHoraSlot };

export function getApiHora(p: PanchangaDay): ApiHoraSlot[] {
  return getHoraSlots(p);
}

function buildHoraTimelineSegments(p: PanchangaDay): HoraSegment[] {
  return getApiHora(p).map((slot) => ({
    name: slot.planet_ne,
    nameEn: slot.planet_en,
    startG: slot.start_g,
    endG: Math.min(slot.end_g, 60),
    bad: slot.bad,
  }));
}

export function buildDayTimelineData(p: PanchangaDay, _dateAd?: string): DayTimelineData | null {
  const detail = getPanchangaDetail(p);
  const sunrise = getSunrise(p);
  const sunset = getSunset(p);
  const sunriseMin = parseTimeToMinutes(sunrise);
  const sunsetMin = parseTimeToMinutes(sunset);
  if (sunriseMin == null || sunsetMin == null) return null;

  const dayG =
    (detail?.day_ghati as number | undefined) ??
    minutesToGhati(sunsetMin, sunriseMin);
  const gMin = computeGMin(sunriseMin);
  const gMax = 60 + G_MAX_PAD;
  const moonriseMin = parseTimeToMinutes(getMoonrise(p));
  const moonsetMin = parseTimeToMinutes(getMoonset(p));
  const moonriseG = moonriseMin != null ? minutesToGhati(moonriseMin, sunriseMin) : null;
  const moonsetG = moonsetMin != null ? minutesToGhati(moonsetMin, sunriseMin) : null;

  const vaara = (detail?.vaara ?? {}) as {
    name_ne?: string;
    name_english?: string;
    number?: number;
  };
  const weekdayNe = vaara.name_ne ?? p.weekday ?? "—";
  const weekdayEn = vaara.name_english ?? p.weekday ?? "—";

  const tithi = (detail?.tithi ?? p.tithi) as AngaBlock | undefined;
  const nakshatra = (detail?.nakshatra ?? p.nakshatra) as AngaBlock | undefined;
  const yoga = (detail?.yoga ?? p.yoga) as AngaBlock | undefined;
  const karana = (detail?.karana ?? p.karana) as AngaBlock | undefined;

  const apiChoghadiya = detail?.choghadiya as
    | Array<{ name_ne: string; start_g: number; end_g: number; bad?: boolean }>
    | undefined;
  // Both choghadiya and hora come pre-computed from the API daily payload.
  const cho = apiChoghadiya?.length ? buildChoghadiyaFromApi(apiChoghadiya) : [];
  const hora = buildHoraTimelineSegments(p);
  const lagnaSpans = (getLagnaSpans(p) ?? []) as LagnaSpanBlock[];
  const grahaSpashta = getPlanetRows(p).map(({ label, rashiNe, coords }) => ({
    label,
    rashiNe,
    coords,
  }));

  return {
    dayG,
    gMin,
    gMax,
    moonriseG,
    moonsetG,
    weekdayNe,
    weekdayEn,
    sunriseMin,
    sunriseLabel: sunrise ?? "",
    sunsetLabel: sunset ?? "",
    moonriseLabel: getMoonrise(p) ?? null,
    moonsetLabel: getMoonset(p) ?? null,
    grahaSpashta,
    civilHourTicks: buildCivilHourTicks(sunriseMin, gMin, gMax),
    rows: [
      { label: "तिथि", en: "Tithi", items: tithiSegments(tithi, p) },
      { label: "नक्षत्र", en: "Nakshatra", items: angaSegments(nakshatra) },
      { label: "योग", en: "Yoga", items: angaSegments(yoga) },
      { label: "करण", en: "Karana", items: karanaSegments(karana) },
      {
        label: "चौघडिया",
        en: weekdayEn,
        kind: "choghadiya",
        items: cho.map((c) => ({
          name: c.name,
          endG: c.endG,
          bad: c.bad,
        })),
      },
      {
        label: "होरा",
        en: "Hora",
        kind: "hora",
        items: hora.map((h) => ({
          name: h.name,
          nameEn: h.nameEn,
          endG: h.endG,
          bad: h.bad,
        })),
      },
      ...(lagnaSpans.length > 0
        ? [
            {
              label: "लग्न",
              en: "Lagna",
              kind: "lagna" as const,
              items: lagnaSegments(lagnaSpans),
            },
          ]
        : []),
      ...(grahaSpashta.length > 0
        ? [
            {
              label: "ग्रह",
              en: "Planets at sunrise",
              kind: "graha" as const,
              items: grahaSegments(grahaSpashta),
            },
          ]
        : []),
    ],
    choghadiya: cho,
    badChoghadiya: cho.filter((c) => c.bad),
    hora,
  };
}

/** Minutes-from-midnight → position on the shared 0–60 axis (1440 min = 60). */
function minToG(min: number): number {
  return Math.max(0, Math.min(60, min / 24));
}

/**
 * Civil-day (midnight→midnight) timeline built from the backend `civil_timeline`
 * block. Reuses the same 0–60 axis as the sunrise chart by treating position as
 * `minutes / 24`, so `dualTimeAtGhati(g, 0)` yields civil clock labels directly.
 */
export function buildCivilTimelineData(civil: CivilTimeline): DayTimelineData {
  const sunriseG = minToG(civil.sunrise_min);
  const sunsetG = civil.sunset_min != null ? minToG(civil.sunset_min) : 60;
  const pakshaNe = civil.paksha_ne ?? "";
  const pakshaEn = /कृष्ण/.test(pakshaNe) ? "Krishna Paksha" : /शुक्ल/.test(pakshaNe) ? "Shukla Paksha" : "";

  const angaItems = (
    segs: CivilTimeline["rows"]["tithi"],
    opts?: { paksha?: boolean; karana?: boolean },
  ): TimelineSegment[] => {
    const items: TimelineSegment[] = segs.map((s, i) => ({
      name:
        opts?.paksha && i === 0 && pakshaNe
          ? `${s.name_ne ?? s.name ?? ""}, ${pakshaNe}`
          : s.name_ne ?? s.name ?? "",
      nameEn:
        opts?.paksha && i === 0 && pakshaEn
          ? `${s.name ?? s.name_ne ?? ""}, ${pakshaEn}`
          : s.name ?? s.name_ne ?? "",
      endG: minToG(s.end_min),
    }));
    const last = items[items.length - 1];
    if (last) {
      // A segment that reaches the end of the day is open-ended (fills to 24:00).
      if (last.endG != null && last.endG >= 59.9) {
        last.endG = null;
      } else if (opts?.karana && last.endG != null) {
        // Karana chain stops short of midnight — continue the fixed cycle.
        const ne = nextKaranaNe(last.name);
        items.push({ name: ne, nameEn: KARANA_EN[ne] ?? ne, endG: null });
      }
    }
    return items;
  };

  const choghadiya: ChoghadiyaSegment[] = civil.choghadiya.map((c) => ({
    name: c.name_ne ?? "",
    startG: minToG(c.start_min),
    endG: minToG(c.end_min),
    bad: Boolean(c.bad),
  }));
  const hora: HoraSegment[] = civil.hora.map((h) => ({
    name: h.planet_ne ?? "",
    nameEn: h.planet_en ?? h.planet_ne ?? "",
    startG: minToG(h.start_min),
    endG: minToG(h.end_min),
    bad: Boolean(h.bad),
  }));

  const lagnaItems: TimelineSegment[] = civil.lagna.map((s, i, arr) => ({
    name: s.name_ne ?? s.name ?? "",
    nameEn: s.name ?? s.name_ne ?? "",
    endG: i < arr.length - 1 ? minToG(s.end_min) : null,
    transitionLocal:
      i < arr.length - 1 ? ghatiToCivilClockLabel(minToG(s.end_min), 0) : undefined,
  }));

  // Civil hours 0…24 across the axis (0–60), every 3h for a clean ruler.
  const civilHourTicks: CivilHourTick[] = Array.from({ length: 9 }, (_, i) => ({
    hour: i * 3,
    g: i * 3 * 2.5,
  }));

  const rows: TimelineRowData[] = [
    { label: "तिथि", en: "Tithi", items: angaItems(civil.rows.tithi, { paksha: true }) },
    { label: "नक्षत्र", en: "Nakshatra", items: angaItems(civil.rows.nakshatra) },
    { label: "योग", en: "Yoga", items: angaItems(civil.rows.yoga) },
    { label: "करण", en: "Karana", items: angaItems(civil.rows.karana, { karana: true }) },
    { label: "चौघडिया", en: civil.weekday_en ?? "", kind: "choghadiya", items: [] },
    { label: "होरा", en: "Hora", kind: "hora", items: [] },
    ...(lagnaItems.length > 0
      ? [{ label: "लग्न", en: "Lagna", kind: "lagna" as const, items: lagnaItems }]
      : []),
  ];

  return {
    mode: "civil",
    sunriseG,
    sunsetG,
    nightBands: [
      [0, sunriseG],
      [sunsetG, 60],
    ],
    dayG: sunsetG,
    gMin: 0,
    gMax: 60,
    moonriseG: civil.moonrise_min != null ? minToG(civil.moonrise_min) : null,
    moonsetG: civil.moonset_min != null ? minToG(civil.moonset_min) : null,
    weekdayNe: civil.weekday_ne ?? "—",
    weekdayEn: civil.weekday_en ?? "—",
    sunriseMin: 0,
    sunriseLabel: ghatiToCivilClockLabel(sunriseG, 0),
    sunsetLabel: civil.sunset_min != null ? ghatiToCivilClockLabel(sunsetG, 0) : "",
    moonriseLabel: null,
    moonsetLabel: null,
    grahaSpashta: [],
    civilHourTicks,
    rows,
    choghadiya,
    badChoghadiya: choghadiya.filter((c) => c.bad),
    hora,
  };
}

export function choghadiyaTone(name: string, bad?: boolean): "bad" | "good" | "neutral" {
  if (bad) return "bad";
  if (name === "लाभ" || name === "अमृत" || name === "शुभ") return "good";
  return "neutral";
}

export function choghadiyaQuality(name: string, bad?: boolean): "शुभ" | "अशुभ" | "सामान्य" {
  const tone = choghadiyaTone(name, bad);
  if (tone === "good") return "शुभ";
  if (tone === "bad") return "अशुभ";
  return "सामान्य";
}

/** Civil clock from sunrise; after 24:00 wraps to 1, 2, 3… (not 25, 26, 27). */
export function ghatiToCivilClockLabel(g: number, sunriseMin: number): string {
  const totalMin = sunriseMin + g * 24;
  let h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  if (h > 24) h = ((h - 1) % 24) + 1;
  return toNepaliDigits(`${h}:${String(m).padStart(2, "0")}`);
}

export function ghatiToClockLabel(g: number, sunriseMin: number): string {
  return ghatiToCivilClockLabel(g, sunriseMin);
}

export function ghatiShortLabel(g: number): string {
  const gh = Math.floor(g);
  const pa = Math.floor((g - gh) * 60);
  return toNepaliDigits(`${gh}:${String(pa).padStart(2, "0")}`);
}

export function ghatiShortLabelLong(g: number): string {
  const gh = Math.floor(g);
  const pa = Math.floor((g - gh) * 60);
  return toNepaliDigits(`${gh} घडी ${pa} पला`);
}

export function dualTimeAtGhati(
  g: number,
  sunriseMin: number
): { ghati: string; clock: string; ghatiLong: string } {
  return {
    ghati: ghatiShortLabel(g),
    ghatiLong: ghatiShortLabelLong(g),
    clock: ghatiToCivilClockLabel(g, sunriseMin),
  };
}
