/**
 * Diagrams for the two zero-points and the belt they measure along.
 *
 * The remaining monospace figures in the zodiac articles were all drawing the
 * same handful of relationships — where the सायन zero sits against the निरयन
 * one, how wide the belt is, where the ecliptic crosses the equator. Drawn
 * once properly, most of them serve several articles.
 */

import { bilingualText, useLocale, type Lang } from "@/i18n/locale";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";

const INK = "currentColor";
const TROPICAL = "#35d05a";
const SIDEREAL = "#f59e0b";
const ECLIPTIC = "#dddd00";
const EQUATOR = "#0ea5e9";
const WARN = "#ef4444";

const digits = (lang: Lang, v: string | number) =>
  lang === "en" ? String(v) : toNepaliDigits(String(v));

function Frame({
  w,
  h,
  label,
  caption,
  children,
}: {
  w: number;
  h: number;
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="m-0 w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" role="img" aria-label={label}>
        {children}
      </svg>
      <figcaption className="mt-1.5 text-[11px] leading-snug text-white/45">{caption}</figcaption>
    </figure>
  );
}

/* ── दुई शून्य बिन्दु — the ayanamsha gap, laid on one ruler ─────────── */

/**
 * The two zodiacs on one ruler, and the `~२४°` between their zeros.
 *
 * This one diagram is the whole सायन/निरयन argument, so it serves several
 * articles at once: why बैशाख १ is not the equinox, what अयनांश *is*, and why
 * a निरयन longitude is a सायन one minus that gap.
 *
 * Both scales run `०°`–`३६०°` along the same ecliptic. The सायन scale is
 * pinned to the वसन्त विषुव; the निरयन scale is pinned to the stars and sits
 * `~२४°` behind it. Every quantity the articles quote — the `२४`-day delay of
 * the new year, the gap between मकर सङ्क्रान्ति and the शीत अयनान्त — is that
 * one offset read in different units.
 */
export function TwoZeroPoints() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const W = 540;
  const H = 200;
  const L = 40;
  const Rr = W - 24;
  const AYAN = 24;
  const x = (deg: number) => L + (deg / 360) * (Rr - L);
  const monthNames = lang === "en" ? ([...BS_MONTH_NAMES] as string[]) : BS_MONTHS_NE;

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "सायन र निरयन राशिचक्रका दुई शून्य बिन्दु, बीचमा ~२४° को अयनांश",
        "The tropical and sidereal zeros on one ruler, with the ~24° ayanamsha between them",
      )}
      caption={bilingualText(
        lang,
        "दुवै राशिचक्र उही क्रान्तिवृत्तमा ०° देखि ३६०° सम्म चल्छन् — फरक केवल शून्य कहाँ राखिएको छ भन्नेमा। सायन शून्य वसन्त विषुवमा अड्किएको छ; निरयन शून्य ताराको सापेक्ष स्थिर छ र अहिले त्योभन्दा ~२४° पछाडि पर्छ। यही एउटा फरकबाट सबै कुरा निस्कन्छ: नयाँ वर्ष विषुवभन्दा ~२४ दिन पछि किन पर्छ, मकर सङ्क्रान्ति शीत अयनान्तभन्दा ~२४ दिन पछि किन पर्छ — सबै यही अयनांश हो, फरक एकाइमा पढिएको।",
        "Both zodiacs run 0° to 360° along the same ecliptic; all that differs is where the zero was put. The tropical zero is pinned to the spring equinox, the sidereal zero to the stars — and the second now sits about 24° behind the first. Everything else follows from that single offset: why the new year falls ~24 days after the equinox, why Makara Sankranti falls ~24 days after the winter solstice. It is one gap, read in different units.",
      )}
    >
      {/* सायन scale */}
      <line x1={L} y1={58} x2={Rr} y2={58} stroke={TROPICAL} strokeWidth={1.6} opacity={0.85} />
      {[0, 90, 180, 270, 360].map((d) => (
        <g key={`t${d}`}>
          <line x1={x(d)} y1={52} x2={x(d)} y2={64} stroke={TROPICAL} strokeWidth={1} opacity={0.8} />
          <text x={x(d)} y={46} textAnchor="middle" className="text-[7.5px]" style={{ fill: TROPICAL }}>
            {n(d)}°
          </text>
        </g>
      ))}
      <text x={L} y={32} className="text-[8.5px] font-semibold" style={{ fill: TROPICAL }}>
        {bilingualText(lang, "सायन — शून्य वसन्त विषुवमा", "tropical — zero at the spring equinox")}
      </text>

      {/* निरयन scale, offset by the ayanamsha */}
      <line x1={x(AYAN)} y1={112} x2={Rr} y2={112} stroke={SIDEREAL} strokeWidth={1.6} opacity={0.85} />
      <line x1={L} y1={112} x2={x(AYAN)} y2={112} stroke={SIDEREAL} strokeWidth={1.6} opacity={0.28} strokeDasharray="3 3" />
      {[0, 90, 180, 270].map((d) => (
        <g key={`s${d}`}>
          <line x1={x(d + AYAN)} y1={106} x2={x(d + AYAN)} y2={118} stroke={SIDEREAL} strokeWidth={1} opacity={0.8} />
          <text x={x(d + AYAN)} y={130} textAnchor="middle" className="text-[7.5px]" style={{ fill: SIDEREAL }}>
            {n(d)}°
          </text>
          <text x={x(d + AYAN)} y={142} textAnchor="middle" className="fill-current text-[7px] opacity-55">
            {monthNames[(d / 30) % 12]}
          </text>
        </g>
      ))}
      <text x={L} y={166} className="text-[8.5px] font-semibold" style={{ fill: SIDEREAL }}>
        {bilingualText(lang, "निरयन — शून्य ताराको सापेक्ष स्थिर (बैशाख १)", "sidereal — zero fixed against the stars (बैशाख १)")}
      </text>

      {/* the gap itself */}
      <rect x={x(0)} y={58} width={x(AYAN) - x(0)} height={54} fill={WARN} opacity={0.16} />
      <line x1={x(0)} y1={58} x2={x(0)} y2={112} stroke={WARN} strokeWidth={1.1} strokeDasharray="3 3" />
      <line x1={x(AYAN)} y1={58} x2={x(AYAN)} y2={112} stroke={WARN} strokeWidth={1.1} strokeDasharray="3 3" />
      <text x={x(AYAN) + 8} y={88} className="text-[8.5px] font-semibold" style={{ fill: WARN }}>
        {bilingualText(lang, `अयनांश ~${n(AYAN)}° ≈ ~${n(24)} दिन`, `ayanamsha ~${n(AYAN)}° ≈ ~${n(24)} days`)}
      </text>
    </Frame>
  );
}

/* ── राशि पट्टी — why the belt has width at all ──────────────────────── */

/**
 * The zodiac is a belt, not a line, because the grahas do not share one plane.
 *
 * The Sun defines the ecliptic exactly — it is *by definition* at latitude
 * zero. Everything else wanders: the Moon by `५.१°`, and the visible grahas by
 * up to a few degrees more. Take the widest of them and you need a band about
 * `९°` either side of the ecliptic to contain the lot, which is the राशि
 * पट्टी.
 *
 * Drawn to scale in latitude, so the Sun's dead-flat line and the Moon's
 * modest `५.१°` are visibly different sizes of claim.
 */
export function ZodiacBeltWidth() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const W = 540;
  const H = 190;
  const L = 92;
  const Rr = W - 88;
  const mid = 96;
  const scale = 7.2;
  const y = (lat: number) => mid - lat * scale;

  const bodies = [
    { lat: 0, ne: "सूर्य", en: "Sun", c: ECLIPTIC, note: { ne: "परिभाषाले नै ०°", en: "0° by definition" } },
    { lat: 5.1, ne: "चन्द्र", en: "Moon", c: "#cbd5e1", note: { ne: "±५.१°", en: "±5.1°" } },
    { lat: 7.0, ne: "बुध", en: "Mercury", c: "#10b981", note: { ne: "±७°", en: "±7°" } },
  ];

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "राशि पट्टीको चौडाइ — क्रान्तिवृत्तको दुवैतिर ~९°",
        "The width of the zodiac belt — about 9° either side of the ecliptic",
      )}
      caption={bilingualText(
        lang,
        "सूर्य परिभाषाले नै क्रान्तिवृत्तमा हुन्छ — त्यसको शर सधैँ ०°। बाँकी सबै भने अलिअलि माथितल हुन्छन्: चन्द्र ±५.१°, बुध ±७° सम्म। सबैलाई समेट्न क्रान्तिवृत्तको दुवैतिर करिब ९° को पेटी चाहिन्छ, र त्यही राशि पट्टी हो। त्यसैले राशिचक्र रेखा होइन, पट्टी हो।",
        "The Sun is on the ecliptic by definition — its latitude is always 0°. Everything else strays: the Moon by ±5.1°, Mercury by as much as ±7°. Containing all of them takes a band about 9° either side of the ecliptic, and that band is the zodiac belt. Which is why the zodiac is a belt rather than a line.",
      )}
    >
      <rect x={L} y={y(9)} width={Rr - L} height={y(-9) - y(9)} fill={SIDEREAL} opacity={0.12} rx={3} />
      {[9, -9].map((d) => (
        <g key={d}>
          <line x1={L} y1={y(d)} x2={Rr} y2={y(d)} stroke={SIDEREAL} strokeWidth={1.1} opacity={0.7} />
          <text x={Rr + 6} y={y(d) + 3} className="text-[7.5px] font-semibold" style={{ fill: SIDEREAL }}>
            {d > 0 ? "+" : "−"}
            {n(9)}°
          </text>
        </g>
      ))}

      {bodies.map((b) => (
        <g key={b.en}>
          {[1, -1].map((s) =>
            b.lat === 0 && s === -1 ? null : (
              <line
                key={s}
                x1={L}
                y1={y(s * b.lat)}
                x2={Rr}
                y2={y(s * b.lat)}
                stroke={b.c}
                strokeWidth={b.lat === 0 ? 2 : 1.2}
                opacity={b.lat === 0 ? 0.95 : 0.6}
                strokeDasharray={b.lat === 0 ? undefined : "5 3"}
              />
            ),
          )}
          <text x={L - 8} y={y(b.lat) + 3} textAnchor="end" className="fill-current text-[8px] opacity-70">
            {lang === "en" ? b.en : b.ne}
          </text>
          <text x={L - 8} y={y(b.lat) + 13} textAnchor="end" className="fill-current text-[7px] opacity-45">
            {lang === "en" ? b.note.en : b.note.ne}
          </text>
        </g>
      ))}

      <text x={(L + Rr) / 2} y={y(0) - 7} textAnchor="middle" className="text-[8px] font-semibold" style={{ fill: ECLIPTIC }}>
        {bilingualText(lang, "क्रान्तिवृत्त — शर ०°", "the ecliptic — latitude 0°")}
      </text>
      <text x={(L + Rr) / 2} y={H - 8} textAnchor="middle" className="text-[8.5px] font-semibold" style={{ fill: SIDEREAL }}>
        {bilingualText(lang, "राशि पट्टी — जम्मा ~१८° चौडा", "the zodiac belt — about 18° wide in all")}
      </text>
    </Frame>
  );
}

/* ── क्रान्तिवृत्त र विषुवत् रेखा — two great circles, one 23.44° angle ─ */

/**
 * The ecliptic and the celestial equator, and the two points they share.
 *
 * Two great circles on the same sphere must cross twice, and these cross at
 * exactly `२३.४४°` — the obliquity. Those two crossings are the विषुव, and
 * the points furthest from the equator are the अयनान्त. So the four seasonal
 * markers are not four separate facts: they are where two circles meet, and
 * where they are farthest apart.
 *
 * Drawn unrolled — longitude across, declination up — because the crossings
 * and the extremes are what matter, and a sphere hides both behind itself.
 */
export function EclipticEquatorCross() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const W = 540;
  const H = 190;
  const L = 46;
  const Rr = W - 24;
  const mid = 96;
  const scale = 2.4;
  const x = (deg: number) => L + (deg / 360) * (Rr - L);
  const y = (dec: number) => mid - dec * scale;

  const path = Array.from({ length: 145 }, (_, i) => {
    const lon = (i / 144) * 360;
    const dec = Math.asin(Math.sin(23.44 * (Math.PI / 180)) * Math.sin(lon * (Math.PI / 180))) / (Math.PI / 180);
    return `${i ? "L" : "M"}${x(lon).toFixed(1)} ${y(dec).toFixed(1)}`;
  }).join(" ");

  const marks = [
    { lon: 0, ne: "वसन्त विषुव", en: "spring equinox", kind: "eq" },
    { lon: 90, ne: "ग्रीष्म अयनान्त", en: "summer solstice", kind: "sol" },
    { lon: 180, ne: "शरद् विषुव", en: "autumn equinox", kind: "eq" },
    { lon: 270, ne: "शीत अयनान्त", en: "winter solstice", kind: "sol" },
  ];

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "क्रान्तिवृत्त र खगोलीय विषुवत् रेखा — दुई ठाउँमा काटिन्छन्, र २३.४४° सम्म टाढा जान्छन्",
        "The ecliptic and the celestial equator — crossing twice, parting by 23.44°",
      )}
      caption={bilingualText(
        lang,
        "एउटै गोलामा दुई बृहत् वृत्त भए दुई ठाउँमा काटिनैपर्छ, र यी ठ्याक्कै २३.४४° को कोणमा काटिन्छन् — त्यही अक्ष झुकाव हो। काटिने ती दुई बिन्दु नै विषुव हुन्, र विषुवत् रेखाबाट सबैभन्दा टाढा पुग्ने दुई बिन्दु अयनान्त। अर्थात् चारै मौसमी बिन्दु अलग–अलग तथ्य होइनन् — दुई वृत्त कहाँ भेटिन्छन् र कहाँ सबैभन्दा टाढा हुन्छन्, त्यही मात्र हो।",
        "Two great circles on one sphere must cross twice, and these cross at exactly 23.44° — the axial tilt. Those crossings are the equinoxes, and the points farthest from the equator are the solstices. So the four seasonal markers are not four separate facts: they are where two circles meet and where they are farthest apart.",
      )}
    >
      {/* the equator: declination zero by definition */}
      <line x1={L} y1={y(0)} x2={Rr} y2={y(0)} stroke={EQUATOR} strokeWidth={1.7} opacity={0.85} />
      <text x={Rr} y={y(0) - 6} textAnchor="end" className="text-[8px] font-semibold" style={{ fill: EQUATOR }}>
        {bilingualText(lang, "खगोलीय विषुवत् रेखा", "celestial equator")}
      </text>

      {[23.44, -23.44].map((d) => (
        <g key={d}>
          <line x1={L} y1={y(d)} x2={Rr} y2={y(d)} stroke={INK} strokeOpacity={0.14} strokeWidth={0.7} strokeDasharray="3 3" />
          <text x={L - 5} y={y(d) + 3} textAnchor="end" className="fill-current text-[7.5px] opacity-50">
            {d > 0 ? "+" : "−"}
            {n("23.44")}°
          </text>
        </g>
      ))}

      <path d={path} fill="none" stroke={ECLIPTIC} strokeWidth={1.9} />
      <text x={x(45)} y={y(20) - 8} className="text-[8px] font-semibold" style={{ fill: ECLIPTIC }}>
        {bilingualText(lang, "क्रान्तिवृत्त", "the ecliptic")}
      </text>

      {marks.map((m) => {
        const dec = m.kind === "eq" ? 0 : m.lon === 90 ? 23.44 : -23.44;
        const c = m.kind === "eq" ? TROPICAL : SIDEREAL;
        const up = dec >= 0;
        return (
          <g key={m.en}>
            <circle cx={x(m.lon)} cy={y(dec)} r={3.6} fill={c} />
            <text
              x={x(m.lon) + (m.lon > 300 ? -6 : 6)}
              y={y(dec) + (up ? -9 : 16)}
              textAnchor={m.lon > 300 ? "end" : "start"}
              className="text-[7.5px] font-semibold"
              style={{ fill: c }}
            >
              {lang === "en" ? m.en : m.ne}
            </text>
          </g>
        );
      })}

      <text x={L} y={H - 8} className="fill-current text-[7.5px] opacity-50">
        {bilingualText(lang, "क्रान्तिवृत्तीय देशान्तर ०° → ३६०° →", "ecliptic longitude 0° → 360° →")}
      </text>
    </Frame>
  );
}
