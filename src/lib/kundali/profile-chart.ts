import { bsToAD } from "@/lib/bs-calendar";
import { parseBirthDateParts } from "@/lib/birth-date";
import type { Profile } from "@/lib/auth/client";
import {
  DEFAULT_PANCHANGA_LOCATION,
  type PanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";

/** Parse a saved profile's birth date (BS or AD, any separator) into an AD Date. */
export function parseBirthDate(p: Profile): Date | null {
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
export function profileLocation(
  p: Profile,
  fallback: PanchangaLocation = DEFAULT_PANCHANGA_LOCATION,
): PanchangaLocation {
  if (p.latitude != null && p.longitude != null) {
    return {
      label: p.location_label || p.city || "जन्म स्थान",
      params: {
        lat: p.latitude,
        lon: p.longitude,
        ...(p.timezone ? { timezone: p.timezone } : {}),
      },
    };
  }
  return fallback;
}

/** Birth clock from a profile, or a sensible default. */
export function profileClock(p: Profile, fallback = "12:00"): string {
  return p.birth_time && /^\d{1,2}:\d{2}/.test(p.birth_time) ? p.birth_time : fallback;
}

export function formatProfileAdDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Panchanga query inputs from a saved profile. */
export function profileChartParams(p: Profile) {
  const date = parseBirthDate(p);
  if (!date) return null;
  return {
    date,
    adDate: formatProfileAdDate(date),
    clock: profileClock(p),
    location: profileLocation(p),
  };
}
