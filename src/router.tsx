import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  useRouterState,
  type RouterHistory,
} from "@tanstack/react-router";
import { Header } from "./components/Header";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { AnalyticsTracker } from "./components/AnalyticsTracker";
import { RouteSeo } from "./components/seo/RouteSeo";
import { PanchangaShellLayout } from "./components/panchanga/PanchangaShellLayout";
import { PanchangaLocationProvider } from "./components/panchanga/use-panchanga-location";
import { Home } from "./pages/Home";
import { lazyRoute } from "./lib/lazy-route";
import { RouteLoadingProvider } from "./lib/route-loading";
import {
  validateAbhijitSearch,
  validateDainikKrantiSearch,
  validateElementPageSearch,
  validateGrahaDaySearch,
  validateLocationSearch,
  validatePanchangaSearch,
  validatePanchangaYearSearch,
  validatePatroMonthBrowseSearch,
  validatePatroYearBrowseSearch,
  validateHolidaysSearch,
} from "./lib/url-state";

const Panchanga = lazyRoute(() => import("./pages/Panchanga"), "Panchanga");
const PanchangaOgPreview = lazyRoute(() => import("./pages/PanchangaOgPreview"), "PanchangaOgPreview");
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
const Gochar = lazyRoute(() => import("./pages/Gochar"), "Gochar");
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
  component: function RootLayout() {
    // The /panchanga/og-preview route is a headless screenshot target — render
    // it bare (no header / bottom nav) so the captured element is the chart alone.
    const bare = useRouterState({
      select: (s) => s.location.pathname.replace(/\/$/, "") === "/panchanga/og-preview",
    });
    if (bare) {
      return (
        <PanchangaLocationProvider>
          <RouteLoadingProvider>
            <Outlet />
          </RouteLoadingProvider>
        </PanchangaLocationProvider>
      );
    }
    return (
      <PanchangaLocationProvider>
        <RouteLoadingProvider>
          <RouteSeo />
          <AnalyticsTracker />
          <div className="min-h-screen">
            <Header />
            {/* Bottom padding on small screens so page content clears the floating
                MobileBottomNav; removed at lg where the bar is hidden. */}
            <div className="pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
              <Outlet />
            </div>
            <MobileBottomNav />
          </div>
        </RouteLoadingProvider>
      </PanchangaLocationProvider>
    );
  },
});

/** Pathless layout — keeps the panchanga sidebar mounted across client navigations. */
const panchangaShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "panchanga-shell",
  component: PanchangaShellLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: validatePatroMonthBrowseSearch,
  component: Home,
});
const panchangaOgPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/panchanga/og-preview",
  validateSearch: validatePanchangaSearch,
  component: PanchangaOgPreview,
});
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
const holidaysRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/holidays",
  validateSearch: validateHolidaysSearch,
  component: Holidays,
});
const rituRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/ritu",
  validateSearch: validateLocationSearch,
  component: Ritu,
});
const kundaliRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/kundali", component: Kundali });
const kundaliDetailRoute = createRoute({ getParentRoute: () => panchangaShellRoute, path: "/kundali/$profileId", component: KundaliDetail });
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
const elementRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/panchanga/element/$name",
  validateSearch: validateElementPageSearch,
  component: ElementPage,
});
const gocharRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/gochar",
  validateSearch: validateGrahaDaySearch,
  component: Gochar,
});
const grahaSthitiRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/panchanga/graha-sthiti",
  validateSearch: validateGrahaDaySearch,
  component: GrahaSthiti,
});
const grahaAstaRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/panchanga/graha-asta",
  validateSearch: validatePatroYearBrowseSearch,
  component: GrahaAsta,
});
const grahaVakriRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/panchanga/graha-vakri",
  validateSearch: validatePatroYearBrowseSearch,
  component: GrahaVakri,
});
const suryaGrahanRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/panchanga/surya-grahan",
  validateSearch: validatePatroYearBrowseSearch,
  component: SuryaGrahan,
});
const chandraGrahanRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/panchanga/chandra-grahan",
  validateSearch: validatePatroYearBrowseSearch,
  component: ChandraGrahan,
});
const saitRoute = createRoute({
  getParentRoute: () => panchangaShellRoute,
  path: "/sait/$category",
  validateSearch: validatePatroYearBrowseSearch,
  component: SaitPage,
});
const marriageSaitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vivah-sait",
  validateSearch: validatePatroYearBrowseSearch,
  component: MarriageSait,
});
const accountRoute = createRoute({ getParentRoute: () => rootRoute, path: "/account", component: Account });
const verifyEmailRoute = createRoute({ getParentRoute: () => rootRoute, path: "/verify-email", component: VerifyEmail });
const resetPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: "/reset-password", component: ResetPassword });

/** Children of panchangaShellRoute — the persistent sidebar shell. Also the source of
 *  truth for PANCHANGA_SHELL_PATHS below; don't list these routes anywhere else. */
const panchangaShellChildRoutes = [
  panchangaYearRoute,
  avakahadaRoute,
  dainikKrantiRoute,
  converterRoute,
  holidaysRoute,
  rituRoute,
  kundaliRoute,
  kundaliDetailRoute,
  kundaliMilanRoute,
  suryakrantiRoute,
  abhijitMuhurtaRoute,
  panchakPatroRoute,
  panchangaDetailsRoute,
  elementRoute,
  gocharRoute,
  grahaSthitiRoute,
  grahaAstaRoute,
  grahaVakriRoute,
  suryaGrahanRoute,
  chandraGrahanRoute,
  saitRoute,
];

const routeTree = rootRoute.addChildren([
  indexRoute,
  panchangaShellRoute.addChildren(panchangaShellChildRoutes),
  panchangaOgPreviewRoute,
  panchangaRoute,
  chandraKrantiLegacyRoute,
  dainikKrantiNeLegacyRoute,
  shantiVidhiRoute,
  learnRoute,
  historyRoute,
  learnArticleRoute,
  sunTimesLegacyRoute,
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

/** Absolute path templates (e.g. "/kundali/$profileId") for pages that render inside
 *  the panchanga sidebar shell — derived from panchangaShellChildRoutes so it can't drift. */
export const PANCHANGA_SHELL_PATHS: string[] = panchangaShellChildRoutes.map((r) => r.fullPath);

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
