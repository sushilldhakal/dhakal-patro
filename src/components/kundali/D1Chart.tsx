import type { BhavaHouse } from "@/lib/bhava";
import { useTranslation } from "react-i18next";
import {
  NI_HOUSE_POLYGONS,
  planetGridLayout,
  pointsToSvg,
  polygonCentroid,
} from "@/lib/kundali/north-indian-layout";
import { cn } from "@/lib/utils";
import { GrahaStatusMarksSvg } from "@/components/graha/GrahaStatusBadges";
import { useLocale, bilingualText } from "@/i18n/locale";
import { formatRashiByNumber } from "@/lib/rashi-i18n";

/** Catalogue key for each planet's two-letter glyph label. */
const PLANET_ABBR_KEY: Record<string, string> = {
  sun: "kundali.x.abbr_sun",
  moon: "kundali.x.abbr_moon",
  mars: "kundali.x.abbr_mars",
  mercury: "kundali.x.abbr_mercury",
  jupiter: "kundali.x.abbr_jupiter",
  venus: "kundali.x.abbr_venus",
  saturn: "kundali.x.abbr_saturn",
  rahu: "kundali.x.abbr_rahu",
  ketu: "kundali.x.abbr_ketu",
};

/** Western signs from i18n (Aries, Leo, …). */

interface Props {
  houses: BhavaHouse[];
}

export function D1Chart({ houses }: Props) {
  const { t } = useTranslation();
  const { digits, lang } = useLocale();
  const byHouse = new Map(houses.map((h) => [h.house, h]));

  return (
    <svg
      viewBox="0 0 300 300"
      className="w-full h-auto max-w-[340px] mx-auto"
      role="img"
      aria-label={t("kundali.north_indian_kundali_chart")}
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
                  "text-sm font-semibold",
                  house.isLagna ? "fill-secondary" : "fill-muted-foreground"
                )}
              >
                {digits(house.rashi)} {formatRashiByNumber(house.rashi, lang)}
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
                const markSize = layout.fontSize * 0.5;
                const abbr = bilingualText(lang, PLANET_ABBR_NE[planet.key] ?? planet.labelNe.slice(0, 2), PLANET_ABBR_EN[planet.key] ?? planet.labelNe.slice(0, 2));
                return (
                  <g key={planet.key}>
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      style={{ fontSize: `${layout.fontSize}px` }}
                      className="text-base fill-foreground"
                    >
                      {abbr}
                    </text>
                    {/* Marks sit just right of the abbreviation, aligned with
                        the glyph's mid-height — never lifted into the rashi
                        label above or crowded onto the neighbour. */}
                    <GrahaStatusMarksSvg
                      planetKey={planet.key}
                      isRetrograde={planet.isRetrograde}
                      isCombust={planet.isCombust}
                      x={x + layout.fontSize * 0.42}
                      y={y - markSize - layout.fontSize * 0.05}
                      size={markSize}
                    />
                  </g>
                );
              });
            })()}
          </g>
        );
      })}
    </svg>
  );
}
