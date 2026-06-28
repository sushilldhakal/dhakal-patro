import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiForgotPassword, ApiError } from "@/lib/auth/client";
import { GoogleSignInButton, googleSignInEnabled } from "./GoogleSignInButton";

type Mode = "login" | "signup" | "forgot";

const labelClass = "text-sm font-medium text-foreground";
const fieldWrap = "flex flex-col gap-1.5";

export function AuthDialog({
  open,
  onOpenChange,
  initialMode = "login",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: Mode;
}) {
  const { login, signup, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function reset(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword("");
    setConfirm("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if ((mode === "signup" || mode === "login") && password.length < 8 && mode === "signup") {
      setError("Password must be at least 8 characters");
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        onOpenChange(false);
      } else if (mode === "signup") {
        await signup(email.trim(), password);
        setNotice("Account created! Check your email to verify your address.");
        // Close shortly after so the notice is seen.
        setTimeout(() => onOpenChange(false), 1200);
      } else {
        const msg = await apiForgotPassword(email.trim());
        setNotice(msg);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle(idToken: string) {
    setError(null);
    setBusy(true);
    try {
      await loginWithGoogle(idToken);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password";
  const desc =
    mode === "login"
      ? "Welcome back to Vedic Patro."
      : mode === "signup"
        ? "Save your kundali profiles across devices."
        : "We'll email you a link to set a new password.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        {mode !== "forgot" && googleSignInEnabled && (
          <div className="flex flex-col gap-3">
            <GoogleSignInButton onCredential={onGoogle} onError={setError} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className={fieldWrap}>
            <label className={labelClass} htmlFor="auth-email">
              Email
            </label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          {mode !== "forgot" && (
            <div className={fieldWrap}>
              <label className={labelClass} htmlFor="auth-password">
                Password
              </label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
              />
            </div>
          )}

          {mode === "signup" && (
            <div className={fieldWrap}>
              <label className={labelClass} htmlFor="auth-confirm">
                Confirm password
              </label>
              <Input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>}

          <Button type="submit" size="lg" disabled={busy} className="mt-1">
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </Button>
        </form>

        <div className="flex flex-col gap-1 text-center text-sm text-muted-foreground">
          {mode === "login" && (
            <>
              <button type="button" className="hover:text-foreground" onClick={() => reset("forgot")}>
                Forgot your password?
              </button>
              <span>
                New here?{" "}
                <button
                  type="button"
                  className="font-medium text-secondary hover:underline"
                  onClick={() => reset("signup")}
                >
                  Create an account
                </button>
              </span>
            </>
          )}
          {mode === "signup" && (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-secondary hover:underline"
                onClick={() => reset("login")}
              >
                Sign in
              </button>
            </span>
          )}
          {mode === "forgot" && (
            <button type="button" className="hover:text-foreground" onClick={() => reset("login")}>
              Back to sign in
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
