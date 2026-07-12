const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Whether Google sign-in is configured (client ID present). */
export const googleSignInEnabled = Boolean(CLIENT_ID);

export function getGoogleClientId(): string | undefined {
  return CLIENT_ID || undefined;
}

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

export function loadGoogleSignIn(locale: string): Promise<void> {
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

export function ensureGoogleSignInInitialized(
  onCredential: (idToken: string) => void,
  locale: string,
): boolean {
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

/** Restrict return URLs to same-origin in-app paths. */
export function safeReturnTo(path: string | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (path.startsWith("/auth/google")) return "/";
  return path;
}
