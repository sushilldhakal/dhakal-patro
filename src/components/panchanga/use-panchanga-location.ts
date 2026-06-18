import { useCallback, useEffect, useState } from "react";
import type { LocationParams } from "@/lib/api";

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

function readStoredLocation(): PanchangaLocation {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PANCHANGA_LOCATION;
    const parsed = JSON.parse(raw) as PanchangaLocation;
    if (!parsed?.label || !parsed?.params) return DEFAULT_PANCHANGA_LOCATION;
    return parsed;
  } catch {
    return DEFAULT_PANCHANGA_LOCATION;
  }
}

export function usePanchangaLocation() {
  const [location, setLocationState] = useState<PanchangaLocation>(readStoredLocation);

  const setLocation = useCallback((next: PanchangaLocation) => {
    setLocationState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
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
}): PanchangaLocation {
  const name = city.ascii_name || city.name;
  return {
    label: `${name}, ${city.country}`,
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
