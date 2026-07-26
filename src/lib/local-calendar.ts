import type { CalendarDay, Festival, Holiday } from "./api";
import {
  AD_MONTHS_SHORT,
  AD_MONTHS_SHORT_NE,
  BS_MONTH_NAMES,
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsToAD,
  getBSMonthLength,
} from "./bs-calendar";

const WEEKDAYS_NE = [
  "आइतवार",
  "सोमवार",
  "मंगलवार",
  "बुधवार",
  "बिहीवार",
  "शुक्रवार",
  "शनिवार",
] as const;

const WEEKDAYS_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function formatAdIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Instant month skeleton — BS/AD dates and weekdays only, no network. */
export function buildLocalMonthDays(year: number, month: number): CalendarDay[] {
  const monthLength = getBSMonthLength(year, month);
  const days: CalendarDay[] = [];

  for (let day = 1; day <= monthLength; day += 1) {
    const adDate = bsToAD(year, month, day);
    const weekdayIdx = adDate.getDay();
    days.push({
      day,
      date_ad: formatAdIso(adDate),
      weekday: WEEKDAYS_NE[weekdayIdx],
      weekday_en: WEEKDAYS_EN[weekdayIdx],
      weekday_ne: WEEKDAYS_NE[weekdayIdx],
      tithi: "",
      festivals: [],
    });
  }

  return days;
}

/** Instant AD month skeleton — BS day + AD date + weekday, no network. */
export function buildLocalAdMonthDays(adYear: number, adMonth: number): CalendarDay[] {
  const daysInMonth = new Date(adYear, adMonth, 0).getDate();
  const days: CalendarDay[] = [];

  for (let adDay = 1; adDay <= daysInMonth; adDay += 1) {
    const adDate = new Date(adYear, adMonth - 1, adDay);
    const bs = adToBS(adDate);
    const weekdayIdx = adDate.getDay();
    days.push({
      day: bs.day,
      date_ad: formatAdIso(adDate),
      weekday: WEEKDAYS_NE[weekdayIdx],
      weekday_en: WEEKDAYS_EN[weekdayIdx],
      weekday_ne: WEEKDAYS_NE[weekdayIdx],
      tithi: "",
      festivals: [],
    });
  }

  return days;
}

export function shiftAdMonth(
  adYear: number,
  adMonth: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(adYear, adMonth - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** BS months that contain at least one day of the given AD month. */
export function getBsMonthsOverlappingAdMonth(
  adYear: number,
  adMonth: number,
): Array<{ year: number; month: number }> {
  const start = new Date(adYear, adMonth - 1, 1);
  const end = new Date(adYear, adMonth, 0);
  const bsStart = adToBS(start);
  const bsEnd = adToBS(end);
  const result: Array<{ year: number; month: number }> = [];
  const seen = new Set<string>();

  let y = bsStart.year;
  let m = bsStart.month;
  while (true) {
    const key = `${y}-${m}`;
    if (
      !seen.has(key) &&
      y >= BS_SUPPORTED_START_YEAR &&
      y <= BS_SUPPORTED_END_YEAR
    ) {
      seen.add(key);
      result.push({ year: y, month: m });
    }
    if (y === bsEnd.year && m === bsEnd.month) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  return result;
}

export function uniqueBsMonths(
  months: Array<{ year: number; month: number }>,
): Array<{ year: number; month: number }> {
  const seen = new Set<string>();
  return months.filter(({ year, month }) => {
    const key = `${year}-${month}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return year >= BS_SUPPORTED_START_YEAR && year <= BS_SUPPORTED_END_YEAR;
  });
}

/** Full 6-week AD grid: trailing/leading days from adjacent Gregorian months. */
export function buildAdCalendarGridDays(
  adYear: number,
  adMonth: number,
  enrichedDays?: CalendarDay[],
): CalendarDay[] {
  const currentLocal = buildLocalAdMonthDays(adYear, adMonth);
  const first = currentLocal[0];
  if (!first) return currentLocal;

  const startOffset = new Date(`${first.date_ad}T12:00:00`).getDay();
  const prevAd = shiftAdMonth(adYear, adMonth, -1);
  const nextAd = shiftAdMonth(adYear, adMonth, 1);

  const prevLocal = buildLocalAdMonthDays(prevAd.year, prevAd.month);
  const leading: CalendarDay[] =
    startOffset > 0
      ? prevLocal.slice(-startOffset).map((d) => ({
          ...d,
          outsideMonth: true,
        }))
      : [];

  const current: CalendarDay[] = currentLocal.map((d) => ({
    ...d,
    outsideMonth: false,
  }));

  const totalCells = Math.ceil((startOffset + current.length) / 7) * 7;
  const trailingCount = totalCells - startOffset - current.length;
  const nextLocal = buildLocalAdMonthDays(nextAd.year, nextAd.month);
  const trailing: CalendarDay[] = nextLocal.slice(0, trailingCount).map((d) => ({
    ...d,
    outsideMonth: true,
  }));

  let grid: CalendarDay[] = [...leading, ...current, ...trailing];

  if (enrichedDays?.length) {
    grid = mergeEnrichedDays(grid, enrichedDays);
  }

  return grid;
}

export type SecondaryCellDate = {
  /** Day number of the other calendar (BS day in an AD grid, and vice versa). */
  day: number;
  /** Set only where that month turns over, so the number can be placed. */
  monthLabel?: string;
  /** Same label clipped for phone-width cells (~50px), e.g. Shrawan → Shr. */
  monthLabelShort?: string;
};

/**
 * The small counterpart date printed next to the big day number — the BS date
 * inside a Gregorian grid, or the AD date inside a BS grid. The month name only
 * rides along where that month turns over (its day 1) or on the grid's opening
 * cell, so a reader can tell which असार / July the bare numbers belong to
 * without the name repeating in all 42 cells.
 */
export function getSecondaryCellDate(
  day: CalendarDay,
  primaryDate: "bs" | "ad",
  lang = "ne",
  isFirstCell = false,
): SecondaryCellDate {
  const ad = new Date(`${day.date_ad}T12:00:00`);
  const isEn = lang.slice(0, 2) === "en";

  if (primaryDate === "ad") {
    const bs = adToBS(ad);
    if (!isFirstCell && bs.day !== 1) return { day: bs.day };
    const name = isEn ? BS_MONTH_NAMES[bs.month - 1] : BS_MONTHS_NE[bs.month - 1];
    return {
      day: bs.day,
      monthLabel: name,
      // Only the romanized BS names run long; Devanagari ones already fit.
      monthLabelShort: isEn ? name.slice(0, 3) : name,
    };
  }

  const adDay = ad.getDate();
  if (!isFirstCell && adDay !== 1) return { day: adDay };
  const name = isEn
    ? AD_MONTHS_SHORT[ad.getMonth()]
    : AD_MONTHS_SHORT_NE[ad.getMonth()];
  return { day: adDay, monthLabel: name, monthLabelShort: name };
}

/** BS month span subtitle for an AD month header, e.g. Poush–Magh 2082. */
export function getAdMonthBsSpanLabel(
  adYear: number,
  adMonth: number,
  lang = "en",
  digitFn: (value: string | number) => string = String,
): string {
  const start = new Date(adYear, adMonth - 1, 1);
  const end = new Date(adYear, adMonth, 0);
  const bsStart = adToBS(start);
  const bsEnd = adToBS(end);
  const isEn = lang.slice(0, 2) === "en";
  const startLabel = isEn
    ? BS_MONTH_NAMES[bsStart.month - 1]
    : BS_MONTHS_NE[bsStart.month - 1];
  const endLabel = isEn
    ? BS_MONTH_NAMES[bsEnd.month - 1]
    : BS_MONTHS_NE[bsEnd.month - 1];

  if (bsStart.year === bsEnd.year && bsStart.month === bsEnd.month) {
    return `${startLabel} ${digitFn(bsStart.year)}`;
  }
  if (bsStart.year === bsEnd.year) {
    return `${startLabel}–${endLabel} ${digitFn(bsStart.year)}`;
  }
  return `${startLabel} ${digitFn(bsStart.year)}/${endLabel} ${digitFn(bsEnd.year)}`;
}

export function shiftBsMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  let m = month + delta;
  let y = year;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return { year: y, month: m };
}

/** Full 6-week grid: trailing days from previous BS month + current + leading from next. */
export function buildCalendarGridDays(
  year: number,
  month: number,
  enriched?: {
    prev?: CalendarDay[];
    current?: CalendarDay[];
    next?: CalendarDay[];
  },
): CalendarDay[] {
  const currentLocal = buildLocalMonthDays(year, month);
  const first = currentLocal[0];
  if (!first) return currentLocal;

  const startOffset = new Date(`${first.date_ad}T12:00:00`).getDay();
  const prevBs = shiftBsMonth(year, month, -1);
  const nextBs = shiftBsMonth(year, month, 1);

  const prevLocal = buildLocalMonthDays(prevBs.year, prevBs.month);
  // slice(-0) is slice(0) in JS — returns the whole array, not zero elements
  const leading: CalendarDay[] =
    startOffset > 0
      ? prevLocal.slice(-startOffset).map((d) => ({
          ...d,
          outsideMonth: true,
        }))
      : [];

  const current: CalendarDay[] = currentLocal.map((d) => ({
    ...d,
    outsideMonth: false,
  }));

  const totalCells = Math.ceil((startOffset + current.length) / 7) * 7;
  const trailingCount = totalCells - startOffset - current.length;
  const nextLocal = buildLocalMonthDays(nextBs.year, nextBs.month);
  const trailing: CalendarDay[] = nextLocal.slice(0, trailingCount).map((d) => ({
    ...d,
    outsideMonth: true,
  }));

  let grid: CalendarDay[] = [...leading, ...current, ...trailing];

  if (enriched?.prev?.length) {
    grid = mergeEnrichedDays(grid, enriched.prev);
  }
  if (enriched?.current?.length) {
    grid = mergeEnrichedDays(grid, enriched.current);
  }
  if (enriched?.next?.length) {
    grid = mergeEnrichedDays(grid, enriched.next);
  }

  return grid;
}

export function getLocalMonthMeta(year: number, month: number) {
  const monthLength = getBSMonthLength(year, month);
  const monthStartAd = formatAdIso(bsToAD(year, month, 1));
  const monthEndAd = formatAdIso(bsToAD(year, month, monthLength));

  return {
    year_bs: year,
    month_bs: month,
    month_name: BS_MONTH_NAMES[month - 1],
    month_name_ne: BS_MONTHS_NE[month - 1],
    month_start_ad: monthStartAd,
    month_length: monthLength,
    month_end_ad: monthEndAd,
  };
}

export function getBsMonthAdSpanLabel(year: number, month: number): string {
  const { month_start_ad, month_end_ad } = getLocalMonthMeta(year, month);
  const start = new Date(month_start_ad);
  const end = new Date(month_end_ad);
  const s = new Date(start.getFullYear(), start.getMonth());
  const e = new Date(end.getFullYear(), end.getMonth());
  const fmt = (d: Date) => d.toLocaleString("en", { month: "short", year: "numeric" });
  return s.getTime() === e.getTime()
    ? fmt(start)
    : `${start.toLocaleString("en", { month: "short" })}–${fmt(end)}`;
}

/** Compact AD month hint for header, e.g. sep/oct or jun */
export function getBsMonthAdSpanCompact(year: number, month: number): string {
  const { month_start_ad, month_end_ad } = getLocalMonthMeta(year, month);
  const start = new Date(`${month_start_ad}T12:00:00`);
  const end = new Date(`${month_end_ad}T12:00:00`);
  const startKey = start.getFullYear() * 12 + start.getMonth();
  const endKey = end.getFullYear() * 12 + end.getMonth();
  const fmt = (d: Date) =>
    d.toLocaleString("en", { month: "short" }).replace(/\./g, "").toLowerCase();
  if (startKey === endKey) return fmt(start);
  return `${fmt(start)}/${fmt(end)}`;
}

/** Day span for header, e.g. असार १ – ३२ */
export function getBsMonthRangeLabel(
  year: number,
  month: number,
  lang = "ne",
  digitFn: (value: string | number) => string = String,
): string {
  const { month_name, month_name_ne, month_length } = getLocalMonthMeta(year, month);
  const isEn = lang.slice(0, 2) === "en";
  const monthLabel = isEn ? month_name : month_name_ne;
  return `${monthLabel} ${digitFn(1)} – ${digitFn(month_length)}`;
}

/** Overlay server panchanga/festival data onto local days (matched by AD date). */
export function mergeEnrichedDays(
  localDays: CalendarDay[],
  enrichedDays: CalendarDay[],
): CalendarDay[] {
  const byDate = new Map(enrichedDays.map((d) => [d.date_ad, d]));
  return localDays.map((local) => {
    const remote = byDate.get(local.date_ad);
    if (!remote) return local;
    // Keep grid lead/trail flags — remote month payloads never set outsideMonth.
    return {
      ...local,
      ...remote,
      day: local.day,
      outsideMonth: local.outsideMonth,
    };
  });
}

/** Attach festival/holiday names from a yearly list (lighter than full month API). */
export function applyHolidaysToDays(
  days: CalendarDay[],
  holidays: Array<Holiday | Festival>,
  lang?: string,
): CalendarDay[] {
  const isEn = (lang ?? "ne").slice(0, 2) === "en";
  const namesByDate = new Map<string, string[]>();
  /** All known aliases for holidays on a date (ne/en/id) — used to drop duplicates. */
  const aliasesByDate = new Map<string, Set<string>>();

  for (const h of holidays) {
    if (!h.start_date) continue;
    const fallbackName = "name" in h ? h.name : undefined;
    const name = isEn
      ? (h.name_en ?? h.name_ne ?? fallbackName ?? h.id)
      : (h.name_ne ?? h.name_en ?? fallbackName ?? h.id);
    const existing = namesByDate.get(h.start_date) ?? [];
    const aliases = aliasesByDate.get(h.start_date) ?? new Set<string>();
    for (const alias of [h.name_ne, h.name_en, fallbackName, h.id, name]) {
      if (alias) aliases.add(alias.toLowerCase());
    }
    aliasesByDate.set(h.start_date, aliases);

    const duplicate = existing.some((entry) => aliases.has(entry.toLowerCase()) || entry === name);
    if (!duplicate) existing.push(name);
    namesByDate.set(h.start_date, existing);
  }

  return days.map((day) => {
    const extra = namesByDate.get(day.date_ad);
    if (!extra?.length) return day;
    const aliases = aliasesByDate.get(day.date_ad) ?? new Set<string>();
    // Prefer localized holiday-API names; strip month-calendar festival strings
    // that are the same event (often Nepali-only) so English isn't buried.
    const fromDay = (day.festivals ?? []).filter((f) => !aliases.has(f.toLowerCase()));
    return { ...day, festivals: [...extra, ...fromDay] };
  });
}
