import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import { useIsDarkTheme } from "./useIsDarkTheme";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Whether Google sign-in is configured (client ID present). */
export const googleSignInEnabled = Boolean(CLIENT_ID);

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (r: { credential?: string }) => void;
    locale?: string;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

const gsiPromises = new Map<string, Promise<void>>();
let gsiInitializedKey: string | null = null;

function loadGsi(locale: string): Promise<void> {
  const cached = gsiPromises.get(locale);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement("script");
    script.src = `https://accounts.google.com/gsi/client?hl=${locale}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(script);
  });
  gsiPromises.set(locale, promise);
  return promise;
}

function ensureGsiInitialized(onCredential: (idToken: string) => void, locale: string) {
  const id = window.google?.accounts?.id;
  if (!id || !CLIENT_ID) return false;

  const key = `${CLIENT_ID}:${locale}`;
  if (gsiInitializedKey !== key) {
    id.initialize({
      client_id: CLIENT_ID,
      locale,
      callback: (res) => {
        if (res.credential) onCredential(res.credential);
      },
    });
    gsiInitializedKey = key;
  }
  return true;
}

/** GSI button width must be an integer ≤ 400; clamp to the available container width. */
function gsiButtonWidth(containerWidth: number): number {
  return Math.min(400, Math.max(200, Math.floor(containerWidth) || 300));
}

/**
 * Renders the real Google Identity Services button (theme- and locale-aware).
 *
 * The button is fully visible on purpose: GSI's anti-clickjacking checks silently
 * ignore taps on a button that is transparent or covered, which broke the previous
 * invisible-overlay approach on mobile browsers.
 */
export function GoogleSignInButton({
  onCredential,
  onError,
}: {
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
}) {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const gsiLocale = lang === "en" ? "en" : "ne";
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const isDark = useIsDarkTheme();
  const [ready, setReady] = useState(false);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID || !buttonRef.current || isDark === undefined) return;
    let cancelled = false;

    loadGsi(gsiLocale)
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        if (
          !ensureGsiInitialized((token) => {
            onCredentialRef.current(token);
          }, gsiLocale)
        ) {
          return;
        }
        const width = gsiButtonWidth(containerRef.current?.clientWidth ?? 300);
        buttonRef.current.innerHTML = "";
        window.google!.accounts!.id!.renderButton(buttonRef.current, {
          type: "standard",
          theme: isDark ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width,
          locale: gsiLocale,
        });
        if (!cancelled) setReady(true);
      })
      .catch(() => onError?.(t("auth.google_error")));

    return () => {
      cancelled = true;
    };
  }, [gsiLocale, isDark, onError, t]);

  if (!CLIENT_ID) return null;

  return (
    <div
      ref={containerRef}
      className="flex h-10 w-[300px] max-w-full items-center justify-center"
    >
      {!ready && (
        <span className="text-sm font-medium text-muted-foreground">
          {t("auth.continue_with_google")}
        </span>
      )}
      <div ref={buttonRef} className={ready ? "flex justify-center" : "hidden"} />
    </div>
  );
}
