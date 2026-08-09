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
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { searchToLocation } from "@/lib/url-state";
import { fetchRashifal, panchangaKeys, type RashifalBlock } from "@/lib/api";
import { formatNavataraQuality, formatNavataraTara } from "@/lib/navatara-bala";
import { formatRashiDisplay } from "@/lib/rashi-i18n";

const RASHIFAL_PERIOD_TABS = ["daily", "weekly", "monthly"] as const;
type RashifalPeriod = (typeof RASHIFAL_PERIOD_TABS)[number];

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

  const dayQ = useResolvedPatroDayQuery(dayState, location.params, {
    syncPickerFromDateAd,
    syncResolvedPatroDay,
  });

  const needsRashifalFetch = period !== "daily" || !dayQ.data?.rashifal?.signs?.length;

  const rashifalQ = useQuery({
    queryKey: [
      ...panchangaKeys.daySelection(dayState, location.params),
      "rashifal",
      period,
    ],
    queryFn: () => fetchRashifal(dayState, period, location.params),
    enabled: needsRashifalFetch,
    staleTime: 1000 * 60 * 30,
  });

  const rashifal: RashifalBlock | undefined = useMemo(() => {
    if (period === "daily" && dayQ.data?.rashifal?.signs?.length) {
      return dayQ.data.rashifal;
    }
    return rashifalQ.data;
  }, [period, dayQ.data?.rashifal, rashifalQ.data]);

  const loading =
    (period === "daily" && dayQ.isLoading && !dayQ.data) ||
    (needsRashifalFetch && rashifalQ.isLoading && !rashifal);
  const error = (period === "daily" && dayQ.isError) || (needsRashifalFetch && rashifalQ.isError);

  useRouteLoading(loading);

  const moonRef = useMemo(() => {
    if (!rashifal?.moon_label) return undefined;
    const label = formatRashiDisplay(rashifal.moon_label, rashifal.moon_label_en, lang);
    return label ? t("rashifal.moon_at_sunrise", { sign: label }) : undefined;
  }, [rashifal, lang, t]);

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

      <div
        className="mt-4 grid grid-cols-3 border border-border bg-surface-muted sm:max-w-md sm:rounded-lg sm:overflow-hidden"
        role="tablist"
        aria-label={t("rashifal.tabs_label")}
      >
        {RASHIFAL_PERIOD_TABS.map((id) => (
          <Button
            key={id}
            type="button"
            role="tab"
            variant="ghost"
            size="sm"
            className={cn(patroAsideTab(period === id), "h-auto min-h-10 w-full rounded-none px-2 py-2.5")}
            aria-selected={period === id}
            onClick={() => setPeriod(id)}
          >
            {t(`rashifal.tabs.${id}`)}
          </Button>
        ))}
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
          <p className="m-0 text-center text-xs text-muted-foreground">{t("rashifal.method_note")}</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rashifal.signs.map((sign) => {
              const taraLine =
                sign.tara && sign.quality
                  ? `${formatNavataraTara(sign.tara, lang)}/${formatNavataraQuality(sign.quality, lang)}`
                  : undefined;
              const prediction = lang === "ne" ? sign.prediction_ne : sign.prediction_en;
              const luckyColor = lang === "ne" ? sign.lucky_color_ne : sign.lucky_color_en;
              const luckyNumber = lang === "ne" ? sign.lucky_number_ne : sign.lucky_number_en;
              return (
                <RashifalSignCard
                  key={sign.id}
                  sign={sign}
                  prediction={prediction}
                  luckyColor={luckyColor}
                  luckyNumber={luckyNumber}
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
