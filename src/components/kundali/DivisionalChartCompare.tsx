import { useMemo, useState } from "react";
import { useLocale } from "@/i18n/locale";
import { D1Chart } from "@/components/kundali/D1Chart";
import { buildBhavaChart, type BhavaHouse } from "@/lib/bhava";
import {
  type ChartAnchor,
  CHART_ANCHOR_LABELS,
  GRAHA_ANCHOR_ORDER,
  type VargaDivision,
  VARGA_OPTIONS,
  vargaOption,
  vargaRashiFromLongitude,
} from "@/lib/vargas";
import { cn } from "@/lib/utils";

type PlanetInput = {
  key: string;
  labelNe: string;
  longitude?: number;
};

type PanelConfig = {
  anchor: ChartAnchor;
  division: VargaDivision;
};

function resolveAnchorLongitude(
  anchor: ChartAnchor,
  lagnaLongitude: number | undefined,
  planets: PlanetInput[],
): number | undefined {
  if (anchor === "lagna") return lagnaLongitude;
  return planets.find((p) => p.key === anchor)?.longitude;
}

function buildDivisionalHouses(
  { anchor, division }: PanelConfig,
  lagnaLongitude: number | undefined,
  planets: PlanetInput[],
  rashiNeFromNumber: (rashi?: number) => string | undefined,
): BhavaHouse[] {
  const anchorLon = resolveAnchorLongitude(anchor, lagnaLongitude, planets);
  if (anchorLon == null) return [];

  const lagnaRashi = vargaRashiFromLongitude(division, anchorLon);
  const planetRashis = planets
    .filter((p) => p.longitude != null)
    .map((p) => ({
      key: p.key,
      labelNe: p.labelNe,
      rashi: vargaRashiFromLongitude(division, p.longitude!),
    }));

  return buildBhavaChart(lagnaRashi, planetRashis, rashiNeFromNumber);
}

function useAnchorOptions(lagnaLongitude: number | undefined, planets: PlanetInput[]) {
  return useMemo(() => {
    const options: ChartAnchor[] = [];
    if (lagnaLongitude != null) options.push("lagna");
    for (const key of GRAHA_ANCHOR_ORDER) {
      if (planets.some((p) => p.key === key && p.longitude != null)) {
        options.push(key);
      }
    }
    return options;
  }, [lagnaLongitude, planets]);
}

function ChartSlot({
  panel,
  onPanelChange,
  houses,
  side,
  anchorOptions,
}: {
  panel: PanelConfig;
  onPanelChange: (next: PanelConfig) => void;
  houses: BhavaHouse[];
  side: "left" | "right";
  anchorOptions: ChartAnchor[];
}) {
  const { pick } = useLocale();
  const varga = vargaOption(panel.division);
  const anchorLabel = CHART_ANCHOR_LABELS[panel.anchor];

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div
        className={cn(
          "flex flex-wrap items-end gap-2 rounded-xl border border-border bg-muted/30 p-3",
          side === "right" && "sm:justify-end",
        )}
      >
        <label className="flex flex-col gap-1 min-w-[7.5rem] flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {pick("आधार", "Anchor")}
          </span>
          <select
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm font-medium text-foreground"
            value={panel.anchor}
            onChange={(e) =>
              onPanelChange({ ...panel, anchor: e.target.value as ChartAnchor })
            }
          >
            {anchorOptions.map((anchor) => {
              const labels = CHART_ANCHOR_LABELS[anchor];
              return (
                <option key={anchor} value={anchor}>
                  {pick(labels.labelNe, labels.labelEn)}
                </option>
              );
            })}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-[9rem] flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {pick("वर्ग", "Chart")}
          </span>
          <select
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm font-medium text-foreground"
            value={panel.division}
            onChange={(e) =>
              onPanelChange({
                ...panel,
                division: Number(e.target.value) as VargaDivision,
              })
            }
          >
            {VARGA_OPTIONS.map((opt) => (
              <option key={opt.division} value={opt.division}>
                {opt.short} — {pick(opt.labelNe, opt.labelEn)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center gap-3 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_6%,transparent)]">
        <div className="text-center w-full border-b border-border/60 pb-2">
          <p className="text-sm font-bold text-foreground">
            {pick(anchorLabel.labelNe, anchorLabel.labelEn)}
            <span className="text-muted-foreground font-normal mx-1.5">·</span>
            {varga.short}
            <span className="text-muted-foreground font-normal mx-1">—</span>
            {pick(varga.labelNe, varga.labelEn)}
          </p>
        </div>
        {houses.length > 0 ? (
          <D1Chart houses={houses} />
        ) : (
          <p className="text-sm text-muted-foreground py-8">
            {pick("चक्र बनाउन डाटा अपुग।", "Not enough data for this chart.")}
          </p>
        )}
      </div>
    </div>
  );
}

export type DivisionalChartCompareProps = {
  lagnaLongitude?: number;
  planets: PlanetInput[];
  rashiNeFromNumber: (rashi?: number) => string | undefined;
  defaultLeft?: PanelConfig;
  defaultRight?: PanelConfig;
};

export function DivisionalChartCompare({
  lagnaLongitude,
  planets,
  rashiNeFromNumber,
  defaultLeft = { anchor: "lagna", division: 1 },
  defaultRight = { anchor: "moon", division: 9 },
}: DivisionalChartCompareProps) {
  const anchorOptions = useAnchorOptions(lagnaLongitude, planets);
  const [left, setLeft] = useState<PanelConfig>(defaultLeft);
  const [right, setRight] = useState<PanelConfig>(defaultRight);

  const safeLeft = anchorOptions.includes(left.anchor) ? left : { ...left, anchor: anchorOptions[0] ?? "lagna" };
  const safeRight = anchorOptions.includes(right.anchor)
    ? right
    : { ...right, anchor: anchorOptions[1] ?? anchorOptions[0] ?? "moon" };

  const leftHouses = useMemo(
    () => buildDivisionalHouses(safeLeft, lagnaLongitude, planets, rashiNeFromNumber),
    [safeLeft, lagnaLongitude, planets, rashiNeFromNumber],
  );

  const rightHouses = useMemo(
    () => buildDivisionalHouses(safeRight, lagnaLongitude, planets, rashiNeFromNumber),
    [safeRight, lagnaLongitude, planets, rashiNeFromNumber],
  );

  if (anchorOptions.length === 0) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-4 p-4">
      <ChartSlot
        panel={safeLeft}
        onPanelChange={setLeft}
        houses={leftHouses}
        side="left"
        anchorOptions={anchorOptions}
      />
      <ChartSlot
        panel={safeRight}
        onPanelChange={setRight}
        houses={rightHouses}
        side="right"
        anchorOptions={anchorOptions}
      />
    </div>
  );
}
