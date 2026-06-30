import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
} from "@tanstack/react-router";
import { Header } from "./components/Header";
import { AnalyticsTracker } from "./components/AnalyticsTracker";
import { Home } from "./pages/Home";
import { lazyRoute } from "./lib/lazy-route";
import { RouteLoadingProvider } from "./lib/route-loading";
import {
  validateChandraKrantiSearch,
  validatePanchangaSearch,
} from "./lib/url-state";

const Panchanga = lazyRoute(() => import("./pages/Panchanga"), "Panchanga");
const PanchangaYear = lazyRoute(() => import("./pages/PanchangaYear"), "PanchangaYear");
const AvakahadaChakra = lazyRoute(() => import("./pages/AvakahadaChakra"), "AvakahadaChakra");
const ChandraKranti = lazyRoute(() => import("./pages/ChandraKranti"), "ChandraKranti");
const ShantiVidhi = lazyRoute(() => import("./pages/ShantiVidhi"), "ShantiVidhi");
const Converter = lazyRoute(() => import("./pages/Converter"), "Converter");
const Holidays = lazyRoute(() => import("./pages/Holidays"), "Holidays");
const Kundali = lazyRoute(() => import("./pages/Kundali"), "Kundali");
const KundaliDetail = lazyRoute(() => import("./pages/KundaliDetail"), "KundaliDetail");
const Learn = lazyRoute(() => import("./pages/Learn"), "Learn");
const LearnArticle = lazyRoute(() => import("./pages/LearnArticle"), "LearnArticle");
const SunTimesYear = lazyRoute(() => import("./pages/SunTimesYear"), "SunTimesYear");
const History = lazyRoute(() => import("./pages/History"), "History");
const Account = lazyRoute(() => import("./pages/Account"), "Account");
const VerifyEmail = lazyRoute(() => import("./pages/VerifyEmail"), "VerifyEmail");
const ResetPassword = lazyRoute(() => import("./pages/ResetPassword"), "ResetPassword");

const rootRoute = createRootRoute({
  component: () => (
    <RouteLoadingProvider>
      <AnalyticsTracker />
      <div className="min-h-screen">
        <Header />
        <Outlet />
      </div>
    </RouteLoadingProvider>
  ),
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home });
const panchangaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/panchanga",
  validateSearch: validatePanchangaSearch,
  component: Panchanga,
});
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
const chandraKrantiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chandrakranti",
  validateSearch: validateChandraKrantiSearch,
  component: ChandraKranti,
});
const shantiVidhiRoute = createRoute({ getParentRoute: () => rootRoute, path: "/shanti-vidhi", component: ShantiVidhi });
const converterRoute = createRoute({ getParentRoute: () => rootRoute, path: "/converter", component: Converter });
const holidaysRoute = createRoute({ getParentRoute: () => rootRoute, path: "/holidays", component: Holidays });
const kundaliRoute = createRoute({ getParentRoute: () => rootRoute, path: "/kundali", component: Kundali });
const kundaliDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: "/kundali/$profileId", component: KundaliDetail });
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
const historyRoute = createRoute({ getParentRoute: () => rootRoute, path: "/learn/history", component: History });
const historyLegacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: () => <Navigate to="/learn/history" replace />,
});
const accountRoute = createRoute({ getParentRoute: () => rootRoute, path: "/account", component: Account });
const verifyEmailRoute = createRoute({ getParentRoute: () => rootRoute, path: "/verify-email", component: VerifyEmail });
const resetPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: "/reset-password", component: ResetPassword });

const routeTree = rootRoute.addChildren([
  indexRoute,
  panchangaRoute,
  panchangaYearRoute,
  avakahadaRoute,
  chandraKrantiRoute,
  shantiVidhiRoute,
  converterRoute,
  holidaysRoute,
  kundaliRoute,
  kundaliDetailRoute,
  learnRoute,
  learnArticleRoute,
  suryakrantiRoute,
  sunTimesLegacyRoute,
  historyRoute,
  historyLegacyRoute,
  accountRoute,
  verifyEmailRoute,
  resetPasswordRoute,
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
