import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { lazyRoute } from "./lib/lazy-route";

const Calendar = lazyRoute(() => import("./pages/Calendar"), "Calendar");
const Panchanga = lazyRoute(() => import("./pages/Panchanga"), "Panchanga");
const Converter = lazyRoute(() => import("./pages/Converter"), "Converter");
const Holidays = lazyRoute(() => import("./pages/Holidays"), "Holidays");
const Kundali = lazyRoute(() => import("./pages/Kundali"), "Kundali");

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      <Header />
      <Outlet />
    </div>
  ),
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home });
const calendarRoute = createRoute({ getParentRoute: () => rootRoute, path: "/calendar", component: Calendar });
const panchangaRoute = createRoute({ getParentRoute: () => rootRoute, path: "/panchanga", component: Panchanga });
const converterRoute = createRoute({ getParentRoute: () => rootRoute, path: "/converter", component: Converter });
const holidaysRoute = createRoute({ getParentRoute: () => rootRoute, path: "/holidays", component: Holidays });
const kundaliRoute = createRoute({ getParentRoute: () => rootRoute, path: "/kundali", component: Kundali });

const routeTree = rootRoute.addChildren([
  indexRoute,
  calendarRoute,
  panchangaRoute,
  converterRoute,
  holidaysRoute,
  kundaliRoute,
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
