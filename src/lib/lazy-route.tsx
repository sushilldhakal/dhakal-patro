import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { RouteSuspenseFallback } from "@/lib/route-loading";

type ModuleLoader = () => Promise<Record<string, ComponentType<unknown>>>;

const eagerCache = new Map<string, ComponentType<unknown>>();

/**
 * Route code-splitting for the client. During SSR prerender, modules are
 * preloaded in entry-server and resolved synchronously from eagerCache.
 */
export function lazyRoute<
  M extends Record<string, ComponentType<unknown>>,
  K extends keyof M,
>(loader: () => Promise<M>, exportName: K) {
  const key = String(exportName);

  if (import.meta.env.SSR) {
    return function SsrRoute() {
      const Comp = eagerCache.get(key);
      if (!Comp) {
        throw new Error(`SSR route module not preloaded: ${key}`);
      }
      return <Comp />;
    };
  }

  const Lazy = lazy(() =>
    loader().then((mod) => ({ default: mod[exportName] as ComponentType<unknown> })),
  ) as LazyExoticComponent<ComponentType<unknown>>;

  return function LazyRoute() {
    return (
      <Suspense fallback={<RouteSuspenseFallback />}>
        <Lazy />
      </Suspense>
    );
  };
}

/** Called from entry-server before renderToString. */
export async function preloadLazyRoutes(loaders: ModuleLoader[], exportNames: string[]) {
  await Promise.all(
    loaders.map(async (load, i) => {
      const mod = await load();
      const name = exportNames[i]!;
      eagerCache.set(name, mod[name] as ComponentType<unknown>);
    }),
  );
}
