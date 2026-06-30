import ReactGA from "react-ga4";

let initialized = false;

export function initAnalytics(): void {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!id || initialized) return;

  ReactGA.initialize(id, { gtagOptions: { send_page_view: false } });
  initialized = true;
}

export function trackPageView(path: string): void {
  if (!initialized) return;

  ReactGA.send({
    hitType: "pageview",
    page: path,
  });
}

export function isAnalyticsEnabled(): boolean {
  return initialized;
}
