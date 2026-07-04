import type { CalendarDay, Festival, Holiday } from "./api";
import {
  BS_MONTH_NAMES,
  BS_MONTHS_NE,
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
    return remote ? { ...local, ...remote, day: local.day } : local;
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

  for (const h of holidays) {
    if (!h.start_date) continue;
    const name = isEn
      ? (h.name_en ?? h.name_ne ?? h.id)
      : (h.name_ne ?? h.name_en ?? h.id);
    const existing = namesByDate.get(h.start_date) ?? [];
    const aliasKey = (h.name_ne ?? h.name_en ?? h.id).toLowerCase();
    const duplicate = existing.some((entry) => {
      const entryKey = entry.toLowerCase();
      return entryKey === aliasKey || entry === name;
    });
    if (!duplicate) existing.push(name);
    namesByDate.set(h.start_date, existing);
  }

  return days.map((day) => {
    const extra = namesByDate.get(day.date_ad);
    if (!extra?.length) return day;
    const merged = [...(day.festivals ?? [])];
    for (const name of extra) {
      if (!merged.includes(name)) merged.push(name);
    }
    return { ...day, festivals: merged };
  });
}
