import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  facebookAccessToken,
  facebookSignInEnabled,
  getFacebookLoginStatus,
  loadFacebookSdk,
  parseFacebookLoginButton,
  setFacebookLoginStatusHandler,
  shouldSkipFacebookAutoLogin,
} from "@/lib/auth/facebook-sdk";
import { cn } from "@/lib/utils";

export { facebookSignInEnabled };

const LOGIN_BUTTON_MARKUP = `
  <div
    class="fb-login-button"
    data-scope="public_profile,email"
    data-onlogin="checkLoginState();"
    data-size="large"
    data-button-type="continue_with"
    data-layout="rounded"
    data-width="300"
  ></div>
`;

/**
 * Official Facebook Login Button (XFBML). On page load calls FB.getLoginStatus;
 * after the user clicks the button, onlogin runs checkLoginState() → getLoginStatus
 * again and hands the access token to the app when status is connected.
 */
export function FacebookSignInButton({
  onAccessToken,
  onError,
  disabled,
  checkStatus = true,
}: {
  onAccessToken: (accessToken: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  /** Run FB.getLoginStatus when mounted (default true). */
  checkStatus?: boolean;
}) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [checking, setChecking] = useState(checkStatus);
  const [showButton, setShowButton] = useState(!checkStatus);
  const onAccessTokenRef = useRef(onAccessToken);
  const onErrorRef = useRef(onError);
  onAccessTokenRef.current = onAccessToken;
  onErrorRef.current = onError;

  // statusChangeCallback — wired to checkLoginState() from the Login Button.
  useEffect(() => {
    if (!facebookSignInEnabled) return;

    setFacebookLoginStatusHandler((response) => {
      const token = facebookAccessToken(response);
      if (token) {
        onAccessTokenRef.current(token);
        return;
      }
      if (response.status === "not_authorized") {
        onErrorRef.current?.(t("auth.facebook_not_authorized"));
      }
    });

    return () => setFacebookLoginStatusHandler(null);
  }, [t]);

  // Initial FB.getLoginStatus on mount — skip silent sign-in right after logout.
  useEffect(() => {
    if (!facebookSignInEnabled || !checkStatus) {
      setChecking(false);
      setShowButton(true);
      return;
    }

    if (shouldSkipFacebookAutoLogin()) {
      setChecking(false);
      setShowButton(true);
      return;
    }

    let cancelled = false;
    getFacebookLoginStatus()
      .then((response) => {
        if (cancelled) return;
        const token = facebookAccessToken(response);
        if (token) {
          onAccessTokenRef.current(token);
        } else {
          setShowButton(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          onErrorRef.current?.(t("auth.facebook_load_error"));
          setShowButton(true);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [checkStatus, t]);

  // Parse the official Login Button once we're ready to show it.
  useEffect(() => {
    if (!facebookSignInEnabled || !showButton || checking || disabled) return;
    const node = containerRef.current;
    if (!node) return;

    node.innerHTML = LOGIN_BUTTON_MARKUP.trim();
    loadFacebookSdk()
      .then(() => parseFacebookLoginButton(node))
      .catch(() => onErrorRef.current?.(t("auth.facebook_load_error")));
  }, [showButton, checking, disabled, t]);

  if (!facebookSignInEnabled) return null;

  return (
    <div
      className={cn(
        "flex min-h-10 w-[300px] max-w-full items-center justify-center",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {checking ? (
        <span className="text-sm text-muted-foreground">{t("auth.facebook_checking")}</span>
      ) : showButton ? (
        <div ref={containerRef} className="flex justify-center" />
      ) : null}
    </div>
  );
}
