import {
  canonicalCivilIso,
  formatBsDateKey,
  parseCivilIsoToDate,
  parsePatroDayDateKey,
  toAdStr,
  type PatroDayEra,
} from "./patro-day";

/**
 * Share URL + API path segment for day browse.
 * `era=ad` → civil ISO (`date_ad`); `era=bs` → Vikram triple from the backend.
 */
export function toPatroDayDateKey(
  date: Date,
  era: PatroDayEra,
  bsDateKey?: string,
): string {
  if (era === "ad") return toAdStr(date);
  if (bsDateKey) {
    const parts = parsePatroDayDateKey(bsDateKey);
    return formatBsDateKey(parts.year, parts.month, parts.day);
  }
  throw new Error("BS day URL key requires backend bs_date (or bsDateKey)");
}

/** Canonical Vikram or civil key string for maps and share URLs. */
export function normalizePatroDayDateKey(key: string, era: PatroDayEra): string {
  if (typeof key !== "string" || !key.trim()) {
    throw new Error("patro day date key is required");
  }
  if (era === "ad") return canonicalCivilIso(key);
  const parts = parsePatroDayDateKey(key);
  return formatBsDateKey(parts.year, parts.month, parts.day);
}

/**
 * Parse URL day key into a picker `Date`.
 * BS Vikram keys do not encode civil time — pass `dateAd` from the API when era is bs.
 */
export function patroDayKeyToDate(
  key: string,
  era: PatroDayEra,
  dateAd?: string,
): Date {
  const normalized = normalizePatroDayDateKey(key, era);
  if (era === "ad") return parseCivilIsoToDate(normalized);
  if (dateAd) return parseCivilIsoToDate(dateAd);
  throw new Error(
    `BS ${normalized} has no date_ad; load panchanga/month API civil days first`,
  );
}

type AsideMonthDay = {
  day: number;
  date_ad: string;
  outsideMonth?: boolean;
};

/**
 * Panchanga path segment for the home aside. BS browse uses the grid’s Vikram
 * parts from the backend month response — never client BS↔AD conversion.
 */
export function asidePanchangaDateKey(
  era: PatroDayEra,
  asideAdDate: string,
  ctx: {
    year: number;
    month: number;
    isAdCalendar?: boolean;
    days: AsideMonthDay[];
  },
  selectedDay: AsideMonthDay | null,
): string {
  if (era === "ad") {
    return toPatroDayDateKey(parseCivilIsoToDate(asideAdDate), "ad");
  }
  if (!ctx.isAdCalendar) {
    const cell =
      selectedDay ??
      ctx.days.find((d) => !d.outsideMonth && d.date_ad === asideAdDate) ??
      ctx.days.find((d) => !d.outsideMonth && d.day === 1) ??
      ctx.days.find((d) => !d.outsideMonth) ??
      null;
    if (cell) {
      return formatBsDateKey(ctx.year, ctx.month, cell.day);
    }
  }
  throw new Error("aside BS panchanga key requires a month-grid cell from the API");
}

export type { PatroDayEra } from "./patro-day";
