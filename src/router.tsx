import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
} from "@tanstack/react-router";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { lazyRoute } from "./lib/lazy-route";

const Panchanga = lazyRoute(() => import("./pages/Panchanga"), "Panchanga");
const PanchangaYear = lazyRoute(() => import("./pages/PanchangaYear"), "PanchangaYear");
const AvakahadaChakra = lazyRoute(() => import("./pages/AvakahadaChakra"), "AvakahadaChakra");
const ChandraKranti = lazyRoute(() => import("./pages/ChandraKranti"), "ChandraKranti");
const Converter = lazyRoute(() => import("./pages/Converter"), "Converter");
const Holidays = lazyRoute(() => import("./pages/Holidays"), "Holidays");
const Kundali = lazyRoute(() => import("./pages/Kundali"), "Kundali");
const Learn = lazyRoute(() => import("./pages/Learn"), "Learn");
const LearnArticle = lazyRoute(() => import("./pages/LearnArticle"), "LearnArticle");
const SunTimesYear = lazyRoute(() => import("./pages/SunTimesYear"), "SunTimesYear");

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
const panchangaYearRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/panchanga/year",
  validateSearch: (search: Record<string, unknown>): { year?: number } => {
    const raw = search.year;
    const year =
      typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : undefined;
    return Number.isFinite(year) ? { year } : {};
  },
  component: PanchangaYear,
});
const avakahadaRoute = createRoute({ getParentRoute: () => rootRoute, path: "/panchanga/avakahada-chakra", component: AvakahadaChakra });
const chandraKrantiRoute = createRoute({ getParentRoute: () => rootRoute, path: "/chandrakranti", component: ChandraKranti });
const converterRoute = createRoute({ getParentRoute: () => rootRoute, path: "/converter", component: Converter });
const holidaysRoute = createRoute({ getParentRoute: () => rootRoute, path: "/holidays", component: Holidays });
const kundaliRoute = createRoute({ getParentRoute: () => rootRoute, path: "/kundali", component: Kundali });
const learnRoute = createRoute({ getParentRoute: () => rootRoute, path: "/learn", component: Learn });
const learnArticleRoute = createRoute({ getParentRoute: () => rootRoute, path: "/learn/$slug", component: LearnArticle });
const suryakrantiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/suryakranti",
  component: SunTimesYear,
});
const sunTimesLegacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sun-times",
  component: () => <Navigate to="/suryakranti" replace />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  panchangaRoute,
  panchangaYearRoute,
  avakahadaRoute,
  chandraKrantiRoute,
  converterRoute,
  holidaysRoute,
  kundaliRoute,
  learnRoute,
  learnArticleRoute,
  suryakrantiRoute,
  sunTimesLegacyRoute,
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
