import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { RouteSuspenseFallback } from "@/lib/route-loading";

export function lazyRoute<
  M extends Record<string, ComponentType<unknown>>,
  K extends keyof M,
>(loader: () => Promise<M>, exportName: K) {
  const Lazy = lazy(() =>
    loader().then((mod) => ({ default: mod[exportName] as ComponentType<unknown> }))
  ) as LazyExoticComponent<ComponentType<unknown>>;

  return function LazyRoute() {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <Lazy />
      </Suspense>
    );
  };
}
