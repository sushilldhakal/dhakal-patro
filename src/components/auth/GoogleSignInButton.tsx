import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import { socialSignInButtonClass } from "./social-sign-in-styles";
import { useIsDarkTheme } from "./useIsDarkTheme";
import { cn } from "@/lib/utils";

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

function clampButtonWidth(width: number): number {
  return Math.max(200, Math.min(400, Math.floor(width)));
}

function useTouchPreferred(): boolean {
  const [touchPreferred, setTouchPreferred] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse), (hover: none)");
    const update = () => setTouchPreferred(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return touchPreferred;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * Theme-aware label (i18n) with a transparent Google button overlay for the OAuth click.
 * On touch devices the native Google button is shown directly — invisible iframe overlays
 * are unreliable inside modals on mobile browsers.
 */
export function GoogleSignInButton({
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
  const containerRef = useRef<HTMLDivElement>(null);
  const gsiRef = useRef<HTMLDivElement>(null);
  const isDark = useIsDarkTheme();
  const touchPreferred = useTouchPreferred();
  const onCredentialRef = useRef(onCredential);
  const [buttonWidth, setButtonWidth] = useState(300);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setButtonWidth(clampButtonWidth(el.clientWidth || 300));
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!CLIENT_ID || !gsiRef.current) return;
    let cancelled = false;
    const theme = isDark ? "filled_black" : "outline";

    loadGsi(gsiLocale)
      .then(() => {
        if (cancelled || !gsiRef.current) return;
        if (
          !ensureGsiInitialized((token) => {
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
          width: buttonWidth,
          locale: gsiLocale,
        });
      })
      .catch(() => onError?.(t("auth.google_error")));

    return () => {
      cancelled = true;
    };
  }, [gsiLocale, isDark, buttonWidth, onError, t]);

  if (!CLIENT_ID) return null;

  if (touchPreferred) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "flex w-full max-w-[300px] justify-center",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <div
          ref={gsiRef}
          className="min-h-10 w-full [&>div]:!mx-auto [&_iframe]:pointer-events-auto"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-10 w-full max-w-[300px] items-center justify-center gap-2 rounded-full",
        socialSignInButtonClass,
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <GoogleIcon className="size-4 shrink-0" />
      <span className="pointer-events-none text-sm font-medium">
        {isDark === undefined ? "…" : t("auth.continue_with_google")}
      </span>
      <div
        ref={gsiRef}
        className={cn(
          "absolute inset-0 z-20 cursor-pointer opacity-0",
          "pointer-events-auto touch-manipulation",
          "[&_div]:!h-full [&_div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full [&_iframe]:pointer-events-auto",
        )}
        aria-hidden
      />
    </div>
  );
}
