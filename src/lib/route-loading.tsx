import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import { VedicPatroLoader } from "@/components/VedicPatroLoader";
import { isBrowser } from "@/lib/browser";

type RouteLoadingContextValue = {
  setDataLoading: (loading: boolean) => void;
  setSuspenseLoading: (loading: boolean) => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextValue | null>(null);

/** Fixed overlay below the site header; covers the full content area until the route is ready. */
export function RouteLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [dataLoading, setDataLoading] = useState(isBrowser);
  const [suspenseLoading, setSuspenseLoading] = useState(false);
  const [trackedPath, setTrackedPath] = useState(pathname);

  // Reset to "loading" synchronously DURING RENDER when the route changes, before
  // children commit. Doing this in a layout effect instead runs AFTER the page's
  // own useRouteLoading effect (parent effects fire last) and clobbers it back to
  // true — which leaves the overlay stuck on same-route param navigation (e.g.
  // /learn/$slug prev/next) where the page never remounts to re-assert false.
  if (pathname !== trackedPath) {
    setTrackedPath(pathname);
    setDataLoading(true);
    setSuspenseLoading(false);
  }

  const value = useMemo(
    () => ({ setDataLoading, setSuspenseLoading }),
    [],
  );

  const isLoading = dataLoading || suspenseLoading;

  return (
    <RouteLoadingContext.Provider value={value}>
      {children}
      {/* Always mounted, toggled via `hidden`. Conditionally mounting this as a
          trailing sibling races with route children swapping in the same commit
          and can throw "removeChild ... not a child of this node" during
          navigation; keeping it mounted avoids that reconciliation crash. */}
      <div
        hidden={!isLoading}
        className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center bg-background"
        aria-busy={isLoading}
        aria-live="polite"
      >
        {isLoading ? <VedicPatroLoader /> : null}
      </div>
    </RouteLoadingContext.Provider>
  );
}

/** Report whether this route still has data to fetch. Call from every data-driven page. */
export function useRouteLoading(loading: boolean) {
  const ctx = useContext(RouteLoadingContext);
  if (!ctx) {
    throw new Error("useRouteLoading must be used within RouteLoadingProvider");
  }

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useLayoutEffect(() => {
    ctx.setDataLoading(loading);
  }, [loading, ctx, pathname]);
}

/** Suspense fallback for lazy route chunks — pairs with RouteLoadingProvider overlay. */
export function RouteSuspenseFallback() {
  const ctx = useContext(RouteLoadingContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.setSuspenseLoading(true);
    return () => ctx.setSuspenseLoading(false);
  }, [ctx]);

  return null;
}
