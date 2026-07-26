import { useEffect, useState } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { SunTimesYearGrid } from "@/components/SunTimesYearGrid";
import { GrahaYearHeader } from "@/components/graha/GrahaPageParts";
import { PageShell } from "@/components/PageShell";
import { useRouteLoading } from "@/lib/route-loading";
import {
  displayLocationLabel,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { useLocale } from "@/i18n/locale";
import {
  locationToSearch,
  sameLocationParams,
  sameSearch,
  searchToLocation,
  type PanchangaYearSearch,
} from "@/lib/url-state";
import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  getCurrentBs,
} from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { patroAyanaNorth, patroAyanaSouth } from "@/lib/patro-classes";

const routeApi = getRouteApi("/panchanga-shell/suryakranti");

function initialYearFromSearch(searchYear?: number): number {
  if (
    searchYear != null &&
    searchYear >= BS_SUPPORTED_START_YEAR &&
    searchYear <= BS_SUPPORTED_END_YEAR
  ) {
    return searchYear;
  }
  return getCurrentBs().year;
}

export function SunTimesYear() {
  const { t } = useTranslation();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const { lang } = useLocale();
  const locationLabel = displayLocationLabel(location, undefined, lang);
  const currentBs = getCurrentBs();
  const [year, setYear] = useState(() => initialYearFromSearch(search.year));
  const [gridLoading, setGridLoading] = useState(true);

  useRouteLoading(gridLoading);

  // Keep the URL shareable: year + location always encoded in search params.
  useEffect(() => {
    const desired: PanchangaYearSearch = {
      ...locationToSearch(location),
      year,
    };
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [location, year, search, navigate]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (search.year != null) {
      const next = initialYearFromSearch(search.year);
      setYear((current) => (current === next ? current : next));
    }
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <PageShell className="space-y-4 overflow-x-hidden pb-16">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-base hover:text-foreground mb-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("common.back_home")}
        </Link>
        <h1 className="text-xl font-bold leading-tight tracking-tight m-0">
          {t("sun_times.title")}
        </h1>
        <p className="text-sm mt-1 m-0">
          {t("sun_times.subtitle", { year: toNepaliDigits(year) })}
        </p>
      </div>

      <GrahaYearHeader
        year={year}
        onYearChange={setYear}
        currentYear={currentBs.year}
        location={location}
        onLocationChange={setLocation}
      />

      <div className="rounded-xl border border-border bg-secondary/4 p-3.5 shadow-xs shadow-ring-soft">
        <p className="m-0 mb-3 text-sm text-base leading-relaxed [&_strong]:font-extrabold [&_strong]:text-foreground">
          <Trans i18nKey="sun_times.ayana_note" components={{ strong: <strong /> }} />
        </p>
        <div className="mb-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm text-base">
            <thead>
              <tr>
                <th scope="col" className="border-b border-border/80 px-2.5 py-2 text-left text-xs font-bold">
                  {t("sun_times.col_ayana")}
                </th>
                <th scope="col" className="border-b border-border/80 px-2.5 py-2 text-left text-xs font-bold">
                  {t("sun_times.col_sun_sign")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-border/80 px-2.5 py-2 align-middle">
                  <span className={patroAyanaNorth}>उ</span> {t("sun_times.north_ayana")}
                </td>
                <td className="border-b border-border/80 px-2.5 py-2 align-middle">{t("sun_times.north_signs")}</td>
              </tr>
              <tr>
                <td className="px-2.5 py-2 align-middle">
                  <span className={patroAyanaSouth}>द</span> {t("sun_times.south_ayana")}
                </td>
                <td className="px-2.5 py-2 align-middle">{t("sun_times.south_signs")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Link
          to="/panchanga/year"
          search={{ year }}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold text-foreground no-underline transition-colors hover:border-secondary/35 hover:bg-secondary/10 hover:text-secondary dark:hover:border-primary/35 dark:hover:bg-primary/10 dark:hover:text-primary"
        >
          <CalendarRange className="h-4 w-4 shrink-0" />
          {t("sun_times.year_wheel_link")}
        </Link>
      </div>

      <SunTimesYearGrid
        bsYear={year}
        locationLabel={locationLabel}
        locationParams={location.params}
        hideHeader
        onLoadingChange={setGridLoading}
      />
    </PageShell>
  );
}
