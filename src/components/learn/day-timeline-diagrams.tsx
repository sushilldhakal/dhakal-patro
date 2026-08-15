/**
 * Diagrams that live on a clock rather than in the sky.
 *
 * Five figures in the Learn library were timelines drawn in monospace — a
 * sunrise, a moonrise slipping later, a तिथि boundary landing either side of
 * dawn. Box-drawing characters can put a mark on a line but they cannot put it
 * at the *right place* on that line, which is the only thing these pictures
 * are for. Each one here is laid out from the real numbers instead.
 *
 * They share a horizontal-time frame and a house style, so they sit together:
 * a rule with hour ticks, events as dots on it, and the reading underneath.
 */

import { bilingualText, useLocale, type Lang } from "@/i18n/locale";
import { toNepaliDigits } from "@/lib/panchanga-format";

const INK = "currentColor";
const SUN = "#dddd00";
const MOON = "#cbd5e1";
const MARK = "#f59e0b";
const ALT = "#0ea5e9";
const WARN = "#ef4444";

const digits = (lang: Lang, v: string | number) =>
  lang === "en" ? String(v) : toNepaliDigits(String(v));

/** Shared frame: a captioned SVG at a fixed aspect. */
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

/* ────────────────────────────────────────────────────────────────────────
   नाक्षत्र दिन vs सौर दिन — the extra ~1° that makes a solar day longer
   ──────────────────────────────────────────────────────────────────── */

/**
 * Why a solar day is four minutes longer than a rotation.
 *
 * Earth turns once in `२३h ५६m` — that is a full rotation, measured against a
 * star so distant its direction never changes. But in that time Earth has also
 * moved about `१°` along its orbit, so it must turn that extra `१°` to bring
 * the Sun back overhead. `१°` of spin is roughly four minutes, and `२३h ५६m`
 * plus four minutes is the `२४h` day a clock keeps.
 *
 * Drawn as two orbital positions rather than one, because the whole effect
 * comes from Earth having *moved* between them.
 */
export function SiderealSolarDay() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const W = 540;
  const H = 236;
  const r = 30;
  /* The real extra turn is 1°, which at any honest scale is invisible. Drawn
     at 22° so the reader can see there *is* an angle; the label carries the
     true value, and the caption says the drawing is exaggerated. */
  const SHOWN = 22;
  const panels = [
    { cx: 150, sun: 0, mark: 0, ne: "सुरु — दुवै सूर्य र ताराको सिधामा", en: "start — lined up on both Sun and star" },
    { cx: 400, sun: SHOWN, mark: 0, ne: "२३घ ५६मि पछि — एक पूरा घुर्णन", en: "after 23h 56m — one full rotation" },
  ];
  const cy = 108;
  const pt = (cx: number, deg: number, rad: number): [number, number] => [
    cx + rad * Math.sin(deg * (Math.PI / 180)),
    cy - rad * Math.cos(deg * (Math.PI / 180)),
  ];

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "नाक्षत्र दिन र सौर दिनको फरक — कक्षमा सरेको १° ले थपिने ४ मिनेट",
        "Sidereal versus solar day — the four minutes added by 1° of orbital motion",
      )}
      caption={bilingualText(
        lang,
        "पृथ्वीको एउटा दाग सुरुमा सूर्य र टाढाको तारा दुवैको सिधामा छ। एक पूरा घुर्णन (२३घ ५६मि) पछि त्यो दाग फेरि ताराकै सिधामा आइपुग्छ — तारा यति टाढा छ कि दिशा बदलिँदैन। तर त्यति बेरमा पृथ्वी कक्षमा ~१° सरिसकेको हुन्छ, त्यसैले सूर्यलाई फेरि ठीक माथि ल्याउन त्यो १° थप घुम्नुपर्छ, जुन करिब ४ मिनेट हो। चित्रमा कोण देखिने बनाउन बढाइएको छ।",
        "A mark on Earth starts lined up with both the Sun and a distant star. After one full rotation — 23h 56m — the mark points at the star again, because the star is far enough away that its direction has not changed. But Earth has moved about 1° along its orbit in that time, so it must turn that extra 1° to bring the Sun overhead again: roughly four minutes. The angle is exaggerated here to be visible.",
      )}
    >
      <text x={W / 2} y={18} textAnchor="middle" className="fill-current text-[8.5px] opacity-60">
        ★ {bilingualText(lang, "टाढाको ताराको दिशा — दुवै चित्रमा उही", "direction to the distant star — the same in both")}
      </text>

      {panels.map((p, i) => (
        <g key={i}>
          {/* star direction: straight up, identical in both panels */}
          <line x1={p.cx} y1={cy - r - 4} x2={p.cx} y2={26} stroke={INK} strokeOpacity={0.3} strokeWidth={0.9} strokeDasharray="3 3" />

          <circle cx={p.cx} cy={cy} r={r} fill={ALT} opacity={0.28} />
          <circle cx={p.cx} cy={cy} r={r} fill="none" stroke={ALT} strokeOpacity={0.6} strokeWidth={1} />

          {/* the mark on Earth — after one rotation it is back on the star */}
          <line
            x1={p.cx}
            y1={cy}
            x2={pt(p.cx, p.mark, r)[0]}
            y2={pt(p.cx, p.mark, r)[1]}
            stroke={INK}
            strokeOpacity={0.75}
            strokeWidth={1.6}
          />
          {/* direction to the Sun from this orbital position */}
          <line
            x1={p.cx}
            y1={cy}
            x2={pt(p.cx, p.sun, r + 22)[0]}
            y2={pt(p.cx, p.sun, r + 22)[1]}
            stroke={SUN}
            strokeWidth={1.6}
            opacity={0.9}
          />
          <circle cx={pt(p.cx, p.sun, r + 30)[0]} cy={pt(p.cx, p.sun, r + 30)[1]} r={7} fill={SUN} opacity={0.6} />

          <text x={p.cx} y={cy + r + 26} textAnchor="middle" className="fill-current text-[8px] opacity-65">
            {lang === "en" ? p.en : p.ne}
          </text>
        </g>
      ))}

      {/* the leftover angle in the second panel */}
      <path
        d={`M${pt(panels[1]!.cx, 0, 46)[0]} ${pt(panels[1]!.cx, 0, 46)[1]} A46 46 0 0 1 ${pt(panels[1]!.cx, SHOWN, 46)[0]} ${pt(panels[1]!.cx, SHOWN, 46)[1]}`}
        fill="none"
        stroke={MARK}
        strokeWidth={1.3}
      />
      <text x={panels[1]!.cx + 54} y={cy - 46} className="text-[8.5px] font-semibold" style={{ fill: MARK }}>
        {bilingualText(lang, `अझै ~${n(1)}° बाँकी`, `~${n(1)}° still to go`)}
      </text>

      <text x={W / 2} y={H - 26} textAnchor="middle" className="text-[9px] font-semibold" style={{ fill: MARK }}>
        {bilingualText(lang, `त्यो ~${n(1)}° = ~${n(4)} मिनेट थप घुर्णन`, `that ~${n(1)}° = ~${n(4)} more minutes of spin`)}
      </text>
      <text x={W / 2} y={H - 8} textAnchor="middle" className="fill-current text-[9px] font-semibold opacity-80">
        {bilingualText(lang, "२३घ ५६मि (नाक्षत्र दिन) + ४मि = २४ घण्टा (सौर दिन)", "23h 56m (sidereal day) + 4m = 24 hours (solar day)")}
      </text>
    </Frame>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   दिनमान = 2H — the hour angle either side of local noon
   ──────────────────────────────────────────────────────────────────── */

/**
 * Sunrise and sunset as one number reflected about local noon.
 *
 * The hour angle H that comes out of the sunrise equation is *half* a day.
 * Local noon sits at the middle, sunrise at noon − H and sunset at noon + H,
 * which is why one solve gives both and why day length is simply 2H.
 *
 * Two bands are drawn: a summer day and a winter one at Kathmandu's latitude,
 * because the symmetry is only interesting once you see H itself change.
 */
export function DayLengthHourAngle() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const W = 540;
  const H = 190;
  const L = 66;
  const Rr = W - 26;
  const noon = (L + Rr) / 2;

  const rows = [
    { h: 6.92, y: 62, ne: "ग्रीष्म अयनान्त", en: "summer solstice", len: "~13h 50m", c: SUN },
    { h: 5.21, y: 126, ne: "शीत अयनान्त", en: "winter solstice", len: "~10h 25m", c: ALT },
  ];
  /* Scale so the longer of the two fills the frame. */
  const px = (hours: number) => ((Rr - L) / 2) * (hours / 7.4);

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "दिनमान = २H — स्थानीय मध्याह्नको दुवैतिर बराबर घण्टा कोण",
        "Day length = 2H — the hour angle on either side of local noon",
      )}
      caption={bilingualText(
        lang,
        "सूर्योदयको समीकरणले दिने H भनेको आधा दिन हो। स्थानीय मध्याह्न ठीक बीचमा पर्छ, सूर्योदय मध्याह्न − H मा र सूर्यास्त मध्याह्न + H मा — त्यसैले एउटै गणनाले दुवै दिन्छ र दिनमान सिधै २H हुन्छ। काठमाडौँमा H ग्रीष्म अयनान्तमा ~६घ ५५मि र शीत अयनान्तमा ~५घ १३मि हुन्छ।",
        "The H that the sunrise equation gives you is half a day. Local noon sits in the middle, sunrise at noon − H and sunset at noon + H — so one solve gives both, and day length is simply 2H. At Kathmandu H runs about 6h 55m at the summer solstice and 5h 13m at the winter one.",
      )}
    >
      <line x1={noon} y1={34} x2={noon} y2={H - 34} stroke={MARK} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.8} />
      <text x={noon} y={26} textAnchor="middle" className="text-[8.5px] font-semibold" style={{ fill: MARK }}>
        {bilingualText(lang, "स्थानीय मध्याह्न", "local noon")}
      </text>

      {rows.map((r) => (
        <g key={r.en}>
          <text x={L - 10} y={r.y + 3} textAnchor="end" className="fill-current text-[8px] opacity-60">
            {lang === "en" ? r.en : r.ne}
          </text>
          <line
            x1={noon - px(r.h)}
            y1={r.y}
            x2={noon + px(r.h)}
            y2={r.y}
            stroke={r.c}
            strokeWidth={7}
            opacity={0.4}
            strokeLinecap="round"
          />
          {[-1, 1].map((s) => (
            <circle key={s} cx={noon + s * px(r.h)} cy={r.y} r={3.4} fill={r.c} />
          ))}
          <text x={noon - px(r.h) - 6} y={r.y + 3} textAnchor="end" className="fill-current text-[7.5px] opacity-65">
            {bilingualText(lang, "सूर्योदय", "sunrise")}
          </text>
          <text x={noon + px(r.h) + 6} y={r.y + 3} className="fill-current text-[7.5px] opacity-65">
            {bilingualText(lang, "सूर्यास्त", "sunset")}
          </text>
          <text x={noon} y={r.y + 17} textAnchor="middle" className="fill-current text-[7.5px] opacity-55">
            {bilingualText(lang, `२H = ${n(r.len)}`, `2H = ${r.len}`)}
          </text>
        </g>
      ))}

      <text x={noon - px(3.5)} y={H - 12} textAnchor="middle" className="fill-current text-[8px] opacity-60">
        ◄── H ──►
      </text>
      <text x={noon + px(3.5)} y={H - 12} textAnchor="middle" className="fill-current text-[8px] opacity-60">
        ◄── H ──►
      </text>
    </Frame>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   चन्द्रोदय ~५० मिनेट ढिलो — and the day that gets none
   ──────────────────────────────────────────────────────────────────── */

/**
 * Why some days have two moonrises and some have none.
 *
 * The Moon rises roughly `५०` minutes later each day, because it has moved
 * about `१३°` along its own orbit while Earth turned. Slide an event `५०`
 * minutes later every day against a `२४`-hour grid and two things follow with
 * no extra rule: occasionally two moonrises land inside one civil day, and
 * occasionally the slip steps clean over a day and it gets none.
 *
 * The dates are the article's worked example, laid out on a real 24-hour axis
 * so the slip is a slope rather than a list.
 */
export function MoonriseSlip() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const W = 540;
  const H = 210;
  const L = 58;
  const Rr = W - 16;
  const x = (h: number) => L + (h / 24) * (Rr - L);

  /* Successive moonrises are ~24h 50m apart — always *more* than a civil day.
     So a day can miss out entirely, but two can never fall inside one. Times
     below are one consistent run of that interval. */
  const days = [
    { d: 1, rises: [22.67] },
    { d: 2, rises: [23.5] },
    { d: 3, rises: [] },
    { d: 4, rises: [0.33] },
    { d: 5, rises: [1.17] },
  ];
  const rowY = (i: number) => 50 + i * 29;

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "चन्द्रोदय हरेक दिन ~५० मिनेट ढिलो — कुनै दिन दुई पटक, कुनै दिन एकै पटक पनि होइन",
        "Moonrise slips ~50 minutes a day — some days get two, some get none",
      )}
      caption={bilingualText(
        lang,
        "चन्द्रमा आफ्नै कक्षमा दैनिक ~१३° सर्ने भएकाले लगातार दुई चन्द्रोदयबीच ~२४ घण्टा ५० मिनेट लाग्छ — अर्थात् एक दिनभन्दा सधैँ बढी। त्यसैले ढिलाइ जम्मा हुँदै गएर कुनै दिन पूरै नाघ्छ र त्यो दिन चन्द्रोदयै हुँदैन। उल्टो भने सम्भव छैन: अन्तराल २४ घण्टाभन्दा लामो हुनाले एउटै दिनमा दुई चन्द्रोदय कहिल्यै पर्दैनन्।",
        "The Moon moves about 13° along its own orbit each day, so successive moonrises are about 24h 50m apart — always more than one civil day. The slip therefore accumulates until it steps clean over a day, which then has no moonrise at all. The reverse cannot happen: because the interval exceeds 24 hours, two moonrises never fall inside one day.",
      )}
    >
      {[0, 6, 12, 18, 24].map((h) => (
        <g key={h}>
          <line x1={x(h)} y1={36} x2={x(h)} y2={H - 42} stroke={INK} strokeOpacity={0.12} strokeWidth={0.7} />
          <text x={x(h)} y={30} textAnchor="middle" className="fill-current text-[7.5px] opacity-50">
            {n(String(h).padStart(2, "0"))}:{n("00")}
          </text>
        </g>
      ))}

      {days.map((row, i) => (
        <g key={row.d}>
          <text x={L - 8} y={rowY(i) + 3} textAnchor="end" className="fill-current text-[8px] opacity-60">
            {bilingualText(lang, `दिन ${n(row.d)}`, `day ${row.d}`)}
          </text>
          <line x1={L} y1={rowY(i)} x2={Rr} y2={rowY(i)} stroke={INK} strokeOpacity={0.16} strokeWidth={0.8} />
          {row.rises.map((h) => (
            <circle key={h} cx={x(h)} cy={rowY(i)} r={4} fill={MOON} opacity={0.95} />
          ))}
          {row.rises.length === 0 && (
            <text x={(L + Rr) / 2} y={rowY(i) + 3} textAnchor="middle" className="text-[8px] font-semibold" style={{ fill: WARN }}>
              {bilingualText(lang, "यो दिन चन्द्रोदय छैन", "no moonrise this day")}
            </text>
          )}
          {/* the slip label flips inboard near the right edge, where a
              +50m sitting after the dot would run off the frame */}
          {row.rises.length === 1 && i > 0 && (
            <text
              x={x(row.rises[0]!) + (row.rises[0]! > 20 ? -9 : 9)}
              y={rowY(i) + 3}
              textAnchor={row.rises[0]! > 20 ? "end" : "start"}
              className="fill-current text-[7px] opacity-45"
            >
              +{n(50)}m
            </text>
          )}
        </g>
      ))}

      <text x={L} y={H - 12} className="fill-current text-[8.5px] font-semibold opacity-70">
        {bilingualText(lang, `हरेक दिन ~${n(50)} मिनेट ढिलो →`, `~${n(50)} minutes later each day →`)}
      </text>
    </Frame>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   सूर्योदय नै नमुना लिने क्षण — why the तिथि of a day is fixed at dawn
   ──────────────────────────────────────────────────────────────────── */

/**
 * The panchanga samples the sky once a day, at sunrise.
 *
 * A तिथि can begin and end at any hour; the calendar needs one label per day.
 * The rule is to read whichever तिथि is running **at sunrise** and give the
 * whole day that name. So a तिथि that ends at 04:30 — before dawn — never gets
 * a day, and the one after it takes the whole day instead.
 *
 * Drawn as a strip of तिथि boundaries with one sampling arrow at sunrise,
 * which is the entire rule in one mark.
 */
export function SunriseSamplesTithi() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const W = 540;
  const H = 172;
  const L = 26;
  const Rr = W - 20;
  const x = (h: number) => L + (h / 24) * (Rr - L);
  const barY = 74;

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "सूर्योदयमा जुन तिथि चलिरहेको छ, त्यही दिनभरिको तिथि",
        "The tithi running at sunrise is the tithi for the whole day",
      )}
      caption={bilingualText(
        lang,
        "तिथि जुनसुकै घडीमा सुरु र अन्त्य हुन सक्छ, तर पात्रोलाई दिनको एउटै नाम चाहिन्छ। नियम सरल छ — सूर्योदयको क्षणमा जुन तिथि चलिरहेको हुन्छ, त्यही दिनभरिको तिथि। त्यसैले सूर्योदयअघि सकिने तिथिले दिन पाउँदैन। यही एउटा नियमबाट तिथि स्थानसापेक्ष बन्छ, किनभने सूर्योदय आफैँ स्थानसापेक्ष छ।",
        "A tithi can start and end at any hour, but a calendar needs one name per day. The rule is simply this: whichever tithi is running at the moment of sunrise is the tithi for that whole day. A tithi that ends before sunrise therefore never gets a day of its own. That one rule is what makes tithi local, because sunrise itself is local.",
      )}
    >
      {/* the तिथि strip, with a boundary before dawn and one after */}
      {[
        { a: 0, b: 4.5, ne: "तृतीया", en: "Tritiya", c: 0.1 },
        { a: 4.5, b: 24, ne: "चतुर्थी", en: "Chaturthi", c: 0.2 },
      ].map((seg) => (
        <g key={seg.en}>
          <rect
            x={x(seg.a)}
            y={barY}
            width={x(seg.b) - x(seg.a)}
            height={26}
            fill={INK}
            opacity={seg.c}
            rx={2}
          />
          <text
            x={(x(seg.a) + x(seg.b)) / 2}
            y={barY + 17}
            textAnchor="middle"
            className="fill-current text-[8.5px] opacity-75"
          >
            {lang === "en" ? seg.en : seg.ne}
          </text>
        </g>
      ))}
      <line x1={x(4.5)} y1={barY - 6} x2={x(4.5)} y2={barY + 32} stroke={WARN} strokeWidth={1.3} />
      <text x={x(4.5)} y={barY - 12} textAnchor="middle" className="text-[8px] font-semibold" style={{ fill: WARN }}>
        {bilingualText(lang, `तिथि बदलियो ०४:३०`, `tithi changes ${n("04:30")}`)}
      </text>

      {/* the sampling instant */}
      <line x1={x(6.17)} y1={barY + 34} x2={x(6.17)} y2={barY + 56} stroke={MARK} strokeWidth={1.4} />
      <circle cx={x(6.17)} cy={barY + 34} r={3.6} fill={MARK} />
      <text x={x(6.17)} y={barY + 70} textAnchor="middle" className="text-[8.5px] font-semibold" style={{ fill: MARK }}>
        {bilingualText(lang, `सूर्योदय ०५:४५ — यहाँ नमुना लिइन्छ`, `sunrise ${n("05:45")} — sampled here`)}
      </text>

      <text x={L} y={30} className="fill-current text-[8px] opacity-55">
        {n("00:00")}
      </text>
      <text x={Rr} y={30} textAnchor="end" className="fill-current text-[8px] opacity-55">
        {n("24:00")}
      </text>
      <text x={(L + Rr) / 2} y={30} textAnchor="middle" className="fill-current text-[8.5px] font-semibold opacity-70">
        {bilingualText(lang, "एक दिन", "one civil day")}
      </text>
    </Frame>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   एउटै क्षण, दुई ठाउँ, दुई फरक तिथि
   ──────────────────────────────────────────────────────────────────── */

/**
 * The same instant, two places, two different answers — and no disagreement.
 *
 * A तिथि ends at one absolute moment for the whole planet. What differs is
 * where each place's *sunrise* falls relative to it. At काठमाडौँ the boundary
 * lands before dawn, so that day takes the next तिथि; at सिड्नी it lands after
 * dawn, so that day keeps the earlier one. Both are correct, and the reason
 * both are correct is the sunrise rule, not a difference in the astronomy.
 */
export function TithiAcrossZones() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const W = 540;
  const H = 208;
  const L = 92;
  const Rr = W - 22;
  const x = (h: number) => L + (h / 12) * (Rr - L);

  const places = [
    { ne: "काठमाडौँ", en: "Kathmandu", tz: "UTC+05:45", end: 3.75, rise: 6.17, before: true },
    { ne: "सिड्नी", en: "Sydney", tz: "UTC+11:00", end: 9.0, rise: 6.5, before: false },
  ];

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "एउटै तिथि–सीमा दुई सहरमा — सूर्योदयको कुन तिर पर्छ भन्नेले उत्तर बदल्छ",
        "One tithi boundary, two cities — which side of sunrise it falls on changes the answer",
      )}
      caption={bilingualText(
        lang,
        "तिथि सकिने क्षण पूरै पृथ्वीका लागि एउटै हो — यहाँ २२:०० UTC। फरक पर्ने कुरा त्यो क्षण कुन ठाउँको सूर्योदयभन्दा अगाडि पर्छ कि पछाडि भन्ने मात्र हो। काठमाडौँमा सीमा सूर्योदयअघि परेकाले त्यो दिनले अर्को तिथि पाउँछ; सिड्नीमा सूर्योदयपछि परेकाले पुरानै तिथि रहन्छ। दुवै सही छन् — फरक खगोलशास्त्रमा होइन, सूर्योदयको नियममा छ।",
        "The tithi ends at one absolute moment for the whole planet — 22:00 UTC here. All that differs is whether that moment falls before or after each place's sunrise. At Kathmandu it lands before dawn, so that day takes the next tithi; at Sydney it lands after, so the day keeps the earlier one. Both are right; the difference is in the sunrise rule, not in the astronomy.",
      )}
    >
      <text x={W / 2} y={20} textAnchor="middle" className="fill-current text-[9px] font-semibold opacity-75">
        {bilingualText(lang, `तिथि सकिने क्षण — ${n("22:00")} UTC`, `tithi ends — ${n("22:00")} UTC`)}
      </text>

      {places.map((p, i) => {
        const y = 62 + i * 76;
        return (
          <g key={p.en}>
            <text x={L - 10} y={y - 2} textAnchor="end" className="fill-current text-[8.5px] font-semibold opacity-75">
              {lang === "en" ? p.en : p.ne}
            </text>
            <text x={L - 10} y={y + 10} textAnchor="end" className="fill-current text-[7.5px] opacity-50">
              {p.tz}
            </text>
            <line x1={L} y1={y} x2={Rr} y2={y} stroke={INK} strokeOpacity={0.18} strokeWidth={0.9} />

            {/* sunrise */}
            <circle cx={x(p.rise)} cy={y} r={3.8} fill={MARK} />
            <text x={x(p.rise)} y={y - 8} textAnchor="middle" className="text-[7.5px]" style={{ fill: MARK }}>
              {bilingualText(lang, "सूर्योदय", "sunrise")}
            </text>

            {/* the boundary */}
            <line x1={x(p.end)} y1={y - 14} x2={x(p.end)} y2={y + 14} stroke={WARN} strokeWidth={1.4} />
            <text x={x(p.end)} y={y - 20} textAnchor="middle" className="text-[7.5px] font-semibold" style={{ fill: WARN }}>
              {n(p.before ? "03:45" : "09:00")}
            </text>

            <text
              x={Rr}
              y={y + 25}
              textAnchor="end"
              className="text-[8px] font-semibold"
              style={{ fill: p.before ? WARN : MARK }}
            >
              {p.before
                ? bilingualText(lang, "सूर्योदयअघि सकियो → अर्को तिथि", "ended before sunrise → next tithi")
                : bilingualText(lang, "सूर्योदयपछि सकियो → पुरानै तिथि", "ended after sunrise → same tithi")}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}
