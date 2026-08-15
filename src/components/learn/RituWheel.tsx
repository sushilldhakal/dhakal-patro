/**
 * The six ऋतु as a ring, against the twelve बि.सं. months and the four
 * सायन markers.
 *
 * The छ ऋतु section had a table and nothing else, and a table cannot show the
 * one thing that matters about ऋतु: they are named by महिना but *defined* by
 * where the Sun stands in its north–south swing. Two rulers, one wheel —
 *
 *   • outer ring — the twelve महिना (निरयन: राशि boundaries, सङ्क्रान्ति)
 *   • inner ring — the six ऋतु, two महिना each
 *   • the four spokes — विषुव and अयनान्त (सायन: declination)
 *
 * The spokes deliberately do not land on the ऋतु boundaries. That offset is
 * the whole point: ग्रीष्म अयनान्त falls inside असार, not at the जेठ–असार
 * seam, because one ruler is tied to the stars and the other to the seasons.
 * Since अयन चलन moves the सायन ruler by ~१° every ७२ years, the spokes creep
 * anticlockwise through the ring — which is what "ऋतु drift" means, and why
 * a ऋतु argument has to be made in उत्तरायण/दक्षिणायन rather than in महिना.
 */

import { bilingualText, useLocale } from "@/i18n/locale";
import { BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";

/* The viewBox is wider than the wheel on purpose: the four marker labels sit
   outside the month ring, and at a square viewBox the two side ones ran off
   the edge and were clipped mid-word. */
const VB_W = 500;
const VB_H = 350;
const CX = VB_W / 2;
const CY = VB_H / 2;
const R_MONTH_OUT = 150;
const R_MONTH_IN = 120;
const R_RITU_OUT = 116;
const R_RITU_IN = 74;

const EQUINOX = "#35d05a";
const SOLSTICE = "#f59e0b";

/** Ayanamsha, degrees — how far the सायन markers sit from बैशाख १. */
const AYANAMSHA = 24;

interface Ritu {
  ne: string;
  en: string;
  colour: string;
}

/** Six ऋतु, starting at बैशाख — वसन्त straddles चैत–बैशाख, so it opens here. */
const RITUS: Ritu[] = [
  { ne: "वसन्त", en: "Vasanta", colour: "#7ec850" },
  { ne: "ग्रीष्म", en: "Grīṣma", colour: "#f0a020" },
  { ne: "वर्षा", en: "Varṣā", colour: "#3aa0d8" },
  { ne: "शरद्", en: "Śarad", colour: "#c8a020" },
  { ne: "हेमन्त", en: "Hemanta", colour: "#8a9ab8" },
  { ne: "शिशिर", en: "Śiśira", colour: "#9fb8d0" },
];

const MARKERS = [
  { lambda: 90, kind: "solstice", ne: "ग्रीष्म अयनान्त", en: "Summer solstice" },
  { lambda: 180, kind: "equinox", ne: "शरद् विषुव", en: "Autumn equinox" },
  { lambda: 270, kind: "solstice", ne: "शीत अयनान्त", en: "Winter solstice" },
  { lambda: 0, kind: "equinox", ne: "वसन्त विषुव", en: "Spring equinox" },
] as const;

const D2R = Math.PI / 180;
/** बैशाख १ at the top, the year running clockwise. */
const at = (deg: number, r: number): [number, number] => {
  const a = (deg - 90) * D2R;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

function arc(from: number, to: number, rOut: number, rIn: number) {
  const [x1, y1] = at(from, rOut);
  const [x2, y2] = at(to, rOut);
  const [x3, y3] = at(to, rIn);
  const [x4, y4] = at(from, rIn);
  const big = to - from > 180 ? 1 : 0;
  return `M${x1} ${y1} A${rOut} ${rOut} 0 ${big} 1 ${x2} ${y2} L${x3} ${y3} A${rIn} ${rIn} 0 ${big} 0 ${x4} ${y4} Z`;
}

export function RituWheel() {
  const { lang } = useLocale();
  const ne = lang !== "en";
  const monthNames = ne ? BS_MONTHS_NE : ([...BS_MONTH_NAMES] as string[]);

  return (
    <figure className="m-0 flex w-full flex-col items-center">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="block w-full max-w-[500px]"
        role="img"
        aria-label={bilingualText(
          lang,
          "छ ऋतु, बाह्र महिना र चार सायन बिन्दु एउटै चक्रमा",
          "The six ṛtus, twelve months and four tropical markers on one wheel",
        )}
      >
        {/* ऋतु band — two महिना each */}
        {RITUS.map((r, i) => (
          <g key={r.en}>
            <path d={arc(i * 60, (i + 1) * 60, R_RITU_OUT, R_RITU_IN)} fill={r.colour} opacity={0.3} />
            <path
              d={arc(i * 60, (i + 1) * 60, R_RITU_OUT, R_RITU_IN)}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.14}
              strokeWidth={0.7}
            />
            <text
              x={at(i * 60 + 30, (R_RITU_OUT + R_RITU_IN) / 2)[0]}
              y={at(i * 60 + 30, (R_RITU_OUT + R_RITU_IN) / 2)[1] + 3.5}
              textAnchor="middle"
              className="fill-current text-[10px] font-semibold opacity-85"
            >
              {ne ? r.ne : r.en}
            </text>
          </g>
        ))}

        {/* महिना band — the निरयन ruler */}
        {monthNames.map((m, i) => (
          <g key={i}>
            <path
              d={arc(i * 30, (i + 1) * 30, R_MONTH_OUT, R_MONTH_IN)}
              fill="currentColor"
              opacity={i % 2 ? 0.05 : 0.09}
            />
            <line
              x1={at(i * 30, R_MONTH_IN)[0]}
              y1={at(i * 30, R_MONTH_IN)[1]}
              x2={at(i * 30, R_MONTH_OUT)[0]}
              y2={at(i * 30, R_MONTH_OUT)[1]}
              stroke="currentColor"
              strokeOpacity={0.2}
              strokeWidth={0.7}
            />
            <text
              x={at(i * 30 + 15, (R_MONTH_OUT + R_MONTH_IN) / 2)[0]}
              y={at(i * 30 + 15, (R_MONTH_OUT + R_MONTH_IN) / 2)[1] + 3}
              textAnchor="middle"
              className="fill-current text-[8.5px] opacity-70"
            >
              {m}
            </text>
          </g>
        ))}

        {/* the four सायन markers — spokes that land mid-month, not on a seam */}
        {MARKERS.map((k) => {
          const deg = (k.lambda - AYANAMSHA + 360) % 360;
          const colour = k.kind === "equinox" ? EQUINOX : SOLSTICE;
          const [x1, y1] = at(deg, R_RITU_IN - 8);
          const [x2, y2] = at(deg, R_MONTH_OUT + 4);
          const [lx, ly] = at(deg, R_MONTH_OUT + 15);
          const right = Math.cos((deg - 90) * D2R) > 0.15;
          const flat = Math.abs(Math.cos((deg - 90) * D2R)) <= 0.15;
          return (
            <g key={k.en}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colour} strokeWidth={1.4} opacity={0.9} />
              <circle cx={x2} cy={y2} r={3.2} fill={colour} />
              <text
                x={lx}
                y={ly + 3}
                textAnchor={flat ? "middle" : right ? "start" : "end"}
                className="text-[8px] font-semibold"
                style={{ fill: colour }}
              >
                {ne ? k.ne : k.en}
              </text>
            </g>
          );
        })}

        <text
          x={CX}
          y={CY - 5}
          textAnchor="middle"
          className="fill-current text-[10px] font-semibold opacity-75"
        >
          {bilingualText(lang, "छ ऋतु", "Six ṛtus")}
        </text>
        <text x={CX} y={CY + 9} textAnchor="middle" className="fill-current text-[8px] opacity-50">
          {bilingualText(lang, "प्रत्येक दुई महिना", "two months each")}
        </text>
      </svg>
      <figcaption className="mt-2 text-[11px] leading-snug text-white/45">
        {bilingualText(
          lang,
          "ऋतुको नाम महिनाले दिन्छ, तर ऋतु बनाउने कुरा सूर्यको उत्तर–दक्षिण यात्रा हो। दुई फरक ढाँचा भएकाले चारै सायन बिन्दु (हरियो = विषुव, सुन्तला = अयनान्त) महिनाको सीमामा नभई बीचमा पर्छन् — ग्रीष्म अयनान्त असारभित्र, जेठ–असारको सन्धिमा होइन। अयन चलनले हरेक ७२ वर्षमा १° का दरले यी बिन्दु सार्दै लैजान्छ; त्यसैले ऋतुको कुरा गर्दा महिना होइन, उत्तरायण–दक्षिणायन नै भरपर्दो सन्दर्भ हो।",
          "The ṛtus take their names from the months, but what makes a ṛtu is the Sun's north–south journey. Because those are two different frames, all four tropical markers (green = equinox, amber = solstice) fall inside a month rather than on its boundary — the summer solstice sits within असार, not at the जेठ–असार seam. Precession moves these markers 1° every 72 years, which is why the dependable reference for a ṛtu argument is Uttarāyaṇa and Dakṣiṇāyana, not the months.",
        )}
      </figcaption>
    </figure>
  );
}

export default RituWheel;
