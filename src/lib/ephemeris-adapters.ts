import type { PanchangaAtTime, PanchangaDay } from "@/lib/api";

/** Map ephemeris at-time payload into PanchangaDay for shared section components. */
export function atTimeToPanchangaDay(raw: PanchangaAtTime): PanchangaDay {
  return {
    ...raw,
    mode: "ephemeris",
    date_ad: raw.panchanga_date_ad ?? raw.date_ad,
    weekday: raw.vaara?.name_ne ?? raw.weekday,
    muhurta_now: raw.muhurta_now,
    query_instant: raw.query_instant,
    query_instant_local: raw.query_instant_local,
    planets_anchor: raw.planets_anchor,
    before_sunrise_of_civil_day: raw.before_sunrise_of_civil_day,
    detail: raw as unknown as PanchangaDay["detail"],
  };
}

export function isEphemerisPanchanga(p: PanchangaDay | undefined): boolean {
  return p?.mode === "ephemeris";
}

export function buildAtTimeDatetime(adDate: string, clock: string): string {
  const [hh, mm] = clock.split(":");
  const h = String(hh ?? "12").padStart(2, "0");
  const m = String(mm ?? "00").padStart(2, "0");
  return `${adDate}T${h}:${m}:00`;
}
