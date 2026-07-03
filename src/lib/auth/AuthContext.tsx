import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  apiFacebook,
  apiGoogle,
  apiLogin,
  apiLogout,
  apiMe,
  apiSignup,
  tokenStore,
  type AuthUser,
} from "./client";
import { isBrowser } from "@/lib/browser";
import {
  clearFacebookAutoLoginSkip,
  facebookAccessToken,
  facebookLogout,
  facebookSignInEnabled,
  getFacebookLoginStatus,
  shouldSkipFacebookAutoLogin,
  skipFacebookAutoLogin,
} from "./facebook-sdk";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, ssr = false }: { children: ReactNode; ssr?: boolean }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!ssr && isBrowser);

  const refreshUser = useCallback(async () => {
    if (!tokenStore.access && !tokenStore.refresh) {
      setUser(null);
      return;
    }
    try {
      setUser(await apiMe());
    } catch {
      setUser(null);
    }
  }, []);

  // Bootstrap from any stored session on first mount.
  useEffect(() => {
    if (ssr) return;
    void refreshUser().finally(() => setLoading(false));
  }, [refreshUser, ssr]);

  // Keep tabs in sync when a session changes elsewhere.
  useEffect(() => {
    if (ssr) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === "dhakalPatroAccessToken" || e.key === "dhakalPatroRefreshToken") {
        void refreshUser();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    tokenStore.set(await apiLogin(email, password));
    setUser(await apiMe());
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    tokenStore.set(await apiSignup(email, password));
    setUser(await apiMe());
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    tokenStore.set(await apiGoogle(idToken));
    setUser(await apiMe());
  }, []);

  const loginWithFacebook = useCallback(async (accessToken: string) => {
    clearFacebookAutoLoginSkip();
    tokenStore.set(await apiFacebook(accessToken));
    setUser(await apiMe());
  }, []);

  const facebookBootstrapDone = useRef(false);

  // Facebook silent sign-in — only once on first page load, not after logout.
  useEffect(() => {
    if (ssr || !isBrowser || !facebookSignInEnabled || loading) return;
    if (facebookBootstrapDone.current) return;
    facebookBootstrapDone.current = true;

    if (user || shouldSkipFacebookAutoLogin()) return;
    if (tokenStore.access || tokenStore.refresh) return;

    let cancelled = false;
    getFacebookLoginStatus()
      .then((response) => {
        if (cancelled || user) return;
        const token = facebookAccessToken(response);
        if (token) {
          return loginWithFacebook(token);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [ssr, loading, user, loginWithFacebook]);

  const logout = useCallback(async () => {
    skipFacebookAutoLogin();
    await Promise.all([apiLogout(), facebookLogout()]);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      login,
      signup,
      loginWithGoogle,
      loginWithFacebook,
      logout,
      refreshUser,
    }),
    [user, loading, login, signup, loginWithGoogle, loginWithFacebook, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
