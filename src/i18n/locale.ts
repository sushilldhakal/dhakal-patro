import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import i18n from "./index";
import { formatLocaleDigits } from "./digits";

export type Lang = "en" | "ne";

/** Normalize any i18n language code to the two supported UI languages. */
export function normalizeLang(lang?: string): Lang {
  return (lang ?? i18n.language ?? "ne").slice(0, 2) === "en" ? "en" : "ne";
}

/** Pick the English or Nepali variant of a value based on the active language. */
export function pickLocale<T>(lang: string | undefined, ne: T, en: T): T {
  return normalizeLang(lang) === "en" ? en : ne;
}

/**
 * Hook returning the current UI language plus helpers to select localized text
 * and digits. Keeps components from hardcoding `.ne` everywhere.
 */
export function useLocale() {
  const { i18n: inst } = useTranslation();
  const lang = normalizeLang(inst.language);

  const pick = useCallback(
    <T,>(ne: T, en: T): T => (lang === "en" ? en : ne),
    [lang],
  );

  const digits = useCallback(
    (value: string | number | null | undefined): string =>
      value == null ? "" : formatLocaleDigits(value, lang),
    [lang],
  );

  return { lang, isEnglish: lang === "en", pick, digits };
}
