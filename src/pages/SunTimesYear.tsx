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
import { patroAyanaNorth, patroAyanaSouth, patroSelect } from "@/lib/patro-classes";

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
            className={patroSelect}
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

      <div className="mb-4 rounded-xl border border-border bg-secondary/4 p-3.5 shadow-xs shadow-ring-soft">
        <p className="m-0 mb-3 text-[13px] font-medium leading-relaxed text-muted-foreground [&_strong]:font-extrabold [&_strong]:text-foreground">
          <Trans i18nKey="sun_times.ayana_note" components={{ strong: <strong /> }} />
        </p>
        <div className="mb-3 overflow-x-auto">
          <table className="w-full border-collapse text-[13px] font-medium">
            <thead>
              <tr>
                <th scope="col" className="border-b border-border/80 px-2.5 py-2 text-left text-xs font-bold text-muted-foreground">
                  {t("sun_times.col_ayana")}
                </th>
                <th scope="col" className="border-b border-border/80 px-2.5 py-2 text-left text-xs font-bold text-muted-foreground">
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
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 text-[13px] font-semibold text-foreground no-underline transition-colors hover:border-secondary/35 hover:bg-secondary/10 hover:text-secondary dark:hover:border-primary/35 dark:hover:bg-primary/10 dark:hover:text-primary"
        >
          <CalendarRange className="h-4 w-4 shrink-0" />
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
