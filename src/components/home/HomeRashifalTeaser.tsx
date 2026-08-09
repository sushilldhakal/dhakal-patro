import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthContext";
import { useProfilesQuery } from "@/lib/kundali/profiles-query";
import { profileChartParams } from "@/lib/kundali/profile-chart";
import { RashiGlyphIcon } from "@/components/panchanga/element/ElementGlyphIcon";
import { getRashiName } from "@/lib/rashi-i18n";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { useLocale } from "@/i18n/locale";
import { patroRouteLinkSearch } from "@/lib/url-state";
import { patroDayFetchFromApiDateAd } from "@/lib/patro-day-url";
import { getLanguageForEra } from "@/lib/era";
import { rashifalToneBar, rashifalToneText, toNepaliDigits } from "@/lib/rashifal-ui";
import { cn } from "@/lib/utils";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import {
  fetchPersonalRashifal,
  fetchRashifal,
  type RashifalPersonal,
  type RashifalSignBlock,
} from "@/lib/api";

/**
 * Bare-minimum shared shape the card reads — either a general sign card
 * (Sun's current rashi) or a personal reading, normalised to one view.
 *
 * The headline is always the **Rashi** (Moon sign): "राशि" in everyday Nepali
 * usage means the Moon sign, not the Lagna, and the personal engine's own
 * scoring is Lagna-anchored for good classical reasons (see
 * rashifal_personal.py) — so a personal reading has a real Lagna to show
 * *in addition*, not instead. `subLabel` carries that ("लग्न: सिंह") as a
 * clearly named second line rather than silently swapping in for the rashi
 * the reader already knows themselves by.
 */
type TeaserContent = {
  kind: "personal" | "general";
  name: string;
  glyphKey: string;
  glyphId: number;
  score: number;
  tone: RashifalSignBlock["tone"];
  prediction: string;
  headline: string;
  subLabel?: string;
};

function fromPersonal(name: string, p: RashifalPersonal, lang: string): TeaserContent {
  const ne = lang === "ne";
  const moonName = ne ? p.moon_sign_ne : p.moon_sign_en;
  const lagnaName = ne ? p.lagna_sign_ne : p.lagna_sign_en;
  return {
    kind: "personal",
    name,
    glyphKey: getRashiName(p.moon_sign, lang),
    glyphId: p.moon_sign,
    score: p.percent,
    tone: p.tone,
    prediction: ne ? p.prediction_ne : p.prediction_en,
    headline: moonName,
    subLabel: ne ? `लग्न ${lagnaName}` : `Lagna ${lagnaName}`,
  };
}

function fromGeneral(sign: RashifalSignBlock, lang: string): TeaserContent {
  const ne = lang === "ne";
  return {
    kind: "general",
    name: ne ? sign.name : `${sign.title_en} · ${sign.name}`,
    glyphKey: getRashiName(sign.id, lang),
    glyphId: sign.id,
    score: sign.percent,
    tone: sign.tone,
    prediction: ne ? sign.prediction_ne : sign.prediction_en,
    headline: ne ? sign.name : sign.title_en,
  };
}

/**
 * Monthly rashifal teaser — the home page's one-line pitch for the full
 * rashifal page, not a second copy of it. A signed-in reader with a default
 * profile sees their own birth-chart reading; everyone else sees the sign
 * the Sun currently occupies this BS month (Baishakh → Mesha, and so on),
 * the one general rashifal fact that needs no sign-in to be true of a
 * specific person.
 */
export function HomeRashifalTeaser({
  location,
  todayAd,
}: {
  location: PanchangaLocation;
  /** Observer-local today (`YYYY-MM-DD`) — same value Home's own hero card uses,
   * so this teaser never drifts a day off near midnight in the viewer's zone. */
  todayAd: string;
}) {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const { isAuthenticated } = useAuth();
  const era = useCalendarEra();

  const { data: profiles } = useProfilesQuery(isAuthenticated);
  const defaultProfile = profiles?.find((p) => p.is_default) ?? null;
  const profileChart = defaultProfile ? profileChartParams(defaultProfile) : null;
  const hasUsableProfile = Boolean(
    defaultProfile && profileChart && profileChart.location.params.lat != null && profileChart.location.params.lon != null,
  );

  const dayState = patroDayFetchFromApiDateAd(todayAd, {
    era: "bs",
    language: getLanguageForEra("bs"),
  });

  const personalQ = useQuery({
    queryKey: [
      "home-rashifal-personal",
      defaultProfile?.id,
      profileChart?.adDate,
      profileChart?.clock,
      location.params.lat,
      location.params.lon,
    ],
    queryFn: () =>
      fetchPersonalRashifal(
        dayState,
        "monthly",
        {
          birth: `${profileChart!.adDate}T${profileChart!.clock}`,
          birthLat: profileChart!.location.params.lat as number,
          birthLon: profileChart!.location.params.lon as number,
          birthTz: profileChart!.location.params.timezone ?? "Asia/Kathmandu",
        },
        location.params,
      ),
    enabled: hasUsableProfile,
    staleTime: 1000 * 60 * 10,
  });

  const generalQ = useQuery({
    queryKey: ["home-rashifal-general", "monthly", location.params.lat, location.params.lon],
    queryFn: () => fetchRashifal(dayState, "monthly", location.params),
    enabled: !hasUsableProfile,
    staleTime: 1000 * 60 * 30,
  });

  const monthLabel = hasUsableProfile
    ? lang === "ne"
      ? `${personalQ.data?.bs_month_name_ne ?? ""} ${personalQ.data?.bs_year != null ? toNepaliDigits(personalQ.data.bs_year, lang) : ""}`.trim()
      : `${personalQ.data?.bs_month_name_en ?? ""} ${personalQ.data?.bs_year ?? ""}`.trim()
    : lang === "ne"
      ? `${generalQ.data?.bs_month_name_ne ?? ""} ${generalQ.data?.bs_year != null ? toNepaliDigits(generalQ.data.bs_year, lang) : ""}`.trim()
      : `${generalQ.data?.bs_month_name_en ?? ""} ${generalQ.data?.bs_year ?? ""}`.trim();

  const content: TeaserContent | null = hasUsableProfile
    ? personalQ.data
      ? fromPersonal(defaultProfile?.full_name ?? "", personalQ.data, lang)
      : null
    : generalQ.data?.signs?.length && generalQ.data.frame?.sun_sign
      ? fromGeneral(
          generalQ.data.signs.find((s) => s.id === generalQ.data!.frame!.sun_sign) ??
            generalQ.data.signs[0],
          lang,
        )
      : null;

  const linkSearch = patroRouteLinkSearch("/jyotish/rashifal", location, era);
  const loading = hasUsableProfile ? personalQ.isLoading : generalQ.isLoading;

  if (!loading && !content) return null;

  return (
    <section>
      <h2 className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {t("home_rashifal.section_title")}
      </h2>

      <div className="mx-auto max-w-xl overflow-hidden rounded-xl border border-border bg-card">
        {loading || !content ? (
          <div className="flex items-center gap-3 px-4 py-5">
            <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 border-b border-border/60 bg-secondary/[0.06] px-4 py-3 dark:bg-secondary/10">
              <RashiGlyphIcon name={content.glyphKey} number={content.glyphId} size={34} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {content.kind === "personal"
                    ? t("home_rashifal.personal_eyebrow", { name: content.name })
                    : t("home_rashifal.general_eyebrow")}
                </p>
                <h3 className="m-0 mt-0.5 truncate text-base font-bold leading-snug text-foreground">
                  {content.headline}
                </h3>
                {content.subLabel ? (
                  <p className="m-0 mt-0.5 truncate text-xs text-muted-foreground">{content.subLabel}</p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
                {monthLabel || t("rashifal.tabs.monthly")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 px-4 pt-3">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", rashifalToneBar(content.tone))}
                  style={{ width: `${content.score}%` }}
                />
              </div>
              <span
                className={cn("shrink-0 font-num tabular-nums text-xs font-bold", rashifalToneText(content.tone))}
              >
                {toNepaliDigits(content.score, lang)}
                <span aria-hidden="true">%</span>
              </span>
            </div>

            <p className="m-0 line-clamp-3 px-4 py-3 text-sm leading-relaxed text-foreground/90">
              {content.prediction}
            </p>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/25 px-4 py-2.5 text-sm">
              <Link
                to="/jyotish/rashifal"
                search={linkSearch}
                className="font-semibold text-secondary no-underline hover:underline"
              >
                {t("home_rashifal.see_daily")}
              </Link>
              <Link
                to="/jyotish/rashifal"
                search={linkSearch}
                className="font-semibold text-secondary no-underline hover:underline"
              >
                {content.kind === "personal" ? t("home_rashifal.see_full") : t("home_rashifal.see_yours")} →
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
