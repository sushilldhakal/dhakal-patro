import type { BhavaHouse } from "@/lib/bhava";
import {
  NI_HOUSE_POLYGONS,
  planetGridLayout,
  pointsToSvg,
  polygonCentroid,
} from "@/lib/kundali/north-indian-layout";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale";

const PLANET_ABBR_NE: Record<string, string> = {
  sun: "सू",
  moon: "चं",
  mars: "मं",
  mercury: "बु",
  jupiter: "गु",
  venus: "शु",
  saturn: "श",
  rahu: "रा",
  ketu: "के",
};

const PLANET_ABBR_EN: Record<string, string> = {
  sun: "Su", moon: "Mo", mars: "Ma", mercury: "Me", jupiter: "Ju",
  venus: "Ve", saturn: "Sa", rahu: "Ra", ketu: "Ke",
};

const RASHI_EN = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
];

interface Props {
  houses: BhavaHouse[];
}

export function D1Chart({ houses }: Props) {
  const { pick, digits } = useLocale();
  const byHouse = new Map(houses.map((h) => [h.house, h]));

  return (
    <svg
      viewBox="0 0 300 300"
      className="w-full h-auto max-w-[340px] mx-auto"
      role="img"
      aria-label="North Indian kundali chart"
    >
      <rect
        x="0"
        y="0"
        width="300"
        height="300"
        className="fill-background/60 dark:fill-background/40 stroke-border"
        strokeWidth="1.5"
        rx="4"
      />
      <line x1="0" y1="0" x2="300" y2="300" className="stroke-border/80" strokeWidth="1.25" />
      <line x1="300" y1="0" x2="0" y2="300" className="stroke-border/80" strokeWidth="1.25" />
      <polygon
        points="150,0 300,150 150,300 0,150"
        className="fill-none stroke-border/80"
        strokeWidth="1.25"
      />

      {Object.entries(NI_HOUSE_POLYGONS).map(([houseStr, points]) => {
        const houseNum = Number(houseStr);
        const house = byHouse.get(houseNum);
        const [cx, cy] = polygonCentroid(points);
        const planetLines = house?.planets ?? [];
        const hasPlanets = planetLines.length > 0;

        return (
          <g key={houseNum}>
            {house?.isLagna && (
              <polygon
                points={pointsToSvg(points)}
                className="fill-secondary/15 dark:fill-secondary/25"
              />
            )}
            {house && (
              <text
                x={cx}
                y={cy - (hasPlanets ? 12 : 0)}
                textAnchor="middle"
                className={cn(
                  "text-[10px] font-semibold",
                  house.isLagna ? "fill-secondary" : "fill-muted-foreground"
                )}
              >
                {digits(house.rashi)} {pick(house.rashiNe, RASHI_EN[house.rashi - 1] ?? house.rashiNe)}
              </text>
            )}
            {(() => {
              if (!hasPlanets) return null;
              const layout = planetGridLayout(points, planetLines.length);
              return planetLines.map((planet, i) => {
                const row = Math.floor(i / layout.columns);
                const rowStart = row * layout.columns;
                const itemsInRow = Math.min(layout.columns, planetLines.length - rowStart);
                const col = i - rowStart;
                const x = cx + (col - (itemsInRow - 1) / 2) * layout.colGap;
                const y = cy + row * layout.rowGap;
                return (
                  <text
                    key={planet.key}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    style={{ fontSize: `${layout.fontSize}px` }}
                    className="font-medium fill-foreground"
                  >
                    {pick(PLANET_ABBR_NE[planet.key] ?? planet.labelNe.slice(0, 2), PLANET_ABBR_EN[planet.key] ?? planet.labelNe.slice(0, 2))}
                  </text>
                );
              });
            })()}
          </g>
        );
      })}
    </svg>
  );
}
