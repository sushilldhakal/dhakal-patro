import { useLocale } from "@/i18n/locale";
import type { BhavaBalaData, BhavaBalaHouse } from "@/lib/api";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const th = "h-9 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-2.5 py-1.5 text-[12.5px]";
const num = "text-right font-mono tabular-nums";

function fmtNum(
  value: number | undefined,
  digits: (v: string | number) => string,
  places = 2,
): string {
  if (value == null) return "—";
  const abs = Math.abs(value).toFixed(places);
  const signed = value < 0 ? `−${abs}` : abs;
  return digits(signed);
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

export function BhavaBalaCard({ data }: { data: BhavaBalaData }) {
  return <BhavaBalaTable data={data} />;
}

export function BhavaBalaTable({ data }: { data: BhavaBalaData }) {
  const { pick, digits } = useLocale();

  const houseLabel = (house: number) =>
    pick(`भाव ${digits(house)}`, `House ${house}`);

  const lordLabel = (key: GrahaKey) =>
    pick(GRAHA_NAME[key].ne, GRAHA_NAME[key].en);

  const houseSummary = (h: BhavaBalaHouse) => (
    <>
      <p className="text-lg font-bold text-foreground">{houseLabel(h.house)}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {pick("स्वामी", "Lord")} {lordLabel(h.lordKey as GrahaKey)}
        <span className="mx-1 text-muted-foreground/50">·</span>
        {digits(h.percent.toFixed(1))}%
      </p>
    </>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {pick("भाव बल — भाव शक्ति (विरुप)", "Bhava Bala — House Strength (Virupas)")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {pick(
            `भावाधिपति (स्वामीको षड्बल) + भाव दिशा + भाव दृष्टि। समपूर्ण राशि भाव; ${digits(data.referenceVirupas)} विरुप (७ रूप) = १००%।`,
            `Bhavadhipati (lord's Shadbala) + Bhava Disha + Bhava Drishti. Whole-sign houses; ${data.referenceVirupas} virupas (7 rupas) = 100%.`,
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GlanceTile label={pick("सबैभन्दा बलियो भाव", "Strongest house")}>
          {houseSummary(data.strongest)}
        </GlanceTile>
        <GlanceTile label={pick("सबैभन्दा कमजोर भाव", "Weakest house")}>
          {houseSummary(data.weakest)}
        </GlanceTile>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={cn(th, "pl-3.5")}>{pick("भाव", "House")}</TableHead>
              <TableHead className={cn(th, "text-right")}>{pick("स्वामी", "Lord")}</TableHead>
              <TableHead className={cn(th, "text-right")}>
                {pick("भावाधिपति", "Bhavadhipati")}
              </TableHead>
              <TableHead className={cn(th, "text-right")}>{pick("दिशा", "Disha")}</TableHead>
              <TableHead className={cn(th, "text-right")}>{pick("दृष्टि", "Drishti")}</TableHead>
              <TableHead className={cn(th, "text-right")}>
                {pick("कुल पिण्ड", "Total Pinda")}
              </TableHead>
              <TableHead className={cn(th, "text-right")}>{pick("रूप", "Rupas")}</TableHead>
              <TableHead className={cn(th, "text-right")}>
                {pick("भाव (%)", "Bhava (%)")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.houses.map((h) => (
              <TableRow key={h.house}>
                <TableCell className={cn(td, "font-semibold pl-3.5")}>
                  {houseLabel(h.house)}
                </TableCell>
                <TableCell className={cn(td, "text-right")}>{lordLabel(h.lordKey as GrahaKey)}</TableCell>
                <TableCell className={cn(td, num)}>{fmtNum(h.bhavadhipati, digits)}</TableCell>
                <TableCell className={cn(td, num)}>{fmtNum(h.disha, digits)}</TableCell>
                <TableCell className={cn(td, num)}>{fmtNum(h.drishti, digits)}</TableCell>
                <TableCell className={cn(td, num, "font-semibold")}>
                  {fmtNum(h.totalPinda, digits)}
                </TableCell>
                <TableCell className={cn(td, num, "font-semibold")}>{fmtNum(h.rupas, digits)}</TableCell>
                <TableCell className={cn(td, num, "font-semibold")}>
                  {digits(h.percent.toFixed(1))}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
