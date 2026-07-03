import { useMemo } from "react";
import type { ShadbalaResponse } from "@/lib/api";
import {
  BHAVA_BALA_REFERENCE_VIRUPAS,
  computeBhavaBala,
  type BhavaBalaResult,
} from "@/lib/bhava-bala";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ShadbalaChartContext } from "@/components/kundali/ShadbalaCard";

const HOUSE_LABELS = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
] as const;

const th = "h-9 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-2.5 py-1.5 text-[12.5px]";
const num = "text-right font-mono tabular-nums";

function fmt(value: number | undefined, digits = 2): string {
  if (value == null) return "—";
  const abs = Math.abs(value).toFixed(digits);
  return value < 0 ? `−${abs}` : abs;
}

function GlanceTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

export function BhavaBalaCard({
  shadbala,
  chart,
}: {
  shadbala: ShadbalaResponse;
  chart: ShadbalaChartContext;
}) {
  const bhavaBala = useMemo(
    () => computeBhavaBala(chart.lagnaRashi, shadbala.planets, chart.planetLongitudes),
    [chart, shadbala.planets],
  );

  return <BhavaBalaTable data={bhavaBala} />;
}

export function BhavaBalaTable({ data }: { data: BhavaBalaResult }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Bhava Bala — House Strength (Virupas)
        </h3>
        <p className="text-xs text-muted-foreground">
          Bhavadhipati (lord&apos;s Shadbala) + Bhava Disha + Bhava Drishti.
          Whole-sign houses; {BHAVA_BALA_REFERENCE_VIRUPAS} virupas (7 rupas) = 100%.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GlanceTile label="Strongest house">
          <p className="text-lg font-bold text-foreground">
            House {HOUSE_LABELS[data.strongest.house - 1]}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lord {data.strongest.lordName} · {data.strongest.percent.toFixed(1)}%
          </p>
        </GlanceTile>
        <GlanceTile label="Weakest house">
          <p className="text-lg font-bold text-foreground">
            House {HOUSE_LABELS[data.weakest.house - 1]}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lord {data.weakest.lordName} · {data.weakest.percent.toFixed(1)}%
          </p>
        </GlanceTile>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={cn(th, "pl-3.5")}>House</TableHead>
              <TableHead className={cn(th, "text-right")}>Lord</TableHead>
              <TableHead className={cn(th, "text-right")}>Bhavadhipati</TableHead>
              <TableHead className={cn(th, "text-right")}>Disha</TableHead>
              <TableHead className={cn(th, "text-right")}>Drishti</TableHead>
              <TableHead className={cn(th, "text-right")}>Total Pinda</TableHead>
              <TableHead className={cn(th, "text-right")}>Rupas</TableHead>
              <TableHead className={cn(th, "text-right")}>Bhava (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.houses.map((h) => (
              <TableRow key={h.house}>
                <TableCell className={cn(td, "font-semibold pl-3.5")}>
                  {HOUSE_LABELS[h.house - 1]}
                </TableCell>
                <TableCell className={cn(td, "text-right")}>{h.lordName}</TableCell>
                <TableCell className={cn(td, num)}>{fmt(h.bhavadhipati)}</TableCell>
                <TableCell className={cn(td, num)}>{fmt(h.disha)}</TableCell>
                <TableCell className={cn(td, num)}>{fmt(h.drishti)}</TableCell>
                <TableCell className={cn(td, num, "font-semibold")}>
                  {fmt(h.totalPinda)}
                </TableCell>
                <TableCell className={cn(td, num, "font-semibold")}>{fmt(h.rupas)}</TableCell>
                <TableCell className={cn(td, num, "font-semibold")}>
                  {h.percent.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
