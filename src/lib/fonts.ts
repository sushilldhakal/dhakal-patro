import { normalizeLang, type Lang } from "@/i18n/locale";
import { isBrowser } from "@/lib/browser";

const OXANIUM_FONT_ID = "oxanium-font";
const OXANIUM_HREF =
  "https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;600;700&display=swap";

/** Load Oxanium only for English UI; Nepali stays on Mukta. */
export function ensureLocaleFonts(lang: string) {
  if (!isBrowser) return;

  const code = normalizeLang(lang);

  if (code === "en") {
    if (!document.getElementById(OXANIUM_FONT_ID)) {
      const link = document.createElement("link");
      link.id = OXANIUM_FONT_ID;
      link.rel = "stylesheet";
      link.href = OXANIUM_HREF;
      document.head.appendChild(link);
    }
    return;
  }

  document.getElementById(OXANIUM_FONT_ID)?.remove();
}

export function syncDocumentLang(lang: string): Lang {
  const code = normalizeLang(lang);
  if (isBrowser) {
    document.documentElement.lang = code;
    ensureLocaleFonts(code);
  }
  return code;
}
