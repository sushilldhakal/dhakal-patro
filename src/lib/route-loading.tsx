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

type RouteLoadingContextValue = {
  setDataLoading: (loading: boolean) => void;
  setSuspenseLoading: (loading: boolean) => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextValue | null>(null);

/** Fixed overlay below the site header; covers the full content area until the route is ready. */
export function RouteLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [dataLoading, setDataLoading] = useState(true);
  const [suspenseLoading, setSuspenseLoading] = useState(false);

  useLayoutEffect(() => {
    setDataLoading(true);
    setSuspenseLoading(false);
  }, [pathname]);

  const value = useMemo(
    () => ({ setDataLoading, setSuspenseLoading }),
    [],
  );

  const isLoading = dataLoading || suspenseLoading;

  return (
    <RouteLoadingContext.Provider value={value}>
      {children}
      {isLoading ? (
        <div
          className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center bg-background"
          aria-busy="true"
          aria-live="polite"
        >
          <VedicPatroLoader />
        </div>
      ) : null}
    </RouteLoadingContext.Provider>
  );
}

/** Report whether this route still has data to fetch. Call from every data-driven page. */
export function useRouteLoading(loading: boolean) {
  const ctx = useContext(RouteLoadingContext);
  if (!ctx) {
    throw new Error("useRouteLoading must be used within RouteLoadingProvider");
  }

  useLayoutEffect(() => {
    ctx.setDataLoading(loading);
  }, [loading, ctx]);
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
