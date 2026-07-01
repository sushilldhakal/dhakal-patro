import { RouterProvider, type AnyRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n from "./i18n/index";
import { router } from "./router.tsx";
import { AuthProvider } from "./lib/auth/AuthContext";
import { getLocalStorageItem, isBrowser } from "./lib/browser";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Apply stored / browser language after hydration to avoid SSR mismatch. */
function LanguageBootstrap() {
  useEffect(() => {
    const stored = getLocalStorageItem("i18nextLng");
    // An explicit stored choice always wins — never let the browser locale
    // override a preference the user picked, even when it equals the default.
    if (stored === "en" || stored === "ne") {
      if (stored !== i18n.language) void i18n.changeLanguage(stored);
      return;
    }
    const nav = navigator.language.split("-")[0];
    if ((nav === "en" || nav === "ne") && nav !== i18n.language) {
      void i18n.changeLanguage(nav);
    }
  }, []);
  return null;
}

function AppRoutes({ appRouter }: { appRouter: AnyRouter }) {
  useTranslation();
  return <RouterProvider router={appRouter} />;
}

export function AppProviders({
  children,
  ssr = false,
}: {
  children: ReactNode;
  ssr?: boolean;
}) {
  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <AuthProvider ssr={ssr}>
            {!ssr && isBrowser ? <LanguageBootstrap /> : null}
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default function App({
  appRouter = router,
  ssr = false,
}: {
  appRouter?: AnyRouter;
  ssr?: boolean;
}) {
  return (
    <AppProviders ssr={ssr}>
      <AppRoutes appRouter={appRouter} />
    </AppProviders>
  );
}
