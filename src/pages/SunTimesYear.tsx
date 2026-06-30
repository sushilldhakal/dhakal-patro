import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { ArrowLeft, CalendarRange, MapPin } from "lucide-react";
import { SunTimesYearGrid } from "@/components/SunTimesYearGrid";
import { useRouteLoading } from "@/lib/route-loading";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  getCurrentBs,
} from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

export function SunTimesYear() {
  const { t } = useTranslation();
  const { location, setLocation } = usePanchangaLocation();
  const [year, setYear] = useState(() => getCurrentBs().year);
  const [gridLoading, setGridLoading] = useState(true);

  useRouteLoading(gridLoading);

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 mt-2">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("common.back_home")}
          </Link>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0">
            {t("sun_times.title")}
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            {t("sun_times.subtitle", { year: toNepaliDigits(year) })}
            {" · "}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
          <select
            className="pn-select"
            value={year}
            aria-label={t("common.bs_year")}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {BS_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <LocationSelector
            compact
            className="shrink-0"
            location={location}
            onLocationChange={setLocation}
          />
        </div>
      </div>

      <div className="pn-suryakranti-ayana-note">
        <p className="pn-suryakranti-ayana-lead">
          <Trans i18nKey="sun_times.ayana_note" components={{ strong: <strong /> }} />
        </p>
        <div className="pn-suryakranti-ayana-table-wrap">
          <table className="pn-suryakranti-ayana-table">
            <thead>
              <tr>
                <th scope="col">{t("sun_times.col_ayana")}</th>
                <th scope="col">{t("sun_times.col_sun_sign")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="pn-sun-grid-ayana pn-sun-grid-ayana--north">उ</span>{" "}
                  {t("sun_times.north_ayana")}
                </td>
                <td>{t("sun_times.north_signs")}</td>
              </tr>
              <tr>
                <td>
                  <span className="pn-sun-grid-ayana pn-sun-grid-ayana--south">द</span>{" "}
                  {t("sun_times.south_ayana")}
                </td>
                <td>{t("sun_times.south_signs")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Link
          to="/panchanga/year"
          search={{ year }}
          className="pn-suryakranti-ayana-cta"
        >
          <CalendarRange className="w-4 h-4 shrink-0" />
          {t("sun_times.year_wheel_link")}
        </Link>
      </div>

      <SunTimesYearGrid
        bsYear={year}
        locationLabel={location.label}
        locationParams={location.params}
        hideHeader
        onLoadingChange={setGridLoading}
      />
    </div>
  );
}
