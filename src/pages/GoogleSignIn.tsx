import { useCallback, useEffect, useState } from "react";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { GoogleSignInWidget } from "@/components/auth/GoogleSignInWidget";
import { ApiError } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { safeReturnTo } from "@/lib/auth/google-sign-in";
import { useRouteLoading } from "@/lib/route-loading";

const routeApi = getRouteApi("/auth/google");

export function GoogleSignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { returnTo } = routeApi.useSearch();
  const destination = safeReturnTo(returnTo);
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: destination, replace: true });
    }
  }, [destination, isAuthenticated, navigate]);

  const onCredential = useCallback(
    async (idToken: string) => {
      setError(null);
      setBusy(true);
      try {
        await loginWithGoogle(idToken);
        navigate({ to: destination, replace: true });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("auth.google_error"));
      } finally {
        setBusy(false);
      }
    },
    [destination, loginWithGoogle, navigate, t],
  );

  useRouteLoading(busy);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="text-xl font-bold text-foreground">{t("auth.sign_in")}</h1>
      <p className="text-sm text-muted-foreground">{t("auth.sign_in_desc")}</p>
      <GoogleSignInWidget onCredential={onCredential} onError={setError} disabled={busy} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button variant="ghost" asChild className="mt-2">
        <Link to={destination}>{t("auth.back_to_sign_in")}</Link>
      </Button>
    </div>
  );
}
