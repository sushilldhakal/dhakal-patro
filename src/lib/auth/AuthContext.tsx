import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiGoogle,
  apiLogin,
  apiLogout,
  apiMe,
  apiSignup,
  tokenStore,
  type AuthUser,
} from "./client";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

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
    void refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  // Keep tabs in sync when a session changes elsewhere.
  useEffect(() => {
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

  const logout = useCallback(async () => {
    await apiLogout();
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
      logout,
      refreshUser,
    }),
    [user, loading, login, signup, loginWithGoogle, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
