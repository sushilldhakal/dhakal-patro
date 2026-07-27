import { useState } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { SunTimesYearGrid } from "@/components/SunTimesYearGrid";
import { PatroYearNav } from "@/components/patro-date";
import { PageShell } from "@/components/PageShell";
import { usePatroYearUrlBrowse } from "@/hooks/use-patro-url-browse";
import { useRouteLoading } from "@/lib/route-loading";
import {
  displayLocationLabel,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { useLocale } from "@/i18n/locale";
import { adToBS } from "@/lib/bs-calendar";
import { getBsYearSpanLabel } from "@/lib/local-calendar";
import { searchToLocation } from "@/lib/url-state";
import { patroAyanaNorth, patroAyanaSouth } from "@/lib/patro-classes";

const routeApi = getRouteApi("/panchanga-shell/suryakranti");

export function SunTimesYear() {
  const { t } = useTranslation();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const { lang, digits, pick } = useLocale();
  const locationLabel = displayLocationLabel(location, undefined, lang);
  const yearBrowse = usePatroYearUrlBrowse(search, navigate, location, setLocation);
  const [gridLoading, setGridLoading] = useState(true);

  const bsYearForLabel =
    yearBrowse.era === "ad"
      ? adToBS(new Date(yearBrowse.browseYear, 6, 15)).year
      : yearBrowse.bsYear;
  const bsYearSpan = getBsYearSpanLabel(bsYearForLabel, lang, digits);
  const pageSubtitle =
    yearBrowse.era === "ad"
      ? pick(
          `वार्षिक सूर्योदय–सूर्यास्त · ${digits(yearBrowse.browseYear)} AD · ${bsYearSpan}`,
          `Annual sunrise & sunset · ${digits(yearBrowse.browseYear)} AD · ${bsYearSpan}`,
        )
      : pick(
          `वार्षिक सूर्योदय–सूर्यास्त · ${bsYearSpan}`,
          lang === "en"
            ? `Annual sunrise & sunset · ${bsYearSpan}`
            : `Annual sunrise & sunset · B.S. ${digits(yearBrowse.browseYear)}`,
        );

  useRouteLoading(gridLoading);

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
        <p className="text-sm mt-1 m-0">{pageSubtitle}</p>
      </div>

      <PatroYearNav
        calendarMode={yearBrowse.era}
        year={yearBrowse.browseYear}
        onYearChange={yearBrowse.setBrowseYear}
        currentYear={yearBrowse.currentBrowseYear}
        yearOptions={yearBrowse.yearOptions}
        location={location}
        onLocationChange={setLocation}
      />

      <SunTimesYearGrid
        browseYear={yearBrowse.browseYear}
        bsYear={yearBrowse.bsYear}
        era={yearBrowse.era}
        locationLabel={locationLabel}
        locationParams={location.params}
        hideHeader
        onLoadingChange={setGridLoading}
      />

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 text-sm leading-relaxed space-y-3">
        <h2 className="text-base font-bold m-0 flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-secondary shrink-0 dark:text-primary" />
          {t("sun_times.ayana_title")}
        </h2>
        <p className="m-0 text-base">
          <Trans
            i18nKey="sun_times.ayana_body"
            components={{
              north: <span className={patroAyanaNorth} />,
              south: <span className={patroAyanaSouth} />,
            }}
          />
        </p>
        {locationLabel ? (
          <p className="m-0 text-xs text-base">
            {pick("स्थान", "Location")}: {locationLabel}
          </p>
        ) : null}
      </section>
    </PageShell>
  );
}
