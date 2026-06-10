import type { PanchangaDay } from "@/lib/api";
import {
  getMoonrise,
  getPanchangaDetail,
  getSunrise,
  getSunset,
  toNepaliDigits,
} from "@/lib/panchanga-format";

export interface TimelineSegment {
  name: string;
  endG?: number | null;
}

export interface ChoghadiyaSegment {
  name: string;
  startG: number;
  endG: number;
  bad?: boolean;
}

export interface DayTimelineData {
  dayG: number;
  moonriseG: number | null;
  weekdayNe: string;
  weekdayEn: string;
  sunriseMin: number;
  rows: { label: string; en: string; items: TimelineSegment[] }[];
  badChoghadiya: ChoghadiyaSegment[];
}

type AngaBlock = {
  name_ne?: string;
  name?: string;
  end_ghati_clock?: string;
  next?: { name_ne?: string; name?: string };
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

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function parseGhatiClock(clock?: string | null): number | null {
  if (!clock) return null;
  const parts = clock.split(":").map(Number);
  const gh = parts[0];
  const pa = parts[1] ?? 0;
  if (gh == null || Number.isNaN(gh)) return null;
  return gh + pa / 60;
}

function minutesToGhati(minutes: number, sunriseMin: number): number {
  let g = (minutes - sunriseMin) / 24;
  while (g < 0) g += 60;
  return Math.min(g, 60);
}

function angaSegments(anga?: AngaBlock | null): TimelineSegment[] {
  if (!anga) return [];
  const current = anga.name_ne ?? anga.name;
  if (!current) return [];
  const endG = parseGhatiClock(anga.end_ghati_clock);
  const next = anga.next?.name_ne ?? anga.next?.name;
  const items: TimelineSegment[] = [{ name: current, endG }];
  if (next) items.push({ name: next, endG: null });
  return items;
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
      bad: "bad" in c ? c.bad : false,
    });
  }
  for (let i = 0; i < 8; i++) {
    const c = CHOGHADIYA[(CHO_NIGHT_START[dow] + i) % 7];
    segments.push({
      name: c.ne,
      startG: dayG + i * nSeg,
      endG: dayG + (i + 1) * nSeg,
      bad: "bad" in c ? c.bad : false,
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
  const moonriseMin = parseTimeToMinutes(getMoonrise(p));
  const moonriseG = moonriseMin != null ? minutesToGhati(moonriseMin, sunriseMin) : null;

  const vaara = (detail?.vaara ?? {}) as {
    name_ne?: string;
    name_english?: string;
    number?: number;
  };
  const weekdayNe = vaara.name_ne ?? p.weekday ?? "—";
  const weekdayEn = vaara.name_english ?? p.weekday ?? "—";

  let dow = vaara.number;
  if (dow == null && dateAd) {
    dow = new Date(dateAd).getDay();
  }
  dow = dow ?? 0;

  const tithi = (detail?.tithi ?? p.tithi) as AngaBlock | undefined;
  const nakshatra = (detail?.nakshatra ?? p.nakshatra) as AngaBlock | undefined;
  const yoga = (detail?.yoga ?? p.yoga) as AngaBlock | undefined;
  const karana = (detail?.karana ?? p.karana) as AngaBlock | undefined;

  const cho = buildChoghadiya(dayG, dow);

  return {
    dayG,
    moonriseG,
    weekdayNe,
    weekdayEn,
    sunriseMin,
    rows: [
      { label: "तिथि", en: "Tithi", items: angaSegments(tithi) },
      { label: "नक्षत्र", en: "Nakshatra", items: angaSegments(nakshatra) },
      { label: "योग", en: "Yoga", items: angaSegments(yoga) },
      { label: "करण", en: "Karana", items: angaSegments(karana) },
    ],
    badChoghadiya: cho.filter((c) => c.bad),
  };
}

export function ghatiToClockLabel(g: number, sunriseMin: number): string {
  const totalMin = sunriseMin + g * 24;
  const wrapped = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = Math.round(wrapped % 60);
  return toNepaliDigits(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
}

export function ghatiShortLabel(g: number): string {
  const gh = Math.floor(g);
  const pa = Math.floor((g - gh) * 60);
  return toNepaliDigits(`${gh} घडी ${pa} पला`);
}
