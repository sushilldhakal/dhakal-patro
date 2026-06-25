import type { BhavaHouse } from "@/lib/bhava";
import {
  NI_HOUSE_POLYGONS,
  pointsToSvg,
  polygonCentroid,
} from "@/lib/kundali/north-indian-layout";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";

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

interface Props {
  houses: BhavaHouse[];
}

export function D1Chart({ houses }: Props) {
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
                {toNepaliDigits(house.rashi)} {house.rashiNe}
              </text>
            )}
            {planetLines.map((planet, i) => (
              <text
                key={planet.key}
                x={cx}
                y={cy + i * 17}
                textAnchor="middle"
                className="text-[13px] font-medium fill-foreground"
              >
                {PLANET_ABBR_NE[planet.key] ?? planet.labelNe.slice(0, 2)}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
