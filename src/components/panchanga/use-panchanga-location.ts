import { useCallback, useEffect, useState } from "react";
import type { LocationParams } from "@/lib/api";
import { getLocalStorageItem, isBrowser, setLocalStorageItem } from "@/lib/browser";
import {
  NEPAL_CITIES,
  localizeNepalCityLabel,
  nepalCityEnglishLabel,
} from "@/lib/cities/nepal-cities";

const STORAGE_KEY = "dhakalPatroLocation";

export interface PanchangaLocation {
  label: string;
  params: LocationParams;
}

export const DEFAULT_PANCHANGA_LOCATION: PanchangaLocation = {
  label: "Kathmandu, NP",
  params: { city_id: 1283240 },
};

/**
 * Best-effort IANA timezone for a location. City and coordinate selections carry
 * their own timezone; the default Kathmandu (and any city the API didn't tag)
 * falls back to Nepal time so "today" stays correct for the patro's home region.
 */
export function resolveLocationTimezone(location: PanchangaLocation): string {
  return location.params.timezone ?? "Asia/Kathmandu";
}

function hasDevanagari(value: string): boolean {
  return /[\u0900-\u097F]/.test(value);
}

/**
 * Older Nepali-UI picks stored `city=सिरहा` which GeoNames cannot resolve.
 * Rewrite those prefs to lat/lon (or drop the bad city name when coords exist).
 */
function healStoredLocation(loc: PanchangaLocation): PanchangaLocation {
  const { params } = loc;
  if (!params.city || !hasDevanagari(params.city)) return loc;

  if (params.lat != null && params.lon != null) {
    return {
      ...loc,
      params: {
        lat: params.lat,
        lon: params.lon,
        timezone: params.timezone ?? "Asia/Kathmandu",
      },
    };
  }

  const needle = params.city.trim();
  const match = NEPAL_CITIES.find(
    (c) => c.name_ne === needle || c.name_ne.startsWith(needle) || needle.startsWith(c.name_ne.split(" ")[0]!),
  );
  if (!match) return loc;

  return {
    label: `${nepalCityEnglishLabel(match)}, NP`,
    params: {
      lat: match.lat,
      lon: match.lon,
      timezone: "Asia/Kathmandu",
    },
  };
}

function readStoredLocation(): PanchangaLocation {
  if (!isBrowser) return DEFAULT_PANCHANGA_LOCATION;
  try {
    const raw = getLocalStorageItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PANCHANGA_LOCATION;
    const parsed = JSON.parse(raw) as PanchangaLocation;
    if (!parsed?.label || !parsed?.params) return DEFAULT_PANCHANGA_LOCATION;
    const healed = healStoredLocation(parsed);
    if (healed !== parsed) {
      setLocalStorageItem(STORAGE_KEY, JSON.stringify(healed));
    }
    return healed;
  } catch {
    return DEFAULT_PANCHANGA_LOCATION;
  }
}

export function usePanchangaLocation(initial?: PanchangaLocation) {
  // A location supplied via the URL (shared link) wins over the stored
  // preference on first render so the page opens on the shared place.
  const [location, setLocationState] = useState<PanchangaLocation>(
    () => initial ?? readStoredLocation()
  );

  const setLocation = useCallback((next: PanchangaLocation) => {
    setLocationState(next);
    setLocalStorageItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    if (!isBrowser) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setLocationState(readStoredLocation());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { location, setLocation };
}

export function cityToLocation(city: {
  id: number;
  ascii_name: string;
  name: string;
  country: string;
  timezone?: string;
  lat?: number;
  lon?: number;
  local?: boolean;
}): PanchangaLocation {
  const displayName = city.name || city.ascii_name;
  const label = `${displayName}, ${city.country}`;
  // Curated Nepal entries have no backend city_id — drive the panchanga from
  // their coordinates + timezone. Do not send `city=` (especially Devanagari):
  // GeoNames resolve only matches English/ascii names.
  if (city.local && city.lat != null && city.lon != null) {
    return {
      label,
      params: {
        lat: city.lat,
        lon: city.lon,
        timezone: city.timezone ?? "Asia/Kathmandu",
      },
    };
  }
  return {
    label,
    params: {
      city_id: city.id,
      ...(city.timezone ? { timezone: city.timezone } : {}),
    },
  };
}

export function coordsToLocation(lat: number, lon: number, timezone?: string): PanchangaLocation {
  return {
    label: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    params: {
      lat,
      lon,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };
}

/** API uses "custom" for lat/lon queries — keep the user's chosen label instead. */
const GENERIC_API_LOCATION_NAMES = new Set(["custom"]);

/**
 * Location name for display. Stored labels (and the English-only names the API
 * returns) are rewritten into the active language whenever they name one of the
 * curated Nepal districts, so the place doesn't stay in the language it was
 * picked in after the reader switches.
 */
export function displayLocationLabel(
  location: PanchangaLocation,
  apiName?: string | null,
  lang = "ne",
): string {
  const { lat, lon } = location.params;
  const name = apiName?.trim();
  if (name && !GENERIC_API_LOCATION_NAMES.has(name.toLowerCase())) {
    return localizeNepalCityLabel(name, lang, lat, lon);
  }
  return localizeNepalCityLabel(location.label, lang, lat, lon);
}
