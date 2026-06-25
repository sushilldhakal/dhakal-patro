import type { CalendarDay, GocharIngressEvent, PlanetInfo } from "@/lib/api";
import { RASHI_NE } from "@/lib/chandrakranti/gochar-display";
import { toNepaliDigits } from "@/lib/panchanga-format";
import {
  GRAHA_KEY_TO_TRANSIT_ABBREV,
  RASHYADI_PLANET_KEYS,
  type RashyadiPlanetKey,
  type RashyadiPlanetRow,
  type RashyadiSegment,
  rashyadiFromPlanetInfo,
} from "./rashyadi";

const RASHI_EN = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
] as const;

export type PakshaSegmentInfo = { key: string; label: string };

/** चन्द्र यो तालिकामा छैन — राशि/पद परिवर्तनले थप तालिका नबनोस्। */
function isMoonIngress(ev: GocharIngressEvent): boolean {
  const g = (ev.graha ?? "").toLowerCase();
  if (g === "moon" || g === "chandra") return true;
  const ne = ev.graha_ne ?? "";
  return ne.includes("चन्द्र") || ne.includes("चंद्र");
}

/** थप तालिका — केवल अन्य ग्रहको राशि परिवर्तन (पद, गति, उदयास्त होइन)। */
function triggersExtraTable(ev: GocharIngressEvent): boolean {
  if (isMoonIngress(ev)) return false;
  return ev.level === "rashi";
}

function resolveVedicDateAd(
  ev: GocharIngressEvent,
  allDays: CalendarDay[],
): string | undefined {
  const civil = ev.entry_vedic_date_ad ?? ev.entry_date_ad;
  if (!civil) return undefined;
  if (allDays.some((d) => d.date_ad === civil)) return civil;
  return ev.entry_date_ad;
}

function rashiNoFromIngress(ev: GocharIngressEvent): number | undefined {
  if (ev.to_rashi) {
    const i = RASHI_EN.findIndex(
      (r) => r.toLowerCase() === ev.to_rashi!.toLowerCase(),
    );
    if (i >= 0) return i + 1;
  }
  if (ev.to_rashi_ne) {
    const i = RASHI_NE.indexOf(ev.to_rashi_ne as (typeof RASHI_NE)[number]);
    if (i >= 0) return i + 1;
  }
  return undefined;
}

export function formatGapashaCode(
  bsDay: number,
  grahaKey: string,
  rashiNo: number,
): string | undefined {
  const abbrev = GRAHA_KEY_TO_TRANSIT_ABBREV[grahaKey];
  if (!abbrev) return undefined;
  return `${toNepaliDigits(bsDay)}${abbrev}${toNepaliDigits(rashiNo)}`;
}

function breakpointLabel(ev: GocharIngressEvent): string {
  const graha = ev.graha_ne ?? ev.graha;
  if (ev.level === "motion") {
    return `${graha} ${ev.label_ne ?? ev.motion_ne ?? "गति परिवर्तन"}`;
  }
  if (ev.level === "rashi") {
    return `${graha} ${ev.label_ne ?? `${ev.to_rashi_ne ?? ""}मा`}`;
  }
  return `${graha} ${ev.label_ne ?? "गोचर"}`;
}

function moonRashiAtDay(day: CalendarDay): string | undefined {
  const det = day.panchanga;
  return (
    det?.chandra_rashi_ne ??
    (typeof det?.chandra_rashi === "string" ? det.chandra_rashi : undefined) ??
    (det?.chandra_rashi as { name_ne?: string } | undefined)?.name_ne
  );
}

function planetsAtDay(day: CalendarDay): Partial<Record<RashyadiPlanetKey, RashyadiPlanetRow>> {
  const raw = day.panchanga?.planets;
  if (!raw) return {};

  const out: Partial<Record<RashyadiPlanetKey, RashyadiPlanetRow>> = {};
  for (const key of RASHYADI_PLANET_KEYS) {
    const info = raw[key];
    if (!info || typeof info === "string") continue;
    const row = rashyadiFromPlanetInfo(info as PlanetInfo);
    if (row) out[key] = row;
  }
  return out;
}

function collectTransitCodes(
  groupDays: CalendarDay[],
  allDays: CalendarDay[],
  ingressEvents: GocharIngressEvent[],
): string[] {
  const rangeDates = new Set(groupDays.map((d) => d.date_ad));
  const dayByDate = new Map(allDays.map((d) => [d.date_ad, d]));
  const codes: string[] = [];

  for (const ev of ingressEvents) {
    if (ev.level !== "rashi" || isMoonIngress(ev)) continue;
    const dateAd = resolveVedicDateAd(ev, allDays);
    if (!dateAd || !rangeDates.has(dateAd)) continue;
    const day = dayByDate.get(dateAd);
    const rNo = rashiNoFromIngress(ev);
    if (!day || !rNo) continue;
    const code = formatGapashaCode(day.day, ev.graha, rNo);
    if (code && !codes.includes(code)) codes.push(code);
  }

  return codes;
}

type DayGroup = PakshaSegmentInfo & { days: CalendarDay[] };

function groupDaysByPaksha(
  days: CalendarDay[],
  pakshaSegmentOf: (day: CalendarDay) => PakshaSegmentInfo,
): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const d of days) {
    const seg = pakshaSegmentOf(d);
    const last = groups[groups.length - 1];
    if (!last || last.key !== seg.key) {
      groups.push({ ...seg, days: [d] });
    } else {
      last.days.push(d);
    }
  }
  return groups;
}

/**
 * प्रत्येक १५-दिने पक्ष (शुक्ल/कृष्ण, अधिक/शुद्ध) का लागि संस्करण तालिका।
 * पक्षभित्र चन्द्र बाहेकका ग्रहले राशि परिवर्तन गरे मात्र थप तालिका।
 */
export function buildRashyadiSegments(
  days: CalendarDay[],
  allDays: CalendarDay[],
  ingressEvents: GocharIngressEvent[],
  pakshaSegmentOf: (day: CalendarDay) => PakshaSegmentInfo,
): RashyadiSegment[] {
  if (days.length === 0) return [];

  const dayByDate = new Map(allDays.map((d) => [d.date_ad, d]));
  const groups = groupDaysByPaksha(days, pakshaSegmentOf);
  const segments: RashyadiSegment[] = [];

  for (const group of groups) {
    const firstDay = group.days[0]!;
    const rangeDates = new Set(group.days.map((d) => d.date_ad));
    const transitCodes = collectTransitCodes(group.days, allDays, ingressEvents);

    type Bp = { dateAd: string; labelNe: string; sortKey: string };
    const breakpoints: Bp[] = [
      {
        dateAd: firstDay.date_ad,
        labelNe: "आरम्भ",
        sortKey: `0-${firstDay.date_ad}`,
      },
    ];

    for (const ev of ingressEvents) {
      if (!triggersExtraTable(ev)) continue;
      const dateAd = resolveVedicDateAd(ev, allDays);
      if (!dateAd || !rangeDates.has(dateAd)) continue;
      if (dateAd === firstDay.date_ad) continue;
      breakpoints.push({
        dateAd,
        labelNe: breakpointLabel(ev),
        sortKey: ev.entry_time_utc ?? `${dateAd}T12:00`,
      });
    }

    breakpoints.sort((a, b) => {
      const dayA = dayByDate.get(a.dateAd)?.day ?? 0;
      const dayB = dayByDate.get(b.dateAd)?.day ?? 0;
      if (dayA !== dayB) return dayA - dayB;
      return a.sortKey.localeCompare(b.sortKey);
    });

    // एकै गते धेरै ग्रहको राशि परिवर्तन → एउटै तालिका
    const mergedByDate = new Map<string, Bp>();
    for (const bp of breakpoints) {
      const existing = mergedByDate.get(bp.dateAd);
      if (!existing) {
        mergedByDate.set(bp.dateAd, { ...bp });
        continue;
      }
      if (!existing.labelNe.includes(bp.labelNe)) {
        existing.labelNe = `${existing.labelNe} · ${bp.labelNe}`;
      }
      if (bp.sortKey.localeCompare(existing.sortKey) < 0) {
        existing.sortKey = bp.sortKey;
      }
    }

    let tableIndex = 0;
    for (const bp of mergedByDate.values()) {
      const day = dayByDate.get(bp.dateAd);
      if (!day) continue;

      segments.push({
        id: `${group.key}-${bp.dateAd}-${tableIndex++}`,
        versionNe: group.label,
        labelNe: bp.labelNe,
        anchorDateAd: bp.dateAd,
        bsDay: day.day,
        moonRashiNe: moonRashiAtDay(day),
        transitCodes,
        planets: planetsAtDay(day),
      });
    }
  }

  return segments;
}
