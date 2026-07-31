import { useState } from "react";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { useLocale } from "@/i18n/locale";
import { adToBS, getCurrentBs } from "@/lib/bs-calendar";
import {
  defaultEraForLanguage,
  type Era,
  type Language,
} from "@/lib/era";

function positiveInt(y: number): number {
  const t = Math.trunc(y);
  return t >= 1 ? t : 1;
}

function positiveMonth(m: number): number {
  const t = Math.trunc(m);
  if (t < 1) return 1;
  if (t > 12) return 12;
  return t;
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
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
  return { year: positiveInt(y), month: m };
}

function calendarEraAsEra(raw: ReturnType<typeof useCalendarEra>): Era {
  return raw === "bbs" || raw === "bs" || raw === "ad" ? raw : "bs";
}

function defaultMonthBrowseParts(era: Era): { year: number; month: number } {
  if (era === "bs" || era === "bbs") {
    return getCurrentBs();
  }
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
}

/**
 * Vikram browse URLs carry BS year/month. Older builds mirrored Gregorian
 * `getFullYear()` / `getMonth()+1` into `era=bs` links — rewrite that pair.
 */
export function coerceMonthBrowseFromUrl(
  era: Era,
  year: number | undefined,
  month: number | undefined,
): { year?: number; month?: number } {
  if (era !== "bs" && era !== "bbs") {
    return { year, month };
  }
  const now = new Date();
  const adYear = now.getFullYear();
  const adMonth = now.getMonth() + 1;
  if (year !== adYear) {
    return { year, month };
  }
  const bs = getCurrentBs();
  return {
    year: bs.year,
    month: month === adMonth ? bs.month : month,
  };
}

function resolveInitialMonthBrowse(
  era: Era,
  initial?: { year?: number; month?: number },
): { year: number; month: number } {
  const defaults = defaultMonthBrowseParts(era);
  if (!initial) return defaults;
  const coerced = coerceMonthBrowseFromUrl(era, initial.year, initial.month);
  return {
    year: positiveInt(coerced.year ?? initial.year ?? defaults.year),
    month: positiveMonth(coerced.month ?? initial.month ?? defaults.month),
  };
}

/** Month+year browse — positive parts in the active era; no BS↔AD conversion. */
export function usePatroMonthBrowse(
  initial?: { year?: number; month?: number },
  options?: { era?: Era },
) {
  const langEra = useCalendarEra();
  const { lang } = useLocale();
  const fallbackLang: Language = lang === "en" ? "en" : "ne";

  const [era, setEraState] = useState<Era>(
    () => options?.era ?? calendarEraAsEra(langEra),
  );
  const initialParts = resolveInitialMonthBrowse(
    options?.era ?? calendarEraAsEra(langEra),
    initial,
  );
  const [year, setYearState] = useState(() => initialParts.year);
  const [month, setMonthState] = useState(() => initialParts.month);
  const [syncedLang, setSyncedLang] = useState(lang);

  if (lang !== syncedLang) {
    setSyncedLang(lang);
    const nextEra = defaultEraForLanguage(fallbackLang);
    setEraState(nextEra);
    const next = defaultMonthBrowseParts(nextEra);
    setYearState(next.year);
    setMonthState(next.month);
  }

  const setYear = (y: number) => setYearState(positiveInt(y));
  const setEra = (next: Era) => setEraState(next);
  const setMonth = (m: number) => setMonthState(positiveMonth(m));

  const setYearMonth = (y: number, m: number) => {
    setYearState(positiveInt(y));
    setMonthState(positiveMonth(m));
  };

  const stepMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYearState(next.year);
    setMonthState(next.month);
  };

  const goToday = (todayAd?: string) => {
    if (era === "bs" || era === "bbs") {
      const bs = todayAd
        ? adToBS(new Date(`${todayAd}T12:00:00`))
        : getCurrentBs();
      setYearState(bs.year);
      setMonthState(bs.month);
      return;
    }
    const d = todayAd ? new Date(`${todayAd}T12:00:00`) : new Date();
    if (era === "ad" || era === "bc") {
      setYearState(d.getFullYear());
      setMonthState(d.getMonth() + 1);
    }
  };

  return {
    era,
    year,
    month,
    setYear,
    setEra,
    setMonth,
    setYearMonth,
    stepMonth,
    goToday,
  } as const;
}

export type PatroMonthBrowse = ReturnType<typeof usePatroMonthBrowse>;
