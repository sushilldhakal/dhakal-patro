import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale, bilingualText } from "@/i18n/locale";
import {
  PURUSHA_JANMA_GRAHAS,
  PURUSHA_JANMA_ROWS,
  STREI_JANMA_GRAHAS,
  STREI_JANMA_ROWS,
  splitJanmaPhala,
  type JanmaPhalaGrahaCol,
  type JanmaPhalaRow,
} from "@/lib/kundali/janma-phala-tables";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const th =
  "h-auto min-h-9 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide align-bottom whitespace-normal";
const td = "px-2 py-2 text-xs align-top whitespace-normal leading-snug";
const houseTd =
  "px-2.5 py-2 text-sm font-semibold align-top whitespace-nowrap sticky left-0 z-[1] bg-muted/80 backdrop-blur-sm";

type TabId = "male" | "female";

function PhalaCell({ text }: { text: string }) {
  const [a, b] = splitJanmaPhala(text);
  return (
    <span className="block text-[0.8125rem] leading-snug text-foreground">
      {a}
      {b ? (
        <>
          <span className="text-muted-foreground"> · </span>
          {b}
        </>
      ) : null}
    </span>
  );
}

function JanmaPhalaTable({
  rows,
  grahas,
  houseColLabel,
}: {
  rows: JanmaPhalaRow[];
  grahas: JanmaPhalaGrahaCol[];
  houseColLabel: string;
}) {
  const { lang } = useLocale();

  return (
    <div className="rounded-xl border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={cn(th, "pl-3.5 min-w-[5.5rem] sticky left-0 z-[2] bg-muted/90")}>
              {houseColLabel}
            </TableHead>
            {grahas.map((g) => (
              <TableHead key={g.id} className={cn(th, "min-w-[7rem] max-w-[9rem] text-center")}>
                {bilingualText(lang, g.ne, g.en)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.houseNe}>
              <TableCell className={cn(houseTd, "pl-3.5 border-r border-border")}>
                {bilingualText(lang, row.houseNe, row.houseEn)}
              </TableCell>
              {row.phala.map((cell, i) => (
                <TableCell key={`${row.houseNe}-${i}`} className={td}>
                  <PhalaCell text={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function JanmaPhalaTables() {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const [tab, setTab] = useState<TabId>("male");

  return (
    <div className="mt-10 space-y-4 border-t border-border pt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            {t("kundali.janma_phala_title")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-3xl">
            {tab === "male"
              ? t("kundali.janma_phala_purusha_intro")
              : t("kundali.janma_phala_stree_intro")}
          </p>
        </div>
        <div
          className="inline-flex shrink-0 rounded-lg border border-border bg-muted/30 p-0.5"
          role="tablist"
          aria-label={t("kundali.janma_phala_tabs_aria")}
        >
          <Button
            type="button"
            role="tab"
            variant="ghost"
            size="sm"
            aria-selected={tab === "male"}
            className={cn(
              "h-8 rounded-md px-3 text-sm font-semibold",
              tab === "male" && "bg-card shadow-sm text-secondary",
            )}
            onClick={() => setTab("male")}
          >
            {t("kundali.janma_phala_tab_male")}
          </Button>
          <Button
            type="button"
            role="tab"
            variant="ghost"
            size="sm"
            aria-selected={tab === "female"}
            className={cn(
              "h-8 rounded-md px-3 text-sm font-semibold",
              tab === "female" && "bg-card shadow-sm text-secondary",
            )}
            onClick={() => setTab("female")}
          >
            {t("kundali.janma_phala_tab_female")}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground rounded-lg border border-border/80 bg-muted/20 px-3 py-2">
        {tab === "male" ? t("kundali.janma_phala_purusha_hint") : t("kundali.janma_phala_stree_hint")}
      </p>

      <p className="text-xs font-medium text-muted-foreground">
        {tab === "male"
          ? bilingualText(
              lang,
              "पुरुषजन्मकुण्डल्यां तन्वादिभावस्थग्रहफलानि",
              "Purushajanmakundalyāṃ tanvādibhāvasthagrahaphalāni",
            )
          : bilingualText(
              lang,
              "स्त्रीजन्मकुण्डल्यां तन्वादिभावस्थग्रहाणां जातकोक्तं फलम्",
              "Strījanmakundalyāṃ tanvādibhāvasthagrahāṇāṃ jātakoktaṃ phalam",
            )}
      </p>

      {tab === "male" ? (
        <JanmaPhalaTable
          rows={PURUSHA_JANMA_ROWS}
          grahas={PURUSHA_JANMA_GRAHAS}
          houseColLabel={bilingualText(lang, "भाव", "Bhava")}
        />
      ) : (
        <JanmaPhalaTable
          rows={STREI_JANMA_ROWS}
          grahas={STREI_JANMA_GRAHAS}
          houseColLabel={bilingualText(lang, "भाव", "Bhava")}
        />
      )}
    </div>
  );
}
