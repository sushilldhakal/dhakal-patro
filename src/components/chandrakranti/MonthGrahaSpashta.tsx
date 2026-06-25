import {
  PATRO_PLANET_KEYS,
  PATRO_PLANET_NE,
  RASHI_COLUMNS_NE,
  type GrahaSpashtaRow,
} from "@/lib/chandrakranti/month-patro-tables";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PatroTableShell } from "./PatroTableShell";

const th = "whitespace-nowrap px-2 py-2.5 text-sm font-semibold text-muted-foreground";
const td = "whitespace-nowrap px-2 py-2 text-sm";

type Props = {
  rows: GrahaSpashtaRow[];
  todayKey?: string;
  loading?: boolean;
  empty?: boolean;
  embedded?: boolean;
};

function formatPlanetCell(cell?: { rashiNe: string; coords: string }): string {
  if (!cell) return "—";
  return `${cell.rashiNe} ${cell.coords}`;
}

export function MonthGrahaSpashta({ rows, todayKey, loading, empty, embedded }: Props) {
  const table = (
      <Table>
        <TableHeader>
          <TableRow className="sticky top-0 z-10 bg-muted hover:bg-muted">
            <TableHead className={cn(th, "sticky left-0 z-20 bg-muted pl-3 text-left")}>गते</TableHead>
            <TableHead className={cn(th, "text-left")}>बा.</TableHead>
            {PATRO_PLANET_KEYS.map((key) => (
              <TableHead key={key} className={cn(th, "min-w-[5.5rem] text-center")}>
                {PATRO_PLANET_NE[key]}
              </TableHead>
            ))}
            <TableHead className={cn(th, "min-w-[4.5rem] text-center")}>बेलान्तर</TableHead>
          </TableRow>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead colSpan={2} className="sticky left-0 z-20 bg-muted/60" />
            {PATRO_PLANET_KEYS.map((key) => (
              <TableHead key={`sub-${key}`} className={cn(th, "text-center font-normal")}>
                रा|अं|क|वि
              </TableHead>
            ))}
            <TableHead className={cn(th, "text-center font-normal")}>समय सुधार</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                लोड हुँदैछ…
              </TableCell>
            </TableRow>
          ) : empty || rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                यो पक्षमा कुनै दिन भेटिएन।
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const isToday = row.dateAd === todayKey;
              const hasPlanets = PATRO_PLANET_KEYS.some((k) => row.planets[k]);
              return (
                <TableRow
                  key={row.dateAd}
                  className={cn(isToday && "bg-secondary/15 hover:bg-secondary/20")}
                >
                  <TableCell
                    className={cn(
                      td,
                      "sticky left-0 z-10 bg-card pl-3 font-semibold",
                      isToday && "bg-secondary/15",
                    )}
                  >
                    {toNepaliDigits(row.day)}
                  </TableCell>
                  <TableCell className={cn(td, "text-muted-foreground")}>
                    {row.weekdayNe ?? "—"}
                  </TableCell>
                  {PATRO_PLANET_KEYS.map((key) => (
                    <TableCell
                      key={key}
                      className={cn(td, "text-center font-mono tabular-nums")}
                    >
                      {formatPlanetCell(row.planets[key])}
                    </TableCell>
                  ))}
                  <TableCell className={cn(td, "text-center font-mono tabular-nums")}>
                    {row.belaantar ?? (hasPlanets ? "—" : "—")}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
  );

  const footnote = (
    <p className="border-t border-border px-4 py-2 text-sm leading-relaxed text-muted-foreground">
      राशिहरू: {RASHI_COLUMNS_NE.join(", ")}। प्रत्येक ग्रहको कोष्ठकमा{" "}
      <span className="font-mono">राशि अंश|कला|विकला</span> — जस्तै{" "}
      <span className="font-mono text-foreground">वृष १३|६|२९</span> = वृष राशि, १३ अंश ६ कला २९ विकला।
    </p>
  );

  if (embedded) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border">
        {table}
        {footnote}
      </div>
    );
  }

  return (
    <PatroTableShell
      titleNe="उदयकालिक सूर्यादिग्रहस्पष्ट"
      titleEn="Sunrise Planetary Positions (Graha Spashta)"
      subtitle="सूर्योदयको क्षणमा ग्रहहरूको राश्यादि स्थिति (राशि, अंश|कला|विकला) र दैनिक बेलान्तर।"
    >
      {table}
      {footnote}
    </PatroTableShell>
  );
}
