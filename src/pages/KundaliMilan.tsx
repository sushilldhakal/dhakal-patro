import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Heart, LogIn, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AyanamshaSelector } from "@/components/kundali/AyanamshaSelector";
import {
  MilanProfilePicker,
  type MilanProfilePickerHandle,
} from "@/components/kundali/MilanProfilePicker";
import { KundaliMilanResult } from "@/components/kundali/KundaliMilanResult";
import { computeAshtakuta } from "@/lib/ashtakuta";
import { AYANAMSHA_MODES, type AyanamshaMode } from "@/lib/ayanamsha";
import { buildAtTimeDatetime, fetchEphemerisPanchangaDay } from "@/lib/ephemeris-adapters";
import { ayanamshaLabel, buildMilanPersonInput, moonDataFromPanchanga } from "@/lib/kundali/milan-person";
import { profileChartParams } from "@/lib/kundali/profile-chart";
import { getPanchangaDetail } from "@/lib/panchanga-format";
import { resolveJanmaNakshatra } from "@/lib/panchang-elements";
import { useLocale } from "@/i18n/locale";
import { locationCacheKey, type PanchangaDay } from "@/lib/api";
import type { Profile } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useRouteLoading } from "@/lib/route-loading";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

const AYANAMSHA_KEY = "dhakalPatroAyanamshaMode";

function loadSavedAyanamshaMode(): AyanamshaMode {
  const saved = typeof localStorage !== "undefined" ? localStorage.getItem(AYANAMSHA_KEY) : null;
  return AYANAMSHA_MODES.some((m) => m.id === saved) ? (saved as AyanamshaMode) : "lahiri";
}

function formatAdDateLong(d: Date, locale: string): string {
  return d.toLocaleDateString(locale.startsWith("en") ? "en-US" : "ne-NP", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDms(deg: number): string {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  const hemi = deg >= 0 ? "N" : "S";
  return `${d}° ${String(m).padStart(2, "0")}′ ${String(s).padStart(2, "0")}″ ${hemi}`;
}

function formatLonDms(deg: number): string {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  const hemi = deg >= 0 ? "E" : "W";
  return `${d}° ${String(m).padStart(2, "0")}′ ${String(s).padStart(2, "0")}″ ${hemi}`;
}

interface BirthDetailsTableProps {
  role: "boy" | "girl";
  profile: Profile;
  panchanga?: PanchangaDay;
  ayanamsha: AyanamshaMode;
  lang: string;
}

function BirthDetailsTable({ role, profile, panchanga, ayanamsha, lang }: BirthDetailsTableProps) {
  const { t } = useTranslation();
  const en = lang.startsWith("en");
  const chart = profileChartParams(profile);
  const moon = panchanga ? moonDataFromPanchanga(panchanga, ayanamsha) : null;
  const detail = panchanga ? getPanchangaDetail(panchanga) : undefined;
  const nak = panchanga
    ? resolveJanmaNakshatra(
        panchanga,
        detail?.nakshatra as { number?: number; name_ne?: string; pada?: number } | undefined,
        moon?.longitude,
      )
    : undefined;

  const rows: { label: string; value: string }[] = [
    { label: t("milan.name"), value: profile.full_name || "—" },
    {
      label: t("milan.date_of_birth"),
      value: chart ? formatAdDateLong(chart.date, lang) : "—",
    },
    { label: t("milan.time_of_birth"), value: chart?.clock ?? profile.birth_time ?? "—" },
    { label: t("milan.city"), value: profile.city || profile.location_label?.split(",")[0] || "—" },
    { label: t("milan.region"), value: profile.location_label || "—" },
    { label: t("milan.country"), value: profile.country || "—" },
  ];

  if (profile.latitude != null) {
    rows.push({
      label: t("milan.latitude"),
      value: `${formatDms(profile.latitude)} (${profile.latitude.toFixed(4)})`,
    });
  }
  if (profile.longitude != null) {
    rows.push({
      label: t("milan.longitude"),
      value: `${formatLonDms(profile.longitude)} (${profile.longitude.toFixed(4)})`,
    });
  }
  rows.push({ label: t("milan.timezone"), value: profile.timezone || "—" });
  rows.push({
    label: t("milan.ayanamsha"),
    value: en
      ? `${ayanamshaLabel(ayanamsha, lang)} / Chitrapaksha`
      : `${ayanamshaLabel(ayanamsha, lang)} / चित्रपक्ष`,
  });

  if (moon) {
    rows.push({ label: t("milan.moon_sign"), value: moon.rashiNe });
  }
  if (nak) {
    rows.push({
      label: t("milan.nakshatra"),
      value: `${nak.ne} (${nak.index + 1}) · ${t("milan.pada")} ${nak.pada}`,
    });
  }
  if (moon) {
    rows.push({ label: t("milan.lunar_longitude"), value: moon.longitude.toFixed(2) });
  }

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20">
        <h3 className="text-sm font-semibold">
          {role === "boy" ? t("milan.vara_details") : t("milan.kanya_details")}
        </h3>
      </div>
      <Table>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="text-muted-foreground w-[40%]">{row.label}</TableCell>
              <TableCell className="font-medium">{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

function useProfilePanchanga(profile: Profile | null, ayanamsha: AyanamshaMode, enabled: boolean) {
  const chart = profile ? profileChartParams(profile) : null;
  const datetime = chart ? buildAtTimeDatetime(chart.adDate, chart.clock) : "";

  return useQuery({
    queryKey: [
      "milan",
      "panchanga",
      profile?.id,
      datetime,
      chart ? locationCacheKey(chart.location.params) : "none",
      ayanamsha,
    ],
    queryFn: () =>
      fetchEphemerisPanchangaDay(datetime, chart!.adDate, chart!.location.params, { ayanamsha }),
    enabled: enabled && !!chart,
  });
}

export function KundaliMilan() {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const pickerRef = useRef<MilanProfilePickerHandle>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [ayanamsha, setAyanamsha] = useState<AyanamshaMode>(loadSavedAyanamshaMode);
  const [boyProfile, setBoyProfile] = useState<Profile | null>(null);
  const [girlProfile, setGirlProfile] = useState<Profile | null>(null);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  useRouteLoading(authLoading);

  const ready = isAuthenticated && !!boyProfile && !!girlProfile;
  const boyChart = boyProfile ? profileChartParams(boyProfile) : null;
  const girlChart = girlProfile ? profileChartParams(girlProfile) : null;
  const hasValidCharts = !!boyChart && !!girlChart;

  const boyQuery = useProfilePanchanga(boyProfile, ayanamsha, ready && hasValidCharts);
  const girlQuery = useProfilePanchanga(girlProfile, ayanamsha, ready && hasValidCharts);

  const result = useMemo(() => {
    if (!boyQuery.data || !girlQuery.data || !boyProfile || !girlProfile) return null;
    const boyPerson = buildMilanPersonInput(boyProfile.full_name, boyQuery.data, ayanamsha);
    const girlPerson = buildMilanPersonInput(girlProfile.full_name, girlQuery.data, ayanamsha);
    if (!boyPerson || !girlPerson) return null;
    return computeAshtakuta(boyPerson, girlPerson, lang);
  }, [boyQuery.data, girlQuery.data, boyProfile, girlProfile, ayanamsha, lang]);

  const loading = ready && hasValidCharts && (boyQuery.isLoading || girlQuery.isLoading);
  const error = ready && hasValidCharts && (boyQuery.isError || girlQuery.isError);
  const missingBirth =
    ready && boyProfile && girlProfile && (!boyChart || !girlChart);

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16">
      <div className="mb-4 mt-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            {t("milan.eyebrow")}
          </div>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0 flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-secondary shrink-0" />
            {t("milan.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {isAuthenticated ? t("milan.subtitle_auth") : t("milan.login_required")}
          </p>
        </div>
        {isAuthenticated ? (
          <Button className="shrink-0" onClick={() => pickerRef.current?.openAdd()}>
            <Plus className="size-4" /> {t("kundali.add_profile")}
          </Button>
        ) : null}
      </div>

      {authLoading ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : !isAuthenticated ? (
        <section className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_8%,transparent)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15">
            <Heart className="h-7 w-7 text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t("milan.login_prompt_title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {t("milan.login_prompt_body")}
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
        <div className="flex flex-col gap-6">
          <p className="text-sm text-muted-foreground">{t("milan.profile_hint")}</p>

          <MilanProfilePicker
            ref={pickerRef}
            boyId={boyProfile?.id ?? null}
            girlId={girlProfile?.id ?? null}
            onBoySelect={setBoyProfile}
            onGirlSelect={setGirlProfile}
          />

          {boyProfile && girlProfile ? (
            <>
              <AyanamshaSelector mode={ayanamsha} onModeChange={setAyanamsha} />

              {missingBirth ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-8 text-center text-sm text-foreground">
                  {t("milan.missing_birth")}
                </div>
              ) : null}

              {loading ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center text-sm text-muted-foreground">
                  {t("common.loading")}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-8 text-center text-sm text-destructive">
                  {t("milan.error")}
                </div>
              ) : null}

              {!missingBirth && !loading && !error && boyQuery.data && girlQuery.data ? (
                <div className="flex flex-col gap-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <BirthDetailsTable
                      role="boy"
                      profile={boyProfile}
                      panchanga={boyQuery.data}
                      ayanamsha={ayanamsha}
                      lang={lang}
                    />
                    <BirthDetailsTable
                      role="girl"
                      profile={girlProfile}
                      panchanga={girlQuery.data}
                      ayanamsha={ayanamsha}
                      lang={lang}
                    />
                  </div>

                  {result ? (
                    <KundaliMilanResult
                      boyName={boyProfile.full_name}
                      girlName={girlProfile.full_name}
                      result={result}
                      lang={lang}
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
                      {t("milan.no_moon")}
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground">
              {t("milan.need_two_profiles")}
            </div>
          )}
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
