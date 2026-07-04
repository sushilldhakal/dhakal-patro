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
  days: Map<string, PanchangaDay>,
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
  days.set(dateAd, seeded);
  return true;
}

function seedFromPayload(
  payload: YearCalendar,
  location: LocationParams | undefined,
  queryClient: QueryClient,
): { daysSeeded: number; days: Map<string, PanchangaDay> } {
  const days = new Map<string, PanchangaDay>();
  for (const day of payload.calendar) {
    seedDayRow(day, location, queryClient, days);
  }
  return { daysSeeded: days.size, days };
}

export type YearCacheSeedResult = {
  daysSeeded: number;
  /** Loaded from browser IndexedDB — no network request. */
  fromPersistentCache: boolean;
  /**
   * Every day of the year keyed by AD date. Held on the (observed, long-lived)
   * bulk query so the wheel always has data to read — the individually seeded
   * `panchangaKeys.day` entries have no observers and React Query garbage-
   * collects them after `gcTime`, which would otherwise freeze the wheel a few
   * minutes after load.
   */
  days: Map<string, PanchangaDay>;
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
    const { daysSeeded, days } = seedFromPayload(persisted, location, queryClient);
    return { daysSeeded, fromPersistentCache: true, days };
  }

  const payload = await fetchYearCalendar(year, location, { full: true });
  void writePersistedYear(storageKey, payload);
  const { daysSeeded, days } = seedFromPayload(payload, location, queryClient);
  return { daysSeeded, fromPersistentCache: false, days };
}
