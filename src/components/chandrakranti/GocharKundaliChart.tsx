import type { GocharGraha } from "@/lib/api";
import {
  buildPlanetsByRashi,
  formatGocharBsLabel,
  RASHI_NE,
} from "@/lib/chandrakranti/gochar-display";
import {
  GOCHAR_RASHI_TO_HOUSE,
  NI_HOUSE_POLYGONS,
  polygonCentroid,
} from "@/lib/kundali/north-indian-layout";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

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
  const planetsByRashi = buildPlanetsByRashi(grahas);
  const dateLabel = formatGocharBsLabel(dateBs, dateAd);

  return (
    <div className={cn("rounded-xl border border-border p-4", className)}>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Sparkles className="h-4 w-4 text-secondary" /> गोचर कुण्डली
      </h3>

      <div className="mb-3 space-y-2">
        <div className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5">
          <p className="font-mono text-base font-medium leading-relaxed text-foreground">
            {papanshaLine || "पापाशाः—"}
          </p>
        </div>
        {gapanshaLine ? (
          <div className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5">
            <p className="font-mono text-base font-medium leading-relaxed text-foreground">
              {gapanshaLine}
            </p>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">लोड हुँदैछ…</p>
      ) : grahas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">विवरण उपलब्ध छैन।</p>
      ) : (
        <svg
          viewBox="0 0 300 300"
          className="mx-auto h-auto w-full max-w-[300px] text-foreground"
          role="img"
          aria-label="गोचर कुण्डली"
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
            const planetLine = planets.join(" ");

            return (
              <g key={rashiNe}>
                {planetLine ? (
                  <text
                    x={cx}
                    y={cy - 6}
                    textAnchor="middle"
                    className="fill-foreground text-[13px] font-semibold"
                  >
                    {planetLine}
                  </text>
                ) : null}
                <text
                  x={cx}
                  y={cy + (planetLine ? 14 : 4)}
                  textAnchor="middle"
                  className="fill-foreground/80 text-[13px] font-medium"
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

      {dateLabel ? (
        <p className="mt-2 text-center text-sm text-muted-foreground">{dateLabel} को स्थिति</p>
      ) : null}
    </div>
  );
}
