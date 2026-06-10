import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { Calendar } from "./pages/Calendar";
import { Panchanga } from "./pages/Panchanga";
import { Converter } from "./pages/Converter";
import { Holidays } from "./pages/Holidays";
import { Kundali } from "./pages/Kundali";

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
