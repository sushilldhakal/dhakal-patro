import { getRouteApi } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Orbit } from "lucide-react";
import { PatroDayTimeNav } from "@/components/patro-date";
import { RoutePageState } from "@/components/common/RoutePageState";
import { GrahaDetailPageFrame } from "@/components/graha/GrahaDetailPageFrame";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { usePatroDayUrlBrowse } from "@/hooks/use-patro-url-browse";
import { useResolvedPatroDayQuery } from "@/hooks/use-resolved-patro-day-query";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import { useRouteLoading } from "@/lib/route-loading";
import { todayAdStringInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import {
  grahaSthitiLord,
  grahaSthitiNakshatra,
  grahaSthitiName,
  grahaSthitiRekhamsha,
  grahaSthitiShara,
  grahaSthitiSubLord,
} from "@/lib/graha-sthiti-display";
import { searchToLocation } from "@/lib/url-state";
import { patroDataTableWrap } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";
import {
  fetchGrahaSthiti,
  grahaDetailKeys,
  grahaSthitiRequestForDisplay,
  type GrahaSthitiRow,
} from "@/lib/api";

const routeApi = getRouteApi("/panchanga-shell/panchanga/graha-sthiti");

function signed(value: number, digits: (v: number | string) => string): string {
  const s = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${s}${digits(Math.abs(value).toFixed(2))}`;
}

const COL_KEYS = [
  "graha_pages.sthiti.columns.graha",
  "graha_pages.sthiti.columns.longitude",
  "graha_pages.sthiti.columns.nakshatra_pada",
  "graha_pages.sthiti.columns.lord_sublord",
  "graha_pages.sthiti.columns.full_degree",
  "graha_pages.sthiti.columns.latitude",
  "graha_pages.sthiti.columns.speed",
  "graha_pages.sthiti.columns.right_ascension",
  "graha_pages.sthiti.columns.declination",
] as const;

function GrahaRow({ row }: { row: GrahaSthitiRow }) {
  const { digits, lang } = useLocale();
  const { t } = useTranslation();
  const isLagna = row.graha === "lagna";
  return (
    <tr className={cn("border-t border-border", isLagna && "bg-secondary/[0.06]")}>
      <td className="whitespace-nowrap px-3 py-2 font-bold text-foreground">
        <span className="mr-1 text-muted-foreground">{row.symbol}</span>
        {grahaSthitiName(row, lang)}
        {row.is_retrograde ? (
          <span className="ml-1 text-danger" title={t("common.retrograde")}>
            ↺
          </span>
        ) : null}
        {row.is_combust ? (
          <span className="ml-1" title={t("common.combust")}>
            🔥
          </span>
        ) : null}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-num tabular-nums text-foreground">
        {lang === "en" ? grahaSthitiRekhamsha(row, lang) : digits(grahaSthitiRekhamsha(row, lang))}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-foreground">
        {grahaSthitiNakshatra(row, lang)}
        <span className="text-muted-foreground"> · {digits(row.pada)}</span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-foreground">
        {grahaSthitiLord(row, lang)}
        <span className="text-muted-foreground"> / {grahaSthitiSubLord(row, lang)}</span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-num tabular-nums text-foreground">
        {digits(row.full_degree.toFixed(2))}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-num tabular-nums text-foreground">
        {lang === "en" ? grahaSthitiShara(row, lang) : digits(grahaSthitiShara(row, lang))}
      </td>
      <td
        className={cn(
          "whitespace-nowrap px-3 py-2 font-num tabular-nums",
          row.is_retrograde ? "text-danger" : "text-foreground",
        )}
      >
        {signed(row.speed_deg_day, digits)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-num tabular-nums text-foreground">
        {digits(row.right_ascension.toFixed(2))}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-num tabular-nums text-foreground">
        {signed(row.declination, digits)}
      </td>
    </tr>
  );
}

export function GrahaSthiti() {
  const { t } = useTranslation();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const dayBrowse = usePatroDayUrlBrowse(search, navigate, location, setLocation);
  const { dayState, date, setDate, syncPickerFromDateAd, syncResolvedPatroDay, patroEra, setDisplayEra } =
    dayBrowse;
  const displayLanguage = dayState.display.language;
  const todayAd = todayAdStringInTimezone(
    new Date(),
    resolveTimeZone(undefined, location.params.timezone),
  );

  const dayResolveQ = useResolvedPatroDayQuery(dayState, location.params, {
    syncPickerFromDateAd,
    syncResolvedPatroDay,
  });

  const sthitiRequest = grahaSthitiRequestForDisplay(
    patroEra,
    dayResolveQ.data?.date_ad ?? "",
    dayResolveQ.data?.date_parts,
  );

  const query = useQuery({
    queryKey: grahaDetailKeys.sthiti(
      sthitiRequest.dateKey,
      sthitiRequest.apiEra,
      location.params,
    ),
    queryFn: () =>
      fetchGrahaSthiti(sthitiRequest.dateKey, location.params, sthitiRequest.apiEra),
    enabled: Boolean(sthitiRequest.dateKey),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  useRouteLoading((dayResolveQ.isLoading && !dayResolveQ.data) || (query.isLoading && !query.data));

  return (
    <GrahaDetailPageFrame
      banner={{
        icon: <Orbit className="h-6 w-6 text-accent dark:text-secondary" />,
        titleKey: "sidebar_nav.items.graha-sthiti.label",
        blurbKey: "sidebar_nav.items.graha-sthiti.blurb",
      }}
      descriptionPageId="graha-sthiti"
      beforeDescription={
        <p className="mt-2 text-sm text-muted-foreground">{t("graha_pages.sthiti_footnote")}</p>
      }
      nav={
        <PatroDayTimeNav
          era={patroEra}
          displayLanguage={displayLanguage}
          date={date}
          vikram={dayResolveQ.data?.date_parts?.vikram}
          civilDateAd={dayResolveQ.data?.date_ad}
          gregorian={dayResolveQ.data?.date_parts?.gregorian}
          onDateChange={setDate}
          onEraChange={setDisplayEra}
          todayAd={todayAd}
          location={location}
          onLocationChange={setLocation}
        />
      }
    >
      <RoutePageState isLoading={query.isLoading} data={query.data}>
        {(data) => (
          <div className={cn(patroDataTableWrap, "mt-2")}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-secondary/[0.09] text-left dark:bg-secondary/20">
                  {COL_KEYS.map((key) => (
                    <th
                      key={key}
                      className="whitespace-nowrap px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                    >
                      {t(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <GrahaRow key={row.graha} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </RoutePageState>
    </GrahaDetailPageFrame>
  );
}

export default GrahaSthiti;
