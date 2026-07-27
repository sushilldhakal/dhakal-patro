import { useState } from "react";
import { useCalendarEra, type CalendarEra } from "@/hooks/use-calendar-era";
import { useLocale } from "@/i18n/locale";
import {
  adToBS,
  bsToAD,
  getCurrentBs,
  getSupportedAdBounds,
} from "@/lib/bs-calendar";
import { clampAdYear, clampBsYear } from "@/lib/patro-date-options";

const AD_BOUNDS = getSupportedAdBounds();

function clampAdMonth(year: number, month: number): { year: number; month: number } {
  let y = clampAdYear(year);
  let m = Math.min(Math.max(month, 1), 12);
  if (y < AD_BOUNDS.minYear) {
    y = AD_BOUNDS.minYear;
    m = AD_BOUNDS.minMonth;
  }
  if (y > AD_BOUNDS.maxYear) {
    y = AD_BOUNDS.maxYear;
    m = AD_BOUNDS.maxMonth;
  }
  return { year: y, month: m };
}

function shiftAdMonth(year: number, month: number, delta: number): { year: number; month: number } {
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
  return clampAdMonth(y, m);
}

function shiftBsMonth(year: number, month: number, delta: number): { year: number; month: number } {
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
  return { year: clampBsYear(y), month: m };
}

function syncBsFromAdMonth(adYear: number, adMonth: number, adDay = 1) {
  const bs = adToBS(new Date(adYear, adMonth - 1, adDay));
  return { year: clampBsYear(bs.year), month: bs.month };
}

function anchorAdDay(adYear: number, adMonth: number, today: Date): number {
  if (adYear === today.getFullYear() && adMonth === today.getMonth() + 1) {
    return today.getDate();
  }
  return 1;
}

function anchorBsDay(bsYear: number, bsMonth: number, todayBs: { year: number; month: number; day: number }): number {
  if (bsYear === todayBs.year && bsMonth === todayBs.month) {
    return todayBs.day;
  }
  return 1;
}

/** Month+year browse — BS months in Nepali, AD months in English. */
export function usePatroMonthBrowse(
  initial?: {
    year?: number;
    month?: number;
    adYear?: number;
    adMonth?: number;
  },
  options?: { era?: CalendarEra },
) {
  const langEra = useCalendarEra();
  const era = options?.era ?? langEra;
  const { lang } = useLocale();
  const currentBs = getCurrentBs();
  const today = new Date();
  const todayBs = adToBS(today);

  const initBs = (() => {
    if (initial?.adYear != null && initial?.adMonth != null) {
      return syncBsFromAdMonth(
        initial.adYear,
        initial.adMonth,
        anchorAdDay(initial.adYear, initial.adMonth, today),
      );
    }
    return {
      year: initial?.year ?? currentBs.year,
      month: initial?.month ?? currentBs.month,
    };
  })();
  const initAd = (() => {
    if (initial?.adYear != null && initial?.adMonth != null) {
      return clampAdMonth(initial.adYear, initial.adMonth);
    }
    if (initial?.year != null && initial?.month != null) {
      const anchor = bsToAD(initial.year, initial.month, 1);
      return { year: anchor.getFullYear(), month: anchor.getMonth() + 1 };
    }
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  })();

  const [bsYear, setBsYear] = useState(initBs.year);
  const [bsMonth, setBsMonth] = useState(initBs.month);
  const [adYear, setAdYear] = useState(initAd.year);
  const [adMonth, setAdMonth] = useState(initAd.month);
  const [syncedLang, setSyncedLang] = useState(lang);

  // Apply language ↔ calendar conversion synchronously so URL mirror and fetch
  // see the converted month in the same render (avoids a stale Asar flash when
  // toggling from July AD → Shrawan BS mid-month).
  let liveAdYear = adYear;
  let liveAdMonth = adMonth;
  let liveBsYear = bsYear;
  let liveBsMonth = bsMonth;

  if (lang !== syncedLang) {
    const fromEn = syncedLang === "en";
    setSyncedLang(lang);
    if (lang === "en") {
      const d = anchorBsDay(bsYear, bsMonth, todayBs);
      const anchor = bsToAD(bsYear, bsMonth, d);
      liveAdYear = anchor.getFullYear();
      liveAdMonth = anchor.getMonth() + 1;
      setAdYear(liveAdYear);
      setAdMonth(liveAdMonth);
    } else if (fromEn) {
      const d = anchorAdDay(adYear, adMonth, today);
      const bs = adToBS(new Date(adYear, adMonth - 1, d));
      liveBsYear = clampBsYear(bs.year);
      liveBsMonth = bs.month;
      setBsYear(liveBsYear);
      setBsMonth(liveBsMonth);
    }
  }

  const browseYear = era === "ad" ? liveAdYear : liveBsYear;
  const browseMonth = era === "ad" ? liveAdMonth : liveBsMonth;

  const setBrowseMonth = (year: number, month: number) => {
    if (era === "ad") {
      const next = clampAdMonth(year, month);
      setAdYear(next.year);
      setAdMonth(next.month);
      const bs = syncBsFromAdMonth(
        next.year,
        next.month,
        anchorAdDay(next.year, next.month, today),
      );
      setBsYear(bs.year);
      setBsMonth(bs.month);
    } else {
      setBsYear(clampBsYear(year));
      setBsMonth(month);
      const anchor = bsToAD(year, month, 1);
      setAdYear(anchor.getFullYear());
      setAdMonth(anchor.getMonth() + 1);
    }
  };

  const stepMonth = (delta: number) => {
    if (era === "ad") {
      const next = shiftAdMonth(adYear, adMonth, delta);
      setAdYear(next.year);
      setAdMonth(next.month);
      const bs = syncBsFromAdMonth(
        next.year,
        next.month,
        anchorAdDay(next.year, next.month, today),
      );
      setBsYear(bs.year);
      setBsMonth(bs.month);
    } else {
      const next = shiftBsMonth(bsYear, bsMonth, delta);
      setBsYear(next.year);
      setBsMonth(next.month);
      const anchor = bsToAD(next.year, next.month, 1);
      setAdYear(anchor.getFullYear());
      setAdMonth(anchor.getMonth() + 1);
    }
  };

  const goToday = (todayAd?: string) => {
    const d = todayAd ? new Date(`${todayAd}T12:00:00`) : new Date();
    const bs = adToBS(d);
    setBsYear(bs.year);
    setBsMonth(bs.month);
    setAdYear(d.getFullYear());
    setAdMonth(d.getMonth() + 1);
  };

  const setFromBs = (year: number, month: number) => {
    const y = clampBsYear(year);
    setBsYear(y);
    setBsMonth(month);
    const anchor = bsToAD(y, month, 1);
    setAdYear(anchor.getFullYear());
    setAdMonth(anchor.getMonth() + 1);
  };

  const setFromAd = (year: number, month: number) => {
    const next = clampAdMonth(year, month);
    setAdYear(next.year);
    setAdMonth(next.month);
    const bs = syncBsFromAdMonth(
      next.year,
      next.month,
      anchorAdDay(next.year, next.month, today),
    );
    setBsYear(bs.year);
    setBsMonth(bs.month);
  };

  return {
    era,
    browseYear,
    browseMonth,
    setBrowseMonth,
    setFromBs,
    setFromAd,
    stepMonth,
    goToday,
    bsYear,
    bsMonth,
    adYear,
    adMonth,
  } as const;
}

export type PatroMonthBrowse = ReturnType<typeof usePatroMonthBrowse> & { era: CalendarEra };
