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
 * Maps a computed yoga key (from `full_yoga_catalog`) to its id in Raman's 162
 * reference list. Used to keep the two views in sync: any computed yoga that is
 * *present* in the chart is shown in the "कुण्डली योग" table and removed from
 * this reference list, so no combination appears twice. Keys with no 162
 * counterpart (Mangala Dosha, Kala Sarpa, Neecha-Bhanga, Raja) are absent here
 * on purpose — they never collide with the reference list.
 */
export const ENGINE_KEY_TO_REF_ID: Record<string, string> = {
  gajakesari: "1",
  sunapha: "2",
  anapha: "3",
  durdhara: "4",
  kemadruma: "5",
  chandra_mangala: "6",
  adhi: "7",
  chatussagara: "8",
  vasumati: "9",
  rajalakshana: "10",
  vanchana_chora_bheeti: "11",
  shakata: "12",
  amala: "13",
  parvata: "14",
  kahala: "15",
  veshi: "16",
  vasi: "17",
  ubhayachari: "18",
  mahapurusha_jupiter: "19",
  mahapurusha_venus: "20",
  mahapurusha_saturn: "21",
  mahapurusha_mars: "22",
  mahapurusha_mercury: "23",
  budhaditya: "24",
  mahabhagya: "25",
  pushkala: "26",
  lakshmi: "27/72",
  gauri: "28",
  bharati: "29",
  chapa: "31",
  shrinatha: "32",
  lagna_mallika: "33-44",
  shankha: "45",
  bheri: "46",
  parijata: "49",
  dhana_2_11: "122-132",
};

export type YogaReferenceCatalogProps = {
  /** 162-ids present in this chart, hidden here so they aren't shown twice. */
  excludeIds?: ReadonlySet<string>;
};

/**
 * Reference catalog of Raman's 162 combinations (Part I), showing the ones that
 * are NOT formed in this chart. Present combinations live in the "कुण्डली योग"
 * table instead; their ids arrive via `excludeIds` and are filtered out here.
 * Fetched once from the CDN-cached `/kundali/yogas/reference` endpoint.
 */
export function YogaReferenceCatalog({ excludeIds }: YogaReferenceCatalogProps = {}) {
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

  // Base list = the 162 minus whatever is already present in the chart.
  const available = useMemo(
    () =>
      entries?.filter((e) => !(excludeIds?.has(e.yogaId) ?? false)) ?? [],
    [entries, excludeIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((e) =>
      [e.name, e.nameNe, e.yogaId, e.definition, e.definitionNe, e.result, e.resultNe]
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [available, query]);

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
                          {pick(e.nameNe?.trim() ? e.nameNe : e.name, e.name)}
                        </TableCell>
                        <TableCell className={cn(td, "min-w-[14rem] whitespace-normal leading-snug")}>
                          {pick(e.definitionNe?.trim() ? e.definitionNe : e.definition, e.definition)}
                        </TableCell>
                        <TableCell className={cn(td, "min-w-[12rem] whitespace-normal pr-3.5 leading-snug")}>
                          {pick(e.resultNe?.trim() ? e.resultNe : e.result, e.result)}
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
