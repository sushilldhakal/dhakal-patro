import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  MapPin,
  Pencil,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { listProfiles, type Profile } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { AYANAMSHA_MODES, type AyanamshaMode } from "@/lib/ayanamsha";
import { AyanamshaSelector } from "@/components/kundali/AyanamshaSelector";
import { KundaliView } from "@/components/kundali/KundaliView";
import { KundaliSectionNav, KUNDALI_SECTIONS } from "@/components/kundali/KundaliSectionNav";
import { ProfileForm, profileToInput } from "@/components/auth/ProfileForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  parseBirthDate,
  profileClock,
  profileLocation,
} from "@/lib/kundali/profile-chart";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { useRouteLoading } from "@/lib/route-loading";
import { cn } from "@/lib/utils";

const AYANAMSHA_KEY = "dhakalPatroAyanamshaMode";

function loadSavedAyanamshaMode(): AyanamshaMode {
  const saved = localStorage.getItem(AYANAMSHA_KEY);
  return AYANAMSHA_MODES.some((m) => m.id === saved) ? (saved as AyanamshaMode) : "nepal";
}

function MetaTile({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/60 dark:bg-background/40 px-3.5 py-3 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        <Icon className="size-3 shrink-0 opacity-70" />
        {label}
      </div>
      <p className={cn("text-sm font-semibold text-foreground leading-snug break-words", mono && "font-mono")}>
        {value}
      </p>
    </div>
  );
}

export function KundaliDetail() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profileId } = useParams({ strict: false }) as { profileId?: string };
  const [editOpen, setEditOpen] = useState(false);

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
    [profiles, profileId],
  );

  const birthDate = useMemo(() => (profile ? parseBirthDate(profile) : null), [profile]);
  const location = useMemo(() => (profile ? profileLocation(profile) : null), [profile]);
  const clock = profile ? profileClock(profile) : "12:00";

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
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-16 text-center text-sm text-muted-foreground">
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
    ? `${toNepaliDigits(profile.birth_date)} ${(profile.birth_era ?? "bs").toUpperCase()}`
    : "—";
  const place = profile.location_label || profile.city || "—";
  const birthTime = profile.birth_time ? toNepaliDigits(profile.birth_time) : "—";
  const canShowChart = Boolean(birthDate && location);

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-20">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {backLink}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/kundali"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Sparkles className="size-4" /> {t("kundali.other_kundali")}
          </Link>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" /> {t("kundali.edit_profile")}
          </Button>
        </div>
      </div>

      {/* Page title */}
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
          {t("kundali.detail_eyebrow")}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 ring-1 ring-secondary/25">
            <User className="size-7 text-secondary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] font-bold leading-tight tracking-tight text-foreground m-0 flex flex-wrap items-center gap-2">
              {profile.full_name}
              {profile.is_default && (
                <Star className="size-5 text-secondary fill-secondary/30" aria-hidden />
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {profile.gender && (
                <span className="capitalize">{profile.gender}</span>
              )}
              {profile.gender && place !== "—" && <span aria-hidden>·</span>}
              {place !== "—" && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" />
                  {place}
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,17rem)_1fr] gap-6 xl:gap-8 items-start">
        {/* Sidebar */}
        <aside className="xl:sticky xl:top-[5.5rem] flex flex-col gap-4 order-2 xl:order-1">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_6%,transparent)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t("kundali.title")}
            </p>
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
              <MetaTile icon={Calendar} label={t("kundali.birth_date")} value={dob} />
              <MetaTile icon={Clock} label={t("kundali.time")} value={birthTime} mono />
              <MetaTile icon={MapPin} label={t("kundali.place")} value={place} />
              <MetaTile
                icon={Globe}
                label={t("kundali.timezone")}
                value={profile.timezone || "—"}
                mono
              />
            </div>
          </div>

          <AyanamshaSelector mode={ayanamshaMode} onModeChange={setAyanamshaMode} />

          {canShowChart && <KundaliSectionNav className="hidden xl:block" />}
        </aside>

        {/* Main chart */}
        <div className="min-w-0 order-1 xl:order-2">
          {canShowChart ? (
            <KundaliView
              date={birthDate!}
              clock={clock}
              locationParams={location!.params}
              locationLabel={location!.label}
              ayanamshaMode={ayanamshaMode}
              hideBirthSummary
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <Clock className="mx-auto mb-4 size-10 text-muted-foreground/70" />
              <p className="text-base font-semibold text-foreground">{t("kundali.no_birth_title")}</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {t("kundali.no_birth_body")}
              </p>
              <Button className="mt-6 gap-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> {t("kundali.edit_profile")}
              </Button>
            </div>
          )}

          {canShowChart && (
            <div className="mt-4 xl:hidden overflow-x-auto">
              <div className="flex gap-2 pb-1 min-w-max">
                {KUNDALI_SECTIONS.map(({ id, labelKey }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {t(labelKey)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("kundali.edit_profile")}</DialogTitle>
            <DialogDescription>{t("kundali.generate_hint")}</DialogDescription>
          </DialogHeader>
          <ProfileForm
            initial={profileToInput(profile)}
            existing={profile}
            onCancel={() => setEditOpen(false)}
            onSaved={async () => {
              setEditOpen(false);
              await queryClient.invalidateQueries({ queryKey: ["profiles"] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default KundaliDetail;
