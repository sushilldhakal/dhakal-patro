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
import { PanchangaShellLayout } from "./components/panchanga/PanchangaShellLayout";
import { Home } from "./pages/Home";
import { lazyRoute } from "./lib/lazy-route";
import { RouteLoadingProvider } from "./lib/route-loading";
import {
  validateAbhijitSearch,
  validateDainikKrantiSearch,
  validatePanchangaSearch,
  validatePanchangaYearSearch,
} from "./lib/url-state";

const Panchanga = lazyRoute(() => import("./pages/Panchanga"), "Panchanga");
const PanchangaYear = lazyRoute(() => import("./pages/PanchangaYear"), "PanchangaYear");
const AvakahadaChakra = lazyRoute(() => import("./pages/AvakahadaChakra"), "AvakahadaChakra");
const DainikKranti = lazyRoute(() => import("./pages/DainikKranti"), "DainikKranti");
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
const PanchangaDetailsHub = lazyRoute(() => import("./pages/PanchangaDetailsHub"), "PanchangaDetailsHub");
const ElementPage = lazyRoute(() => import("./pages/ElementPage"), "ElementPage");
const GrahaSthiti = lazyRoute(() => import("./pages/GrahaSthiti"), "GrahaSthiti");
const GrahaAsta = lazyRoute(() => import("./pages/GrahaAsta"), "GrahaAsta");
const GrahaVakri = lazyRoute(() => import("./pages/GrahaVakri"), "GrahaVakri");
const SuryaGrahan = lazyRoute(() => import("./pages/EclipsePage"), "SuryaGrahan");
const ChandraGrahan = lazyRoute(() => import("./pages/EclipsePage"), "ChandraGrahan");
const SaitPage = lazyRoute(() => import("./pages/SaitPage"), "SaitPage");
const MarriageSait = lazyRoute(() => import("./pages/MarriageSait"), "MarriageSait");
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

/** Pathless layout — keeps the panchanga sidebar mounted across client navigations. */
const panchangaShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "panchanga-shell",
  component: PanchangaShellLayout,
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home });
const panchangaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/panchanga",
  validateSearch: validatePanchangaSearch,
  component: Panchanga,
});
const panchangaYearRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/panchanga/year",
  validateSearch: validatePanchangaYearSearch,
  component: PanchangaYear,
});
const avakahadaRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/panchanga/avakahada-chakra", component: AvakahadaChakra });
const dainikKrantiRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/dainikkranti",
  validateSearch: validateDainikKrantiSearch,
  component: DainikKranti,
});
const chandraKrantiLegacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chandrakranti",
  validateSearch: validateDainikKrantiSearch,
  component: function ChandraKrantiLegacyRedirect() {
    const search = chandraKrantiLegacyRoute.useSearch();
    return <Navigate to="/dainikkranti" search={search} replace />;
  },
});
const dainikKrantiNeLegacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/दैनिकक्रान्ति",
  validateSearch: validateDainikKrantiSearch,
  component: function DainikKrantiNeLegacyRedirect() {
    const search = dainikKrantiNeLegacyRoute.useSearch();
    return <Navigate to="/dainikkranti" search={search} replace />;
  },
});
const shantiVidhiRoute = createRoute({ getParentRoute: () => rootRoute, path: "/shanti-vidhi", component: ShantiVidhi });
const converterRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/converter", component: Converter });
const holidaysRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/holidays", component: Holidays });
const rituRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/ritu", component: Ritu });
const kundaliRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/kundali", component: Kundali });
const kundaliDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: "/kundali/$profileId", component: KundaliDetail });
const kundaliMilanRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/jyotish/kundali-milan", component: KundaliMilan });
const learnRoute = createRoute({ getParentRoute: () => rootRoute, path: "/learn", component: Learn });
const learnArticleRoute = createRoute({ getParentRoute: () => rootRoute, path: "/learn/$slug", component: LearnArticle });
const suryakrantiRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/suryakranti",
  // Shareable: ?year=<bs> plus location (city / lat+lon+tz+place).
  validateSearch: validatePanchangaYearSearch,
  component: SunTimesYear,
});
const abhijitMuhurtaRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/abhijit-muhurta",
  validateSearch: validateAbhijitSearch,
  component: AbhijitMuhurta,
});
const panchakPatroRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/panchak-patro",
  validateSearch: validatePanchangaYearSearch,
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
const panchangaDetailsRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/panchanga/details", component: PanchangaDetailsHub });
const elementRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/panchanga/element/$name", component: ElementPage });
const grahaSthitiRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/panchanga/graha-sthiti", component: GrahaSthiti });
const grahaAstaRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/panchanga/graha-asta", component: GrahaAsta });
const grahaVakriRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/panchanga/graha-vakri", component: GrahaVakri });
const suryaGrahanRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/panchanga/surya-grahan", component: SuryaGrahan });
const chandraGrahanRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/panchanga/chandra-grahan", component: ChandraGrahan });
const saitRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/sait/$category", component: SaitPage });
const marriageSaitRoute = createRoute({ getParentRoute: () => rootRoute, path: "/vivah-sait", component: MarriageSait });
const accountRoute = createRoute({ getParentRoute: () => rootRoute, path: "/account", component: Account });
const verifyEmailRoute = createRoute({ getParentRoute: () => rootRoute, path: "/verify-email", component: VerifyEmail });
const resetPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: "/reset-password", component: ResetPassword });

const routeTree = rootRoute.addChildren([
  indexRoute,
  panchangaShellRoute.addChildren([
    panchangaYearRoute,
    avakahadaRoute,
    dainikKrantiRoute,
    converterRoute,
    holidaysRoute,
    rituRoute,
    kundaliRoute,
    kundaliMilanRoute,
    suryakrantiRoute,
    abhijitMuhurtaRoute,
    panchakPatroRoute,
    panchangaDetailsRoute,
    elementRoute,
    grahaSthitiRoute,
    grahaAstaRoute,
    grahaVakriRoute,
    suryaGrahanRoute,
    chandraGrahanRoute,
    saitRoute,
  ]),
  panchangaRoute,
  chandraKrantiLegacyRoute,
  dainikKrantiNeLegacyRoute,
  shantiVidhiRoute,
  kundaliDetailRoute,
  learnRoute,
  learnArticleRoute,
  sunTimesLegacyRoute,
  historyRoute,
  historyLegacyRoute,
  marriageSaitRoute,
  accountRoute,
  verifyEmailRoute,
  resetPasswordRoute,
]);

const basepath = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Recovery screen for route errors — bilingual. */
function RouteErrorFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg font-semibold text-foreground">केही गडबड भयो</p>
      <p className="text-sm">केही गडबड भयो। पुनः लोड गर्दा प्रायः ठीक हुन्छ।</p>
      <p className="text-sm text-muted-foreground">Something went wrong. Reloading usually fixes this.</p>
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
