import { getRouteApi } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RoutePageState } from "@/components/common/RoutePageState";
import { GrahaDetailPageFrame } from "@/components/graha/GrahaDetailPageFrame";
import { GrahaGroupedEventCards } from "@/components/graha/GrahaGroupedEventCards";
import { PatroYearNavBlock } from "@/components/patro-page/PatroYearNavBlock";
import { usePatroYearDataPage } from "@/hooks/use-patro-year-data-page";
import { useLocale } from "@/i18n/locale";
import { useRouteLoading } from "@/lib/route-loading";
import { grahaName } from "@/lib/graha-i18n";
import { cn } from "@/lib/utils";
import {
  fetchGrahaVakriYear,
  grahaDetailKeys,
  type GrahaVakriEvent,
} from "@/lib/api";

const routeApi = getRouteApi("/panchanga-shell/panchanga/graha-vakri");

const GRAHA_ORDER = ["mercury", "venus", "mars", "jupiter", "saturn"];

function renderedEntryDate(ev: GrahaVakriEvent): string {
  const label = ev.entry_jd_date?.trim();
  if (!label) {
    throw new Error("Graha vakri event missing entry_jd_date (stale gv= cache?)");
  }
  return label;
}

function EventRow({ ev }: { ev: GrahaVakriEvent }) {
  const { digits } = useLocale();
  const { t } = useTranslation();
  const isVakri = ev.is_retrograde === true || ev.motion === "Vakri";
  const dateLabel = renderedEntryDate(ev);
  const timeLabel = ev.entry_time_local_short ?? "";
  return (
    <div className="flex items-center font-semibold justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm odd:bg-foreground/[0.03]">
      <span className="flex items-center gap-1.5">
        <span className={cn(isVakri ? "text-danger" : "text-success")}>
          {isVakri ? "↺" : "→"}
        </span>
        <span className={cn("font-semibold", isVakri ? "text-danger" : "text-success")}>
          {t(isVakri ? "graha_pages.vakri.retrograde" : "graha_pages.vakri.direct")}
        </span>
      </span>
      <span className="text-right">
        <span className="font-num tabular-nums text-foreground">{digits(dateLabel)}</span>
        {timeLabel ? (
          <span className="text-muted-foreground"> · {digits(timeLabel)}</span>
        ) : null}
      </span>
    </div>
  );
}

export function GrahaVakri() {
  const { lang } = useLocale();
  const { t } = useTranslation();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation, yearBrowse } = usePatroYearDataPage(search, navigate);

  const query = useQuery({
    queryKey: grahaDetailKeys.vakri(yearBrowse.year, location.params, yearBrowse.era),
    queryFn: () => fetchGrahaVakriYear(yearBrowse.year, location.params, yearBrowse.era),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(query.isLoading && !query.data);

  const byGraha = new Map<string, GrahaVakriEvent[]>();
  for (const g of GRAHA_ORDER) byGraha.set(g, []);
  for (const ev of query.data?.events ?? []) {
    if (!byGraha.has(ev.graha)) byGraha.set(ev.graha, []);
    byGraha.get(ev.graha)!.push(ev);
  }

  return (
    <GrahaDetailPageFrame
      banner={{
        icon: <RotateCcw className="h-6 w-6 text-accent dark:text-secondary" />,
        titleKey: "sidebar_nav.items.graha-vakri.label",
        blurbKey: "sidebar_nav.items.graha-vakri.blurb",
      }}
      descriptionPageId="graha-vakri"
      nav={
        <PatroYearNavBlock
          era={yearBrowse.era}
          year={yearBrowse.year}
          onYearChange={yearBrowse.setYear}
          onEraChange={yearBrowse.setEra}
          gregorianRange={query.data?.gregorian_range}
          location={location}
          onLocationChange={setLocation}
        />
      }
    >
      <RoutePageState isLoading={query.isLoading} data={query.data}>
        {() => (
          <GrahaGroupedEventCards
            order={GRAHA_ORDER}
            groups={byGraha}
            bodyClassName="flex flex-col gap-0.5 p-2"
            renderCardHeader={(g, events) => (
              <>
                <span className="text-base font-bold text-foreground">{grahaName(g, lang)}</span>
                <span className="text-xs text-muted-foreground">
                  {events.length
                    ? t("graha_pages.vakri.stations", { count: events.length })
                    : t("graha_pages.vakri.no_stations")}
                </span>
              </>
            )}
            renderItem={(ev) => <EventRow ev={ev} />}
            emptyInGroup={
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                {t("graha_pages.vakri.no_vakri_year")}
              </p>
            }
          />
        )}
      </RoutePageState>
    </GrahaDetailPageFrame>
  );
}

export default GrahaVakri;
