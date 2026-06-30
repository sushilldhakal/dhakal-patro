import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ne from "./ne.json";

async function ensureEnglishBundle(): Promise<void> {
  if (i18n.hasResourceBundle("en", "translation")) return;
  const { default: en } = await import("./en.json");
  i18n.addResourceBundle("en", "translation", en);
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ne: { translation: ne },
    },
    supportedLngs: ["en", "ne"],
    lng: "ne",
    fallbackLng: "en",
    partialBundledLanguages: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  })
  .then(() => {
    if (i18n.language?.startsWith("en")) {
      void ensureEnglishBundle();
    }
  });

i18n.on("languageChanged", (lng) => {
  if (lng.startsWith("en")) {
    void ensureEnglishBundle();
  }
});

export default i18n;
