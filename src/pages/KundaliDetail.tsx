import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, Clock, Globe, MapPin, Sparkles, User } from "lucide-react";
import { listProfiles, type Profile } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  AYANAMSHA_MODES,
  type AyanamshaMode,
} from "@/lib/ayanamsha";
import { AyanamshaSelector } from "@/components/kundali/AyanamshaSelector";
import { KundaliView } from "@/components/kundali/KundaliView";
import {
  parseBirthDate,
  profileClock,
  profileLocation,
} from "@/lib/kundali/profile-chart";
import { useRouteLoading } from "@/lib/route-loading";

const AYANAMSHA_KEY = "dhakalPatroAyanamshaMode";

function loadSavedAyanamshaMode(): AyanamshaMode {
  const saved = localStorage.getItem(AYANAMSHA_KEY);
  return AYANAMSHA_MODES.some((m) => m.id === saved) ? (saved as AyanamshaMode) : "nepal";
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <Icon className="mt-0.5 size-3.5 shrink-0 opacity-70" />
      <span className="shrink-0 font-medium text-foreground/70">{label}:</span>
      <span className="min-w-0 break-words text-foreground">{children}</span>
    </div>
  );
}

export function KundaliDetail() {
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profileId } = useParams({ strict: false }) as { profileId?: string };

  const [ayanamshaMode, setAyanamshaModeState] = useState<AyanamshaMode>(loadSavedAyanamshaMode);
  const setAyanamshaMode = (next: AyanamshaMode) => {
    setAyanamshaModeState(next);
    localStorage.setItem(AYANAMSHA_KEY, next);
  };

  const {
    data: profiles,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });

  const profile = useMemo<Profile | undefined>(
    () => profiles?.find((p) => p.id === profileId),
    [profiles, profileId]
  );

  const birthDate = useMemo(() => (profile ? parseBirthDate(profile) : null), [profile]);
  const location = useMemo(() => (profile ? profileLocation(profile) : null), [profile]);
  const clock = profile ? profileClock(profile) : "12:00";

  // Page is ready once the profile list resolves; KundaliView shows its own
  // inline chart-computing state after that.
  useRouteLoading(authLoading || (isAuthenticated && isLoading));

  const backLink = (
    <Link
      to="/kundali"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> {t("kundali.back_all")}
    </Link>
  );

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6">
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 space-y-4">
        {backLink}
        <div className="rounded-xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
          {t("kundali.login_required")}
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !profile)) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 space-y-4">
        {backLink}
        <div className="rounded-xl border border-border bg-card px-5 py-12 text-center">
          <p className="text-sm font-medium text-foreground">{t("kundali.not_found")}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t("kundali.not_found_body")}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const dob = profile.birth_date
    ? `${profile.birth_date} ${(profile.birth_era ?? "bs").toUpperCase()}`
    : "—";
  const place = profile.location_label || profile.city || "—";

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16 space-y-4">
      <div className="mt-1">{backLink}</div>

      {/* Profile header */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/15">
              <User className="h-6 w-6 text-secondary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight text-foreground">
                {profile.full_name}
              </h1>
              {profile.gender && (
                <span className="text-xs capitalize text-muted-foreground">{profile.gender}</span>
              )}
            </div>
          </div>
          <Link
            to="/kundali"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Sparkles className="size-4" /> {t("kundali.other_kundali")}
          </Link>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Field icon={Calendar} label={t("kundali.birth_date")}>
            {dob}
          </Field>
          <Field icon={Clock} label={t("kundali.time")}>
            {profile.birth_time || "—"}
          </Field>
          <Field icon={MapPin} label={t("kundali.place")}>
            {place}
          </Field>
          <Field icon={Globe} label={t("kundali.timezone")}>
            {profile.timezone || "—"}
          </Field>
        </div>
      </section>

      <AyanamshaSelector mode={ayanamshaMode} onModeChange={setAyanamshaMode} />

      {birthDate && location ? (
        <KundaliView
          date={birthDate}
          clock={clock}
          locationParams={location.params}
          locationLabel={location.label}
          ayanamshaMode={ayanamshaMode}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center">
          <Clock className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {t("kundali.no_birth_title")}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t("kundali.no_birth_body")}
          </p>
          <Link
            to="/kundali"
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-secondary px-4 text-sm font-semibold text-secondary-foreground"
          >
            {t("kundali.edit_profile")}
          </Link>
        </div>
      )}
    </div>
  );
}

export default KundaliDetail;
