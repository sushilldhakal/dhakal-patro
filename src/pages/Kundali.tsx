import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LogIn, Plus, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  KundaliProfilePicker,
  type KundaliProfilePickerHandle,
} from "@/components/kundali/KundaliProfilePicker";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useRouteLoading } from "@/lib/route-loading";

export function Kundali() {
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const pickerRef = useRef<KundaliProfilePickerHandle>(null);

  useRouteLoading(authLoading);

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16">
      <div className="mb-4 mt-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.12em] mb-1.5">
            {t("kundali.eyebrow")}
          </div>
          <h1 className="text-xl font-bold leading-tight tracking-tight m-0 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-secondary shrink-0" />
            {t("kundali.title")}
          </h1>
          <p className="text-sm mt-1">
            {isAuthenticated ? t("kundali.subtitle_auth") : t("kundali.login_required")}
          </p>
        </div>
        {isAuthenticated && (
          <Button className="shrink-0" onClick={() => pickerRef.current?.openAdd()}>
            <Plus className="size-4" /> {t("kundali.add_profile")}
          </Button>
        )}
      </div>

      {authLoading ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center text-sm">
          {t("common.loading")}
        </div>
      ) : !isAuthenticated ? (
        <section className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_8%,transparent)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15">
            <Sparkles className="h-7 w-7 text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {t("kundali.login_prompt_title")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm">
            {t("kundali.login_prompt_body")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => openAuth("login")}>
              <LogIn className="size-4" /> {t("kundali.login")}
            </Button>
            <Button size="lg" variant="outline" onClick={() => openAuth("signup")}>
              <UserPlus className="size-4" /> {t("kundali.signup")}
            </Button>
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            {t("kundali.profile_hint")}
          </p>
          <KundaliProfilePicker
            ref={pickerRef}
            selectedId={null}
            onSelect={(p) =>
              navigate({ to: "/kundali/$profileId", params: { profileId: p.id } })
            }
          />
        </div>
      )}

      <AuthDialog
        key={authMode}
        open={authOpen}
        onOpenChange={setAuthOpen}
        initialMode={authMode}
      />
    </div>
  );
}
