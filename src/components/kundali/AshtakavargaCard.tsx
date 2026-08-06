import { useLocale, bilingualText } from "@/i18n/locale";
import { useTranslation } from "react-i18next";
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
import { RashiGlyphIcon } from "@/components/panchanga/element/ElementGlyphIcon";
import { GrahaPlanetIcon } from "@/components/graha/GrahaPlanetIcon";
import type { GrahaKey } from "@/lib/graha-details";

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

const th = "h-9 px-2 text-sm font-semibold uppercase tracking-wide whitespace-nowrap";
const td = "px-2 py-1.5 text-sm";
const num = "text-right font-mono tabular-nums";

function ashtakavargaTargetLabel(
  target: (typeof ASHTAKAVARGA_TARGETS)[number],
  lang: "ne" | "en",
) {
  const label = ASHTAKAVARGA_TARGET_LABEL[target];
  return bilingualText(lang, label.shortNe, label.shortEn);
}

function AshtakavargaTargetHead({
  target,
}: {
  target: (typeof ASHTAKAVARGA_TARGETS)[number];
}) {
  const { lang } = useLocale();
  const label = ASHTAKAVARGA_TARGET_LABEL[target];
  if (target !== "lagna") {
    return (
      <span
        className="inline-flex flex-col items-end gap-0.5"
        title={bilingualText(lang, label.ne, label.en)}
      >
        <GrahaPlanetIcon graha={target as GrahaKey} size={18} />
        <span className="text-[10px] font-normal normal-case tracking-normal">
          {ashtakavargaTargetLabel(target, lang)}
        </span>
      </span>
    );
  }
  return ashtakavargaTargetLabel(target, lang);
}

function AshtakavargaMatrix({
  title,
  rows,
  showSarvashtaka = true,
}: {
  title: string;
  rows: AshtakavargaSignRow[];
  showSarvashtaka?: boolean;
}) {
  const { t } = useTranslation();
  const { lang, digits } = useLocale();

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2">{title}</h4>
      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={cn(th, "sticky left-0 z-10 bg-muted pl-3 min-w-[5.5rem]")}>
                {t("kundali.rashi")}
              </TableHead>
              {ASHTAKAVARGA_TARGETS.map((t) => (
                <TableHead key={t} className={cn(th, "text-right min-w-[2.75rem]")}>
                  <AshtakavargaTargetHead target={t} />
                </TableHead>
              ))}
              {showSarvashtaka && (
                <TableHead className={cn(th, "text-right min-w-[3rem]")}>
                  {t("kundali.sarv")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.rashi}>
                <TableCell className={cn(td, "sticky left-0 z-10 bg-card pl-3 font-semibold text-foreground")}>
                  <span className="inline-flex items-center gap-2">
                    <RashiGlyphIcon name={row.rashiNe} number={row.rashi} size={22} />
                    {bilingualText(lang, row.rashiNe, row.rashiEn)}
                  </span>
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
                {t("kundali.sarvashtaka")}
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
  const { t } = useTranslation();
  const { lang, digits } = useLocale();

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
        {t("kundali.shodhya_pinda")}
      </h4>
      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={cn(th, "sticky left-0 z-10 bg-muted pl-3")} />
              {ASHTAKAVARGA_TARGETS.map((t) => (
                <TableHead key={t} className={cn(th, "text-right min-w-[2.75rem]")}>
                  <AshtakavargaTargetHead target={t} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {metricRows.map((metric) => (
              <TableRow
                key={metric.key}
                className={metric.key === "shodhyaPinda" ? "bg-muted/20 font-semibold" : undefined}
              >
                <TableCell className={cn(td, "sticky left-0 z-10 bg-card pl-3 font-semibold")}>
                  {bilingualText(lang, metric.ne, metric.en)}
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
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-1">
          {t("kundali.ashtakavarga")}
        </h3>
        <p className="text-xs">
          {t("kundali.parashari_bindu_tables_per_rashi_sarv_sums_the_seven_gr")}
        </p>
      </div>

      <AshtakavargaMatrix
        title={t("kundali.ashtakavarga")}
        rows={data.raw}
      />

      <AshtakavargaMatrix
        title={t("kundali.reduced_ashtakavarga")}
        rows={data.reduced}
      />

      <ShodhyaPindaTable rows={data.shodhyaPinda} />
    </div>
  );
}
