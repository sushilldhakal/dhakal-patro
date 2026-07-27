import { useState } from "react";
import { useCalendarEra, type CalendarEra } from "@/hooks/use-calendar-era";
import { useLocale } from "@/i18n/locale";
import {
  adToBS,
  bsToAD,
  getBSMonthLength,
  getCurrentBs,
} from "@/lib/bs-calendar";
import {
  PATRO_AD_YEAR_OPTIONS,
  PATRO_BS_YEAR_OPTIONS,
  clampAdYear,
  clampBsYear,
} from "@/lib/patro-date-options";

/** Year browse state — BS in Nepali, AD (Jan–Dec) in English. Follows {@link useCalendarEra} unless overridden. */
export function usePatroYearBrowse(
  initialBsYear?: number,
  options?: { era?: CalendarEra; initialAdYear?: number },
) {
  const langEra = useCalendarEra();
  const era = options?.era ?? langEra;
  const { lang } = useLocale();
  const currentBs = getCurrentBs();
  const today = new Date();

  const initBs = initialBsYear ?? currentBs.year;
  const initAd = options?.initialAdYear ?? bsToAD(initBs, 1, 1).getFullYear();
  const [bsYear, setBsYear] = useState(initBs);
  const [adYear, setAdYear] = useState(initAd);
  const [syncedLang, setSyncedLang] = useState(lang);

  if (lang !== syncedLang) {
    const fromEn = syncedLang === "en";
    setSyncedLang(lang);
    if (lang === "en") {
      const anchor =
        today.getFullYear() === bsYear || today.getMonth() === 0
          ? today
          : bsToAD(bsYear, 6, Math.min(15, getBSMonthLength(bsYear, 6)));
      setAdYear(anchor.getFullYear());
    } else if (fromEn) {
      const anchor =
        today.getFullYear() === adYear && today.getMonth() + 1 === 6
          ? today
          : new Date(adYear, 6, 15);
      const bs = adToBS(anchor);
      setBsYear(clampBsYear(bs.year));
    }
  }

  const browseYear = era === "ad" ? adYear : bsYear;
  const setBrowseYear = (y: number) => {
    if (era === "ad") setAdYear(clampAdYear(y));
    else setBsYear(clampBsYear(y));
  };
  const currentBrowseYear = era === "ad" ? today.getFullYear() : currentBs.year;

  const setFromBs = (year: number) => {
    const y = clampBsYear(year);
    setBsYear(y);
    const anchor =
      today.getFullYear() === y || today.getMonth() === 0
        ? today
        : bsToAD(y, 6, Math.min(15, getBSMonthLength(y, 6)));
    setAdYear(anchor.getFullYear());
  };

  return {
    era,
    browseYear,
    setBrowseYear,
    setFromBs,
    currentBrowseYear,
    bsYear,
    adYear,
    yearOptions: era === "ad" ? PATRO_AD_YEAR_OPTIONS : PATRO_BS_YEAR_OPTIONS,
    clampYear: (y: number) => (era === "ad" ? clampAdYear(y) : clampBsYear(y)),
  } as const;
}

export type PatroYearBrowse = ReturnType<typeof usePatroYearBrowse> & { era: CalendarEra };
