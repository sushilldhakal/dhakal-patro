import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouteLoading } from "@/lib/route-loading";
import { apiVerifyEmail, ApiError } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/AuthContext";

export function VerifyEmail() {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    apiVerifyEmail(token)
      .then(async () => {
        setStatus("ok");
        await refreshUser();
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Verification failed.");
      });
  }, [refreshUser]);

  useRouteLoading(status === "loading");

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {status === "loading" && null}
      {status === "ok" && (
        <>
          <CheckCircle2 className="size-12 text-emerald-500" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Email verified</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account is now fully active.
          </p>
          <Button asChild className="mt-6">
            <Link to="/account">Go to my account</Link>
          </Button>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="size-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Verification failed</h1>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/account">Back to account</Link>
          </Button>
        </>
      )}
    </div>
  );
}
