import { useEffect, useMemo } from "react";
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

const MONTH_TABLE_COLUMNS = [
  monthCol.accessor("day", {
    header: "दिन",
    cell: (info) => (
      <span className="font-semibold tabular-nums">{toNepaliDigits(info.getValue())}</span>
    ),
  }),
  monthCol.accessor("ayanaMark", {
    header: "अयन",
    cell: (info) => {
      const mark = info.getValue();
      const ayanaNe = info.row.original.ayanaNe;
      if (!mark) return <span className="text-muted-foreground">—</span>;
      return (
        <span
          className={cn(
            "pn-sun-grid-ayana",
            mark === "उ" ? "pn-sun-grid-ayana--north" : "pn-sun-grid-ayana--south",
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
        <Sunrise className="size-4 text-orange-500" />
        सूर्योदय
      </span>
    ),
    cell: (info) => (
      <span className="font-mono text-base tabular-nums text-orange-600 dark:text-[#7fd6db]">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),
  monthCol.accessor("sunsetDisplay", {
    header: () => (
      <span className="inline-flex items-center gap-1.5">
        <Sunset className="size-4 text-blue-500" />
        सूर्यास्त
      </span>
    ),
    cell: (info) => (
      <span className="font-mono text-base tabular-nums text-destructive/90">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),
];

function MonthSunDataTable({
  rows,
  isLoading,
}: {
  rows: SunDayRow[];
  isLoading: boolean;
}) {
  const table = useReactTable({
    data: rows,
    columns: MONTH_TABLE_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table className="text-base">
      <TableHeader className="bg-muted/50">
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => (
              <TableHead key={h.id} className="px-3 py-3 text-sm font-semibold">
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
              {MONTH_TABLE_COLUMNS.map((col, colIdx) => (
                <TableCell
                  key={col.id ?? ("accessorKey" in col ? String(col.accessorKey) : colIdx)}
                  className="px-3 py-3"
                >
                  <span className="pn-sun-grid-skel h-5" />
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
  return (
    <div className={cn("pn-sun-grid-head", hideHeader && "pn-sun-grid-head--legend-only")}>
      {!hideHeader ? (
        <div className="pn-sun-grid-titles">
          <h3 className="pn-sun-grid-title">सूर्य क्रान्ति</h3>
          <span className="pn-sun-grid-sub">
            Suryakranti · {locationLabel} · वि.सं. {bsYear}
          </span>
        </div>
      ) : null}
      <div className="pn-sun-grid-legend">
        <span className="pn-sun-grid-legend-item">
          <Sunrise className="size-4" strokeWidth={1.8} />
          सूर्योदय
        </span>
        <span className="pn-sun-grid-legend-item">
          <Sunset className="size-4" strokeWidth={1.8} />
          सूर्यास्त
        </span>
        <span className="pn-sun-grid-legend-item">
          <span className="pn-sun-grid-ayana pn-sun-grid-ayana--north">उ</span>
          उत्तरायण
        </span>
        <span className="pn-sun-grid-legend-item">
          <span className="pn-sun-grid-ayana pn-sun-grid-ayana--south">द</span>
          दक्षिणायण
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
  return (
    <div className="pn-sun-grid-scroll">
      <table className="pn-sun-grid" aria-label={`Sunrise and sunset grid for BS year ${bsYear}`}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="pn-sun-grid-corner">
              दिन
            </TableHead>
            {BS_MONTHS_NE.map((name) => (
              <TableHead key={name} scope="col" className="pn-sun-grid-month">
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
                <TableHead scope="row" className="pn-sun-grid-day">
                  {toNepaliDigits(day)}
                </TableHead>
                {Array.from({ length: 12 }, (_, colIdx) => {
                  const month = colIdx + 1;
                  const monthLen = getBSMonthLength(bsYear, month);
                  if (day > monthLen) {
                    return (
                      <TableCell key={month} className="pn-sun-grid-cell empty" aria-hidden />
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
                        "pn-sun-grid-cell",
                        isLoading && !cell && "loading",
                      )}
                      title={title}
                    >
                      {isLoading && !cell ? (
                        <span className="pn-sun-grid-skel" />
                      ) : cell?.sunrise || cell?.sunset ? (
                        <>
                          {cell.ayanaMark ? (
                            <span
                              className={cn(
                                "pn-sun-grid-ayana",
                                cell.ayanaMark === "उ"
                                  ? "pn-sun-grid-ayana--north"
                                  : "pn-sun-grid-ayana--south",
                              )}
                              title={cell.ayanaNe}
                            >
                              {cell.ayanaMark}
                            </span>
                          ) : null}
                          <span className="pn-sun-grid-rise">
                            {cell.sunriseDisplay ?? "—"}
                          </span>
                          <span className="pn-sun-grid-set">
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
                  {toNepaliDigits(getBSMonthLength(bsYear, month))} दिन
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
      <div className="pn-sun-grid-wrap">
        <p className="pn-sun-grid-error">Could not load sunrise/sunset times for this location.</p>
      </div>
    );
  }

  return (
    <div className="pn-sun-grid-wrap">
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
