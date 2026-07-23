import type { GocharGraha } from "@/lib/api";
import {
  buildPlanetsByRashi,
  formatGocharBsLabel,
  RASHI_NE,
} from "@/lib/dainikKranti/gochar-display";
import {
  GOCHAR_RASHI_TO_HOUSE,
  NI_HOUSE_POLYGONS,
  polygonCentroid,
} from "@/lib/kundali/north-indian-layout";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { GrahaStatusLegend, GrahaStatusMarksSvg } from "@/components/graha/GrahaStatusBadges";
import { useLocale } from "@/i18n/locale";

type GrahaRow = GocharGraha & { key: string };

type Props = {
  grahas: GrahaRow[];
  /** पापाशाःसू०७, म.६, श.१०, रा.९के.३ */
  papanshaLine?: string;
  /** गा.पाशाः१५सू८, १८म.७, … */
  gapanshaLine?: string;
  dateBs?: string | null;
  dateAd?: string | null;
  loading?: boolean;
  className?: string;
};

export function GocharKundaliChart({
  grahas,
  papanshaLine = "",
  gapanshaLine = "",
  dateBs,
  dateAd,
  loading,
  className,
}: Props) {
  const { pick } = useLocale();
  const planetsByRashi = buildPlanetsByRashi(grahas);
  const dateLabel = formatGocharBsLabel(dateBs, dateAd);

  return (
    <div className={cn("rounded-xl border border-border p-4", className)}>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Sparkles className="h-4 w-4 text-secondary" /> {pick("गोचर कुण्डली", "Transit Chart")}
      </h3>

      <div className="mb-3 space-y-2">
        <div className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5">
          <p className="font-mono text-base text-base leading-relaxed text-foreground">
            {papanshaLine || pick("पापाशाः—", "Papashah —")}
          </p>
        </div>
        {gapanshaLine ? (
          <div className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5">
            <p className="font-mono text-base text-base leading-relaxed text-foreground">
              {gapanshaLine}
            </p>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm">{pick("लोड हुँदैछ…", "Loading…")}</p>
      ) : grahas.length === 0 ? (
        <p className="py-8 text-center text-sm">{pick("विवरण उपलब्ध छैन।", "No details available.")}</p>
      ) : (
        <svg
          viewBox="0 0 300 300"
          className="mx-auto h-auto w-full max-w-[300px] text-foreground"
          role="img"
          aria-label={pick("गोचर कुण्डली", "Transit chart")}
        >
          <rect
            x="0"
            y="0"
            width="300"
            height="300"
            className="fill-background"
            rx="2"
          />

          {RASHI_NE.map((rashiNe, idx) => {
            const rashiNo = idx + 1;
            const house = GOCHAR_RASHI_TO_HOUSE[rashiNo]!;
            const points = NI_HOUSE_POLYGONS[house]!;
            const [cx, cy] = polygonCentroid(points);
            const planets = planetsByRashi[rashiNo] ?? [];

            const slot = planets.length > 3 ? 15 : 18;
            return (
              <g key={rashiNe}>
                {planets.map((planet, i) => {
                  const px = cx + (i - (planets.length - 1) / 2) * slot;
                  return (
                    <g key={planet.key}>
                      <text
                        x={px}
                        y={cy - 6}
                        textAnchor="middle"
                        className="fill-foreground text-sm font-semibold"
                      >
                        {planet.label}
                      </text>
                      <GrahaStatusMarksSvg
                        planetKey={planet.key}
                        isRetrograde={planet.isRetrograde}
                        isCombust={planet.isCombust}
                        x={px + 3}
                        y={cy - 18}
                        size={7}
                      />
                    </g>
                  );
                })}
                <text
                  x={cx}
                  y={cy + (planets.length ? 14 : 4)}
                  textAnchor="middle"
                  className="fill-foreground/80 text-sm text-base"
                >
                  {rashiNe}
                </text>
              </g>
            );
          })}

          <g className="stroke-current" fill="none" strokeWidth="1.75" strokeLinejoin="miter">
            <rect x="0" y="0" width="300" height="300" rx="2" />
            <line x1="0" y1="0" x2="300" y2="300" />
            <line x1="300" y1="0" x2="0" y2="300" />
            <polygon points="150,0 300,150 150,300 0,150" />
          </g>
        </svg>
      )}

      {grahas.some((g) => g.is_retrograde || g.is_combust) ? (
        <GrahaStatusLegend className="mt-2" />
      ) : null}

      {dateLabel ? (
        <p className="mt-2 text-center text-sm">{pick(`${dateLabel} को स्थिति`, `Position on ${dateLabel}`)}</p>
      ) : null}
    </div>
  );
}
