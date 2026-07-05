import { useLocale } from "@/i18n/locale";
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
  { en: string; ne: string; shortEn: string; shortNe: string }
> = {
  lagna: { en: "Lagna", ne: "लग्न", shortEn: "Lg", shortNe: "ल" },
  sun: { en: "Sun", ne: "सूर्य", shortEn: "Su", shortNe: "सू" },
  moon: { en: "Moon", ne: "चन्द्र", shortEn: "Ch", shortNe: "च" },
  mars: { en: "Mars", ne: "मंगल", shortEn: "Ma", shortNe: "म" },
  mercury: { en: "Mercury", ne: "बुध", shortEn: "Bu", shortNe: "बु" },
  jupiter: { en: "Jupiter", ne: "बृहस्पति", shortEn: "Gu", shortNe: "गु" },
  venus: { en: "Venus", ne: "शुक्र", shortEn: "Ve", shortNe: "श" },
  saturn: { en: "Saturn", ne: "शनि", shortEn: "Sa", shortNe: "श" },
};

const th = "h-9 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const td = "px-2 py-1.5 text-[12px]";
const num = "text-right font-mono tabular-nums";

function AshtakavargaMatrix({
  title,
  rows,
  showSarvashtaka = true,
}: {
  title: string;
  rows: AshtakavargaSignRow[];
  showSarvashtaka?: boolean;
}) {
  const { pick, digits } = useLocale();

  const targetHead = (t: (typeof ASHTAKAVARGA_TARGETS)[number]) => {
    const label = ASHTAKAVARGA_TARGET_LABEL[t];
    return pick(label.shortNe, label.shortEn);
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2">{title}</h4>
      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={cn(th, "sticky left-0 z-10 bg-muted pl-3 min-w-[5.5rem]")}>
                {pick("राशि", "Rashi")}
              </TableHead>
              {ASHTAKAVARGA_TARGETS.map((t) => (
                <TableHead key={t} className={cn(th, "text-right min-w-[2.75rem]")}>
                  {targetHead(t)}
                </TableHead>
              ))}
              {showSarvashtaka && (
                <TableHead className={cn(th, "text-right min-w-[3rem]")}>
                  {pick("सर्व*", "Sarv*")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.rashi}>
                <TableCell className={cn(td, "sticky left-0 z-10 bg-card pl-3 font-semibold text-foreground")}>
                  {pick(row.rashiNe, row.rashiEn)}
                </TableCell>
                {ASHTAKAVARGA_TARGETS.map((t) => (
                  <TableCell key={t} className={cn(td, num)}>
                    {digits(row.bindus[t])}
                  </TableCell>
                ))}
                {showSarvashtaka && (
                  <TableCell className={cn(td, num, "font-semibold")}>
                    {digits(row.sarvashtaka)}
                  </TableCell>
                )}
              </TableRow>
            ))}
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell className={cn(td, "sticky left-0 z-10 bg-muted/30 pl-3")}>
                {pick("*सर्वाष्टक", "*Sarvashtaka")}
              </TableCell>
              {ASHTAKAVARGA_TARGETS.map((t) => (
                <TableCell key={t} className={cn(td, num)}>
                  {digits(rows.reduce((s, r) => s + r.bindus[t], 0))}
                </TableCell>
              ))}
              {showSarvashtaka && (
                <TableCell className={cn(td, num)}>
                  {digits(rows.reduce((s, r) => s + r.sarvashtaka, 0))}
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
  const { pick, digits } = useLocale();

  const metricRows: {
    key: keyof Pick<ShodhyaPindaRow, "rashiPinda" | "grahaPinda" | "shodhyaPinda">;
    ne: string;
    en: string;
  }[] = [
    { key: "rashiPinda", ne: "राशि", en: "Rashi" },
    { key: "grahaPinda", ne: "ग्रह", en: "Graha" },
    { key: "shodhyaPinda", ne: "शोध्य", en: "Shodhya" },
  ];

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2">
        {pick("शोध्य पिण्ड", "Shodhya Pinda")}
      </h4>
      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={cn(th, "sticky left-0 z-10 bg-muted pl-3")} />
              {ASHTAKAVARGA_TARGETS.map((t) => {
                const label = ASHTAKAVARGA_TARGET_LABEL[t];
                return (
                  <TableHead key={t} className={cn(th, "text-right min-w-[2.75rem]")}>
                    {pick(label.shortNe, label.shortEn)}
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
                  {pick(metric.ne, metric.en)}
                </TableCell>
                {ASHTAKAVARGA_TARGETS.map((t) => {
                  const row = rows.find((r) => r.target === t);
                  const val = row?.[metric.key];
                  return (
                    <TableCell key={t} className={cn(td, num)}>
                      {val != null ? digits(val) : "—"}
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
  const { pick } = useLocale();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {pick("अष्टकवर्ग", "Ashtakavarga")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {pick(
            "पाराशरी बिन्दु तालिका प्रति राशि। सर्व* ले सात ग्रहको योग जोड्छ (लग्न बाहेक)। शोध्य चартमा त्रिकोण र एकाधिपत्य शोधन लागू हुन्छ।",
            "Parashari bindu tables per rashi. Sarv* sums the seven grahas (excludes Lagna). Reduced charts apply Trikona then Ekadhipatya Shodhana.",
          )}
        </p>
      </div>

      <AshtakavargaMatrix
        title={pick("अष्टकवर्ग", "Ashtakavarga")}
        rows={data.raw}
      />

      <AshtakavargaMatrix
        title={pick("शोध्य अष्टकवर्ग", "Reduced Ashtakavarga")}
        rows={data.reduced}
      />

      <ShodhyaPindaTable rows={data.shodhyaPinda} />
    </div>
  );
}
