import { useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Sparkles, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/PageShell";
import { PatroDayTimeNav } from "@/components/patro-date";
import { DataUnavailablePanel } from "@/components/common/DataUnavailablePanel";
import { RashifalSignCard } from "@/components/rashifal/RashifalSignCard";
import { RashifalProfilePicker } from "@/components/rashifal/RashifalProfilePicker";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { usePatroDayUrlBrowse } from "@/hooks/use-patro-url-browse";
import { useResolvedPatroDayQuery } from "@/hooks/use-resolved-patro-day-query";
import { useLocale } from "@/i18n/locale";
import { useRouteLoading } from "@/lib/route-loading";
import { cn } from "@/lib/utils";
import { patroAsideTab, patroMobileStepBtn } from "@/lib/patro-classes";
import { profileChartParams } from "@/lib/kundali/profile-chart";
import type { Profile } from "@/lib/auth/client";
import {
  RASHIFAL_PERIOD_ICON,
  rashifalRangeLabel,
  rashifalStepDate,
} from "@/lib/rashifal-ui";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { searchToLocation } from "@/lib/url-state";
import {
  RASHIFAL_PERIODS,
  fetchJanmaRashi,
  fetchRashifal,
  panchangaKeys,
  type RashifalBlock,
  type RashifalPeriod,
} from "@/lib/api";
import { formatNavataraQuality, formatNavataraTara } from "@/lib/navatara-bala";
import { formatRashiDisplay } from "@/lib/rashi-i18n";

const routeApi = getRouteApi("/panchanga-shell/jyotish/rashifal");

export function Rashifal() {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const [period, setPeriod] = useState<RashifalPeriod>("daily");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const dayBrowse = usePatroDayUrlBrowse(search, navigate, location, setLocation);
  const { dayState, date, setDate, setDisplayEra, syncPickerFromDateAd, syncResolvedPatroDay } =
    dayBrowse;

  const todayAd = todayAdStringInTimezone(
    new Date(),
    resolveTimeZone(undefined, location.params.timezone),
  );

  // The day query still drives the date navigator's BS/AD labels; the rashifal
  // itself always comes from /panchanga/rashifal now. The panchanga payload
  // carries only the legacy chandrabala block, which has none of the scored
  // layers the cards render.
  const dayQ = useResolvedPatroDayQuery(dayState, location.params, {
    syncPickerFromDateAd,
    syncResolvedPatroDay,
  });

  const rashifalQ = useQuery({
    queryKey: [...panchangaKeys.daySelection(dayState, location.params), "rashifal", period],
    queryFn: () => fetchRashifal(dayState, period, location.params),
    staleTime: 1000 * 60 * 30,
  });

  const rashifal: RashifalBlock | undefined = rashifalQ.data;

  const loading = rashifalQ.isLoading && !rashifal;
  const error = rashifalQ.isError;

  useRouteLoading(loading);

  // Selected profile → its janma (birth Moon) rashi, resolved server-side from
  // birth date/time/place — a BS-era profile is converted to AD first, same as
  // the kundali profile flow, so the lookup never duplicates that arithmetic.
  const profileChart = selectedProfile ? profileChartParams(selectedProfile) : null;
  const birthIso = profileChart ? `${profileChart.adDate}T${profileChart.clock}` : null;
  const birthTz = profileChart?.location.params.timezone ?? "Asia/Kathmandu";

  const janmaQ = useQuery({
    queryKey: ["rashifal-janma", selectedProfile?.id, birthIso, birthTz],
    queryFn: () => fetchJanmaRashi(birthIso as string, birthTz),
    enabled: Boolean(selectedProfile && birthIso),
    staleTime: Infinity,
  });

  // A profile without a saved birth date can't resolve a rashi — reject the
  // pick at selection time instead of silently showing all twelve later.
  const [profileError, setProfileError] = useState(false);
  const handleSelectProfile = (profile: Profile | null) => {
    if (profile && !profileChartParams(profile)) {
      setProfileError(true);
      setSelectedProfile(null);
      return;
    }
    setProfileError(false);
    setSelectedProfile(profile);
  };

  const visibleSigns = useMemo(() => {
    if (!rashifal?.signs) return rashifal?.signs;
    if (!selectedProfile || !janmaQ.data) return rashifal.signs;
    return rashifal.signs.filter((s) => s.id === janmaQ.data.janma_rashi);
  }, [rashifal, selectedProfile, janmaQ.data]);

  const rangeLabel = useMemo(
    () => rashifalRangeLabel(rashifal, period, lang),
    [rashifal, period, lang],
  );

  // "Moon at sunrise" is one sunrise. Over a month or a year the payload's
  // moon_label is only the middle sample, so naming it would read as a claim
  // about the whole window.
  const moonRef = useMemo(() => {
    if (period !== "daily" && period !== "weekly") return undefined;
    if (!rashifal?.moon_label) return undefined;
    const label = formatRashiDisplay(rashifal.moon_label, rashifal.moon_label_en, lang);
    return label ? t("rashifal.moon_at_sunrise", { sign: label }) : undefined;
  }, [period, rashifal, lang, t]);

  return (
    <PageShell className="pb-16">
      <PageHeader
        icon={<Sparkles className="size-7 text-secondary" />}
        title={t("rashifal.title")}
        subtitle={t("rashifal.subtitle")}
      />

      <p className="m-0 mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
        {t("rashifal.eyebrow")}
      </p>

      <div className="mt-4">
        <PatroDayTimeNav
          era={dayState.display.era}
          date={date}
          vikram={dayQ.data?.date_parts?.vikram}
          civilDateAd={dayQ.data?.date_ad}
          gregorian={dayQ.data?.date_parts?.gregorian}
          onDateChange={setDate}
          onEraChange={setDisplayEra}
          todayAd={todayAd}
          location={location}
          onLocationChange={setLocation}
        />
      </div>

      {/* Period switch — active tab carries its label, the rest stay icon-only
          so four tabs read at a glance without four labels competing. */}
      <div
        className="mt-4 flex flex-wrap border border-border bg-surface-muted sm:max-w-md sm:rounded-lg sm:overflow-hidden"
        role="tablist"
        aria-label={t("rashifal.tabs_label")}
      >
        {RASHIFAL_PERIODS.map((id) => {
          const Icon = RASHIFAL_PERIOD_ICON[id];
          const label = t(`rashifal.tabs.${id}`);
          const active = period === id;
          return (
            <Button
              key={id}
              type="button"
              role="tab"
              variant="ghost"
              size="sm"
              className={cn(
                patroAsideTab(active),
                "h-auto min-h-11 flex-1 rounded-none px-2 py-2.5",
                active ? "gap-1.5" : "gap-0",
              )}
              aria-selected={active}
              aria-label={label}
              title={label}
              onClick={() => setPeriod(id)}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {active ? <span className="whitespace-nowrap">{label}</span> : null}
            </Button>
          );
        })}
      </div>

      {/* Range strip — the window this tab is actually reading, with prev/next
          that step by a whole window (day / week / BS month / BS year) rather
          than by the shared date-nav's single civil day, which for a week or a
          month usually leaves the window unchanged. */}
      {period !== "daily" ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            className={patroMobileStepBtn}
            aria-label={t("rashifal.range_prev")}
            onClick={() => setDate(rashifalStepDate(rashifal, period, date, -1))}
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
          <span className="min-w-0 truncate text-center text-sm font-semibold text-foreground">
            {rangeLabel ?? t("common.loading")}
          </span>
          <button
            type="button"
            className={patroMobileStepBtn}
            aria-label={t("rashifal.range_next")}
            onClick={() => setDate(rashifalStepDate(rashifal, period, date, 1))}
          >
            <ChevronRight size={15} strokeWidth={2} />
          </button>
        </div>
      ) : null}

      {/* Signed-in users can narrow the grid to their own saved profile. */}
      <div className="mt-3 flex flex-col items-center gap-1.5">
        <RashifalProfilePicker
          selectedId={selectedProfile?.id ?? null}
          onSelect={handleSelectProfile}
        />
        {profileError ? (
          <p className="m-0 text-xs text-destructive">{t("rashifal.profile.missing_birth_data")}</p>
        ) : null}
      </div>

      {error ? (
        <DataUnavailablePanel message={t("rashifal.error")} className="mt-6" />
      ) : loading ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center text-sm">
          {t("common.loading")}
        </div>
      ) : !rashifal?.signs?.length ? (
        <DataUnavailablePanel message={t("common.no_data")} className="mt-6" />
      ) : (
        <div className="mt-6 flex flex-col gap-4" role="tabpanel">
          {period !== "daily" ? (
            <p className="m-0 text-center text-sm text-muted-foreground">
              {t(`rashifal.period_intro.${period}`)}
            </p>
          ) : null}
          {moonRef ? (
            <p className="m-0 text-center text-sm text-muted-foreground">{moonRef}</p>
          ) : null}
          <p className="m-0 text-center text-xs text-muted-foreground">
            {t("rashifal.method_note")}
          </p>
          {selectedProfile ? (
            <div className="flex items-center justify-center gap-1.5 text-sm text-secondary">
              <Users className="size-4" aria-hidden="true" />
              {janmaQ.isLoading ? (
                <span>{t("rashifal.profile.resolving")}</span>
              ) : (
                <>
                  <span>{t("rashifal.profile.showing_for", { name: selectedProfile.full_name })}</span>
                  <button
                    type="button"
                    className="font-semibold underline underline-offset-2 hover:no-underline"
                    onClick={() => setSelectedProfile(null)}
                  >
                    {t("rashifal.profile.show_all")}
                  </button>
                </>
              )}
            </div>
          ) : null}
          <div
            className={cn(
              "grid gap-4",
              selectedProfile && visibleSigns?.length === 1
                ? "sm:max-w-md sm:mx-auto"
                : "sm:grid-cols-2 xl:grid-cols-3",
            )}
          >
            {(visibleSigns ?? rashifal.signs).map((sign) => {
              // Chandrabala is a 2¼-day reading. It belongs on a day or a week;
              // over a month or a year the server all but drops the layer, so
              // showing one day's tara there would contradict the score above it.
              const showTara = period === "daily" || period === "weekly";
              const taraLine =
                showTara && sign.tara && sign.quality
                  ? `${formatNavataraTara(sign.tara, lang)}/${formatNavataraQuality(sign.quality, lang)}`
                  : undefined;
              return (
                <RashifalSignCard
                  key={sign.id}
                  sign={sign}
                  period={period}
                  taraLine={taraLine}
                  tone={sign.tone}
                />
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}
