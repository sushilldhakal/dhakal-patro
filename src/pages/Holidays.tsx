import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { PartyPopper, Flag, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
  fetchHolidays, fetchFestivals,
  holidayKeys,
  type Holiday, type Festival,
} from "../lib/api";
import { PageShell, PageHeader } from "../components/PageShell";
import { useRouteLoading } from "@/lib/route-loading";
import { BS_SUPPORTED_END_YEAR, BS_SUPPORTED_START_YEAR, getCurrentBs } from "../lib/bs-calendar";
import { formatLocaleDigits } from "@/i18n/digits";
import { cn } from "../lib/utils";

type Tab = "holidays" | "festivals";

const holidayCol = createColumnHelper<Holiday>();
const festivalCol = createColumnHelper<Festival>();

function useHolidayColumns() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      holidayCol.accessor(r => r.name_ne ?? r.name_en ?? "—", {
        id: "name_ne",
        header: t("holidays.col_name_ne"),
        cell: i => <span className="font-medium">{i.getValue()}</span>,
      }),
      holidayCol.accessor(r => r.name_en ?? "—", {
        id: "name_en",
        header: t("holidays.col_name_en"),
      }),
      holidayCol.accessor("bs_start_date", {
        header: t("holidays.col_bs_date"),
        cell: i => <span className="font-mono text-sm">{i.getValue() ?? "—"}</span>,
      }),
      holidayCol.accessor("start_date", {
        header: t("holidays.col_ad_date"),
        cell: i => <span className="font-mono text-sm">{i.getValue()}</span>,
      }),
      holidayCol.accessor("duration_days", {
        header: t("holidays.col_days"),
        cell: i => i.getValue() ?? 1,
      }),
      holidayCol.accessor("type", {
        header: t("holidays.col_type"),
        cell: i => (
          <span className="capitalize text-xs bg-muted px-2 py-0.5 rounded-full">
            {i.getValue() ?? "—"}
          </span>
        ),
      }),
    ],
    [t],
  );
}

function useFestivalColumns() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      festivalCol.accessor(r => r.name_ne ?? r.name_en ?? "—", {
        id: "name_ne",
        header: t("holidays.col_name_ne"),
        cell: i => <span className="font-medium">{i.getValue()}</span>,
      }),
      festivalCol.accessor(r => r.name_en ?? "—", {
        id: "name_en",
        header: t("holidays.col_name_en"),
      }),
      festivalCol.accessor("bs_start_date", {
        header: t("holidays.col_bs_date"),
        cell: i => <span className="font-mono text-sm">{i.getValue() ?? "—"}</span>,
      }),
      festivalCol.accessor("start_date", {
        header: t("holidays.col_ad_date"),
        cell: i => <span className="font-mono text-sm">{i.getValue()}</span>,
      }),
      festivalCol.accessor("type", {
        header: t("holidays.col_type"),
        cell: i => (
          <span className="capitalize text-xs bg-muted px-2 py-0.5 rounded-full">
            {i.getValue() ?? "—"}
          </span>
        ),
      }),
      festivalCol.accessor("is_public_holiday", {
        header: t("holidays.col_govt"),
        cell: i =>
          i.getValue() ? (
            <span className="text-xs text-destructive font-semibold flex items-center gap-1">
              <Flag className="w-3 h-3" /> {t("common.yes")}
            </span>
          ) : null,
      }),
    ],
    [t],
  );
}

function DataTable<T>({
  data,
  columns,
  globalFilter,
  emptyMessage,
}: {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: any[];
  globalFilter: string;
  emptyMessage: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th
                  key={h.id}
                  onClick={h.column.getToggleSortingHandler()}
                  className={cn(
                    "text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap",
                    h.column.getCanSort() && "cursor-pointer select-none hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-1">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getCanSort() && (
                      h.column.getIsSorted() === "asc" ? <ChevronUp className="w-3 h-3" /> :
                      h.column.getIsSorted() === "desc" ? <ChevronDown className="w-3 h-3" /> :
                      <ChevronsUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Holidays() {
  const { t } = useTranslation();
  const holidayColumns = useHolidayColumns();
  const festivalColumns = useFestivalColumns();
  const init = getCurrentBs();
  const [year, setYear] = useState(init.year);
  const [tab, setTab] = useState<Tab>("holidays");
  const [filter, setFilter] = useState("");

  const holidaysQ = useQuery({
    queryKey: holidayKeys.holidays(year),
    queryFn: () => fetchHolidays(year),
    staleTime: 1000 * 60 * 60,
  });

  const festivalsQ = useQuery({
    queryKey: holidayKeys.festivals(year),
    queryFn: () => fetchFestivals(year),
    staleTime: 1000 * 60 * 60,
  });

  const loading = tab === "holidays" ? holidaysQ.isLoading : festivalsQ.isLoading;
  const error = tab === "holidays" ? holidaysQ.isError : festivalsQ.isError;

  const holidays = holidaysQ.data?.holidays ?? [];
  const festivals = festivalsQ.data?.festivals ?? [];

  useRouteLoading(loading);

  return (
    <PageShell>
      <PageHeader
        icon={<PartyPopper className="w-6 h-6 text-secondary" />}
        title={t("holidays.page_title")}
        subtitle={t("holidays.page_subtitle")}
      />

      {/* Year picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-muted-foreground">{t("holidays.bs_year")}</label>
        <input
          type="number"
          value={year}
          min={BS_SUPPORTED_START_YEAR}
          max={BS_SUPPORTED_END_YEAR}
          onChange={e => setYear(Number(e.target.value))}
          className="w-28 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <span className="text-xs text-muted-foreground">
          {holidaysQ.data?.gregorian_range
            ? `(${holidaysQ.data.gregorian_range.start} – ${holidaysQ.data.gregorian_range.end})`
            : ""}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: "holidays" as const, labelKey: "holidays.tab_holidays", icon: Flag, count: holidays.length },
          { id: "festivals" as const, labelKey: "holidays.tab_festivals", icon: PartyPopper, count: festivals.length },
        ]).map(tItem => (
          <button
            key={tItem.id}
            onClick={() => setTab(tItem.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === tItem.id
                ? "border-secondary text-secondary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tItem.icon className="w-4 h-4" />
            {t(tItem.labelKey)}
            {tItem.count > 0 && (
              <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                {formatLocaleDigits(tItem.count)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder={t("holidays.search_placeholder")}
          className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
          {t("holidays.error")}
        </div>
      )}

      {!loading && !error && tab === "holidays" && (
        <DataTable
          data={holidays}
          columns={holidayColumns}
          globalFilter={filter}
          emptyMessage={t("common.no_results")}
        />
      )}

      {!loading && !error && tab === "festivals" && (
        <DataTable
          data={festivals}
          columns={festivalColumns}
          globalFilter={filter}
          emptyMessage={t("common.no_results")}
        />
      )}
    </PageShell>
  );
}
