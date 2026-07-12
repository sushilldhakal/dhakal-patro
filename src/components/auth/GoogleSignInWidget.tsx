import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import {
  ensureGoogleSignInInitialized,
  getGoogleClientId,
  loadGoogleSignIn,
} from "@/lib/auth/google-sign-in";
import { useIsDarkTheme } from "./useIsDarkTheme";
import { cn } from "@/lib/utils";

/**
 * Visible Google Sign-In button for plain pages (no Radix modal).
 * GSI iframes are unreliable inside modal dialogs on mobile browsers.
 */
export function GoogleSignInWidget({
  onCredential,
  onError,
  disabled = false,
}: {
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const gsiLocale = lang === "en" ? "en" : "ne";
  const gsiRef = useRef<HTMLDivElement>(null);
  const isDark = useIsDarkTheme();
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
  const clientId = getGoogleClientId();

  useEffect(() => {
    if (!clientId || !gsiRef.current) return;
    let cancelled = false;
    const theme = isDark ? "filled_black" : "outline";

    loadGoogleSignIn(gsiLocale)
      .then(() => {
        if (cancelled || !gsiRef.current) return;
        if (
          !ensureGoogleSignInInitialized((token) => {
            onCredentialRef.current(token);
          }, gsiLocale)
        ) {
          return;
        }
        gsiRef.current.innerHTML = "";
        window.google!.accounts!.id!.renderButton(gsiRef.current, {
          type: "standard",
          theme,
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          locale: gsiLocale,
        });
      })
      .catch(() => onError?.(t("auth.google_error")));

    return () => {
      cancelled = true;
    };
  }, [clientId, gsiLocale, isDark, onError, t]);

  if (!clientId) return null;

  return (
    <div
      className={cn(
        "flex min-h-11 w-full max-w-[320px] items-center justify-center",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <div
        ref={gsiRef}
        className="flex min-h-11 w-full items-center justify-center [&>div]:!mx-auto [&_iframe]:pointer-events-auto"
      />
    </div>
  );
}
