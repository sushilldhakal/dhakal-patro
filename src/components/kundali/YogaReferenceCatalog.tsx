import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { useLocale } from "@/i18n/locale";
import {
  fetchYogaReference,
  type YogaReferenceEntry,
} from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const th = "h-9 px-2.5 text-sm font-semibold uppercase tracking-wide";
const td = "px-2.5 py-2 text-sm align-top";

/**
 * Static reference catalog of the 162 planetary combinations (B. V. Raman,
 * "Three Hundred Important Combinations", Part I). Fetched once from the
 * CDN-cached `/kundali/yogas/reference` endpoint and filtered client-side.
 * This is a fixed lookup table, independent of the current chart.
 */
export function YogaReferenceCatalog() {
  const { pick } = useLocale();
  const [entries, setEntries] = useState<YogaReferenceEntry[] | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open || entries || error) return;
    let alive = true;
    fetchYogaReference()
      .then((res) => alive && setEntries(res.combinations))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [open, entries, error]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.yogaId.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q) ||
        e.result.toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <div className="mt-4 rounded-xl border border-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {pick("योग सन्दर्भ सूची (१६२ संयोग)", "Yoga reference catalog (162 combinations)")}
          </span>
          <span className="text-xs text-muted-foreground">
            {pick(
              "बी. वी. रमनको “Three Hundred Important Combinations”, भाग I",
              "B. V. Raman — “Three Hundred Important Combinations”, Part I",
            )}
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="border-t border-border/60 p-3">
          {error ? (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">
              {pick("सन्दर्भ सूची लोड गर्न सकिएन।", "Could not load the reference catalog.")}
            </p>
          ) : !entries ? (
            <p className="flex items-center justify-center gap-2 px-1 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {pick("लोड हुँदैछ…", "Loading…")}
            </p>
          ) : (
            <>
              <label className="mb-3 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={pick(
                    "नाम, नियम वा फलले खोज्नुहोस्…",
                    "Search name, rule or result…",
                  )}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className={cn(th, "pl-3.5")}>ID</TableHead>
                      <TableHead className={th}>{pick("योग", "Yoga")}</TableHead>
                      <TableHead className={th}>{pick("नियम", "Rule")}</TableHead>
                      <TableHead className={cn(th, "pr-3.5")}>{pick("फल", "Result")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e, i) => (
                      <TableRow
                        key={e.yogaId}
                        className={cn(i % 2 === 1 && "bg-muted/20")}
                      >
                        <TableCell className={cn(td, "pl-3.5 whitespace-nowrap font-mono text-xs text-muted-foreground")}>
                          {e.yogaId}
                        </TableCell>
                        <TableCell className={cn(td, "whitespace-nowrap font-semibold text-foreground")}>
                          {e.name}
                        </TableCell>
                        <TableCell className={cn(td, "min-w-[14rem] whitespace-normal leading-snug")}>
                          {e.definition}
                        </TableCell>
                        <TableCell className={cn(td, "min-w-[12rem] whitespace-normal pr-3.5 leading-snug")}>
                          {e.result}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="px-3.5 py-6 text-center text-sm text-muted-foreground"
                        >
                          {pick("कुनै मिल्दो योग भेटिएन।", "No matching combination.")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-2 px-1 text-xs text-muted-foreground">
                {pick(
                  "समूहबद्ध ID (जस्तै 33-44, 75-106) स्रोतमा जस्तै राखिएको। भाग II (163–300) पछि थपिनेछ।",
                  "Grouped IDs (e.g. 33-44, 75-106) are kept as in the source. Part II (163–300) will be added later.",
                )}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
