import type {
  AshtakavargaData,
  AshtakavargaSignRow,
  ShodhyaPindaRow,
} from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Matrix column order + labels (display only — scores come from the API). */
const ASHTAKAVARGA_TARGETS = [
  "lagna", "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn",
] as const;

const ASHTAKAVARGA_TARGET_LABEL: Record<
  (typeof ASHTAKAVARGA_TARGETS)[number],
  { en: string; ne: string; short: string }
> = {
  lagna: { en: "Lagna", ne: "लग्न", short: "Lg" },
  sun: { en: "Sun", ne: "सूर्य", short: "Su" },
  moon: { en: "Moon", ne: "चन्द्र", short: "Ch" },
  mars: { en: "Mars", ne: "मंगल", short: "Ma" },
  mercury: { en: "Mercury", ne: "बुध", short: "Bu" },
  jupiter: { en: "Jupiter", ne: "बृहस्पति", short: "Gu" },
  venus: { en: "Venus", ne: "शुक्र", short: "Ve" },
  saturn: { en: "Saturn", ne: "शनि", short: "Sa" },
};

const th = "h-9 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const td = "px-2 py-1.5 text-[12px]";
const num = "text-right font-mono tabular-nums";

function BilingualHead({ en, ne }: { en: string; ne: string }) {
  return (
    <span className="block leading-tight">
      <span className="block">{en}</span>
      <span className="block text-[9px] font-medium normal-case text-muted-foreground/80">{ne}</span>
    </span>
  );
}

function BilingualRashi({ en, ne }: { en: string; ne: string }) {
  return (
    <span className="block leading-tight">
      <span className="block font-semibold text-foreground">{en}</span>
      <span className="block text-[10px] text-muted-foreground">{ne}</span>
    </span>
  );
}

function AshtakavargaMatrix({
  title,
  titleNe,
  rows,
  showSarvashtaka = true,
}: {
  title: string;
  titleNe: string;
  rows: AshtakavargaSignRow[];
  showSarvashtaka?: boolean;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-0.5">{title}</h4>
      <p className="text-xs text-muted-foreground mb-2">{titleNe}</p>
      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={cn(th, "sticky left-0 z-10 bg-muted pl-3 min-w-[5.5rem]")}>
                <BilingualHead en="Rashi" ne="राशि" />
              </TableHead>
              {ASHTAKAVARGA_TARGETS.map((t) => {
                const label = ASHTAKAVARGA_TARGET_LABEL[t];
                return (
                  <TableHead key={t} className={cn(th, "text-right min-w-[2.75rem]")}>
                    <BilingualHead en={label.short} ne={label.ne} />
                  </TableHead>
                );
              })}
              {showSarvashtaka && (
                <TableHead className={cn(th, "text-right min-w-[3rem]")}>
                  <BilingualHead en="Sarv*" ne="सर्व*" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.rashi}>
                <TableCell className={cn(td, "sticky left-0 z-10 bg-card pl-3")}>
                  <BilingualRashi en={row.rashiEn} ne={row.rashiNe} />
                </TableCell>
                {ASHTAKAVARGA_TARGETS.map((t) => (
                  <TableCell key={t} className={cn(td, num)}>
                    {row.bindus[t]}
                  </TableCell>
                ))}
                {showSarvashtaka && (
                  <TableCell className={cn(td, num, "font-semibold")}>
                    {row.sarvashtaka}
                  </TableCell>
                )}
              </TableRow>
            ))}
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell className={cn(td, "sticky left-0 z-10 bg-muted/30 pl-3")}>
                <BilingualHead en="*Sarvashtaka" ne="*सर्वाष्टक" />
              </TableCell>
              {ASHTAKAVARGA_TARGETS.map((t) => (
                <TableCell key={t} className={cn(td, num)}>
                  {rows.reduce((s, r) => s + r.bindus[t], 0)}
                </TableCell>
              ))}
              {showSarvashtaka && (
                <TableCell className={cn(td, num)}>
                  {rows.reduce((s, r) => s + r.sarvashtaka, 0)}
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ShodhyaPindaTable({ rows }: { rows: ShodhyaPindaRow[] }) {
  const metricRows: { key: keyof Pick<ShodhyaPindaRow, "rashiPinda" | "grahaPinda" | "shodhyaPinda">; en: string; ne: string }[] = [
    { key: "rashiPinda", en: "Rashi", ne: "राशि" },
    { key: "grahaPinda", en: "Graha", ne: "ग्रह" },
    { key: "shodhyaPinda", en: "Shodhya", ne: "शोध्य" },
  ];

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-0.5">Shodhya Pinda</h4>
      <p className="text-xs text-muted-foreground mb-2">शोध्य पिण्ड</p>
      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={cn(th, "sticky left-0 z-10 bg-muted pl-3")} />
              {ASHTAKAVARGA_TARGETS.map((t) => {
                const label = ASHTAKAVARGA_TARGET_LABEL[t];
                return (
                  <TableHead key={t} className={cn(th, "text-right min-w-[2.75rem]")}>
                    <BilingualHead en={label.short} ne={label.ne} />
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {metricRows.map((metric) => (
              <TableRow
                key={metric.key}
                className={metric.key === "shodhyaPinda" ? "bg-muted/20 font-semibold" : undefined}
              >
                <TableCell className={cn(td, "sticky left-0 z-10 bg-card pl-3 font-semibold")}>
                  <BilingualHead en={metric.en} ne={metric.ne} />
                </TableCell>
                {ASHTAKAVARGA_TARGETS.map((t) => {
                  const row = rows.find((r) => r.target === t);
                  return (
                    <TableCell key={t} className={cn(td, num)}>
                      {row?.[metric.key] ?? "—"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function AshtakavargaCard({ data }: { data: AshtakavargaData }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Ashtakavarga
        </h3>
        <p className="text-xs text-muted-foreground">
          अष्टकवर्ग — Parashari bindu tables per rashi. Sarv* sums the seven grahas
          (excludes Lagna). Reduced charts apply Trikona then Ekadhipatya Shodhana.
        </p>
      </div>

      <AshtakavargaMatrix
        title="Ashtakavarga"
        titleNe="अष्टकवर्ग"
        rows={data.raw}
      />

      <AshtakavargaMatrix
        title="Reduced Ashtakavarga"
        titleNe="शोध्य अष्टकवर्ग"
        rows={data.reduced}
      />

      <ShodhyaPindaTable rows={data.shodhyaPinda} />
    </div>
  );
}
