declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function initAnalytics(): void {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!id || initialized) return;

  // gtag.js is injected in index.html at build time — avoid loading it twice.
  initialized = typeof window.gtag === "function";
}

export function trackPageView(path: string): void {
  if (!initialized || !window.gtag) return;

  window.gtag("event", "page_view", { page_path: path });
}

export function isAnalyticsEnabled(): boolean {
  return initialized;
}
