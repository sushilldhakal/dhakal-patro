import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import {
  VASTU_WHEEL_DIRECTIONS,
  vastuWheelPoint,
  type VastuDirectionId,
} from "@/lib/vastu";
import { cn } from "@/lib/utils";

const WHEEL_SIZE = 620;
const CX = WHEEL_SIZE / 2;
const CY = WHEEL_SIZE / 2;
const PURUSHA_OPACITY = 0.2;

/**
 * Concentric bands, outside → in. The 8 clickable दिशा wedges and the
 * Brahmasthan stay the same interaction; everything else is a decorative
 * Shakti-chakra layer (degrees, 16 compass points, organs/gunas, life
 * attributes, 32 pada codes, 32 perimeter deities, inner four).
 */
const DEG_OUTER = 308;
const DEG_INNER = 292;
const DIR16_OUTER = 292;
const DIR16_INNER = 266;
const ORGAN_OUTER = 266;
const ORGAN_INNER = 248;
const ATTR_OUTER = 248;
const ATTR_INNER = 214;
const CODE_OUTER = 214;
const CODE_INNER = 192;
const DEITY_OUTER = 192;
const DEITY_INNER = 162;
const WEDGE_OUTER = 162;
const WEDGE_INNER = 104;
const INNER4_OUTER = 104;
const INNER4_INNER = 66;
const CENTER_R = 60;
/** Diagonal figure — head/feet are the square corners, so keep those inside the rim. */
const PURUSHA_SIZE = Math.round(DEG_INNER * Math.SQRT2 * 0.82);

const DEG_LABEL_R = (DEG_OUTER + DEG_INNER) / 2;
const DIR16_LABEL_R = (DIR16_OUTER + DIR16_INNER) / 2;
const ORGAN_LABEL_R = (ORGAN_OUTER + ORGAN_INNER) / 2;
const ATTR_LABEL_R = (ATTR_OUTER + ATTR_INNER) / 2;
const CODE_LABEL_R = (CODE_OUTER + CODE_INNER) / 2;
const DEITY_LABEL_R = (DEITY_OUTER + DEITY_INNER) / 2;
const WEDGE_LABEL_R = (WEDGE_OUTER + WEDGE_INNER) / 2;
const INNER4_LABEL_R = (INNER4_OUTER + INNER4_INNER) / 2;

/** Quadrant color groups — independent of VASTU_ELEMENT_COLOR. */
const GROUP_COLORS = ["#2f8fa6", "#7a9a5b", "#d2622f", "#c9a23a"];

function groupColor(bearing: number): string {
  const idx16 = Math.round((((bearing % 360) + 360) % 360) / 22.5) % 16;
  return GROUP_COLORS[Math.floor(idx16 / 4)]!;
}

function normBearing(bearing: number): number {
  return ((bearing % 360) + 360) % 360;
}

/** Annular sector spanning `halfAngle` degrees on each side of `bearing`. */
function annularSectorPath(bearing: number, halfAngle: number, outerR: number, innerR: number): string {
  const from = bearing - halfAngle;
  const to = bearing + halfAngle;
  const o1 = vastuWheelPoint(from, outerR, CX, CY);
  const o2 = vastuWheelPoint(to, outerR, CX, CY);
  const i1 = vastuWheelPoint(to, innerR, CX, CY);
  const i2 = vastuWheelPoint(from, innerR, CX, CY);
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 0 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 0 0 ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

const COMPASS_16: { bearing: number; abbr: string; nameKey: string }[] = [
  { bearing: 0, abbr: "N", nameKey: "vastu.dir.north.name" },
  { bearing: 22.5, abbr: "NNE", nameKey: "vastu.dir16.nne.name" },
  { bearing: 45, abbr: "NE", nameKey: "vastu.dir.northeast.name" },
  { bearing: 67.5, abbr: "ENE", nameKey: "vastu.dir16.ene.name" },
  { bearing: 90, abbr: "E", nameKey: "vastu.dir.east.name" },
  { bearing: 112.5, abbr: "ESE", nameKey: "vastu.dir16.ese.name" },
  { bearing: 135, abbr: "SE", nameKey: "vastu.dir.southeast.name" },
  { bearing: 157.5, abbr: "SSE", nameKey: "vastu.dir16.sse.name" },
  { bearing: 180, abbr: "S", nameKey: "vastu.dir.south.name" },
  { bearing: 202.5, abbr: "SSW", nameKey: "vastu.dir16.ssw.name" },
  { bearing: 225, abbr: "SW", nameKey: "vastu.dir.southwest.name" },
  { bearing: 247.5, abbr: "WSW", nameKey: "vastu.dir16.wsw.name" },
  { bearing: 270, abbr: "W", nameKey: "vastu.dir.west.name" },
  { bearing: 292.5, abbr: "WNW", nameKey: "vastu.dir16.wnw.name" },
  { bearing: 315, abbr: "NW", nameKey: "vastu.dir.northwest.name" },
  { bearing: 337.5, abbr: "NNW", nameKey: "vastu.dir16.nnw.name" },
];

const ORGAN_16 = [
  "vastu.wheel.organ.kidney",
  "vastu.wheel.organ.pericardium",
  "vastu.wheel.organ.tamas",
  "vastu.wheel.organ.circulation",
  "vastu.wheel.organ.liver",
  "vastu.wheel.organ.gallbladder",
  "vastu.wheel.organ.rajas",
  "vastu.wheel.organ.spleen",
  "vastu.wheel.organ.stomach",
  "vastu.wheel.organ.heart",
  "vastu.wheel.organ.belly",
  "vastu.wheel.organ.lung",
  "vastu.wheel.organ.sattva",
  "vastu.wheel.organ.colon",
  "vastu.wheel.organ.intestine",
  "vastu.wheel.organ.bladder",
] as const;

const ATTR_16 = [
  "vastu.wheel.attr.money",
  "vastu.wheel.attr.health",
  "vastu.wheel.attr.clarity",
  "vastu.wheel.attr.joy",
  "vastu.wheel.attr.social",
  "vastu.wheel.attr.anxiety",
  "vastu.wheel.attr.liquidity",
  "vastu.wheel.attr.power",
  "vastu.wheel.attr.fame",
  "vastu.wheel.attr.expense",
  "vastu.wheel.attr.bonds",
  "vastu.wheel.attr.learning",
  "vastu.wheel.attr.gains",
  "vastu.wheel.attr.detox",
  "vastu.wheel.attr.support",
  "vastu.wheel.attr.attraction",
] as const;

/** 32 perimeter padas, Soma at north, clockwise — Shikhi sits on ईशान. */
const PADA_32 = [
  "soma",
  "bhujaga",
  "aditi",
  "diti",
  "shikhi",
  "parjanya",
  "jayanta",
  "mahendra",
  "surya",
  "satya",
  "bhrisha",
  "aakasha",
  "anila",
  "pushan",
  "vitatha",
  "grihakshata",
  "yama",
  "gandharva",
  "bhringraj",
  "mriga",
  "pitra",
  "dauvarika",
  "sugriva",
  "pushpadanta",
  "varuna",
  "asura",
  "shosha",
  "papayakshma",
  "roga",
  "naga",
  "mukhya",
  "bhallata",
] as const;

/** N1 sits on Roga (NW), matching the 32-pada chart — same slot as {@link PADA_32}'s roga. */
const N1_SLOT = PADA_32.indexOf("roga");
const PADA_STEP = 360 / PADA_32.length;

const INNER_4 = [
  { bearing: 0, id: "bhudhara" },
  { bearing: 90, id: "aryama" },
  { bearing: 180, id: "vivasvan" },
  { bearing: 270, id: "mitra" },
] as const;

const CODE_QUAD = ["N", "E", "S", "W"] as const;

const RING_DIVIDERS = [
  DEG_OUTER,
  DIR16_INNER,
  ORGAN_INNER,
  ATTR_INNER,
  CODE_INNER,
  DEITY_INNER,
  WEDGE_INNER,
  INNER4_INNER,
] as const;

function ArcLabel({
  bearing,
  radius,
  className,
  fontSize,
  fillOpacity = 0.85,
  children,
}: {
  bearing: number;
  radius: number;
  className?: string;
  fontSize: number;
  fillOpacity?: number;
  children: ReactNode;
}) {
  const flip = normBearing(bearing) > 90 && normBearing(bearing) < 270;
  return (
    <g transform={`rotate(${bearing} ${CX} ${CY})`}>
      <text
        x={CX}
        y={CY - radius}
        textAnchor="middle"
        dominantBaseline="central"
        className={cn("pointer-events-none select-none", className)}
        fill="currentColor"
        fillOpacity={fillOpacity}
        fontSize={fontSize}
        transform={flip ? `rotate(180 ${CX} ${CY - radius})` : undefined}
      >
        {children}
      </text>
    </g>
  );
}

/**
 * The exact figure the user provided (a classical dorsal-view Vastu Purusha
 * line drawing), traced into a vector path with potrace rather than
 * hand-approximated — earlier hand-drawn attempts didn't read as a person.
 * The source art already has the head in the upper-right (northeast) and
 * feet in the lower-left (southwest), matching this wheel's own screen
 * orientation, so no extra rotation is applied — just centering and scaling
 * to fit the hub. Exported on its own since it'll be reused outside this
 * wheel (e.g. a future house-design overlay).
 */
export function VastuPurushaSilhouette({ size = 100 }: { size?: number }) {
  const scale = size / 220;
  return (
    <g transform={`translate(${-size / 2} ${-size / 2}) scale(${scale})`}>
      <g transform="translate(0,220) scale(0.1,-0.1)" fill="currentColor" stroke="none">
        <path
          d="M1643 2185 c-14 -10 -30 -42 -44 -88 -26 -87 -43 -121 -81 -165 -40
-47 -35 -76 14 -80 39 -3 43 -23 10 -49 -50 -41 -123 11 -198 139 -52 89 -96
127 -177 155 -59 20 -194 22 -240 4 -36 -14 -191 -14 -237 -1 -70 21 -198 31
-268 20 -106 -17 -192 -90 -192 -165 0 -28 -4 -33 -29 -38 -170 -34 -241 -432
-167 -932 52 -348 44 -720 -18 -893 -15 -42 -15 -44 4 -49 11 -3 20 -11 20
-19 0 -23 16 -24 72 -5 144 50 543 63 798 27 239 -34 298 -38 510 -33 324 7
474 62 505 187 5 21 12 26 39 26 42 0 99 44 134 103 31 53 42 195 23 291 -28
136 -32 186 -20 255 43 264 10 365 -153 463 -123 75 -166 128 -146 182 18 49
55 54 60 8 4 -48 37 -49 89 -4 26 22 72 45 121 62 136 45 160 86 74 127 -29
14 -36 22 -31 35 32 81 8 203 -54 273 -63 72 -117 94 -235 94 -96 0 -99 1
-108 25 -9 26 -37 60 -47 60 -4 0 -16 -7 -28 -15z m50 -52 l15 -38 -40 -34
c-39 -34 -88 -118 -88 -153 0 -17 -28 -38 -49 -38 -19 0 -12 18 23 64 19 25
46 82 61 128 40 120 53 132 78 71z m-1036 -54 c52 -20 202 -23 280 -5 94 21
137 20 216 -4 85 -26 115 -53 177 -155 119 -198 234 -211 275 -31 30 138 110
207 237 208 152 0 257 -105 258 -258 0 -132 -57 -198 -205 -237 -76 -20 -92
-28 -107 -53 -47 -77 -9 -134 156 -234 79 -47 88 -56 116 -114 41 -83 47 -151
25 -266 -19 -98 -16 -220 6 -276 7 -16 12 -82 13 -149 1 -136 -6 -158 -73
-218 -50 -45 -82 -48 -106 -10 -10 16 -71 80 -135 143 -138 135 -280 337 -253
359 59 51 114 81 131 72 28 -15 98 -94 133 -151 49 -80 62 -69 27 25 -19 51
-23 80 -23 195 l0 135 -80 -80 c-111 -112 -170 -154 -321 -229 -102 -51 -141
-77 -178 -116 l-48 -51 -55 17 c-109 34 -226 132 -255 211 -10 26 -26 41 -71
65 -70 38 -135 107 -171 184 -46 98 -46 107 12 164 36 35 67 84 112 172 78
154 110 199 228 320 l94 96 -38 -9 c-95 -22 -212 -9 -356 38 -38 12 -16 -23
28 -47 50 -26 139 -101 154 -131 8 -15 1 -30 -36 -79 -26 -33 -49 -60 -50 -60
-2 0 -41 22 -87 49 -104 62 -229 163 -283 230 -23 27 -67 71 -98 96 -60 49
-62 54 -45 88 27 52 79 91 144 108 39 11 216 2 252 -12z m-359 -216 c85 -64
261 -341 313 -492 34 -97 28 -123 -36 -166 -30 -20 -81 -45 -112 -56 -73 -25
-136 -62 -190 -112 -24 -22 -43 -37 -43 -34 0 3 15 48 32 99 30 84 33 104 32
208 0 125 -15 200 -40 200 -10 0 -13 -6 -10 -17 47 -157 35 -276 -51 -492 -81
-205 -64 -315 69 -442 82 -78 76 -111 -30 -169 -56 -31 -72 -58 -79 -135 -6
-62 -35 -115 -64 -115 -4 0 -13 -16 -19 -35 -6 -19 -16 -35 -21 -35 -11 0 -12
-3 5 56 54 187 56 532 3 869 -31 204 -31 541 1 668 25 101 49 151 89 189 55
53 92 55 151 11z m621 -103 l66 0 -46 -46 -46 -46 -53 52 -52 53 32 -7 c18 -3
62 -6 99 -6z m1226 -74 c51 -22 36 -41 -54 -71 -66 -22 -128 -55 -187 -100
-19 -14 -26 -1 -15 26 7 19 24 29 67 43 45 14 70 29 104 66 54 57 43 53 85 36z
m-1443 -159 c32 -18 58 -36 58 -42 0 -5 -21 -52 -46 -104 l-46 -95 -23 70
c-21 68 -79 189 -130 271 l-26 43 78 -56 c42 -31 103 -70 135 -87z m-128 -420
c30 -105 129 -225 216 -263 26 -12 43 -30 64 -70 16 -30 52 -75 80 -101 49
-44 177 -113 211 -113 10 0 15 -6 13 -18 -13 -61 -249 87 -327 205 -17 25 -52
61 -79 78 -137 93 -274 328 -195 335 1 0 9 -24 17 -53z m-67 3 c26 -100 130
-241 225 -305 27 -17 62 -53 79 -78 60 -91 170 -176 276 -213 59 -21 59 -21
16 -109 -79 -160 -213 -258 -327 -239 -123 20 -262 161 -282 286 -6 32 -9 35
-71 51 -185 48 -302 245 -234 392 33 71 122 152 226 204 71 36 85 38 92 11z
m1269 -317 c-2 -4 -96 89 -96 95 0 3 19 23 43 43 l42 37 6 -87 c3 -47 5 -87 5
-88z m-194 -167 c38 -55 76 -112 85 -125 14 -20 8 -17 -41 14 -80 51 -210 112
-274 128 -64 16 -61 20 59 77 74 35 85 38 94 24 6 -9 40 -62 77 -118z m-157
-39 c44 -18 129 -61 188 -97 322 -193 371 -299 181 -394 -93 -46 -163 -58
-389 -63 -162 -4 -236 -1 -320 11 -419 61 -773 62 -968 2 -56 -17 -63 2 -7 20
18 6 38 21 45 34 17 32 53 49 103 50 70 0 105 21 140 83 29 52 64 77 107 77 7
0 44 -31 81 -68 131 -131 208 -136 475 -33 166 63 263 71 432 35 34 -8 37 13
2 26 -98 37 -261 30 -401 -19 l-82 -28 49 64 c54 71 80 117 99 178 15 49 45
101 79 138 32 35 66 32 186 -16z m-1021 -109 c53 -15 55 -17 77 -80 18 -55 14
-68 -22 -68 -23 0 -64 -41 -89 -89 -23 -46 -50 -61 -113 -61 -23 0 -55 -7 -71
-15 -26 -14 -28 -14 -21 3 5 9 11 44 15 77 11 84 16 92 76 127 60 33 84 61 84
95 0 26 7 27 64 11z m-277 -365 c-9 -9 -20 -14 -24 -10 -3 4 2 14 13 21 25 19
33 10 11 -11z"
        />
      </g>
    </g>
  );
}

export function VastuPurushaWheel({
  selected,
  onSelect,
  centerContent,
}: {
  selected: VastuDirectionId;
  onSelect: (id: VastuDirectionId) => void;
  centerContent?: ReactNode;
}) {
  const { t } = useTranslation();
  const { digits } = useLocale();
  const clipId = `vastu-purusha-${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
      className="mx-auto block h-auto w-full"
      overflow="hidden"
      role="group"
      aria-label={t("vastu.wheel.heading")}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={CX} cy={CY} r={DIR16_INNER} />
        </clipPath>
      </defs>
      {/* Degree rim */}
      <circle cx={CX} cy={CY} r={DEG_OUTER} fill="var(--card)" stroke="currentColor" strokeOpacity={0.2} strokeWidth={0.8} />
      {Array.from({ length: 36 }, (_, i) => {
        const bearing = i * 10;
        const major = bearing % 30 === 0;
        const inner = vastuWheelPoint(bearing, major ? DEG_INNER : DEG_INNER + 8, CX, CY);
        const outer = vastuWheelPoint(bearing, DEG_OUTER, CX, CY);
        return (
          <g key={`deg-${bearing}`} aria-hidden="true">
            <line
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="currentColor"
              strokeOpacity={major ? 0.45 : 0.22}
              strokeWidth={major ? 1 : 0.5}
            />
            {major ? (
              <ArcLabel bearing={bearing} radius={DEG_LABEL_R} fontSize={11} className="font-semibold" fillOpacity={0.6}>
                {digits(bearing)}
              </ArcLabel>
            ) : null}
          </g>
        );
      })}

      {/* 16 compass labels */}
      {COMPASS_16.map((point) => {
        const color = groupColor(point.bearing);
        return (
          <g key={point.abbr} aria-hidden="true">
            <title>{t(point.nameKey)}</title>
            <path
              d={annularSectorPath(point.bearing, 11.25, DIR16_OUTER, DIR16_INNER)}
              fill={color}
              fillOpacity={0.2}
              stroke={color}
              strokeOpacity={0.28}
              strokeWidth={0.4}
            />
            <ArcLabel bearing={point.bearing} radius={DIR16_LABEL_R} fontSize={11} className="font-bold" fillOpacity={0.9}>
              {point.abbr}
            </ArcLabel>
          </g>
        );
      })}

      {/* Organ / guna band — between the 16-point ring and ईशान */}
      {COMPASS_16.map((point, i) => {
        const color = groupColor(point.bearing);
        return (
          <g key={`organ-${point.abbr}`} aria-hidden="true">
            <path
              d={annularSectorPath(point.bearing, 11.25, ORGAN_OUTER, ORGAN_INNER)}
              fill="var(--card)"
              fillOpacity={0.55}
              stroke={color}
              strokeOpacity={0.18}
              strokeWidth={0.4}
            />
            <ArcLabel bearing={point.bearing} radius={ORGAN_LABEL_R} fontSize={11} className="font-semibold" fillOpacity={0.72}>
              {t(ORGAN_16[i]!)}
            </ArcLabel>
          </g>
        );
      })}

      {/* Life-attribute band */}
      {COMPASS_16.map((point, i) => {
        const color = groupColor(point.bearing);
        return (
          <g key={`attr-${point.abbr}`} aria-hidden="true">
            <path
              d={annularSectorPath(point.bearing, 11.25, ATTR_OUTER, ATTR_INNER)}
              fill={color}
              fillOpacity={0.34}
              stroke={color}
              strokeOpacity={0.4}
              strokeWidth={0.5}
            />
            <ArcLabel bearing={point.bearing} radius={ATTR_LABEL_R} fontSize={14} className="font-semibold" fillOpacity={0.92}>
              {t(ATTR_16[i]!)}
            </ArcLabel>
          </g>
        );
      })}

      {/* 32 pada codes — N1 is the same wedge as Roga */}
      {PADA_32.map((_, slot) => {
        const bearing = slot * PADA_STEP;
        const color = groupColor(bearing);
        const i = (slot - N1_SLOT + PADA_32.length) % PADA_32.length;
        const quad = CODE_QUAD[Math.floor(i / 8)]!;
        const n = (i % 8) + 1;
        return (
          <g key={`code-${quad}${n}`} aria-hidden="true">
            <path
              d={annularSectorPath(bearing, PADA_STEP / 2, CODE_OUTER, CODE_INNER)}
              fill={color}
              fillOpacity={0.12}
              stroke={color}
              strokeOpacity={0.22}
              strokeWidth={0.35}
            />
            <ArcLabel bearing={bearing} radius={CODE_LABEL_R} fontSize={12} className="font-semibold" fillOpacity={0.84}>
              {`${quad}${digits(n)}`}
            </ArcLabel>
          </g>
        );
      })}

      {/* 32 perimeter deities */}
      {PADA_32.map((id, i) => {
        const bearing = i * PADA_STEP;
        const color = groupColor(bearing);
        return (
          <g key={id} aria-hidden="true">
            <title>{t(`vastu.pada.${id}.name`)}</title>
            <path
              d={annularSectorPath(bearing, PADA_STEP / 2, DEITY_OUTER, DEITY_INNER)}
              fill="var(--card)"
              fillOpacity={0.45}
              stroke={color}
              strokeOpacity={0.2}
              strokeWidth={0.35}
            />
            <ArcLabel bearing={bearing} radius={DEITY_LABEL_R} fontSize={9} className="font-semibold" fillOpacity={0.88}>
              {t(`vastu.pada.${id}.name`)}
            </ArcLabel>
          </g>
        );
      })}

      {/* Inner four — Bhudhara / Aryama / Vivasvan / Mitra */}
      {INNER_4.map((devata) => {
        const color = groupColor(devata.bearing);
        const label = vastuWheelPoint(devata.bearing, INNER4_LABEL_R, CX, CY);
        return (
          <g key={devata.id} aria-hidden="true">
            <path
              d={annularSectorPath(devata.bearing, 45, INNER4_OUTER, INNER4_INNER)}
              fill={color}
              fillOpacity={0.1}
              stroke={color}
              strokeOpacity={0.28}
              strokeWidth={0.5}
            />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="pointer-events-none select-none font-semibold"
              fill="currentColor"
              fillOpacity={0.8}
              fontSize={12}
            >
              {t(`vastu.pada.${devata.id}.name`)}
            </text>
          </g>
        );
      })}

      {/* 8-direction fills sit under the Purusha so the figure stays visible. */}
      {VASTU_WHEEL_DIRECTIONS.map((dir) => {
        const active = dir.id === selected;
        const color = groupColor(dir.bearing);
        return (
          <path
            key={`wedge-fill-${dir.id}`}
            d={annularSectorPath(dir.bearing, 22.5, WEDGE_OUTER, WEDGE_INNER)}
            fill={color}
            fillOpacity={active ? 0.38 : 0.1}
            stroke={color}
            strokeOpacity={active ? 0.95 : 0.32}
            strokeWidth={active ? 2.4 : 1}
            className="pointer-events-none transition-[fill-opacity,stroke-opacity]"
          />
        );
      })}
      <circle
        cx={CX}
        cy={CY}
        r={CENTER_R}
        fill="var(--card)"
        fillOpacity={0.08}
        className="pointer-events-none"
      />

      <g clipPath={`url(#${clipId})`} pointerEvents="none" aria-hidden>
        <g
          transform={`translate(${CX} ${CY})`}
          opacity={PURUSHA_OPACITY}
          className="text-foreground"
        >
          <VastuPurushaSilhouette size={PURUSHA_SIZE} />
        </g>
      </g>

      {Array.from({ length: 32 }, (_, i) => {
        const bearing = i * 11.25;
        const major = i % 2 === 0;
        const inner = vastuWheelPoint(bearing, INNER4_INNER, CX, CY);
        const outer = vastuWheelPoint(bearing, DEG_OUTER, CX, CY);
        return (
          <line
            key={`spoke-${bearing}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="currentColor"
            strokeOpacity={major ? 0.16 : 0.08}
            strokeWidth={major ? 0.6 : 0.4}
          />
        );
      })}

      {RING_DIVIDERS.map((r) => (
        <circle
          key={`div-${r}`}
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.14}
          strokeWidth={0.6}
        />
      ))}

      {VASTU_WHEEL_DIRECTIONS.map((dir) => {
        const active = dir.id === selected;
        const label = vastuWheelPoint(dir.bearing, WEDGE_LABEL_R, CX, CY);
        return (
          <text
            key={`wedge-label-${dir.id}`}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="central"
            className={cn(
                "pointer-events-none select-none",
              active ? "font-bold" : "font-semibold",
            )}
            fill="currentColor"
            fillOpacity={active ? 1 : 0.8}
            fontSize={11}
          >
            {t(`vastu.dir.${dir.id}.name`)}
          </text>
        );
      })}

      <line x1={CX - 5} y1={CY} x2={CX + 5} y2={CY} stroke="currentColor" strokeOpacity={0.45} strokeWidth={1} />
      <line x1={CX} y1={CY - 5} x2={CX} y2={CY + 5} stroke="currentColor" strokeOpacity={0.45} strokeWidth={1} />
      {centerContent ?? (
        <text
          x={CX}
          y={CY + 16}
          textAnchor="middle"
          dominantBaseline="central"
            className="pointer-events-none select-none font-bold"
            fill="currentColor"
            fillOpacity={0.85}
            fontSize={16}
        >
          {t("vastu.dir.center.deity")}
        </text>
      )}

      {VASTU_WHEEL_DIRECTIONS.map((dir) => {
        const active = dir.id === selected;
        const color = groupColor(dir.bearing);
        return (
          <path
            key={`wedge-hit-${dir.id}`}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={t(`vastu.dir.${dir.id}.name`)}
            d={annularSectorPath(dir.bearing, 22.5, WEDGE_OUTER, WEDGE_INNER)}
            fill="transparent"
            className="cursor-pointer outline-none focus-visible:stroke-[3]"
            stroke={color}
            strokeOpacity={0}
            onClick={() => onSelect(dir.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(dir.id);
              }
            }}
          />
        );
      })}

      <circle
        role="button"
        tabIndex={0}
        aria-pressed={selected === "center"}
        aria-label={t("vastu.dir.center.name")}
        cx={CX}
        cy={CY}
        r={CENTER_R}
        fill="transparent"
        stroke="currentColor"
        strokeOpacity={selected === "center" ? 0.8 : 0.28}
        strokeWidth={selected === "center" ? 2.4 : 1}
        className="cursor-pointer outline-none transition-[stroke-opacity] focus-visible:stroke-[3]"
        onClick={() => onSelect("center")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect("center");
          }
        }}
      />
    </svg>
  );
}

export default VastuPurushaWheel;
