import { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { useLocale } from "@/i18n/locale";
import { rashiToHouse } from "@/lib/bhava";
import type { DashaLord } from "@/lib/dasha";
import {
  DIGNITY_LABELS,
  GRAHA_DETAIL_ORDER,
  GRAHA_NAME,
  RASHI_EN_NAMES,
  RELATION_LABELS,
  grahaDignity,
  kpSubLordFromLongitude,
  naturalRelation,
  nakshatraLordKey,
  ownedRashis,
  rashiLordKey,
  vargaDmsParts,
  type GrahaDignity,
  type GrahaKey,
  type GrahaRelation,
  type LongitudeDmsParts,
} from "@/lib/graha-details";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { nakshatraPadaFromLongitude } from "@/lib/panchang-elements";
import { rashiNeFromNumber } from "@/lib/panchanga-format";
import { vargaRashiFromLongitude, type VargaDivision } from "@/lib/vargas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type GrahaPointInput = {
  key: string;
  longitude?: number;
  retrograde?: boolean;
};

type Row = {
  key: "lagna" | GrahaKey;
  retrograde?: boolean;
  vargaRashi: number;
  bhava: number;
  dms: LongitudeDmsParts;
  nakshatraIndex: number;
  pada: number;
  nakshatraLord: DashaLord;
  subLord: DashaLord;
  ownerKey: GrahaKey;
  ownerBhava?: number;
  relation?: GrahaRelation;
  dignity?: GrahaDignity;
  rulesBhavas: number[];
};

const th = "h-9 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-2.5 py-2 text-[12.5px]";

export type GrahaDetailsListProps = {
  division: VargaDivision;
  /** Longitude of this chart's house-1 anchor (lagna / chandra / …). */
  anchorLongitude: number;
  /** True lagna longitude — rendered as the first row when available. */
  lagnaLongitude?: number;
  planets: GrahaPointInput[];
};

/**
 * Detailed graha table for one divisional chart: varga sign + D1 longitude
 * (deg • rashi • min • sec), nakshatra pada with lord / KP sub-lord, bhava
 * placement, sign owner with its bhava, relationship, dignity and rulership —
 * for Lagna plus all nine grahas. Retrograde grahas carry a ↺ badge.
 */
export function GrahaDetailsList({
  division,
  anchorLongitude,
  lagnaLongitude,
  planets,
}: GrahaDetailsListProps) {
  const { pick, digits } = useLocale();

  const rows = useMemo<Row[]>(() => {
    const anchorRashi = vargaRashiFromLongitude(division, anchorLongitude);
    const lonByKey = new Map<string, number>();
    for (const p of planets) {
      if (p.longitude != null) lonByKey.set(p.key, p.longitude);
    }
    const bhavaOf = (lon: number) =>
      rashiToHouse(vargaRashiFromLongitude(division, lon), anchorRashi);

    const build = (key: "lagna" | GrahaKey, lon: number, retrograde?: boolean): Row => {
      const vargaRashi = vargaRashiFromLongitude(division, lon);
      const nak = nakshatraPadaFromLongitude(lon);
      const ownerKey = rashiLordKey(vargaRashi);
      const ownerLon = lonByKey.get(ownerKey);
      const isGraha = key !== "lagna";
      return {
        key,
        retrograde,
        vargaRashi,
        bhava: rashiToHouse(vargaRashi, anchorRashi),
        dms: vargaDmsParts(division, lon),
        nakshatraIndex: nak.index,
        pada: nak.pada,
        nakshatraLord: nakshatraLordKey(lon),
        subLord: kpSubLordFromLongitude(lon),
        ownerKey,
        ownerBhava: ownerLon != null ? bhavaOf(ownerLon) : undefined,
        relation: isGraha ? naturalRelation(key, ownerKey) : undefined,
        dignity: isGraha
          ? grahaDignity(key, vargaRashi, division === 1 ? lon % 30 : undefined)
          : undefined,
        rulesBhavas: isGraha
          ? ownedRashis(key)
              .map((rashi) => rashiToHouse(rashi, anchorRashi))
              .sort((a, b) => a - b)
          : [],
      };
    };

    const out: Row[] = [];
    if (lagnaLongitude != null) out.push(build("lagna", lagnaLongitude));
    for (const key of GRAHA_DETAIL_ORDER) {
      const lon = lonByKey.get(key);
      if (lon != null) {
        out.push(build(key, lon, planets.find((p) => p.key === key)?.retrograde));
      }
    }
    return out;
  }, [division, anchorLongitude, lagnaLongitude, planets]);

  if (rows.length === 0) return null;

  const grahaName = (key: GrahaKey) => pick(GRAHA_NAME[key].ne, GRAHA_NAME[key].en);
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
                      className="inline-flex items-center gap-0.5 text-[9px] font-bold text-secondary bg-secondary/15 px-1 py-0.5 rounded-full"
                      title={pick("वक्री", "Retrograde")}
                    >
                      <RotateCcw className="size-2.5" aria-hidden />
                      {pick("वक्री", "R")}
                    </span>
                  )}
                </span>
              </TableCell>
              <TableCell className={cn(td, "font-mono tabular-nums text-muted-foreground")}>
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
                <span className="text-muted-foreground"> ({digits(row.pada)})</span>
              </TableCell>
              <TableCell className={td}>
                {grahaName(row.nakshatraLord)}
                <span className="text-muted-foreground/60 mx-1">/</span>
                {grahaName(row.subLord)}
              </TableCell>
              <TableCell className={td}>
                {grahaName(row.ownerKey)}
                {row.ownerBhava != null && (
                  <span className="text-muted-foreground">
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
