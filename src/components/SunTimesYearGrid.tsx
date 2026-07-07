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
import {
  fetchMonthCalendar,
  panchangaKeys,
  type CalendarDay,
  type LocationParams,
} from "@/lib/api";
import { BS_MONTHS_NE, getBSMonthLength, getCurrentBs } from "@/lib/bs-calendar";
import { formatClockNepali, formatTimeShort, toNepaliDigits } from "@/lib/panchanga-format";
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

function resolveAyanaMark(day: CalendarDay): { mark?: "उ" | "द"; label?: string } {
  if (!day.ayana_mark) return {};
  return { mark: day.ayana_mark, label: day.aayan_ne ?? day.aayan };
}

function buildYearGrid(
  months: (CalendarDay[] | undefined)[],
): Map<string, SunCell> {
  const grid = new Map<string, SunCell>();

  months.forEach((days, monthIdx) => {
    if (!days) return;
    const month = monthIdx + 1;
    for (const d of days) {
      const sunrise = formatTimeShort(d.sunrise);
      const sunset = formatTimeShort(d.sunset);
      const { mark: ayanaMark, label: ayanaNe } = resolveAyanaMark(d);
      grid.set(`${month}-${d.day}`, {
        day: d.day,
        sunrise,
        sunset,
        sunriseDisplay: formatClockNepali(sunrise),
        sunsetDisplay: formatClockNepali(sunset),
        ayanaMark,
        ayanaNe,
      });
    }
  });

  return grid;
}

function buildMonthRows(bsYear: number, month: number, grid: Map<string, SunCell>): SunDayRow[] {
  const monthLen = getBSMonthLength(bsYear, month);
  return Array.from({ length: monthLen }, (_, i) => {
    const day = i + 1;
    return grid.get(`${month}-${day}`) ?? { day };
  });
}

const monthCol = createColumnHelper<SunDayRow>();

function useMonthTableColumns() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      monthCol.accessor("day", {
        header: t("sun_times.col_day"),
        cell: (info) => (
          <span className="font-semibold tabular-nums">{toNepaliDigits(info.getValue())}</span>
        ),
      }),
      monthCol.accessor("ayanaMark", {
        header: t("sun_times.col_ayana_short"),
        cell: (info) => {
          const mark = info.getValue();
          const ayanaNe = info.row.original.ayanaNe;
          if (!mark) return <span className="text-muted-foreground">—</span>;
          return (
            <span
              className={cn(
                mark === "उ" ? patroAyanaNorth : patroAyanaSouth,
              )}
              title={ayanaNe}
            >
              {mark}
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
    [t],
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
          Array.from({ length: 6 }).map((_, i) => (
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

function SunTimesLegend({ hideHeader, locationLabel, bsYear }: {
  hideHeader: boolean;
  locationLabel: string;
  bsYear: number;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 pt-3.5 pb-2.5",
        hideHeader && "justify-end",
      )}
    >
      {!hideHeader ? (
        <div>
          <h3 className="m-0 text-[15px] font-bold">{t("sun_times.grid_title")}</h3>
          <span className="mt-0.5 block text-[11.5px] font-medium text-muted-foreground">
            {t("sun_times.subtitle", { year: toNepaliDigits(bsYear) })} · {locationLabel}
          </span>
        </div>
      ) : null}
      <div className="flex shrink-0 gap-3">
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
          <Sunrise className="size-4" strokeWidth={1.8} />
          {t("sun_times.col_sunrise")}
        </span>
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
          <Sunset className="size-4" strokeWidth={1.8} />
          {t("sun_times.col_sunset")}
        </span>
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
          <span className={patroAyanaNorth}>उ</span>
          {t("sun_times.north_ayana")}
        </span>
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
          <span className={patroAyanaSouth}>द</span>
          {t("sun_times.south_ayana")}
        </span>
      </div>
    </div>
  );
}

function SunTimesYearMatrix({
  bsYear,
  grid,
  maxDay,
  isLoading,
}: {
  bsYear: number;
  grid: Map<string, SunCell>;
  maxDay: number;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="max-w-full overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]">
      <table
        className="w-max min-w-full border-collapse table-fixed text-[13px] font-semibold font-num"
        aria-label={`Sunrise and sunset grid for BS year ${bsYear}`}
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              scope="col"
              className="sticky left-0 z-[4] w-12 min-w-12 border-r border-b border-border bg-card px-2.5 py-2 text-center text-[13px] font-bold text-muted-foreground"
            >
              {t("sun_times.col_day")}
            </TableHead>
            {BS_MONTHS_NE.map((name) => (
              <TableHead
                key={name}
                scope="col"
                className="w-[72px] min-w-[72px] overflow-hidden border-b border-border bg-card px-1 py-2.5 text-center text-xs font-bold whitespace-nowrap text-ellipsis text-muted-foreground"
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
                  className="sticky left-0 z-[2] w-12 min-w-12 border-r border-b border-border/70 bg-card px-2.5 py-2 text-center text-[13px] font-bold text-muted-foreground"
                >
                  {toNepaliDigits(day)}
                </TableHead>
                {Array.from({ length: 12 }, (_, colIdx) => {
                  const month = colIdx + 1;
                  const monthLen = getBSMonthLength(bsYear, month);
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
                      ? `${BS_MONTHS_NE[colIdx]} ${day}: ${cell.ayanaMark ? `${cell.ayanaNe ?? cell.ayanaMark} · ` : ""}↑ ${cell.sunriseDisplay ?? cell.sunrise} ↓ ${cell.sunsetDisplay ?? cell.sunset}`
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
                          {cell.ayanaMark ? (
                            <span
                              className={cn(
                                cell.ayanaMark === "उ" ? patroAyanaNorth : patroAyanaSouth,
                              )}
                              title={cell.ayanaNe}
                            >
                              {cell.ayanaMark}
                            </span>
                          ) : null}
                          <span className={patroSunRise}>
                            {cell.sunriseDisplay ?? "—"}
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
  bsYear,
  grid,
  isLoading,
}: {
  bsYear: number;
  grid: Map<string, SunCell>;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const currentMonth =
    getCurrentBs().year === bsYear ? String(getCurrentBs().month) : "1";

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={`month-${currentMonth}`}
      className="px-3 pb-3"
    >
      {BS_MONTHS_NE.map((name, idx) => {
        const month = idx + 1;
        const rows = buildMonthRows(bsYear, month, grid);
        return (
          <AccordionItem key={name} value={`month-${month}`} className="border-border">
            <AccordionTrigger className="px-1 text-base font-semibold hover:no-underline">
              <span>
                {name}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {t("sun_times.days_count", { count: toNepaliDigits(getBSMonthLength(bsYear, month)) })}
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
  bsYear: number;
  locationLabel: string;
  locationParams: LocationParams;
  /** Hide title row when the parent page supplies its own heading */
  hideHeader?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

export function SunTimesYearGrid({
  bsYear,
  locationLabel,
  locationParams,
  hideHeader = false,
  onLoadingChange,
}: Props) {
  const monthQueries = useQueries({
    queries: Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        queryKey: panchangaKeys.month(bsYear, month, locationParams, false),
        queryFn: () => fetchMonthCalendar(bsYear, month, locationParams, { full: false }),
        staleTime: 1000 * 60 * 60,
      };
    }),
  });

  const isLoading = monthQueries.some((q) => q.isLoading);
  const isError = monthQueries.every((q) => q.isError);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const grid = useMemo(() => {
    const monthDays = monthQueries.map((q) => q.data?.calendar);
    return buildYearGrid(monthDays);
  }, [monthQueries]);

  const maxDay = useMemo(() => {
    let max = 30;
    for (let m = 1; m <= 12; m += 1) {
      max = Math.max(max, getBSMonthLength(bsYear, m));
    }
    return max;
  }, [bsYear]);

  if (isError) {
    return (
      <div className="mt-5 max-w-full overflow-hidden rounded-xl bg-card shadow-xs shadow-ring-soft">
        <p className="m-0 px-4 py-3.5 text-xs font-medium text-muted-foreground">
          Could not load sunrise/sunset times for this location.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 max-w-full overflow-hidden rounded-xl bg-card shadow-xs shadow-ring-soft">
      <SunTimesLegend
        hideHeader={hideHeader}
        locationLabel={locationLabel}
        bsYear={bsYear}
      />

      <div className="hidden lg:block">
        <SunTimesYearMatrix
          bsYear={bsYear}
          grid={grid}
          maxDay={maxDay}
          isLoading={isLoading}
        />
      </div>

      <div className="lg:hidden">
        <SunTimesYearAccordion bsYear={bsYear} grid={grid} isLoading={isLoading} />
      </div>
    </div>
  );
}
