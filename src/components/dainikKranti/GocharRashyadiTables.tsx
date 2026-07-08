import type { GocharGraha } from "@/lib/api";
import {
  mergeKundaliRashi,
  RASHYADI_PLANET_ABBREV,
  RASHYADI_PLANET_KEYS,
  RASHYADI_ROW_KEYS,
  RASHYADI_ROW_LABEL,
  rashyadiCellValue,
  type RashyadiRowKey,
  type RashyadiSegment,
} from "@/lib/dainikKranti/rashyadi";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale";

type GrahaRow = GocharGraha & { key: string };

type TableProps = {
  segment: RashyadiSegment;
  kundaliGrahas?: GrahaRow[];
  kundaliDateAd?: string | null;
  loading?: boolean;
  className?: string;
};

function rowLabelFor(segment: RashyadiSegment, key: RashyadiRowKey): string {
  if (key === "rashi") return segment.monthInitialLabel;
  return RASHYADI_ROW_LABEL[key];
}

export function GocharRashyadiTable({
  segment,
  kundaliGrahas,
  kundaliDateAd,
  loading,
  className,
}: TableProps) {
  const { pick, digits } = useLocale();
  const planets =
    kundaliGrahas &&
    kundaliDateAd &&
    segment.anchorDateAd === kundaliDateAd &&
    segment.anchor === "start"
      ? mergeKundaliRashi(segment.planets, kundaliGrahas)
      : segment.planets;

  if (loading) {
    return (
      <div className={cn("flex h-full min-h-[280px] items-center justify-center rounded-xl border border-border p-4", className)}>
        <p className="text-sm text-muted-foreground">{pick("लोड हुँदैछ…", "Loading…")}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col overflow-x-auto rounded-xl border border-border bg-muted/15", className)}>
      <div className="border-b border-border bg-muted/40 px-3 py-2.5">
        <p className="text-sm font-semibold leading-snug text-secondary">{segment.versionNe}</p>
        <p className="mt-0.5 text-base font-medium text-foreground">
          {segment.labelNe}
          {segment.bsDay != null ? (
            <span className="ml-1.5 text-sm text-muted-foreground">
              ({digits(segment.bsDay)}{pick(" गते", "")})
            </span>
          ) : null}
        </p>
        {segment.moonRashiNe ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {pick("च.रा.", "Moon")}: <span className="font-medium text-foreground">{segment.moonRashiNe}</span>
          </p>
        ) : null}
      </div>

      <table className="w-full flex-1 border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="w-10 px-1 py-2" />
            {RASHYADI_PLANET_KEYS.map((key) => (
              <th
                key={key}
                className="min-w-[2.25rem] px-1 py-2 text-center text-base font-bold text-foreground"
              >
                {RASHYADI_PLANET_ABBREV[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/60">
            <td className="px-1 py-2 text-center text-base font-semibold text-muted-foreground">
              {digits(segment.pakshaDayCount)}
            </td>
            {RASHYADI_PLANET_KEYS.map((key) => (
              <td key={`${segment.id}-hdr-${key}`} className="px-1 py-2" />
            ))}
          </tr>
          {RASHYADI_ROW_KEYS.map((rowKey) => (
            <tr key={rowKey} className="border-b border-border/60 last:border-0">
              <td className="whitespace-nowrap px-1 py-2 text-center text-sm font-semibold text-muted-foreground">
                {rowLabelFor(segment, rowKey)}
              </td>
              {RASHYADI_PLANET_KEYS.map((key) => {
                const row = planets[key];
                return (
                  <td
                    key={`${segment.id}-${key}-${rowKey}`}
                    className="px-1 py-2 text-center font-mono text-base font-medium tabular-nums text-foreground"
                  >
                    {row ? rashyadiCellValue(row, rowKey) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
        {pick(
          "अं=अंश · ग=कला · वि=विकला · प्र=तटपरा · त्र=प्रतितत्परा",
          "Deg=degree · Ka=kala · Vi=vikala · Pr=prati-tatpara · Tr=prati-vikala",
        )}
      </p>
    </div>
  );
}
