import type { QueryClient } from "@tanstack/react-query";
import {
  fetchYearCalendar,
  locationCacheKey,
  panchangaKeys,
  type CalendarDay,
  type LocationParams,
  type PanchangaDay,
  type YearCalendar,
} from "@/lib/api";
import {
  readPersistedYear,
  writePersistedYear,
  yearCacheStorageKey,
} from "@/lib/year-cache-storage";

export const panchangaYearBulkKey = (year: number, location?: LocationParams) =>
  ["panchanga", "year-bulk", year, locationCacheKey(location)] as const;

function seedDayRow(
  day: CalendarDay,
  location: LocationParams | undefined,
  queryClient: QueryClient,
): boolean {
  const embedded = day.panchanga as PanchangaDay | undefined;
  if (!embedded) return false;
  const dateAd = embedded.date_ad ?? day.date_ad;
  if (!dateAd) return false;
  const seeded: PanchangaDay = {
    ...embedded,
    date_ad: dateAd,
    sun: embedded.sun ?? {
      sunrise: day.sunrise,
      sunset: day.sunset,
    },
  };
  queryClient.setQueryData(panchangaKeys.day(dateAd, "ad", location), seeded);
  return true;
}

function seedFromPayload(
  payload: YearCalendar,
  location: LocationParams | undefined,
  queryClient: QueryClient,
): number {
  let daysSeeded = 0;
  for (const day of payload.calendar) {
    if (seedDayRow(day, location, queryClient)) daysSeeded += 1;
  }
  return daysSeeded;
}

export type YearCacheSeedResult = {
  daysSeeded: number;
  /** Loaded from browser IndexedDB — no network request. */
  fromPersistentCache: boolean;
};

/**
 * Load a BS year for the wheel: IndexedDB first, then one API call if missing.
 * Keyed by year + location — only refetches when either changes.
 */
export async function seedYearPanchangaCache(
  year: number,
  location: LocationParams | undefined,
  queryClient: QueryClient,
): Promise<YearCacheSeedResult> {
  const locKey = locationCacheKey(location);
  const storageKey = yearCacheStorageKey(year, locKey);

  const persisted = await readPersistedYear(storageKey);
  if (persisted) {
    const daysSeeded = seedFromPayload(persisted, location, queryClient);
    return { daysSeeded, fromPersistentCache: true };
  }

  const payload = await fetchYearCalendar(year, location, { full: true });
  void writePersistedYear(storageKey, payload);
  const daysSeeded = seedFromPayload(payload, location, queryClient);
  return { daysSeeded, fromPersistentCache: false };
}
