import { Check, Info, Minus } from "lucide-react";
import { useLocale } from "@/i18n/locale";
import type { KundaliYoga } from "@/lib/api";
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
const td = "px-2.5 py-2 text-[12.5px]";

export type YogaListProps = {
  yogas: KundaliYoga[];
};

/**
 * Kundali yoga checklist: each classical yoga with its nature
 * (auspicious / inauspicious), whether it is formed in this chart, and an
 * ⓘ description of the rule used.
 */
export function YogaList({ yogas }: YogaListProps) {
  const { pick } = useLocale();

  if (yogas.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className={cn(th, "pl-3.5")}>{pick("योग", "Yoga")}</TableHead>
          <TableHead className={th}>{pick("प्रकृति", "Nature")}</TableHead>
          <TableHead className={cn(th, "pr-3.5")}>{pick("स्थिति", "Status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {yogas.map((yoga, i) => {
          const desc = pick(yoga.descNe, yoga.descEn);
          return (
            <TableRow
              key={yoga.key}
              className={cn(
                i % 2 === 1 && "bg-muted/20",
                yoga.present && "bg-secondary/[0.06] dark:bg-secondary/10",
              )}
            >
              <TableCell
                className={cn(
                  td,
                  "pl-3.5 w-full max-w-0 whitespace-normal align-top sm:max-w-[420px]",
                )}
              >
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Info
                    className="size-3.5 shrink-0 text-muted-foreground/60"
                    aria-hidden
                  />
                  {pick(yoga.nameNe, yoga.nameEn)}
                </span>
                <span className="mt-0.5 block pl-5 text-[11px] leading-snug text-muted-foreground break-words">
                  {desc}
                </span>
              </TableCell>
              <TableCell className={cn(td, "whitespace-nowrap align-top")}>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                    yoga.nature === "auspicious"
                      ? "bg-secondary/15 text-secondary"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {yoga.nature === "auspicious" ? pick("शुभ", "Auspicious") : pick("अशुभ", "Inauspicious")}
                </span>
              </TableCell>
              <TableCell className={cn(td, "pr-3.5 whitespace-nowrap align-top")}>
                {yoga.present ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <Check className="size-3.5 text-secondary" aria-hidden />
                    {pick("छ", "Present")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Minus className="size-3.5" aria-hidden />
                    {pick("छैन", "Absent")}
                  </span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
