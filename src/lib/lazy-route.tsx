import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      लोड हुँदैछ…
    </div>
  );
}

export function lazyRoute<
  M extends Record<string, ComponentType<unknown>>,
  K extends keyof M,
>(loader: () => Promise<M>, exportName: K) {
  const Lazy = lazy(() =>
    loader().then((mod) => ({ default: mod[exportName] as ComponentType<unknown> }))
  ) as LazyExoticComponent<ComponentType<unknown>>;

  return function LazyRoute() {
    return (
      <Suspense fallback={<PageFallback />}>
        <Lazy />
      </Suspense>
    );
  };
}
