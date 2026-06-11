import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { BS_SUPPORTED_END_YEAR, BS_SUPPORTED_START_YEAR, getCurrentBs } from "../lib/bs-calendar";
import { cn } from "../lib/utils";

type Tab = "holidays" | "festivals";

const holidayCol = createColumnHelper<Holiday>();
const festivalCol = createColumnHelper<Festival>();

const HOLIDAY_COLUMNS = [
  holidayCol.accessor(r => r.name_ne ?? r.name_en ?? "—", {
    id: "name_ne",
    header: "Name (NE)",
    cell: i => <span className="font-medium">{i.getValue()}</span>,
  }),
  holidayCol.accessor(r => r.name_en ?? "—", {
    id: "name_en",
    header: "Name (EN)",
  }),
  holidayCol.accessor("bs_start_date", {
    header: "BS Date",
    cell: i => <span className="font-mono text-sm">{i.getValue() ?? "—"}</span>,
  }),
  holidayCol.accessor("start_date", {
    header: "AD Date",
    cell: i => <span className="font-mono text-sm">{i.getValue()}</span>,
  }),
  holidayCol.accessor("duration_days", {
    header: "Days",
    cell: i => i.getValue() ?? 1,
  }),
  holidayCol.accessor("type", {
    header: "Type",
    cell: i => (
      <span className="capitalize text-xs bg-muted px-2 py-0.5 rounded-full">
        {i.getValue() ?? "—"}
      </span>
    ),
  }),
];

const FESTIVAL_COLUMNS = [
  festivalCol.accessor(r => r.name_ne ?? r.name_en ?? "—", {
    id: "name_ne",
    header: "Name (NE)",
    cell: i => <span className="font-medium">{i.getValue()}</span>,
  }),
  festivalCol.accessor(r => r.name_en ?? "—", {
    id: "name_en",
    header: "Name (EN)",
  }),
  festivalCol.accessor("bs_start_date", {
    header: "BS Date",
    cell: i => <span className="font-mono text-sm">{i.getValue() ?? "—"}</span>,
  }),
  festivalCol.accessor("start_date", {
    header: "AD Date",
    cell: i => <span className="font-mono text-sm">{i.getValue() ?? "—"}</span>,
  }),
  festivalCol.accessor("type", {
    header: "Type",
    cell: i => (
      <span className="capitalize text-xs bg-muted px-2 py-0.5 rounded-full">
        {i.getValue() ?? "—"}
      </span>
    ),
  }),
  festivalCol.accessor("is_public_holiday", {
    header: "Gov't Holiday",
    cell: i =>
      i.getValue() ? (
        <span className="text-xs text-destructive font-semibold flex items-center gap-1">
          <Flag className="w-3 h-3" /> Yes
        </span>
      ) : null,
  }),
];

function DataTable<T>({
  data,
  columns,
  globalFilter,
}: {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: any[];
  globalFilter: string;
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
                No results found.
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

  return (
    <PageShell>
      <PageHeader
        icon={<PartyPopper className="w-6 h-6 text-secondary" />}
        title="Holidays & Festivals"
        subtitle="Nepal public holidays and religious festivals for a BS year"
      />

      {/* Year picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-muted-foreground">BS Year</label>
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
          { id: "holidays", label: "Government Holidays", icon: Flag, count: holidays.length },
          { id: "festivals", label: "All Festivals", icon: PartyPopper, count: festivals.length },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-secondary text-secondary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                {t.count}
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
          placeholder="Search festivals..."
          className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-muted/50 animate-pulse rounded-lg h-12" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
          Failed to load data. The API may need a moment to warm up.
        </div>
      )}

      {!loading && !error && tab === "holidays" && (
        <DataTable data={holidays} columns={HOLIDAY_COLUMNS} globalFilter={filter} />
      )}

      {!loading && !error && tab === "festivals" && (
        <DataTable data={festivals} columns={FESTIVAL_COLUMNS} globalFilter={filter} />
      )}
    </PageShell>
  );
}
