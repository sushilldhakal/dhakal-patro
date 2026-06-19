import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { lazyRoute } from "./lib/lazy-route";

const Panchanga = lazyRoute(() => import("./pages/Panchanga"), "Panchanga");
const PanchangaYear = lazyRoute(() => import("./pages/PanchangaYear"), "PanchangaYear");
const Converter = lazyRoute(() => import("./pages/Converter"), "Converter");
const Holidays = lazyRoute(() => import("./pages/Holidays"), "Holidays");
const Kundali = lazyRoute(() => import("./pages/Kundali"), "Kundali");
const Learn = lazyRoute(() => import("./pages/Learn"), "Learn");
const LearnArticle = lazyRoute(() => import("./pages/LearnArticle"), "LearnArticle");

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      <Header />
      <Outlet />
    </div>
  ),
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home });
const panchangaRoute = createRoute({ getParentRoute: () => rootRoute, path: "/panchanga", component: Panchanga });
const panchangaYearRoute = createRoute({ getParentRoute: () => rootRoute, path: "/panchanga/year", component: PanchangaYear });
const converterRoute = createRoute({ getParentRoute: () => rootRoute, path: "/converter", component: Converter });
const holidaysRoute = createRoute({ getParentRoute: () => rootRoute, path: "/holidays", component: Holidays });
const kundaliRoute = createRoute({ getParentRoute: () => rootRoute, path: "/kundali", component: Kundali });
const learnRoute = createRoute({ getParentRoute: () => rootRoute, path: "/learn", component: Learn });
const learnArticleRoute = createRoute({ getParentRoute: () => rootRoute, path: "/learn/$slug", component: LearnArticle });

const routeTree = rootRoute.addChildren([
  indexRoute,
  panchangaRoute,
  panchangaYearRoute,
  converterRoute,
  holidaysRoute,
  kundaliRoute,
  learnRoute,
  learnArticleRoute,
]);

const basepath = import.meta.env.BASE_URL.replace(/\/$/, "");

export const router = createRouter({
  routeTree,
  ...(basepath ? { basepath } : {}),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
