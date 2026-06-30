import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackPageView } from "@/lib/analytics";

/**
 * Sends a GA4 pageview on every client-side navigation (SPA route change).
 * Must render inside the TanStack Router tree.
 */
export function AnalyticsTracker() {
  const page = useRouterState({
    select: (s) => `${s.location.pathname}${s.location.searchStr}`,
  });

  useEffect(() => {
    trackPageView(page);
  }, [page]);

  return null;
}
