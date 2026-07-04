import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ne from "./ne.json";
import en from "./en.json";

// Fixed default locale for first paint (matches SSR prerender). LanguageBootstrap
// in App.tsx applies a saved localStorage choice after hydration; otherwise Nepali.
void i18n.use(initReactI18next).init({
  resources: {
    ne: { translation: ne },
    en: { translation: en },
  },
  lng: "ne",
  supportedLngs: ["en", "ne"],
  fallbackLng: "ne",
  load: "languageOnly",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
