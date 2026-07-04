import { useMemo } from "react";
import { Flame, RotateCcw } from "lucide-react";
import { useLocale } from "@/i18n/locale";
import type { VargaChartEntry } from "@/lib/api";
import { GRAHA_NAME, RASHI_EN_NAMES, type GrahaKey } from "@/lib/graha-details";
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

/** One body's astronomical readout — sidereal longitude plus equatorial extras. */
export type GrahaAstroPoint = {
  longitude?: number;
  retrograde?: boolean;
  latitude?: number;
  rightAscension?: number;
  declination?: number;
  speed?: number;
};

export type GrahaAstroTableProps = {
  /** Keyed by graha ("sun" … "ketu"). */
  planets: Partial<Record<string, GrahaAstroPoint>>;
  lagna?: GrahaAstroPoint;
  /** Server-computed D1 rows (DMS, nakshatra pada, lord). */
  d1Rows: VargaChartEntry[];
  /** Server-computed combustion flags keyed by graha. */
  combustion: Record<string, boolean | null>;
};

type Row = GrahaAstroPoint &
  VargaChartEntry & {
    lon: number;
    combust?: boolean;
  };

const th = "h-9 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-2.5 py-2 text-[12.5px]";

function signedFixed(value: number | undefined, digits: (v: string) => string): string {
  if (value == null) return "—";
  const abs = Math.abs(value).toFixed(2);
  return `${value < 0 ? "−" : "+"}${digits(abs)}`;
}

/**
 * Astronomical graha table (D1): longitude with nakshatra/lord, raw sidereal
 * longitude, shara (ecliptic latitude), right ascension, kranti (declination)
 * and daily speed — with retrograde (R) and combust (C) flags. The jyotish
 * columns come straight from the API's D1 varga rows.
 */
export function GrahaAstroTable({ planets, lagna, d1Rows, combustion }: GrahaAstroTableProps) {
  const { pick, digits } = useLocale();

  const rows = useMemo<Row[]>(() => {
    return d1Rows.flatMap((entry) => {
      const point = entry.key === "lagna" ? lagna : planets[entry.key];
      if (point?.longitude == null) return [];
      return [
        {
          ...point,
          ...entry,
          lon: point.longitude,
          combust:
            entry.key !== "lagna" ? combustion[entry.key] ?? undefined : undefined,
        },
      ];
    });
  }, [d1Rows, planets, lagna, combustion]);

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
          <TableHead className={cn(th, "text-center")} title={pick("वक्री", "Retrograde")}>
            R
          </TableHead>
          <TableHead className={cn(th, "text-center")} title={pick("अस्त (सूर्य सामीप्य)", "Combust")}>
            C
          </TableHead>
          <TableHead className={th}>{pick("स्पष्ट", "Longitude")}</TableHead>
          <TableHead className={th}>{pick("नक्षत्र / स्वामी", "Nakshatra / Swami")}</TableHead>
          <TableHead className={cn(th, "text-right")}>{pick("Raw L.", "Raw L.")}</TableHead>
          <TableHead className={cn(th, "text-right")}>{pick("शर (अक्षांश)", "Latitude / Shara")}</TableHead>
          <TableHead className={cn(th, "text-right")}>{pick("विषुवांश (RA)", "Right Ascension")}</TableHead>
          <TableHead className={cn(th, "text-right")}>{pick("क्रान्ति", "Declination / Kranti")}</TableHead>
          <TableHead className={cn(th, "text-right")}>{pick("गति °/दिन", "Speed deg/day")}</TableHead>
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
            <TableRow key={row.key} className={cn(zebra)}>
              <TableCell
                className={cn(
                  td,
                  "sticky left-0 z-10 bg-card pl-3.5 font-semibold text-foreground",
                  zebra && "bg-[color-mix(in_srgb,var(--muted)_20%,var(--card))]",
                )}
              >
                {name}
              </TableCell>
              <TableCell className={cn(td, "text-center")}>
                {row.retrograde ? (
                  <span title={pick("वक्री", "Retrograde")} className="inline-flex text-secondary">
                    <RotateCcw className="size-3.5" aria-label={pick("वक्री", "Retrograde")} />
                  </span>
                ) : (
                  <span className="text-muted-foreground/40">—</span>
                )}
              </TableCell>
              <TableCell className={cn(td, "text-center")}>
                {row.combust ? (
                  <span title={pick("अस्त", "Combust")} className="inline-flex text-destructive">
                    <Flame className="size-3.5" aria-label={pick("अस्त", "Combust")} />
                  </span>
                ) : (
                  <span className="text-muted-foreground/40">—</span>
                )}
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
              <TableCell className={cn(td, "text-right font-mono tabular-nums")}>
                {digits(row.lon.toFixed(2))}
              </TableCell>
              <TableCell className={cn(td, "text-right font-mono tabular-nums")}>
                {signedFixed(row.latitude, digits)}
              </TableCell>
              <TableCell className={cn(td, "text-right font-mono tabular-nums")}>
                {signedFixed(row.rightAscension, digits)}
              </TableCell>
              <TableCell className={cn(td, "text-right font-mono tabular-nums")}>
                {signedFixed(row.declination, digits)}
              </TableCell>
              <TableCell className={cn(td, "text-right font-mono tabular-nums")}>
                {signedFixed(row.speed, digits)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
