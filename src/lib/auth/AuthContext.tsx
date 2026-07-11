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
  facebookLogout,
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
  /** Bumped on logout so late apiMe() responses cannot restore a stale session. */
  const authEpoch = useRef(0);

  const refreshUser = useCallback(async () => {
    const epoch = authEpoch.current;
    if (!tokenStore.access && !tokenStore.refresh) {
      setUser(null);
      return;
    }
    try {
      const me = await apiMe();
      if (epoch !== authEpoch.current) return;
      setUser(me);
    } catch {
      if (epoch !== authEpoch.current) return;
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
    authEpoch.current += 1;
    const epoch = authEpoch.current;
    tokenStore.set(await apiLogin(email, password));
    const me = await apiMe();
    if (epoch !== authEpoch.current) return;
    setUser(me);
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    authEpoch.current += 1;
    const epoch = authEpoch.current;
    tokenStore.set(await apiSignup(email, password));
    const me = await apiMe();
    if (epoch !== authEpoch.current) return;
    setUser(me);
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    authEpoch.current += 1;
    const epoch = authEpoch.current;
    tokenStore.set(await apiGoogle(idToken));
    const me = await apiMe();
    if (epoch !== authEpoch.current) return;
    setUser(me);
  }, []);

  const loginWithFacebook = useCallback(async (accessToken: string) => {
    authEpoch.current += 1;
    const epoch = authEpoch.current;
    clearFacebookAutoLoginSkip();
    tokenStore.set(await apiFacebook(accessToken));
    const me = await apiMe();
    if (epoch !== authEpoch.current) return;
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    authEpoch.current += 1;
    skipFacebookAutoLogin();
    setUser(null);
    await Promise.all([apiLogout(), facebookLogout()]);
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
