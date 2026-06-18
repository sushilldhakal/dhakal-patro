import type { BhavaHouse } from "@/lib/bhava";
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

/** 300x300 North Indian diamond chart — fixed house slots, rashi rotates with Lagna. */
const HOUSE_POLYGONS: Record<number, [number, number][]> = {
  1: [[150, 0], [225, 75], [150, 150], [75, 75]],
  2: [[0, 0], [150, 0], [75, 75]],
  3: [[0, 0], [75, 75], [0, 150]],
  4: [[0, 150], [75, 75], [150, 150], [75, 225]],
  5: [[0, 150], [75, 225], [0, 300]],
  6: [[0, 300], [75, 225], [150, 300]],
  7: [[150, 300], [75, 225], [150, 150], [225, 225]],
  8: [[150, 300], [225, 225], [300, 300]],
  9: [[225, 225], [300, 300], [300, 150]],
  10: [[300, 150], [225, 225], [150, 150], [225, 75]],
  11: [[300, 150], [225, 75], [300, 0]],
  12: [[225, 75], [300, 0], [150, 0]],
};

function centroid(points: [number, number][]): [number, number] {
  const n = points.length;
  const sum = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [sum[0] / n, sum[1] / n];
}

interface Props {
  houses: BhavaHouse[];
}

export function D1Chart({ houses }: Props) {
  const byHouse = new Map(houses.map((h) => [h.house, h]));

  return (
    <svg viewBox="0 0 300 300" className="w-full h-auto max-w-sm mx-auto">
      <rect x="0" y="0" width="300" height="300" className="fill-card stroke-border" strokeWidth="1.5" />
      <line x1="0" y1="0" x2="300" y2="300" className="stroke-border" strokeWidth="1.5" />
      <line x1="300" y1="0" x2="0" y2="300" className="stroke-border" strokeWidth="1.5" />
      <polygon
        points="150,0 300,150 150,300 0,150"
        className="fill-none stroke-border"
        strokeWidth="1.5"
      />

      {Object.entries(HOUSE_POLYGONS).map(([houseStr, points]) => {
        const houseNum = Number(houseStr);
        const house = byHouse.get(houseNum);
        const [cx, cy] = centroid(points);
        const planetLines = house?.planets ?? [];
        const hasPlanets = planetLines.length > 0;

        return (
          <g key={houseNum}>
            {house?.isLagna && (
              <polygon
                points={points.map((p) => p.join(",")).join(" ")}
                className="fill-secondary/10"
              />
            )}
            {house && (
              <text
                x={cx}
                y={cy - (hasPlanets ? 14 : 0)}
                textAnchor="middle"
                className={cn(
                  "text-[11px] font-semibold",
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
                y={cy + i * 13}
                textAnchor="middle"
                className="text-[11px] font-medium fill-foreground"
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
