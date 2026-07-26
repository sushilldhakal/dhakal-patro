import { useSyncExternalStore } from "react";
import i18n from "@/i18n";
import { getStoredLanguage } from "@/lib/user-preferences";
import { normalizeLang } from "@/i18n/locale";

/** Home calendar layout: Gregorian (AD) in English, Bikram Sambat in Nepali. */
export type CalendarEra = "bs" | "ad";

export function readCalendarEra(): CalendarEra {
  const lang = normalizeLang(i18n.resolvedLanguage ?? i18n.language);
  if (lang === "en") return "ad";
  if (getStoredLanguage() === "en") return "ad";
  return "bs";
}

function subscribe(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();
  i18n.on("languageChanged", handler);
  i18n.on("loaded", handler);
  if (typeof window !== "undefined") {
    window.addEventListener("patro-lang-pref", handler);
  }
  return () => {
    i18n.off("languageChanged", handler);
    i18n.off("loaded", handler);
    if (typeof window !== "undefined") {
      window.removeEventListener("patro-lang-pref", handler);
    }
  };
}

export function useCalendarEra(): CalendarEra {
  return useSyncExternalStore(subscribe, readCalendarEra, () => "bs");
}

/** True when the home grid should follow Gregorian month boundaries (1–28/31). */
export function useIsGregorianHomeCalendar(): boolean {
  return useCalendarEra() === "ad";
}
