import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { createMemoryHistory } from "@tanstack/react-router";
import { createAppRouter } from "./router";
import App from "./App";
import { initSsrI18n } from "./i18n/ssr";
import { preloadLazyRoutes } from "./lib/lazy-route";
import { buildHeadHtml } from "./lib/seo";

export { PRERENDER_PATHS } from "./lib/seo";

const LAZY_LOADERS = [
  () => import("./pages/Panchanga"),
  () => import("./pages/PanchangaYear"),
  () => import("./pages/AvakahadaChakra"),
  () => import("./pages/ChandraKranti"),
  () => import("./pages/ShantiVidhi"),
  () => import("./pages/Converter"),
  () => import("./pages/Holidays"),
  () => import("./pages/Kundali"),
  () => import("./pages/KundaliDetail"),
  () => import("./pages/Learn"),
  () => import("./pages/LearnArticle"),
  () => import("./pages/SunTimesYear"),
  () => import("./pages/AbhijitMuhurta"),
  () => import("./pages/History"),
  () => import("./pages/Account"),
  () => import("./pages/VerifyEmail"),
  () => import("./pages/ResetPassword"),
] as const;

const LAZY_NAMES = [
  "Panchanga",
  "PanchangaYear",
  "AvakahadaChakra",
  "ChandraKranti",
  "ShantiVidhi",
  "Converter",
  "Holidays",
  "Kundali",
  "KundaliDetail",
  "Learn",
  "LearnArticle",
  "SunTimesYear",
  "AbhijitMuhurta",
  "History",
  "Account",
  "VerifyEmail",
  "ResetPassword",
] as const;

export async function buildHeadHtmlForPath(pathname: string): Promise<string> {
  const i18nInstance = initSsrI18n();
  return buildHeadHtml(pathname, i18nInstance.t.bind(i18nInstance));
}

export async function render(url: string): Promise<string> {
  initSsrI18n();
  await preloadLazyRoutes([...LAZY_LOADERS], [...LAZY_NAMES]);

  const history = createMemoryHistory({ initialEntries: [url] });
  const router = createAppRouter(history);

  await router.load();

  return renderToString(
    <StrictMode>
      <App appRouter={router} ssr />
    </StrictMode>,
  );
}
