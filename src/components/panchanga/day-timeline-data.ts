import type { PanchangaDay } from "@/lib/api";
import {
  formatPakshaNepaliDisplay,
  getMoonrise,
  getMoonset,
  getPanchangaDetail,
  getSunrise,
  getSunset,
  toNepaliDigits,
} from "@/lib/panchanga-format";

export interface TimelineSegment {
  name: string;
  endG?: number | null;
  bad?: boolean;
}

export interface TimelineRowData {
  label: string;
  en: string;
  kind?: "choghadiya";
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

const CHOGHADIYA = [
  { ne: "उद्वेग", bad: true },
  { ne: "चर" },
  { ne: "लाभ" },
  { ne: "अमृत" },
  { ne: "काल", bad: true },
  { ne: "शुभ" },
  { ne: "रोग", bad: true },
] as const;

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
  gMin: number,
  gMax: number
): CivilHourTick[] {
  const ticks: CivilHourTick[] = [];
  const startHour = Math.floor(sunriseMin / 60);
  for (let h = startHour; h <= startHour + 28; h++) {
    const g = (h * 60 - sunriseMin) / 24;
    if (g < gMin - 0.05) continue;
    if (g > gMax) break;
    ticks.push({ hour: h % 24 === 0 ? 24 : h % 24, g });
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

  items.push({ name: current, endG: endG ?? null });

  const next = anga.next;
  if (next?.name_ne || next?.name) {
    const nextEndG = ghatiFromBlock(next);
    items.push({
      name: next.name_ne ?? next.name ?? "",
      endG: nextEndG ?? null,
    });

    const third = next.next;
    if (third?.name_ne || third?.name) {
      const thirdEndG = ghatiFromBlock(third);
      items.push({
        name: third.name_ne ?? third.name ?? "",
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
      items.push({ name: nextKaranaNe(second.name), endG: null });
    }
  }
  return items;
}

function tithiSegments(tithi: AngaBlock | undefined, p: PanchangaDay): TimelineSegment[] {
  const paksha = formatPakshaNepaliDisplay(p);
  return angaSegments(tithi).map((seg, i) => ({
    ...seg,
    name: i === 0 && paksha ? `${seg.name}, ${paksha}` : seg.name,
  }));
}

function buildChoghadiya(dayG: number, dow: number): ChoghadiyaSegment[] {
  const segments: ChoghadiyaSegment[] = [];
  const dSeg = dayG / 8;
  const nSeg = (60 - dayG) / 8;
  for (let i = 0; i < 8; i++) {
    const c = CHOGHADIYA[(CHO_DAY_START[dow] + i) % 7];
    segments.push({
      name: c.ne,
      startG: i * dSeg,
      endG: (i + 1) * dSeg,
      bad: Boolean("bad" in c && c.bad),
    });
  }
  for (let i = 0; i < 8; i++) {
    const c = CHOGHADIYA[(CHO_NIGHT_START[dow] + i) % 7];
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

  const dayG = minutesToGhati(sunsetMin, sunriseMin);
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

  const cho = buildChoghadiya(dayG, dow);

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
