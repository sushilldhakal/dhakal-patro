import { useMemo } from "react";
import { useLocale } from "@/i18n/locale";
import {
  GRAHA_NAME,
  RASHI_EN_NAMES,
  longitudeDmsParts,
  nakshatraLordKey,
  type GrahaKey,
  type LongitudeDmsParts,
} from "@/lib/graha-details";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { nakshatraPadaFromLongitude } from "@/lib/panchang-elements";
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

/** One upagraha row from the at-time API's detail.upagrahas block. */
export type UpagrahaInput = {
  key: string;
  name?: string;
  name_ne?: string;
  longitude?: number;
};

type Row = {
  key: string;
  name: string;
  lon: number;
  dms: LongitudeDmsParts;
  nakshatraIndex: number;
  pada: number;
  nakshatraLord: GrahaKey;
};

const th = "h-9 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-2.5 py-2 text-[12.5px]";

export type UpagrahaTableProps = {
  upagrahas: UpagrahaInput[];
};

/**
 * Upagraha (shadow point) table: Gulika/Mandi/Kala/… plus the sun-based
 * points, each with its longitude (deg° rashi min′ sec″), nakshatra pada
 * with lord, and raw sidereal longitude.
 */
export function UpagrahaTable({ upagrahas }: UpagrahaTableProps) {
  const { pick, digits } = useLocale();

  const rows = useMemo<Row[]>(
    () =>
      upagrahas
        .filter((u) => u.longitude != null)
        .map((u) => {
          const lon = u.longitude!;
          const nak = nakshatraPadaFromLongitude(lon);
          return {
            key: u.key,
            name: pick(u.name_ne ?? u.name ?? u.key, u.name ?? u.key),
            lon,
            dms: longitudeDmsParts(lon),
            nakshatraIndex: nak.index,
            pada: nak.pada,
            nakshatraLord: nakshatraLordKey(lon),
          };
        }),
    [upagrahas, pick],
  );

  if (rows.length === 0) return null;

  const grahaName = (key: GrahaKey) => pick(GRAHA_NAME[key].ne, GRAHA_NAME[key].en);
  const rashiName = (rashi: number) =>
    pick(rashiNeFromNumber(rashi) ?? "—", RASHI_EN_NAMES[rashi - 1] ?? "—");

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className={cn(th, "pl-3.5")}>{pick("उपग्रह", "Upagraha")}</TableHead>
          <TableHead className={th}>{pick("स्पष्ट", "Longitude")}</TableHead>
          <TableHead className={th}>{pick("नक्षत्र / स्वामी", "Nakshatra / Swami")}</TableHead>
          <TableHead className={cn(th, "text-right pr-3.5")}>{pick("Raw L.", "Raw L.")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => {
          const nakName = pick(
            NAKSHATRA_ICONS[row.nakshatraIndex]?.ne ?? "—",
            NAKSHATRA_ICONS[row.nakshatraIndex]?.en ?? "—",
          );
          return (
            <TableRow key={row.key} className={cn(i % 2 === 1 && "bg-muted/20")}>
              <TableCell className={cn(td, "pl-3.5 font-semibold text-foreground")}>
                {row.name}
              </TableCell>
              <TableCell className={cn(td, "font-mono tabular-nums text-muted-foreground")}>
                <span className="text-foreground font-semibold">
                  {digits(String(row.dms.deg).padStart(2, "0"))}°
                </span>{" "}
                <span className="font-sans text-foreground">{rashiName(row.dms.rashiNum)}</span>{" "}
                {digits(String(row.dms.min).padStart(2, "0"))}′{" "}
                {digits(String(row.dms.sec).padStart(2, "0"))}″
              </TableCell>
              <TableCell className={td}>
                {nakName} {digits(row.pada)}
                <span className="text-muted-foreground">, {grahaName(row.nakshatraLord)}</span>
              </TableCell>
              <TableCell className={cn(td, "text-right pr-3.5 font-mono tabular-nums")}>
                {digits(row.lon.toFixed(2))}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
