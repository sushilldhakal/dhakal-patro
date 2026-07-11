import { RouterProvider, type AnyRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n, { ensureEnglishBundle } from "./i18n/index";
import { router } from "./router.tsx";
import { AuthProvider } from "./lib/auth/AuthContext";
import { getLocalStorageItem, isBrowser } from "./lib/browser";
import { syncDocumentLang } from "./lib/fonts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Apply stored language after hydration. Default stays Nepali when nothing is saved. */
function LanguageBootstrap() {
  useEffect(() => {
    const stored = getLocalStorageItem("i18nextLng");
    if (stored === "en" || stored === "ne") {
      if (stored !== i18n.language) {
        const apply = stored === "en" ? ensureEnglishBundle().then(() => i18n.changeLanguage(stored)) : i18n.changeLanguage(stored);
        void apply;
      }
    }
    syncDocumentLang(i18n.language);

    const onLanguageChanged = (lang: string) => syncDocumentLang(lang);
    i18n.on("languageChanged", onLanguageChanged);
    return () => {
      i18n.off("languageChanged", onLanguageChanged);
    };
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
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
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
