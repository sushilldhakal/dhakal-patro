import type { ReactNode } from "react";
import {
  PATRO_PLANET_KEYS,
  PATRO_PLANET_NE,
  RASHI_COLUMNS_NE,
  type CalcNote,
  type GrahaSpashtaRow,
  type LagnaMatrixRow,
} from "@/lib/chandrakranti/month-patro-tables";
import { cn } from "@/lib/utils";

type Props = {
  lagna?: LagnaMatrixRow;
  graha?: GrahaSpashtaRow;
  notes?: CalcNote[];
};

const LAGNA_GRID =
  "grid w-full min-w-0 grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12";

const GRAHA_GRID =
  "grid w-full min-w-0 grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">
      {children}
    </p>
  );
}

export function DayPatroExpandPanel({ lagna, graha, notes = [] }: Props) {
  return (
    <div className="w-full min-w-0 max-w-full space-y-4 py-2">
      {lagna ? (
        <div className="w-full min-w-0">
          <SectionTitle>दैनिक लग्न आरम्भ (बजे)</SectionTitle>
          <div className={LAGNA_GRID}>
            {RASHI_COLUMNS_NE.map((rne, i) => {
              const num = i + 1;
              const val = lagna.times[num];
              const late =
                val?.includes("२५") || val?.includes("२६") || val?.includes("२७");
              return (
                <div
                  key={rne}
                  className="min-w-0 rounded-md border border-border/80 bg-background/80 px-1.5 py-1.5 text-center sm:px-2"
                >
                  <div className="text-xs font-medium leading-tight text-muted-foreground sm:text-sm">
                    {rne}
                  </div>
                  <div
                    className={cn(
                      "mt-1 break-all font-mono text-xs tabular-nums sm:text-sm",
                      late ? "text-amber-700 dark:text-amber-300" : "text-foreground",
                    )}
                  >
                    {val ?? "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {graha ? (
        <div className="w-full min-w-0">
          <SectionTitle>उदयकालिक ग्रहस्पष्ट (सूर्योदय)</SectionTitle>
          <div className={GRAHA_GRID}>
            {PATRO_PLANET_KEYS.map((key) => {
              const cell = graha.planets[key];
              if (!cell) return null;
              return (
                <div
                  key={key}
                  className="min-w-0 rounded-md border border-border/80 bg-background/80 px-2.5 py-2"
                >
                  <div className="text-sm font-semibold text-foreground">{PATRO_PLANET_NE[key]}</div>
                  <div className="mt-0.5 break-words font-mono text-xs tabular-nums text-muted-foreground sm:text-sm">
                    <span className="text-foreground">{cell.rashiNe}</span> {cell.coords}
                  </div>
                </div>
              );
            })}
            {graha.belaantar ? (
              <div className="min-w-0 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-2 md:col-span-2 lg:col-span-4">
                <div className="text-sm font-semibold text-foreground">बेलान्तर</div>
                <div className="mt-0.5 break-words font-mono text-xs text-amber-800 dark:text-amber-200 sm:text-sm">
                  {graha.belaantar}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {notes.length > 0 ? (
        <ul className="w-full min-w-0 space-y-1.5 text-sm text-muted-foreground">
          {notes.map((n) => (
            <li key={`${n.kind}-${n.text}`} className="break-words">
              <span className="font-medium text-foreground">{n.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
