import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  type RouterHistory,
} from "@tanstack/react-router";
import { Header } from "./components/Header";
import { AnalyticsTracker } from "./components/AnalyticsTracker";
import { RouteSeo } from "./components/seo/RouteSeo";
import { Home } from "./pages/Home";
import { lazyRoute } from "./lib/lazy-route";
import { RouteLoadingProvider } from "./lib/route-loading";
import {
  validateAbhijitSearch,
  validateChandraKrantiSearch,
  validatePanchangaSearch,
  validatePanchangaYearSearch,
} from "./lib/url-state";

const Panchanga = lazyRoute(() => import("./pages/Panchanga"), "Panchanga");
const PanchangaYear = lazyRoute(() => import("./pages/PanchangaYear"), "PanchangaYear");
const AvakahadaChakra = lazyRoute(() => import("./pages/AvakahadaChakra"), "AvakahadaChakra");
const ChandraKranti = lazyRoute(() => import("./pages/ChandraKranti"), "ChandraKranti");
const ShantiVidhi = lazyRoute(() => import("./pages/ShantiVidhi"), "ShantiVidhi");
const Converter = lazyRoute(() => import("./pages/Converter"), "Converter");
const Holidays = lazyRoute(() => import("./pages/Holidays"), "Holidays");
const Ritu = lazyRoute(() => import("./pages/Ritu"), "Ritu");
const Kundali = lazyRoute(() => import("./pages/Kundali"), "Kundali");
const KundaliDetail = lazyRoute(() => import("./pages/KundaliDetail"), "KundaliDetail");
const KundaliMilan = lazyRoute(() => import("./pages/KundaliMilan"), "KundaliMilan");
const Learn = lazyRoute(() => import("./pages/Learn"), "Learn");
const LearnArticle = lazyRoute(() => import("./pages/LearnArticle"), "LearnArticle");
const SunTimesYear = lazyRoute(() => import("./pages/SunTimesYear"), "SunTimesYear");
const AbhijitMuhurta = lazyRoute(() => import("./pages/AbhijitMuhurta"), "AbhijitMuhurta");
const PanchakPatro = lazyRoute(() => import("./pages/PanchakPatro"), "PanchakPatro");
const History = lazyRoute(() => import("./pages/History"), "History");
const Account = lazyRoute(() => import("./pages/Account"), "Account");
const VerifyEmail = lazyRoute(() => import("./pages/VerifyEmail"), "VerifyEmail");
const ResetPassword = lazyRoute(() => import("./pages/ResetPassword"), "ResetPassword");

const rootRoute = createRootRoute({
  component: () => (
    <RouteLoadingProvider>
      <RouteSeo />
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
  validateSearch: validatePanchangaYearSearch,
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
const rituRoute = createRoute({ getParentRoute: () => rootRoute, path: "/ritu", component: Ritu });
const kundaliRoute = createRoute({ getParentRoute: () => rootRoute, path: "/kundali", component: Kundali });
const kundaliDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: "/kundali/$profileId", component: KundaliDetail });
const kundaliMilanRoute = createRoute({ getParentRoute: () => rootRoute, path: "/jyotish/kundali-milan", component: KundaliMilan });
const learnRoute = createRoute({ getParentRoute: () => rootRoute, path: "/learn", component: Learn });
const learnArticleRoute = createRoute({ getParentRoute: () => rootRoute, path: "/learn/$slug", component: LearnArticle });
const suryakrantiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/suryakranti",
  component: SunTimesYear,
});
const abhijitMuhurtaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/abhijit-muhurta",
  validateSearch: validateAbhijitSearch,
  component: AbhijitMuhurta,
});
const panchakPatroRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/panchak-patro",
  validateSearch: (search: Record<string, unknown>): { year?: number } => {
    const parse = (raw: unknown) => {
      const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : undefined;
      return Number.isFinite(n) ? n : undefined;
    };
    return { year: parse(search.year) };
  },
  component: PanchakPatro,
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
  rituRoute,
  kundaliRoute,
  kundaliDetailRoute,
  kundaliMilanRoute,
  learnRoute,
  learnArticleRoute,
  suryakrantiRoute,
  abhijitMuhurtaRoute,
  panchakPatroRoute,
  sunTimesLegacyRoute,
  historyRoute,
  historyLegacyRoute,
  accountRoute,
  verifyEmailRoute,
  resetPasswordRoute,
]);

const basepath = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Recovery screen for route errors — bilingual, no i18n dependency. */
function RouteErrorFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg font-semibold text-foreground">केही गडबड भयो</p>
      <p className="text-sm text-muted-foreground">
        Something went wrong. Reloading usually fixes this.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        फेरि लोड गर्नुहोस् / Reload
      </button>
    </div>
  );
}

export function createAppRouter(history?: RouterHistory) {
  return createRouter({
    routeTree,
    defaultErrorComponent: RouteErrorFallback,
    ...(history ? { history } : {}),
    ...(basepath ? { basepath } : {}),
  });
}

export const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
