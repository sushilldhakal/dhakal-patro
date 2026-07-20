import { Check, Info } from "lucide-react";
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

const th = "h-9 px-2.5 text-sm font-semibold uppercase tracking-wide";
const td = "px-2.5 py-2 text-sm";

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
  const present = yogas.filter((y) => y.present);

  if (present.length === 0) return null;

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
        {present.map((yoga, i) => {
          const desc = pick(
            yoga.descNe?.trim() ? yoga.descNe : yoga.descEn,
            yoga.descEn,
          );
          const name = pick(
            yoga.nameNe?.trim() ? yoga.nameNe : yoga.nameEn,
            yoga.nameEn,
          );
          return (
            <TableRow
              key={yoga.key}
              className={cn(
                i % 2 === 1 && "bg-muted/20",
                "bg-secondary/[0.06] dark:bg-secondary/10",
              )}
            >
              <TableCell
                className={cn(
                  td,
                  "pl-3.5 min-w-[11rem] max-w-[min(100%,28rem)] whitespace-normal align-top",
                )}
              >
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Info
                    className="size-3.5 shrink-0"
                    aria-hidden
                  />
                  {name}
                </span>
                <span className="mt-0.5 block pl-5 text-sm leading-snug break-words">
                  {desc}
                </span>
              </TableCell>
              <TableCell className={cn(td, "whitespace-nowrap align-top")}>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-sm font-semibold",
                    yoga.nature === "auspicious"
                      ? "bg-secondary/15 text-secondary"
                      : yoga.nature === "mixed"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : yoga.nature === "caution"
                          ? "bg-muted"
                          : "bg-destructive/10 text-destructive",
                  )}
                >
                  {yoga.nature === "auspicious"
                    ? pick("शुभ", "Auspicious")
                    : yoga.nature === "mixed"
                      ? pick("मिश्र", "Mixed")
                      : yoga.nature === "caution"
                        ? pick("सावधानी", "Caution")
                        : pick("अशुभ", "Inauspicious")}
                </span>
              </TableCell>
              <TableCell className={cn(td, "pr-3.5 whitespace-nowrap align-top")}>
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Check className="size-3.5 text-secondary" aria-hidden />
                  {pick("छ", "Present")}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
