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
  longitudeDmsParts,
  naturalRelation,
  nakshatraLordKey,
  ownedRashis,
  rashiLordKey,
  type GrahaDignity,
  type GrahaKey,
  type GrahaRelation,
  type LongitudeDmsParts,
} from "@/lib/graha-details";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { nakshatraPadaFromLongitude } from "@/lib/panchang-elements";
import { rashiNeFromNumber } from "@/lib/panchanga-format";
import { vargaRashiFromLongitude, type VargaDivision } from "@/lib/vargas";
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 text-[11.5px] leading-snug">
      <span className="text-muted-foreground/80 shrink-0">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

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
        dms: longitudeDmsParts(lon),
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
  const bhavaList = (houses: number[]) => houses.map((h) => digits(h)).join(", ");

  return (
    <ul className="flex flex-col divide-y divide-border/70">
      {rows.map((row) => {
        const name =
          row.key === "lagna" ? pick("लग्न", "Lagna") : grahaName(row.key);
        const nakName = pick(
          NAKSHATRA_ICONS[row.nakshatraIndex]?.ne ?? "—",
          NAKSHATRA_ICONS[row.nakshatraIndex]?.en ?? "—",
        );
        return (
          <li
            key={row.key}
            className={cn(
              "flex flex-col gap-1.5 px-3.5 py-2.5",
              row.retrograde && "bg-secondary/[0.05] dark:bg-secondary/10",
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-foreground">{name}</span>
                {row.retrograde && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-secondary bg-secondary/15 px-1.5 py-0.5 rounded-full"
                    title={pick("वक्री", "Retrograde")}
                  >
                    <RotateCcw className="size-2.5" aria-hidden />
                    {pick("वक्री", "Retro")}
                  </span>
                )}
              </span>
              <span className="text-[12px] font-mono text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {digits(String(row.dms.deg).padStart(2, "0"))}°
                </span>
                <span className="mx-1 text-foreground font-sans font-semibold">
                  {rashiName(row.dms.rashiNum)}
                </span>
                {digits(String(row.dms.min).padStart(2, "0"))}′{" "}
                {digits(String(row.dms.sec).padStart(2, "0"))}″
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <DetailItem
                label={pick("राशि", "Rashi")}
                value={rashiName(row.vargaRashi)}
              />
              <DetailItem label={pick("भाव", "Bhava")} value={digits(row.bhava)} />
              <DetailItem
                label={pick("नक्षत्र", "Nakshatra")}
                value={`${nakName} · ${pick(`पद ${digits(row.pada)}`, `Pada ${digits(row.pada)}`)}`}
              />
              <DetailItem
                label={pick("नक्षत्रेश / उप", "Lord / Sub")}
                value={`${grahaName(row.nakshatraLord)} / ${grahaName(row.subLord)}`}
              />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <DetailItem
                label={pick("स्वामी", "Owner")}
                value={
                  row.ownerBhava != null
                    ? pick(
                        `${grahaName(row.ownerKey)} (भाव ${digits(row.ownerBhava)} मा)`,
                        `${grahaName(row.ownerKey)} (in bhava ${digits(row.ownerBhava)})`,
                      )
                    : grahaName(row.ownerKey)
                }
              />
              {row.relation && (
                <DetailItem
                  label={pick("सम्बन्ध", "Relationship")}
                  value={pick(RELATION_LABELS[row.relation].ne, RELATION_LABELS[row.relation].en)}
                />
              )}
              {row.dignity && (
                <DetailItem
                  label={pick("स्थिति", "Dignity")}
                  value={pick(DIGNITY_LABELS[row.dignity].ne, DIGNITY_LABELS[row.dignity].en)}
                />
              )}
              {row.rulesBhavas.length > 0 && (
                <DetailItem
                  label={pick("स्वामित्व", "Rules")}
                  value={pick(
                    `भाव ${bhavaList(row.rulesBhavas)}`,
                    `Bhava ${bhavaList(row.rulesBhavas)}`,
                  )}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
