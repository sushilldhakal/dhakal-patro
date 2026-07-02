import type { PanchangaDay } from "@/lib/api";
import {
  formatPakshaNepaliDisplay,
  getLagnaSpans,
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
  kind?: "choghadiya" | "lagna" | "graha";
  items: TimelineSegment[];
}

export interface ChoghadiyaSegment {
  name: string;
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

const CHO_DAY_START = [0, 3, 6, 2, 5, 1, 4];
const CHO_NIGHT_START = [5, 1, 4, 0, 3, 6, 2];

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

function buildChoghadiyaFallback(dayG: number, dow: number): ChoghadiyaSegment[] {
  const CHOGHADIYA = [
    { ne: "उद्वेग", bad: true },
    { ne: "चर" },
    { ne: "लाभ" },
    { ne: "अमृत" },
    { ne: "काल", bad: true },
    { ne: "शुभ" },
    { ne: "रोग", bad: true },
  ] as const;
  const segments: ChoghadiyaSegment[] = [];
  const dSeg = dayG / 8;
  const nSeg = (60 - dayG) / 8;
  for (let i = 0; i < 8; i++) {
    const c = CHOGHADIYA[(CHO_DAY_START[dow] + i) % 7]!;
    segments.push({
      name: c.ne,
      startG: i * dSeg,
      endG: (i + 1) * dSeg,
      bad: Boolean("bad" in c && c.bad),
    });
  }
  for (let i = 0; i < 8; i++) {
    const c = CHOGHADIYA[(CHO_NIGHT_START[dow] + i) % 7]!;
    segments.push({
      name: c.ne,
      startG: dayG + i * nSeg,
      endG: dayG + (i + 1) * nSeg,
      bad: Boolean("bad" in c && c.bad),
    });
  }
  return segments;
}

export function buildDayTimelineData(p: PanchangaDay, dateAd?: string): DayTimelineData | null {
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

  let dow = vaara.number;
  if (dow == null && dateAd) {
    dow = new Date(dateAd + "T12:00:00").getDay();
  }
  dow = dow ?? 0;

  const tithi = (detail?.tithi ?? p.tithi) as AngaBlock | undefined;
  const nakshatra = (detail?.nakshatra ?? p.nakshatra) as AngaBlock | undefined;
  const yoga = (detail?.yoga ?? p.yoga) as AngaBlock | undefined;
  const karana = (detail?.karana ?? p.karana) as AngaBlock | undefined;

  const apiChoghadiya = detail?.choghadiya as
    | Array<{ name_ne: string; start_g: number; end_g: number; bad?: boolean }>
    | undefined;
  const cho =
    apiChoghadiya?.length === 16
      ? buildChoghadiyaFromApi(apiChoghadiya)
      : buildChoghadiyaFallback(dayG, dow);
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
              en: "Udayakal",
              kind: "graha" as const,
              items: grahaSegments(grahaSpashta),
            },
          ]
        : []),
    ],
    choghadiya: cho,
    badChoghadiya: cho.filter((c) => c.bad),
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
