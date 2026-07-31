import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLang } from "@/i18n/locale";
import type { Language } from "@/lib/era";

/** Align i18n with share URL `language=` so digits and copy match the link. */
export function useSyncUrlLanguage(urlLanguage?: Language) {
  const { i18n } = useTranslation();
  useEffect(() => {
    if (urlLanguage !== "en" && urlLanguage !== "ne") return;
    if (normalizeLang(i18n.language) === urlLanguage) return;
    void i18n.changeLanguage(urlLanguage);
  }, [urlLanguage, i18n]);
}
