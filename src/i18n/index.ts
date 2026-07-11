import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ne from "./ne.json";

// Nepali only on first paint (default locale, matches SSR). English is loaded on
// demand when the user switches language — keeps ~30 KiB out of the home bundle.
void i18n.use(initReactI18next).init({
  resources: {
    ne: { translation: ne },
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

let enLoadPromise: Promise<void> | null = null;

export function ensureEnglishBundle(): Promise<void> {
  if (i18n.hasResourceBundle("en", "translation")) {
    return Promise.resolve();
  }
  if (!enLoadPromise) {
    enLoadPromise = import("./en.json").then((mod) => {
      i18n.addResourceBundle("en", "translation", mod.default, true, true);
    });
  }
  return enLoadPromise;
}

export default i18n;
