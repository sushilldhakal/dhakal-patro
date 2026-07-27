import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueries } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Sunrise, Sunset } from "lucide-react";
import type { CalendarEra } from "@/hooks/use-calendar-era";
import { useLocale, bilingualText } from "@/i18n/locale";
import {
  fetchYearSunTimes,
  sunYearKeys,
  type SunYearDay,
  type SunYearResponse,
  type LocationParams,
} from "@/lib/api";
import {
  AD_MONTHS_SHORT,
  AD_MONTHS_SHORT_NE,
  BS_MONTHS_NE,
  adToBS,
  getBSMonthLength,
  getCurrentBs,
} from "@/lib/bs-calendar";
import { formatClockNepali, formatAyanaMarkShort, formatTimeShort, isAyanaNorthMark } from "@/lib/panchanga-format";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  patroAyanaNorth,
  patroAyanaSouth,
  patroSkel,
  patroStickyHeadCell,
  patroStickyHeadRow,
  patroSunRise,
  patroSunSet,
} from "@/lib/patro-classes";

export type SunDayRow = {
  day: number;
  sunrise?: string;
  sunset?: string;
  sunriseDisplay?: string;
  sunsetDisplay?: string;
  ayanaMark?: "उ" | "द";
  ayanaNe?: string;
};

type SunCell = SunDayRow;

function resolveAyanaMark(
  day: SunYearDay,
  isEnglish: boolean,
): { mark?: "उ" | "द"; label?: string } {
  if (!day.ayana_mark) return {};
  const label = isEnglish
    ? (day.aayan ?? day.aayan_ne ?? (day.ayana_mark === "उ" ? "Uttarayana" : "Dakshinayana"))
    : (day.aayan_ne ?? day.aayan);
  return { mark: day.ayana_mark, label };
}

function formatClockDisplay(time: string | undefined, nepaliDigits: boolean): string | undefined {
  if (!time) return undefined;
  return nepaliDigits ? formatClockNepali(time) : formatTimeShort(time);
}

function dayCell(
  d: SunYearDay,
  nepaliDigits: boolean,
  isEnglish: boolean,
): SunCell {
  const sunrise = formatTimeShort(d.sunrise);
  const sunset = formatTimeShort(d.sunset);
  const { mark: ayanaMark, label: ayanaNe } = resolveAyanaMark(d, isEnglish);
  return {
    day: d.day,
    sunrise,
    sunset,
    sunriseDisplay: formatClockDisplay(sunrise, nepaliDigits),
    sunsetDisplay: formatClockDisplay(sunset, nepaliDigits),
    ayanaMark,
    ayanaNe,
  };
}

function buildBsYearGrid(
  months: (SunYearDay[] | undefined)[],
  nepaliDigits: boolean,
  isEnglish: boolean,
): Map<string, SunCell> {
  const grid = new Map<string, SunCell>();

  months.forEach((days, monthIdx) => {
    if (!days) return;
    const month = monthIdx + 1;
    for (const d of days) {
      grid.set(`${month}-${d.day}`, dayCell(d, nepaliDigits, isEnglish));
    }
  });

  return grid;
}

function parseDateAd(dateAd: string): Date {
  const [y, m, day] = dateAd.split("-").map(Number);
  return new Date(y!, m! - 1, day!);
}

function bsYearsForAdYear(adYear: number): number[] {
  const start = adToBS(new Date(adYear, 0, 1)).year;
  const end = adToBS(new Date(adYear, 11, 31)).year;
  return start === end ? [start] : [start, end];
}

function buildAdYearGrid(
  responses: (SunYearResponse | undefined)[],
  adYear: number,
  nepaliDigits: boolean,
  isEnglish: boolean,
): Map<string, SunCell> {
  const grid = new Map<string, SunCell>();
  for (const resp of responses) {
    if (!resp) continue;
    for (const month of resp.months) {
      for (const d of month.calendar) {
        if (!d.date_ad) continue;
        const adDate = parseDateAd(d.date_ad);
        if (adDate.getFullYear() !== adYear) continue;
        const adMonth = adDate.getMonth() + 1;
        const adDay = adDate.getDate();
        grid.set(`${adMonth}-${adDay}`, {
          ...dayCell(d, nepaliDigits, isEnglish),
          day: adDay,
        });
      }
    }
  }
  return grid;
}

function getAdMonthLength(adYear: number, month: number): number {
  return new Date(adYear, month, 0).getDate();
}

function buildMonthRows(
  month: number,
  monthLen: number,
  grid: Map<string, SunCell>,
): SunDayRow[] {
  return Array.from({ length: monthLen }, (_, i) => {
    const day = i + 1;
    return grid.get(`${month}-${day}`) ?? { day };
  });
}

const monthCol = createColumnHelper<SunDayRow>();

function useMonthTableColumns() {
  const { t } = useTranslation();
  const { digits, lang } = useLocale();
  return useMemo(
    () => [
      monthCol.accessor("day", {
        header: t("sun_times.col_day"),
        cell: (info) => (
          <span className="font-semibold tabular-nums">{digits(info.getValue())}</span>
        ),
      }),
      monthCol.accessor("ayanaMark", {
        header: t("sun_times.col_ayana_short"),
        cell: (info) => {
          const mark = info.getValue();
          const ayanaNe = info.row.original.ayanaNe;
          if (!mark) return <span>—</span>;
          return (
            <span
              className={cn(
                isAyanaNorthMark(mark) ? patroAyanaNorth : patroAyanaSouth,
              )}
              title={ayanaNe}
            >
              {formatAyanaMarkShort(mark, lang)}
            </span>
          );
        },
      }),
      monthCol.accessor("sunriseDisplay", {
        header: () => (
          <span className="inline-flex items-center gap-1.5">
            <Sunrise className="size-4 text-primary" />
            {t("sun_times.col_sunrise")}
          </span>
        ),
        cell: (info) => (
          <span className="font-mono text-base tabular-nums text-primary dark:text-accent">
            {info.getValue() ?? "—"}
          </span>
        ),
      }),
      monthCol.accessor("sunsetDisplay", {
        header: () => (
          <span className="inline-flex items-center gap-1.5">
            <Sunset className="size-4 text-blue-500" />
            {t("sun_times.col_sunset")}
          </span>
        ),
        cell: (info) => (
          <span className="font-mono text-base tabular-nums text-destructive/90">
            {info.getValue() ?? "—"}
          </span>
        ),
      }),
    ],
    [t, digits, lang],
  );
}

function MonthSunDataTable({
  rows,
  isLoading,
}: {
  rows: SunDayRow[];
  isLoading: boolean;
}) {
  const columns = useMonthTableColumns();
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table className="text-base">
      <TableHeader className="bg-muted">
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id} className={cn(patroStickyHeadRow, "hover:bg-muted")}>
            {hg.headers.map((h) => (
              <TableHead key={h.id} className={cn(patroStickyHeadCell, "px-3 py-3 text-sm font-semibold")}>
                {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading && rows.every((r) => !r.sunrise && !r.sunset) ? (
          Array.from({ length: rows.length }).map((_, i) => (
            <TableRow key={i}>
              {columns.map((col, colIdx) => (
                <TableCell
                  key={col.id ?? ("accessorKey" in col ? String(col.accessorKey) : colIdx)}
                  className="px-3 py-3"
                >
                  <span className={cn(patroSkel, "h-5")} />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-3 py-2.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function SunTimesLegend({
  hideHeader,
  locationLabel,
  browseYear,
}: {
  hideHeader: boolean;
  locationLabel: string;
  browseYear: number;
}) {
  const { t } = useTranslation();
  const { lang, digits } = useLocale();
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 pt-3.5 pb-2.5",
        hideHeader && "justify-end",
      )}
    >
      {!hideHeader ? (
        <div>
          <h3 className="m-0 text-base font-bold">{t("sun_times.grid_title")}</h3>
          <span className="mt-0.5 block text-sm text-base">
            {t("sun_times.subtitle", { year: digits(browseYear) })} · {locationLabel}
          </span>
        </div>
      ) : null}
      <div className="flex shrink-0 gap-3">
        <span className="inline-flex items-center gap-1 text-sm text-base">
          <Sunrise className="size-4" strokeWidth={1.8} />
          {t("sun_times.col_sunrise")}
        </span>
        <span className="inline-flex items-center gap-1 text-sm text-base">
          <Sunset className="size-4" strokeWidth={1.8} />
          {t("sun_times.col_sunset")}
        </span>
        <span className="inline-flex items-center gap-1 text-sm text-base">
          <span className={patroAyanaNorth}>{bilingualText(lang, "उ", "N")}</span>
          {t("sun_times.north_ayana")}
        </span>
        <span className="inline-flex items-center gap-1 text-sm text-base">
          <span className={patroAyanaSouth}>{bilingualText(lang, "द", "S")}</span>
          {t("sun_times.south_ayana")}
        </span>
      </div>
    </div>
  );
}

type CalendarLayout = {
  year: number;
  monthLabels: readonly string[];
  getMonthLength: (month: number) => number;
  maxDay: number;
  defaultMonth: string;
};

function SunTimesYearMatrix({
  layout,
  grid,
  isLoading,
}: {
  layout: CalendarLayout;
  grid: Map<string, SunCell>;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const { digits, lang } = useLocale();
  const { year, monthLabels, getMonthLength, maxDay } = layout;

  return (
    <div className="max-w-full overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]">
      <table
        className="w-max min-w-full border-collapse table-fixed text-sm font-semibold font-num"
        aria-label={t("sun_times.grid_aria", { year })}
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              scope="col"
              className="sticky left-0 z-[4] w-12 min-w-12 border-r border-b border-border bg-card px-2.5 py-2 text-center text-sm font-bold"
            >
              {t("sun_times.col_day")}
            </TableHead>
            {monthLabels.map((name) => (
              <TableHead
                key={name}
                scope="col"
                className="w-[72px] min-w-[72px] overflow-hidden border-b border-border bg-card px-1 py-2.5 text-center text-xs font-bold whitespace-nowrap text-ellipsis"
              >
                {name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: maxDay }, (_, rowIdx) => {
            const day = rowIdx + 1;
            return (
              <TableRow key={day} className="hover:bg-transparent">
                <TableHead
                  scope="row"
                  className="sticky left-0 z-[2] w-12 min-w-12 border-r border-b border-border/70 bg-card px-2.5 py-2 text-center text-sm font-bold"
                >
                  {digits(day)}
                </TableHead>
                {Array.from({ length: 12 }, (_, colIdx) => {
                  const month = colIdx + 1;
                  const monthLen = getMonthLength(month);
                  if (day > monthLen) {
                    return (
                      <TableCell
                        key={month}
                        className="w-[72px] min-w-[72px] min-h-10 border-r border-b border-border/50 bg-surface-muted px-1 py-1.5 text-center align-middle leading-snug opacity-45"
                        aria-hidden
                      />
                    );
                  }

                  const cell = grid.get(`${month}-${day}`);
                  const title =
                    cell?.sunrise && cell?.sunset
                      ? `${monthLabels[colIdx]} ${day}: ${cell.ayanaMark ? `${cell.ayanaNe ?? formatAyanaMarkShort(cell.ayanaMark, lang)} · ` : ""}↑ ${cell.sunriseDisplay ?? cell.sunrise} ↓ ${cell.sunsetDisplay ?? cell.sunset}`
                      : undefined;

                  return (
                    <TableCell
                      key={month}
                      className={cn(
                        "w-[72px] min-w-[72px] min-h-10 border-r border-b border-border/50 px-1 py-1.5 text-center align-middle leading-snug",
                        isLoading && !cell && "bg-surface-inset",
                      )}
                      title={title}
                    >
                      {isLoading && !cell ? (
                        <span className={patroSkel} />
                      ) : cell?.sunrise || cell?.sunset ? (
                        <>
                          <span className={cn(patroSunRise, "whitespace-nowrap")}>
                            {cell.sunriseDisplay ?? "—"}
                            {cell.ayanaMark ? (
                              <>
                                {" "}
                                <span
                                  className={cn(
                                    isAyanaNorthMark(cell.ayanaMark)
                                      ? patroAyanaNorth
                                      : patroAyanaSouth,
                                    "mb-0 text-[11px] align-baseline",
                                  )}
                                  title={cell.ayanaNe}
                                >
                                  {formatAyanaMarkShort(cell.ayanaMark, lang)}
                                </span>
                              </>
                            ) : null}
                          </span>
                          <span className={patroSunSet}>
                            {cell.sunsetDisplay ?? "—"}
                          </span>
                        </>
                      ) : null}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </table>
    </div>
  );
}

function SunTimesYearAccordion({
  layout,
  grid,
  isLoading,
}: {
  layout: CalendarLayout;
  grid: Map<string, SunCell>;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const { digits } = useLocale();
  const { monthLabels, getMonthLength, defaultMonth } = layout;

  return (
    <Accordion
      key={isLoading ? "loading" : `ready-${layout.year}`}
      type="single"
      collapsible
      defaultValue={isLoading ? undefined : defaultMonth}
      className="px-3 pb-3"
    >
      {monthLabels.map((name, idx) => {
        const month = idx + 1;
        const monthLen = getMonthLength(month);
        const rows = buildMonthRows(month, monthLen, grid);
        return (
          <AccordionItem key={name} value={`month-${month}`} className="border-border">
            <AccordionTrigger className="px-1 text-base font-semibold hover:no-underline">
              <span>
                {name}
                <span className="ml-2 text-sm font-normal">
                  {t("sun_times.days_count", { count: digits(monthLen) })}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-0">
              <MonthSunDataTable rows={rows} isLoading={isLoading} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

interface Props {
  era: CalendarEra;
  browseYear: number;
  bsYear: number;
  locationLabel: string;
  locationParams: LocationParams;
  /** Hide title row when the parent page supplies its own heading */
  hideHeader?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

export function SunTimesYearGrid({
  era,
  browseYear,
  bsYear,
  locationLabel,
  locationParams,
  hideHeader = false,
  onLoadingChange,
}: Props) {
  const { t } = useTranslation();
  const { isEnglish } = useLocale();
  const nepaliDigits = !isEnglish;

  const fetchYears = era === "ad" ? bsYearsForAdYear(browseYear) : [bsYear];

  const yearQueries = useQueries({
    queries: fetchYears.map((y) => ({
      queryKey: sunYearKeys.year(y, locationParams),
      queryFn: () => fetchYearSunTimes(y, locationParams),
      staleTime: 1000 * 60 * 60 * 24,
    })),
  });

  const isLoading = yearQueries.some((q) => q.isLoading);
  const isError = yearQueries.some((q) => q.isError);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const grid = useMemo(() => {
    if (era === "ad") {
      return buildAdYearGrid(
        yearQueries.map((q) => q.data),
        browseYear,
        nepaliDigits,
        isEnglish,
      );
    }
    const monthDays = yearQueries[0]?.data?.months.map((month) => month.calendar);
    return buildBsYearGrid(monthDays ?? [], nepaliDigits, isEnglish);
  }, [yearQueries, era, browseYear, nepaliDigits, isEnglish]);

  const layout = useMemo((): CalendarLayout => {
    if (era === "ad") {
      const monthLabels = isEnglish ? AD_MONTHS_SHORT : AD_MONTHS_SHORT_NE;
      const today = new Date();
      const defaultMonth =
        today.getFullYear() === browseYear ? String(today.getMonth() + 1) : "1";
      let maxDay = 31;
      for (let m = 1; m <= 12; m += 1) {
        maxDay = Math.max(maxDay, getAdMonthLength(browseYear, m));
      }
      return {
        year: browseYear,
        monthLabels,
        getMonthLength: (month) => getAdMonthLength(browseYear, month),
        maxDay,
        defaultMonth: `month-${defaultMonth}`,
      };
    }

    const currentBs = getCurrentBs();
    let maxDay = 30;
    for (let m = 1; m <= 12; m += 1) {
      maxDay = Math.max(maxDay, getBSMonthLength(bsYear, m));
    }
    return {
      year: browseYear,
      monthLabels: BS_MONTHS_NE,
      getMonthLength: (month) => getBSMonthLength(bsYear, month),
      maxDay,
      defaultMonth:
        currentBs.year === bsYear ? `month-${currentBs.month}` : "month-1",
    };
  }, [era, browseYear, bsYear, isEnglish]);

  if (isError) {
    return (
      <div className="mt-5 max-w-full overflow-hidden rounded-xl bg-card shadow-xs shadow-ring-soft">
        <p className="m-0 px-4 py-3.5 text-xs text-base">
          {t("sun_times.load_error")}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 max-w-full overflow-hidden rounded-xl bg-card shadow-xs shadow-ring-soft">
      <SunTimesLegend
        hideHeader={hideHeader}
        locationLabel={locationLabel}
        browseYear={browseYear}
      />

      <div className="hidden lg:block">
        <SunTimesYearMatrix layout={layout} grid={grid} isLoading={isLoading} />
      </div>

      <div className="lg:hidden">
        <SunTimesYearAccordion layout={layout} grid={grid} isLoading={isLoading} />
      </div>
    </div>
  );
}
