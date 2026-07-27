import { useMemo } from "react";
import { useLocale } from "@/i18n/locale";
import type { VargaCharts } from "@/lib/api";
import { buildBhavaTable, type BhavaTableRow, RASHI_QUALITIES } from "@/lib/bhava";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import { formatRashiByNumber } from "@/lib/rashi-i18n";
import { rashiNeFromNumber } from "@/lib/panchanga-format";
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
const td = "px-2.5 py-2 text-sm";

export type BhavaTableProps = {
  division: number;
  /** Key of this chart's house-1 anchor (lagna / moon / …). */
  anchorKey: string;
  /** Server-computed varga placements for every point. */
  vargaCharts: VargaCharts;
};

/**
 * Per-house (bhava) table for one divisional chart: residents, rashi owner
 * (lord), rashi qualities and which planets cast a graha-drishti onto that
 * house. Derived entirely from the already-fetched varga placements — no
 * extra API call.
 */
export function BhavaTable({ division, anchorKey, vargaCharts }: BhavaTableProps) {
  const { pick, digits, lang } = useLocale();

  const rows = useMemo<BhavaTableRow[]>(() => {
    const entries = vargaCharts.entries[String(division)] ?? [];
    const anchorEntry = entries.find((e) => e.key === anchorKey);
    if (!anchorEntry) return [];

    const planetRashis = entries
      .filter((e) => e.key !== "lagna")
      .map((e) => ({ key: e.key, labelNe: GRAHA_NAME[e.key as GrahaKey]?.ne ?? e.key, rashi: e.vargaRashi }));

    return buildBhavaTable(
      anchorEntry.vargaRashi,
      planetRashis,
      vargaCharts.ownedRashis,
      rashiNeFromNumber,
    );
  }, [division, anchorKey, vargaCharts]);

  if (rows.length === 0) return null;

  const grahaName = (key: string) =>
    pick(GRAHA_NAME[key as GrahaKey]?.ne ?? key, GRAHA_NAME[key as GrahaKey]?.en ?? key);
  const rashiName = (rashi: number) => formatRashiByNumber(rashi, lang);

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className={cn(th, "sticky left-0 z-10 bg-muted pl-3.5")}>
            {pick("भाव", "Bhava")}
          </TableHead>
          <TableHead className={th}>{pick("बासिन्दा", "Residents")}</TableHead>
          <TableHead className={th}>{pick("स्वामी", "Owner")}</TableHead>
          <TableHead className={th}>{pick("राशि", "Rashi")}</TableHead>
          <TableHead className={th}>{pick("गुण", "Qualities")}</TableHead>
          <TableHead className={th}>{pick("दृष्टि", "Aspected By")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => {
          const zebra = i % 2 === 1 && "bg-muted/20";
          const quality = RASHI_QUALITIES[row.rashi - 1];
          return (
            <TableRow key={row.house} className={cn(zebra)}>
              <TableCell
                className={cn(
                  td,
                  "sticky left-0 z-10 bg-card pl-3.5 font-semibold text-foreground",
                  zebra && "bg-[color-mix(in_srgb,var(--muted)_20%,var(--card))]",
                )}
              >
                {digits(row.house)}
                {row.badge && (
                  <span className="ml-1 text-sm font-semibold">
                    ({row.badge})
                  </span>
                )}
              </TableCell>
              <TableCell className={td}>
                {row.residents.length > 0
                  ? row.residents.map((p) => grahaName(p.key)).join(", ")
                  : "—"}
              </TableCell>
              <TableCell className={td}>{row.owner ? grahaName(row.owner) : "—"}</TableCell>
              <TableCell className={td}>{rashiName(row.rashi)}</TableCell>
              <TableCell className={cn(td, "")}>
                {quality ? pick(quality.ne, quality.en) : "—"}
              </TableCell>
              <TableCell className={td}>
                {row.aspectedBy.length > 0
                  ? row.aspectedBy.map((k) => grahaName(k)).join(", ")
                  : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
