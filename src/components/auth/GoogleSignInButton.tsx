import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Whether Google sign-in is configured (client ID present). */
export const googleSignInEnabled = Boolean(CLIENT_ID);

interface GoogleAccountsId {
  initialize: (config: { client_id: string; callback: (r: { credential?: string }) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

let gsiPromise: Promise<void> | null = null;
let gsiInitializedFor: string | null = null;

/** Load the Google Identity Services script once, shared across mounts. */
function loadGsi(): Promise<void> {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(script);
  });
  return gsiPromise;
}

function ensureGsiInitialized(onCredential: (idToken: string) => void) {
  const id = window.google?.accounts?.id;
  if (!id || !CLIENT_ID) return false;

  if (gsiInitializedFor !== CLIENT_ID) {
    id.initialize({
      client_id: CLIENT_ID,
      callback: (res) => {
        if (res.credential) onCredential(res.credential);
      },
    });
    gsiInitializedFor = CLIENT_ID;
  }
  return true;
}

/**
 * Renders Google's official "Continue with Google" button. On success it hands
 * back the Google ID token (a JWT) for the backend to verify.
 *
 * Renders nothing if VITE_GOOGLE_CLIENT_ID isn't configured.
 */
export function GoogleSignInButton({
  onCredential,
  onError,
}: {
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return;
    let cancelled = false;

    loadGsi()
      .then(() => {
        if (cancelled || !ref.current) return;
        if (
          !ensureGsiInitialized((token) => {
            onCredentialRef.current(token);
          })
        ) {
          return;
        }
        ref.current.innerHTML = "";
        window.google!.accounts!.id!.renderButton(ref.current, {
          type: "standard",
          theme: resolvedTheme === "dark" ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 300,
        });
      })
      .catch(() => onError?.("Could not load Google sign-in"));

    return () => {
      cancelled = true;
    };
  }, [onError, resolvedTheme]);

  if (!CLIENT_ID) return null;
  return <div ref={ref} className="flex justify-center" />;
}
