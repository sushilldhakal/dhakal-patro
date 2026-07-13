import { useEffect, useMemo, useState } from "react";
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
import {
  DEFAULT_KUNDALI_SECTION,
  KundaliSectionNav,
  parseKundaliSectionFromHash,
  setKundaliSectionHash,
  type KundaliSectionId,
} from "@/components/kundali/KundaliSectionNav";
import { ProfileForm, profileToInput } from "@/components/auth/ProfileForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatBsDateLong } from "@/lib/bs-calendar";
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

function MetaItem({
  icon: Icon,
  label,
  value,
  sub,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-[6.75rem] flex-col justify-center gap-0 px-2.5 py-2 sm:min-w-[7.25rem] sm:px-3">
      <div className="flex items-center gap-1 text-sm font-semibold uppercase tracking-wider">
        <Icon className="size-2.5 shrink-0 opacity-70" />
        {label}
      </div>
      <p className={cn("text-sm font-semibold text-foreground leading-tight break-words", mono && "font-mono text-xs")}>
        {value}
      </p>
      {sub ? <p className="text-sm leading-tight mt-0.5">{sub}</p> : null}
    </div>
  );
}

function formatBsDate(d: Date): string {
  return formatBsDateLong(d, "ne", toNepaliDigits);
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

  const [section, setSection] = useState<KundaliSectionId>(() =>
    typeof window !== "undefined"
      ? parseKundaliSectionFromHash(window.location.hash)
      : DEFAULT_KUNDALI_SECTION,
  );

  useEffect(() => {
    const syncFromHash = () => setSection(parseKundaliSectionFromHash(window.location.hash));
    if (!window.location.hash) {
      setKundaliSectionHash(DEFAULT_KUNDALI_SECTION);
      setSection(DEFAULT_KUNDALI_SECTION);
    }
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const navigateSection = (id: KundaliSectionId) => {
    setKundaliSectionHash(id);
    setSection(id);
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

  const birthDateMeta = useMemo(() => {
    if (!profile?.birth_date) return { value: "—", sub: undefined as string | undefined };
    if (!birthDate) {
      const era = profile.birth_era ?? "bs";
      return {
        value: `${toNepaliDigits(profile.birth_date)} ${era.toUpperCase()}`,
        sub: undefined,
      };
    }
    return { value: formatBsDate(birthDate), sub: undefined };
  }, [profile, birthDate]);

  useRouteLoading(authLoading || (isAuthenticated && isLoading));

  const backLink = (
    <Link
      to="/kundali"
      className="inline-flex items-center gap-1.5 text-sm text-base transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> {t("kundali.back_all")}
    </Link>
  );

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6">
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-16 text-center text-sm">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 space-y-4">
        {backLink}
        <div className="rounded-xl border border-border bg-card px-5 py-12 text-center text-sm">
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
          <p className="text-sm text-base text-foreground">{t("kundali.not_found")}</p>
          <p className="mx-auto mt-1 max-w-md text-sm">
            {t("kundali.not_found_body")}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

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
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm text-base transition-colors hover:bg-muted hover:text-foreground"
          >
            <Sparkles className="size-4" /> {t("kundali.other_kundali")}
          </Link>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" /> {t("kundali.edit_profile")}
          </Button>
        </div>
      </div>

      {/* Page title + birth facts on one row */}
      <header className="mb-5 rounded-xl border border-border bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_6%,transparent)] overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:divide-x lg:divide-border">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 sm:px-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary/15 ring-1 ring-secondary/25 sm:size-10">
              <User className="size-4 text-secondary sm:size-[1.125rem]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.1em] mb-0.5">
                {t("kundali.title")}
              </p>
              <h1 className="text-lg sm:text-xl font-bold leading-tight tracking-tight text-foreground m-0 flex flex-wrap items-center gap-1.5">
                {profile.full_name}
                {profile.is_default && (
                  <Star className="size-3.5 text-secondary fill-secondary/30 sm:size-4" aria-hidden />
                )}
              </h1>
              {profile.gender ? (
                <p className="text-sm mt-0.5 capitalize">{profile.gender}</p>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto border-t border-border lg:border-t-0">
            <div className="flex min-w-max divide-x divide-border">
              <MetaItem
                icon={Calendar}
                label={t("kundali.birth_date")}
                value={birthDateMeta.value}
                sub={birthDateMeta.sub}
              />
              <MetaItem icon={Clock} label={t("kundali.time")} value={birthTime} mono />
              <MetaItem icon={MapPin} label={t("kundali.place")} value={place} />
              <MetaItem
                icon={Globe}
                label={t("kundali.timezone")}
                value={profile.timezone || "—"}
                mono
              />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,15.5rem)_1fr] gap-6 xl:gap-8 items-start">
        {/* Sidebar */}
        <aside className="xl:sticky xl:top-[5.5rem] flex flex-col gap-4 order-2 xl:order-1">
          {canShowChart && (
            <KundaliSectionNav
              className="hidden xl:block"
              activeId={section}
              onNavigate={navigateSection}
            />
          )}

          <AyanamshaSelector mode={ayanamshaMode} onModeChange={setAyanamshaMode} />
        </aside>

        {/* Main chart */}
        <div className="min-w-0 order-1 xl:order-2">
          {canShowChart && (
            <div className="mb-4 xl:hidden">
              <KundaliSectionNav
                activeId={section}
                onNavigate={navigateSection}
                variant="horizontal"
              />
            </div>
          )}

          {canShowChart ? (
            <KundaliView
              date={birthDate!}
              clock={clock}
              locationParams={location!.params}
              locationLabel={location!.label}
              ayanamshaMode={ayanamshaMode}
              hideBirthSummary
              section={section}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <Clock className="mx-auto mb-4 size-10" />
              <p className="text-base font-semibold text-foreground">{t("kundali.no_birth_title")}</p>
              <p className="mx-auto mt-2 max-w-md text-sm">
                {t("kundali.no_birth_body")}
              </p>
              <Button className="mt-6 gap-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> {t("kundali.edit_profile")}
              </Button>
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
