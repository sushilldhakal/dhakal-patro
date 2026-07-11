declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

let initialized = false;
let loadScheduled = false;
const pendingPageViews: string[] = [];

function flushPendingPageViews(): void {
  if (!initialized || !window.gtag) return;
  while (pendingPageViews.length > 0) {
    const path = pendingPageViews.shift()!;
    window.gtag("event", "page_view", { page_path: path });
  }
}

function onGtagReady(): void {
  initialized = true;
  flushPendingPageViews();
}

function loadGtagScript(id: string): void {
  if (loadScheduled) return;
  loadScheduled = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.onload = () => {
    window.gtag!("js", new Date());
    window.gtag!("config", id, { send_page_view: false });
    onGtagReady();
    window.dispatchEvent(new Event("gtag-ready"));
  };
  document.head.appendChild(script);
}

function scheduleGtagLoad(id: string): void {
  if (loadScheduled) return;

  const load = () => loadGtagScript(id);
  const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

  const onFirstInteraction = () => {
    events.forEach((event) => window.removeEventListener(event, onFirstInteraction));
    load();
  };

  events.forEach((event) => {
    window.addEventListener(event, onFirstInteraction, { passive: true, once: true });
  });

  // Capture bounce sessions without blocking the initial load (Lighthouse window).
  window.setTimeout(load, 12_000);
}

export function initAnalytics(): void {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!id || loadScheduled) return;

  if (typeof window.gtag === "function") {
    onGtagReady();
    return;
  }

  window.addEventListener("gtag-ready", onGtagReady, { once: true });
  scheduleGtagLoad(id);
}

export function trackPageView(path: string): void {
  if (!initialized || !window.gtag) {
    pendingPageViews.push(path);
    return;
  }

  window.gtag("event", "page_view", { page_path: path });
}

export function isAnalyticsEnabled(): boolean {
  return initialized;
}
