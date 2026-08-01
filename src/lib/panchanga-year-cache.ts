import {
  fetchYearCalendar,
  locationCacheKey,
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
import type { Era } from "@/lib/era";

export const panchangaYearBulkKey = (
  year: number,
  location?: LocationParams,
  era: Era = "bs",
) => ["panchanga", "year-bulk", era, year, locationCacheKey(location)] as const;

function seedDayRow(
  day: CalendarDay,
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
  // Intentionally NOT written to `panchangaKeys.day`: the wheel payload is
  // trimmed to wheel-only state, so seeding the shared day cache would starve
  // the full daily / timeline pages (same key) of muhurta/hora/etc. The year
  // wheel reads straight from this Map instead.
  days.set(dateAd, seeded);
  return true;
}

function seedFromPayload(
  payload: YearCalendar,
): { daysSeeded: number; days: Map<string, PanchangaDay> } {
  const days = new Map<string, PanchangaDay>();
  for (const day of payload.calendar) {
    seedDayRow(day, days);
  }
  return { daysSeeded: days.size, days };
}

export type YearCacheSeedResult = {
  daysSeeded: number;
  /** Loaded from browser IndexedDB — no network request. */
  fromPersistentCache: boolean;
  /**
   * Every day of the year keyed by AD date. Held on the (observed, long-lived)
   * bulk query so the wheel always has data to read directly, independent of
   * React Query's per-day `gcTime` eviction.
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
  era: Era = "bs",
): Promise<YearCacheSeedResult> {
  const locKey = locationCacheKey(location);
  const storageKey = yearCacheStorageKey(year, locKey);

  const persisted = await readPersistedYear(storageKey);
  if (persisted) {
    const { daysSeeded, days } = seedFromPayload(persisted);
    return { daysSeeded, fromPersistentCache: true, days };
  }

  const payload = await fetchYearCalendar(year, location, { wheel: true, era });
  void writePersistedYear(storageKey, payload);
  const { daysSeeded, days } = seedFromPayload(payload);
  return { daysSeeded, fromPersistentCache: false, days };
}
