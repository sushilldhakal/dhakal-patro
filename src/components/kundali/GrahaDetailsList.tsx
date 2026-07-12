import { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { useLocale } from "@/i18n/locale";
import type { VargaChartEntry, VargaCharts } from "@/lib/api";
import { rashiToHouse } from "@/lib/bhava";
import {
  DIGNITY_LABELS,
  GRAHA_NAME,
  RASHI_EN_NAMES,
  RELATION_LABELS,
  type GrahaKey,
} from "@/lib/graha-details";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
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

type Row = VargaChartEntry & {
  bhava: number;
  ownerBhava?: number;
  rulesBhavas: number[];
};

const th = "h-9 px-2.5 text-sm font-semibold uppercase tracking-wide";
const td = "px-2.5 py-2 text-sm";

export type GrahaDetailsListProps = {
  division: number;
  /** Key of this chart's house-1 anchor (lagna / moon / …). */
  anchorKey: string;
  /** Server-computed varga placements for every point. */
  vargaCharts: VargaCharts;
};

/**
 * Detailed graha table for one divisional chart. All jyotish values (varga
 * sign, DMS, nakshatra pada with lord / KP sub-lord, owner, relationship,
 * dignity) come from the API — only the whole-sign house arrangement relative
 * to the chosen anchor is applied here.
 */
export function GrahaDetailsList({
  division,
  anchorKey,
  vargaCharts,
}: GrahaDetailsListProps) {
  const { pick, digits } = useLocale();

  const rows = useMemo<Row[]>(() => {
    const entries = vargaCharts.entries[String(division)] ?? [];
    const anchorEntry = entries.find((e) => e.key === anchorKey);
    if (!anchorEntry) return [];
    const anchorRashi = anchorEntry.vargaRashi;
    const byKey = new Map(entries.map((e) => [e.key, e]));

    return entries.map((entry) => {
      const owner = byKey.get(entry.ownerKey);
      const rules = vargaCharts.ownedRashis[entry.key] ?? [];
      return {
        ...entry,
        bhava: rashiToHouse(entry.vargaRashi, anchorRashi),
        ownerBhava: owner ? rashiToHouse(owner.vargaRashi, anchorRashi) : undefined,
        rulesBhavas:
          entry.key !== "lagna"
            ? rules.map((rashi) => rashiToHouse(rashi, anchorRashi)).sort((a, b) => a - b)
            : [],
      };
    });
  }, [division, anchorKey, vargaCharts]);

  if (rows.length === 0) return null;

  const grahaName = (key: string) =>
    pick(GRAHA_NAME[key as GrahaKey]?.ne ?? key, GRAHA_NAME[key as GrahaKey]?.en ?? key);
  const rashiName = (rashi: number) =>
    pick(rashiNeFromNumber(rashi) ?? "—", RASHI_EN_NAMES[rashi - 1] ?? "—");

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className={cn(th, "sticky left-0 z-10 bg-muted pl-3.5")}>
            {pick("ग्रह", "Graha")}
          </TableHead>
          <TableHead className={th}>{pick("राशि / स्पष्ट", "Rashi / Longitude")}</TableHead>
          <TableHead className={cn(th, "text-center")}>{pick("भाव", "Bhava")}</TableHead>
          <TableHead className={th}>{pick("नक्षत्र (पद)", "Nakshatra (Pada)")}</TableHead>
          <TableHead className={th}>{pick("नक्षत्रेश / उप", "Lord / Sub")}</TableHead>
          <TableHead className={th}>{pick("स्वामी", "Owner")}</TableHead>
          <TableHead className={th}>{pick("सम्बन्ध", "Relationship")}</TableHead>
          <TableHead className={th}>{pick("स्थिति", "Dignity")}</TableHead>
          <TableHead className={th}>{pick("स्वामित्व", "Rules")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => {
          const name = row.key === "lagna" ? pick("लग्न", "Lagna") : grahaName(row.key);
          const nakName = pick(
            NAKSHATRA_ICONS[row.nakshatraIndex]?.ne ?? "—",
            NAKSHATRA_ICONS[row.nakshatraIndex]?.en ?? "—",
          );
          const zebra = i % 2 === 1 && "bg-muted/20";
          return (
            <TableRow
              key={row.key}
              className={cn(zebra, row.retrograde && "bg-secondary/[0.06] dark:bg-secondary/10")}
            >
              {/* Sticky cell needs an opaque background so scrolled columns
                  don't show through — blend the row tint into the card color. */}
              <TableCell
                className={cn(
                  td,
                  "sticky left-0 z-10 bg-card pl-3.5 font-semibold text-foreground",
                  zebra && "bg-[color-mix(in_srgb,var(--muted)_20%,var(--card))]",
                  row.retrograde &&
                    "bg-[color-mix(in_srgb,var(--secondary)_6%,var(--card))] dark:bg-[color-mix(in_srgb,var(--secondary)_10%,var(--card))]",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {name}
                  {row.retrograde && (
                    <span
                      className="inline-flex items-center gap-0.5 text-sm font-bold normal-case text-secondary bg-secondary/15 px-1 py-0.5 rounded-full"
                      title={pick("वक्री", "Retrograde")}
                    >
                      <RotateCcw className="size-2.5" aria-hidden />
                      {pick("वक्री", "R")}
                    </span>
                  )}
                </span>
              </TableCell>
              <TableCell className={cn(td, "font-mono tabular-nums")}>
                <span className="text-foreground font-semibold">
                  {digits(String(row.dms.deg).padStart(2, "0"))}°
                </span>{" "}
                <span className="font-sans text-foreground">{rashiName(row.dms.rashiNum)}</span>{" "}
                {digits(String(row.dms.min).padStart(2, "0"))}′{" "}
                {digits(String(row.dms.sec).padStart(2, "0"))}″
              </TableCell>
              <TableCell className={cn(td, "text-center font-semibold text-foreground")}>
                {digits(row.bhava)}
              </TableCell>
              <TableCell className={td}>
                {nakName}
                <span> ({digits(row.pada)})</span>
              </TableCell>
              <TableCell className={td}>
                {grahaName(row.nakshatraLord)}
                <span className="mx-1">/</span>
                {grahaName(row.subLord)}
              </TableCell>
              <TableCell className={td}>
                {grahaName(row.ownerKey)}
                {row.ownerBhava != null && (
                  <span>
                    {" "}
                    {pick(`(भाव ${digits(row.ownerBhava)})`, `(bhava ${digits(row.ownerBhava)})`)}
                  </span>
                )}
              </TableCell>
              <TableCell className={td}>
                {row.relation
                  ? pick(RELATION_LABELS[row.relation].ne, RELATION_LABELS[row.relation].en)
                  : "—"}
              </TableCell>
              <TableCell className={td}>
                {row.dignity
                  ? pick(DIGNITY_LABELS[row.dignity].ne, DIGNITY_LABELS[row.dignity].en)
                  : "—"}
              </TableCell>
              <TableCell className={td}>
                {row.rulesBhavas.length > 0
                  ? pick(
                      `भाव ${row.rulesBhavas.map((h) => digits(h)).join(", ")}`,
                      `Bhava ${row.rulesBhavas.map((h) => digits(h)).join(", ")}`,
                    )
                  : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
