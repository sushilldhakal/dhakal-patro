import { RouterProvider, type AnyRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n, { ensureEnglishBundle } from "./i18n/index";
import { router } from "./router.tsx";
import { AuthProvider } from "./lib/auth/AuthContext";
import { isBrowser } from "./lib/browser";
import { syncDocumentLang } from "./lib/fonts";
import {
  getStoredLanguage,
  setStoredLanguage,
  THEME_STORAGE_KEY,
  type StoredLang,
} from "./lib/user-preferences";
import { normalizeLang } from "./i18n/locale";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Restore language from localStorage after hydration.
 * First visit → Nepali. After the user switches, keep that choice until they change it again.
 */
function LanguageBootstrap() {
  useEffect(() => {
    const stored = getStoredLanguage();
    const applyStored = async () => {
      if (!stored) return;
      if (stored === "en") await ensureEnglishBundle();
      if (normalizeLang(i18n.language) !== stored) {
        await i18n.changeLanguage(stored);
      }
    };
    void applyStored();
    syncDocumentLang(stored ?? i18n.language);

    const onLanguageChanged = (lang: string) => {
      const next = normalizeLang(lang) as StoredLang;
      setStoredLanguage(next);
      syncDocumentLang(next);
    };
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
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        storageKey={THEME_STORAGE_KEY}
        disableTransitionOnChange
      >
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
