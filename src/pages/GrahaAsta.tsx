import { Link, getRouteApi } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Sunrise } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import {
  GrahaBanner,
  GrahaDescription,
} from "@/components/graha/GrahaPageParts";
import { usePatroYearUrlBrowse } from "@/hooks/use-patro-url-browse";
import { PatroYearNav } from "@/components/patro-date";
import { useLocale } from "@/i18n/locale";
import { useRouteLoading } from "@/lib/route-loading";
import { grahaName } from "@/lib/graha-i18n";
import { patroCard } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";
import { searchToLocation } from "@/lib/url-state";
import {
  fetchGrahaAstaYear,
  grahaDetailKeys,
  type AstaStamp,
  type GrahaAstaPeriod,
} from "@/lib/api";

const routeApi = getRouteApi("/panchanga-shell/panchanga/graha-asta");

const GRAHA_ORDER = ["mercury", "venus", "moon", "mars", "jupiter", "saturn"];

function StampLine({
  label,
  stamp,
  tone,
}: {
  label: string;
  stamp: AstaStamp | null;
  tone: "asta" | "udaya";
}) {
  const { digits } = useLocale();
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-2">
      <span className={cn("font-semibold", tone === "asta" ? "text-danger" : "text-success")}>
        {label}
      </span>
      <span className="text-right font-num tabular-nums text-foreground font-semibold">
        {stamp ? (
          <>
            <span className="block">
              {stamp.date_bs ? digits(stamp.date_bs) : digits(stamp.date_ad)}
              <span className="text-muted-foreground"> · {digits(stamp.time_short)}</span>
            </span>
            {stamp.date_bs ? (
              <span className="block text-xs text-muted-foreground">{stamp.date_ad}</span>
            ) : null}
          </>
        ) : (
          <span className="text-muted-foreground">{t("graha_pages.asta.outside_year")}</span>
        )}
      </span>
    </div>
  );
}

function PeriodCard({ period }: { period: GrahaAstaPeriod }) {
  const { digits } = useLocale();
  const { t } = useTranslation();
  const hemi =
    period.hemisphere === "east"
      ? t("graha_pages.asta.east_morning")
      : period.hemisphere === "west"
        ? t("graha_pages.asta.west_evening")
        : null;
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border/70 bg-foreground/[0.02] p-2.5 text-sm">
      <StampLine label={t("graha_pages.asta.asta_begins")} stamp={period.start} tone="asta" />
      <StampLine label={t("graha_pages.asta.udaya_ends")} stamp={period.end} tone="udaya" />
      <div className="flex items-baseline justify-between gap-2 border-t border-border/60 pt-1 text-xs text-muted-foreground">
        <span>{hemi}</span>
        {period.duration_days != null ? (
          <span>{t("graha_pages.asta.duration_days", { count: digits(period.duration_days) })}</span>
        ) : null}
      </div>
    </div>
  );
}

export function GrahaAsta() {
  const { lang } = useLocale();
  const { t } = useTranslation();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const yearBrowse = usePatroYearUrlBrowse(search, navigate, location, setLocation);

  const query = useQuery({
    queryKey: grahaDetailKeys.asta(yearBrowse.browseYear, location.params, yearBrowse.era),
    queryFn: () => fetchGrahaAstaYear(yearBrowse.browseYear, location.params, yearBrowse.era),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(query.isLoading && !query.data);

  const byGraha = new Map<string, GrahaAstaPeriod[]>();
  for (const g of GRAHA_ORDER) byGraha.set(g, []);
  for (const p of query.data?.periods ?? []) {
    if (!byGraha.has(p.graha)) byGraha.set(p.graha, []);
    byGraha.get(p.graha)!.push(p);
  }

  return (
    <PageShell>
      <GrahaBanner
        icon={<Sunrise className="h-6 w-6 text-accent dark:text-secondary" />}
        titleKey="sidebar_nav.items.graha-asta.label"
        blurbKey="sidebar_nav.items.graha-asta.blurb"
      />

      <div className="space-y-3">
        <PatroYearNav
          calendarMode={yearBrowse.era}
          year={yearBrowse.browseYear}
          onYearChange={yearBrowse.setBrowseYear}
          currentYear={yearBrowse.currentBrowseYear}
          yearOptions={yearBrowse.yearOptions}
          location={location}
          onLocationChange={setLocation}
        />
      </div>

      {query.isLoading && !query.data ? (
        <p className="text-sm">{t("common.loading")}</p>
      ) : query.data ? (
        <div className="mt-2 columns-1 gap-3 sm:columns-2 lg:columns-3">
          {GRAHA_ORDER.map((g) => {
            const periods = byGraha.get(g) ?? [];
            const isMoon = g === "moon";
            return (
              <div
                key={g}
                className={cn(patroCard, "mb-3 flex break-inside-avoid flex-col")}
              >
                <div className="flex items-baseline justify-between gap-2 border-b border-border bg-secondary/[0.09] px-3 py-2 dark:bg-secondary/20">
                  <span className="text-base font-bold text-foreground">
                    {grahaName(g, lang)}
                    {isMoon ? (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {t("graha_pages.asta.tara_asta")}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {periods.length
                      ? t("graha_pages.asta.times", { count: periods.length })
                      : t("graha_pages.asta.none")}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-2">
                  {periods.length ? (
                    periods.map((p, i) => <PeriodCard key={i} period={p} />)
                  ) : (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      {t("graha_pages.asta.no_asta_year")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-danger">{t("common.load_error")}</p>
      )}

      <GrahaDescription pageId="graha-asta" />

      <p className="mt-6 text-sm">
        <Link to="/panchanga/details" className="text-primary underline">
          {t("element_page.all_elements")}
        </Link>
      </p>
    </PageShell>
  );
}

export default GrahaAsta;
