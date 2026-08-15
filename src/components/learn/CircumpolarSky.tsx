/**
 * परिध्रुवीय तारा — why latitude decides how much sky you can ever see.
 *
 * The celestial sphere seen edge-on, looking along the east–west line: the
 * horizon is the flat line, the observer at the centre, and the polar axis
 * tilted out of the horizon by exactly the observer's latitude φ. Every star
 * rides a *diurnal circle* perpendicular to that axis, which in this view
 * projects to a straight chord.
 *
 * Read the chords against the horizon and the whole rule falls out:
 *
 *   • chord entirely above  → परिध्रुवीय, the star never sets  (δ > 90° − φ)
 *   • chord crossing        → the star rises and sets
 *   • chord entirely below  → the star never rises             (δ < φ − 90°)
 *
 * At Kathmandu's `२७.७°N` the two limits are `±६२.३°`, and the diagram marks
 * where सप्तर्षि and क्रक्स actually fall against them — which is close enough
 * to the limit in both cases to be worth drawing rather than asserting.
 *
 * Geometry: with axis unit u pointing at the pole and p perpendicular to it,
 * a declination-δ circle has centre O + R·sin δ·u and half-width R·cos δ along
 * p. The δ = 90° − φ chord then touches the horizon exactly, which is the
 * check that the projection is right.
 */

import { bilingualText, useLocale } from "@/i18n/locale";
import { toNepaliDigits } from "@/lib/panchanga-format";

const W = 520;
const H = 330;
const CX = 236;
const CY = 176;
const R = 132;

const NEVER_SETS = "#35d05a";
const RISES = "#8fb6d8";
const NEVER_RISES = "#ef4444";
const AXIS = "#f59e0b";

/** Kathmandu. The limits are ±(90 − φ). */
const LAT = 27.7;
const LIMIT = 90 - LAT;

const D2R = Math.PI / 180;
/* North to the left, so the pole rises out of the left-hand horizon. */
const ux = -Math.cos(LAT * D2R);
const uy = -Math.sin(LAT * D2R);
/* Perpendicular to the axis — the direction a diurnal chord runs. */
const px = -Math.sin(LAT * D2R);
const py = Math.cos(LAT * D2R);

/**
 * The circular segment cut off by a declination-δ chord, on the pole side.
 *
 * This is the परिध्रुवीय cap when δ = +(90−φ) and the never-visible cap when
 * δ = −(90−φ). Shading them is what turns three separate chords into two
 * *zones*, which is the thing the article is actually claiming.
 */
function cap(dec: number): string {
  const [x1, y1, x2, y2] = chord(dec);
  const sweep = dec > 0 ? 1 : 0;
  return `M${x1} ${y1} A${R} ${R} 0 0 ${sweep} ${x2} ${y2} Z`;
}

/** Endpoints of the chord a declination-δ star traces. */
function chord(dec: number): [number, number, number, number] {
  const s = Math.sin(dec * D2R);
  const c = Math.cos(dec * D2R);
  const cx = CX + R * s * ux;
  const cy = CY + R * s * uy;
  return [cx - R * c * px, cy - R * c * py, cx + R * c * px, cy + R * c * py];
}

interface Track {
  dec: number;
  kind: "never-sets" | "rises" | "never-rises";
  ne: string;
  en: string;
}

const TRACKS: Track[] = [
  { dec: 78, kind: "never-sets", ne: "ध्रुव तारा ~+८९°", en: "Pole star ~+89°" },
  { dec: LIMIT, kind: "never-sets", ne: "सीमा +६२.३°", en: "limit +62.3°" },
  { dec: 20, kind: "rises", ne: "", en: "" },
  { dec: 0, kind: "rises", ne: "खगोलीय विषुवत् रेखा ०°", en: "celestial equator 0°" },
  { dec: -40, kind: "rises", ne: "", en: "" },
  { dec: -LIMIT, kind: "never-rises", ne: "सीमा −६२.३°", en: "limit −62.3°" },
  { dec: -78, kind: "never-rises", ne: "", en: "" },
];

const COLOUR = {
  "never-sets": NEVER_SETS,
  rises: RISES,
  "never-rises": NEVER_RISES,
} as const;

export function CircumpolarSky() {
  const { lang } = useLocale();
  const ne = lang !== "en";
  const num = (v: number | string) => (ne ? toNepaliDigits(String(v)) : String(v));

  const [px1, py1] = [CX + R * ux, CY + R * uy]; // north celestial pole
  const [sx1, sy1] = [CX - R * ux, CY - R * uy]; // south celestial pole

  return (
    <figure className="m-0 w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={bilingualText(
          lang,
          "काठमाडौँको अक्षांशबाट आकाश — कुन तारा कहिल्यै अस्ताउँदैनन् र कुन कहिल्यै उदाउँदैनन्",
          "The sky from Kathmandu's latitude — which stars never set and which never rise",
        )}
      >
        {/* the sky below the horizon, never in view at this instant */}
        <path
          d={`M${CX - R} ${CY} A${R} ${R} 0 0 0 ${CX + R} ${CY} Z`}
          fill="currentColor"
          opacity={0.06}
        />
        <path d={cap(LIMIT)} fill={NEVER_SETS} opacity={0.16} />
        <path d={cap(-LIMIT)} fill={NEVER_RISES} opacity={0.14} />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="currentColor" strokeOpacity={0.22} strokeWidth={0.9} />

        {/* diurnal chords */}
        {TRACKS.map((t) => {
          const [x1, y1, x2, y2] = chord(t.dec);
          const isLimit = Math.abs(Math.abs(t.dec) - LIMIT) < 0.01;
          return (
            <g key={t.dec}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={COLOUR[t.kind]}
                strokeWidth={isLimit ? 1.6 : 1.1}
                strokeDasharray={isLimit ? "4 2.5" : undefined}
                opacity={isLimit ? 0.95 : 0.6}
              />
              <circle cx={x2} cy={y2} r={2.4} fill={COLOUR[t.kind]} opacity={0.9} />
            </g>
          );
        })}

        {/* the polar axis, and the latitude it makes with the horizon */}
        <line x1={sx1} y1={sy1} x2={px1} y2={py1} stroke={AXIS} strokeWidth={1.3} opacity={0.85} />
        <circle cx={px1} cy={py1} r={3.4} fill={AXIS} />
        <text x={px1 - 4} y={py1 - 7} textAnchor="middle" className="text-[8.5px] font-semibold" style={{ fill: AXIS }}>
          {bilingualText(lang, "खगोलीय ध्रुव", "celestial pole")}
        </text>
        <path
          d={`M${CX - 54} ${CY} A54 54 0 0 1 ${CX + 54 * ux} ${CY + 54 * uy}`}
          fill="none"
          stroke={AXIS}
          strokeWidth={0.9}
          opacity={0.75}
        />
        <text
          x={CX - 60}
          y={CY - 20}
          textAnchor="middle"
          className="text-[8.5px] font-semibold"
          style={{ fill: AXIS }}
        >
          φ = {num(LAT)}°
        </text>

        {/* the horizon */}
        <line
          x1={CX - R - 16}
          y1={CY}
          x2={CX + R + 16}
          y2={CY}
          stroke="currentColor"
          strokeOpacity={0.55}
          strokeWidth={1.2}
        />
        <text x={CX - R - 16} y={CY + 12} className="fill-current text-[8px] opacity-55">
          {bilingualText(lang, "उत्तर", "N")}
        </text>
        <text x={CX + R + 16} y={CY + 12} textAnchor="end" className="fill-current text-[8px] opacity-55">
          {bilingualText(lang, "दक्षिण", "S")}
        </text>
        <text x={CX} y={CY + 13} textAnchor="middle" className="fill-current text-[8px] opacity-45">
          {bilingualText(lang, "क्षितिज", "horizon")}
        </text>

        {/* the three verdicts */}
        <text x={W - 8} y={30} textAnchor="end" className="text-[8.5px] font-semibold" style={{ fill: NEVER_SETS }}>
          {bilingualText(lang, "क्रान्ति > +६२.३° — कहिल्यै अस्ताउँदैन", "dec > +62.3° — never sets")}
        </text>
        <text x={W - 8} y={44} textAnchor="end" className="text-[8.5px]" style={{ fill: RISES }}>
          {bilingualText(lang, "बीचमा — उदाउँछ र अस्ताउँछ", "in between — rises and sets")}
        </text>
        <text x={W - 8} y={H - 10} textAnchor="end" className="text-[8.5px] font-semibold" style={{ fill: NEVER_RISES }}>
          {bilingualText(lang, "क्रान्ति < −६२.३° — कहिल्यै उदाउँदैन", "dec < −62.3° — never rises")}
        </text>

        {/* where the two famous asterisms actually fall */}
        <text x={8} y={H - 24} className="fill-current text-[8px] opacity-70">
          {bilingualText(lang, "सप्तर्षि: क्रान्ति +४९° … +६२°", "Saptarishi: dec +49° … +62°")}
        </text>
        <text x={8} y={H - 12} className="fill-current text-[8px] opacity-70">
          {bilingualText(lang, "क्रक्स: क्रान्ति −५७° … −६३°", "Crux: dec −57° … −63°")}
        </text>
      </svg>
      <figcaption className="mt-1.5 text-[11px] leading-snug text-white/45">
        {bilingualText(
          lang,
          "आकाशी ध्रुव क्षितिजभन्दा ठ्याक्कै अक्षांश जति (काठमाडौँमा २७.७°) माथि हुन्छ, र हरेक तारा त्यही अक्षको वरिपरि वृत्त काट्छ। वृत्त पूरै क्षितिजमाथि परे तारा कहिल्यै अस्ताउँदैन; पूरै तल परे कहिल्यै उदाउँदैन। काठमाडौँको सीमा ±६२.३° हो — सप्तर्षि र क्रक्स दुवै यही सीमाको छेउछाउ पर्छन्, त्यसैले सप्तर्षिको पुच्छर वर्षको केही समय क्षितिजमुनि जान्छ र क्रक्सको माथिल्लो तारा दक्षिणी क्षितिजमा अलिकति देखिन्छ।",
          "The celestial pole stands above the horizon by exactly the observer's latitude — 27.7° at Kathmandu — and every star circles that axis. A circle entirely above the horizon never sets; entirely below, it never rises. Kathmandu's limits are ±62.3°, and both the Saptarishi and Crux straddle them: the Dipper's tail dips below the horizon for part of the year, and the top of Crux does clear the southern horizon by a few degrees.",
        )}
      </figcaption>
    </figure>
  );
}

export default CircumpolarSky;
