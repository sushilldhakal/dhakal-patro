import {
  PATRO_PLANET_KEYS,
  PATRO_PLANET_NE,
  RASHI_COLUMNS_NE,
  RASHI_COLUMNS_EN,
  type GrahaSpashtaRow,
} from "@/lib/chandrakranti/month-patro-tables";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale";
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
const stickyHeadCorner = "sticky top-0 left-0 z-30 bg-muted pl-3 text-left";
const stickyHeadCell = "sticky top-0 z-10 bg-muted";
const stickySubCorner = "sticky top-10 left-0 z-30 bg-muted/60";
const stickySubCell = "sticky top-10 z-10 bg-muted/60";
const td = "whitespace-nowrap px-2 py-2 text-sm";

const PLANET_EN: Record<string, string> = {
  sun: "Sun", moon: "Moon", mars: "Mars", mercury: "Mercury", jupiter: "Jupiter",
  venus: "Venus", saturn: "Saturn", rahu: "Rahu",
};

type Props = {
  rows: GrahaSpashtaRow[];
  todayKey?: string;
  loading?: boolean;
  empty?: boolean;
  embedded?: boolean;
};

function formatPlanetCell(cell: { rashiNe: string; rashiEn?: string; coords: string } | undefined, isEn: boolean): string {
  if (!cell) return "—";
  return `${isEn ? (cell.rashiEn ?? cell.rashiNe) : cell.rashiNe} ${cell.coords}`;
}

export function MonthGrahaSpashta({ rows, todayKey, loading, empty, embedded }: Props) {
  const { lang, pick, digits } = useLocale();
  const isEn = lang === "en";
  const table = (
      <Table>
        <TableHeader>
          <TableRow className="sticky top-0 z-10 bg-muted hover:bg-muted">
            <TableHead className={cn(th, stickyHeadCorner)}>{pick("गते", "Date")}</TableHead>
            <TableHead className={cn(th, stickyHeadCell, "text-left")}>{pick("बा.", "Day")}</TableHead>
            {PATRO_PLANET_KEYS.map((key) => (
              <TableHead key={key} className={cn(th, stickyHeadCell, "min-w-[5.5rem] text-center")}>
                {pick(PATRO_PLANET_NE[key], PLANET_EN[key] ?? PATRO_PLANET_NE[key])}
              </TableHead>
            ))}
            <TableHead className={cn(th, stickyHeadCell, "min-w-[4.5rem] text-center")}>{pick("बेलान्तर", "Belaantar")}</TableHead>
          </TableRow>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead colSpan={2} className={stickySubCorner} />
            {PATRO_PLANET_KEYS.map((key) => (
              <TableHead key={`sub-${key}`} className={cn(th, stickySubCell, "text-center font-normal")}>
                {pick("रा|अं|क|वि", "Ra|Deg|Ka|Vi")}
              </TableHead>
            ))}
            <TableHead className={cn(th, stickySubCell, "text-center font-normal")}>{pick("समय सुधार", "Time corr.")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                {pick("लोड हुँदैछ…", "Loading…")}
              </TableCell>
            </TableRow>
          ) : empty || rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                {pick("यो पक्षमा कुनै दिन भेटिएन।", "No days found in this paksha.")}
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
                    {digits(row.day)}
                  </TableCell>
                  <TableCell className={cn(td, "text-muted-foreground")}>
                    {pick(row.weekdayNe ?? "—", row.weekdayEn ?? row.weekdayNe ?? "—")}
                  </TableCell>
                  {PATRO_PLANET_KEYS.map((key) => (
                    <TableCell
                      key={key}
                      className={cn(td, "text-center font-mono tabular-nums")}
                    >
                      {formatPlanetCell(row.planets[key], isEn)}
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
      {pick(
        <>
          राशिहरू: {RASHI_COLUMNS_NE.join(", ")}। प्रत्येक ग्रहको कोष्ठकमा{" "}
          <span className="font-mono">राशि अंश|कला|विकला</span> — जस्तै{" "}
          <span className="font-mono text-foreground">वृष १३|६|२९</span> = वृष राशि, १३ अंश ६ कला २९ विकला।
        </>,
        <>
          Signs: {RASHI_COLUMNS_EN.join(", ")}. Each planet's bracket shows{" "}
          <span className="font-mono">sign deg|kala|vikala</span> — e.g.{" "}
          <span className="font-mono text-foreground">Vrishabha 13|6|29</span> = Vrishabha sign, 13 deg 6 kala 29 vikala.
        </>,
      )}
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
      subtitleEn="The planets' rashi positions (sign, deg|kala|vikala) at the moment of sunrise, and the daily belaantar."
    >
      {table}
      {footnote}
    </PatroTableShell>
  );
}
