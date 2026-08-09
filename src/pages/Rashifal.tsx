import { useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/PageShell";
import { PatroDayTimeNav } from "@/components/patro-date";
import { DataUnavailablePanel } from "@/components/common/DataUnavailablePanel";
import { RashifalSignCard } from "@/components/rashifal/RashifalSignCard";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { usePatroDayUrlBrowse } from "@/hooks/use-patro-url-browse";
import { useResolvedPatroDayQuery } from "@/hooks/use-resolved-patro-day-query";
import { useLocale } from "@/i18n/locale";
import { useRouteLoading } from "@/lib/route-loading";
import { cn } from "@/lib/utils";
import { patroAsideTab } from "@/lib/patro-classes";
import { RASHIFAL_PERIOD_ICON } from "@/lib/rashifal-ui";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { searchToLocation } from "@/lib/url-state";
import {
  RASHIFAL_PERIODS,
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

      {/* Icon-only period switch — the label stays as the accessible name. */}
      <div
        className="mt-4 grid grid-cols-4 border border-border bg-surface-muted sm:max-w-md sm:rounded-lg sm:overflow-hidden"
        role="tablist"
        aria-label={t("rashifal.tabs_label")}
      >
        {RASHIFAL_PERIODS.map((id) => {
          const Icon = RASHIFAL_PERIOD_ICON[id];
          const label = t(`rashifal.tabs.${id}`);
          return (
            <Button
              key={id}
              type="button"
              role="tab"
              variant="ghost"
              size="sm"
              className={cn(
                patroAsideTab(period === id),
                "h-auto min-h-11 w-full rounded-none px-2 py-2.5",
              )}
              aria-selected={period === id}
              aria-label={label}
              title={label}
              onClick={() => setPeriod(id)}
            >
              <Icon className="size-5" aria-hidden="true" />
            </Button>
          );
        })}
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rashifal.signs.map((sign) => {
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
