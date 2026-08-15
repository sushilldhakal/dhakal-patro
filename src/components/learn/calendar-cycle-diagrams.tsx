/**
 * Diagrams for the counting arguments: cycles, drifts and corrections.
 *
 * These five figures were each a small table or a hand-drawn ruler in
 * monospace. What they have in common is that the *quantity* is the point —
 * how far a calendar has slipped, how wide an eclipse window is, how a
 * seven-step cycle lands three places along. A number set in a <pre> is still
 * just a number; drawn to scale it becomes an argument.
 */

import { bilingualText, useLocale, type Lang } from "@/i18n/locale";
import { toNepaliDigits } from "@/lib/panchanga-format";

const INK = "currentColor";
const MARK = "#f59e0b";
const WARN = "#ef4444";
const COOL = "#0ea5e9";
const GOOD = "#35d05a";
const SUN = "#dddd00";

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

/* ── वार — 24 horas, and why tomorrow starts three places along ──────── */

/**
 * The weekday order is not arbitrary; it falls out of counting horas.
 *
 * The seven ग्रह sit in a fixed cycle by classical orbital period — शनि,
 * बृहस्पति, मंगल, सूर्य, शुक्र, बुध, चन्द्र — and each hour of the day is ruled
 * by the next one along. A day holds `२४` horas, and `२४ ÷ ७` leaves `३`, so
 * the *next* day's first hora sits **three** places further round the ring.
 *
 * Step three at a time and the ring emits सूर्य → चन्द्र → मंगल → बुध →
 * बृहस्पति → शुक्र → शनि, which is exactly the week. The diagram draws both:
 * the ring in period order, and the three-step chords that generate the week
 * from it.
 */
export function HoraWeekdayCycle() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const S = 300;
  const C = S / 2;
  const R = 104;

  /* Classical order by period, slowest first — the hora sequence. */
  const RING = [
    { ne: "शनि", en: "Sat" },
    { ne: "बृहस्पति", en: "Jup" },
    { ne: "मंगल", en: "Mars" },
    { ne: "सूर्य", en: "Sun" },
    { ne: "शुक्र", en: "Ven" },
    { ne: "बुध", en: "Mer" },
    { ne: "चन्द्र", en: "Moon" },
  ];
  const at = (i: number, r: number): [number, number] => {
    const a = ((i / 7) * 360 - 90) * (Math.PI / 180);
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };
  /* Start at सूर्य (index 3) and step *three* each time — 24 mod 7 = 3 — which
     emits सूर्य, चन्द्र, मंगल, बुध, बृहस्पति, शुक्र, शनि: the week exactly.
     The figure this replaced said "24 ÷ 7 = 3 बाँकी 4"; the remainder is 3.
     Counted inclusively the landing place is the fourth along, which is
     probably where the 4 came from, but as a step it is 3. */
  const week = Array.from({ length: 7 }, (_, k) => (3 + k * 3) % 7);

  return (
    <Frame
      w={S}
      h={S}
      label={bilingualText(
        lang,
        "सात ग्रहको होरा चक्र र त्यसबाट निस्कने बारको क्रम",
        "The seven-graha hora cycle and the weekday order it generates",
      )}
      caption={bilingualText(
        lang,
        "सात ग्रह परम्परागत परिक्रमा–कालको क्रममा चक्रमा बस्छन्, र दिनको हरेक घण्टा (होरा) क्रमको अर्को ग्रहले चलाउँछ। एक दिनमा २४ होरा हुन्छन्, र २४ ÷ ७ ले ३ बाँकी छाड्छ — त्यसैले भोलिको पहिलो होरा चक्रमा तीन स्थान अगाडि पर्छ। सूर्यबाट तीन–तीन गन्दै जानुहोस्: सूर्य → चन्द्र → मंगल → बुध → बृहस्पति → शुक्र → शनि। बारको क्रम मनपरी होइन, यही गणनाबाट आएको हो।",
        "The seven grahas sit in a ring ordered by classical orbital period, and each hour of the day — each hora — is ruled by the next one along. A day holds 24 horas, and 24 ÷ 7 leaves 3, so tomorrow's first hora lands three places further round. Count in threes from the Sun: Sun → Moon → Mars → Mercury → Jupiter → Venus → Saturn. The weekday order is not arbitrary; it is that arithmetic.",
      )}
    >
      {/* the three-step chords that generate the week */}
      {week.map((idx, k) => {
        const nxt = week[(k + 1) % 7]!;
        const [x1, y1] = at(idx, R - 16);
        const [x2, y2] = at(nxt, R - 16);
        return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={MARK} strokeWidth={0.9} opacity={0.4} />;
      })}

      <circle cx={C} cy={C} r={R} fill="none" stroke={INK} strokeOpacity={0.16} strokeWidth={0.8} />

      {RING.map((g, i) => {
        const [x, y] = at(i, R);
        const order = week.indexOf(i) + 1;
        return (
          <g key={g.en}>
            <circle cx={x} cy={y} r={15} fill={INK} opacity={0.07} />
            <circle cx={x} cy={y} r={15} fill="none" stroke={MARK} strokeOpacity={0.45} strokeWidth={0.9} />
            <text x={x} y={y + 3} textAnchor="middle" className="fill-current text-[8px] font-semibold opacity-85">
              {lang === "en" ? g.en : g.ne}
            </text>
            <text
              x={at(i, R + 25)[0]}
              y={at(i, R + 25)[1] + 3}
              textAnchor="middle"
              className="text-[8px] font-semibold"
              style={{ fill: MARK }}
            >
              {n(order)}
            </text>
          </g>
        );
      })}

      <text x={C} y={C - 6} textAnchor="middle" className="fill-current text-[8.5px] font-semibold opacity-75">
        {bilingualText(lang, "२४ ÷ ७ → बाँकी ३", "24 ÷ 7 → remainder 3")}
      </text>
      <text x={C} y={C + 8} textAnchor="middle" className="text-[8px] font-semibold" style={{ fill: MARK }}>
        {bilingualText(lang, "→ ३ स्थान अगाडि", "→ 3 places along")}
      </text>
    </Frame>
  );
}

/* ── लीप वर्ष — the 0.0078 day the Julian rule overpays ──────────────── */

/**
 * Three year-lengths side by side, and what the difference buys.
 *
 * The Julian mean year is `३६५.२५००` days and the true tropical year
 * `३६५.२४२२`. The rule therefore overpays by `०.००७८` days a year — small
 * enough to ignore for a lifetime, and by `१५८२` it had put the equinox ten
 * days adrift. The Gregorian correction drops three leap days every four
 * centuries and lands at `३६५.२४२५`, which is close enough to lose a day only
 * once in about three thousand years.
 *
 * Bars are drawn against the *excess*, not the absolute length: at absolute
 * scale all three are the same bar.
 */
export function YearLengthLadder() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const W = 540;
  const H = 176;
  const L = 128;
  const zero = L + 40;
  const scale = 4400;

  const rows = [
    { ne: "जुलियन औसत", en: "Julian mean", len: "365.2500", excess: 0.0078, c: WARN },
    { ne: "ग्रेगोरियन औसत", en: "Gregorian mean", len: "365.2425", excess: 0.0003, c: GOOD },
    { ne: "वास्तविक सायन वर्ष", en: "true tropical year", len: "365.2422", excess: 0, c: INK },
  ];

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "जुलियन, ग्रेगोरियन र वास्तविक वर्षको लम्बाइ — र त्यसको जोडिँदो त्रुटि",
        "Julian, Gregorian and true year lengths, and the error each accumulates",
      )}
      caption={bilingualText(
        lang,
        "जुलियन नियमले वर्षमा ३६५.२५ दिन मान्छ, वास्तविक सायन वर्ष ३६५.२४२२ को हो — वर्षेनि ०.००७८ दिन बढी। एक जीवनकालमा बेवास्ता गर्न मिल्ने यही सानो रकमले १२८ वर्षमा एक दिन र १५८२ सम्ममा दस दिन बनाइदियो। ग्रेगोरियन सुधारले हरेक चार शताब्दीमा तीन लीप दिन घटाएर औसत ३६५.२४२५ मा झार्छ — अब एक दिन बिग्रन करिब ३,००० वर्ष लाग्छ।",
        "The Julian rule calls a year 365.25 days when the true tropical year is 365.2422 — an overpayment of 0.0078 days annually. That amount, negligible over a lifetime, becomes a full day in 128 years and ten days by 1582. The Gregorian correction drops three leap days every four centuries, bringing the mean to 365.2425 — now it takes about 3,000 years to lose a day.",
      )}
    >
      <line x1={zero} y1={30} x2={zero} y2={H - 46} stroke={INK} strokeOpacity={0.35} strokeWidth={1} />
      <text x={zero} y={24} textAnchor="middle" className="fill-current text-[7.5px] opacity-55">
        {bilingualText(lang, "शून्य त्रुटि", "zero error")}
      </text>

      {rows.map((r, i) => {
        const y = 48 + i * 30;
        const w = r.excess * scale;
        return (
          <g key={r.en}>
            <text x={L - 6} y={y + 3} textAnchor="end" className="fill-current text-[8px] opacity-65">
              {lang === "en" ? r.en : r.ne}
            </text>
            <text x={L + 2} y={y + 3} className="fill-current text-[8px] tabular-nums opacity-80">
              {n(r.len)}
            </text>
            {w > 0 && <rect x={zero} y={y - 6} width={w} height={12} fill={r.c} opacity={0.45} rx={1.5} />}
            {w > 0 && (
              <text x={zero + w + 6} y={y + 3} className="text-[7.5px] font-semibold" style={{ fill: r.c }}>
                +{n(r.excess.toFixed(4))} {bilingualText(lang, "दिन/वर्ष", "d/yr")}
              </text>
            )}
          </g>
        );
      })}

      <text x={zero} y={H - 26} className="text-[8px] font-semibold" style={{ fill: WARN }}>
        {bilingualText(lang, `जुलियन: ~१ दिन प्रति ${n(128)} वर्ष → ${n(1582)} सम्ममा १० दिन`, `Julian: ~1 day per ${n(128)} years → ten days by ${n(1582)}`)}
      </text>
      <text x={zero} y={H - 10} className="text-[8px] font-semibold" style={{ fill: GOOD }}>
        {bilingualText(lang, `ग्रेगोरियन: ~१ दिन प्रति ~३,००० वर्ष`, `Gregorian: ~1 day per ~3,000 years`)}
      </text>
    </Frame>
  );
}

/* ── अक्टोबर १५८२ — the ten days that never happened ─────────────────── */

/**
 * The Gregorian jump, and the three centuries it took to spread.
 *
 * Ten days were struck out of October 1582 so the equinox would land back
 * where the Julian rule had promised. The calendar went straight from the
 * `४`th to the `१५`th — no day in between existed anywhere that adopted it.
 *
 * The second half of the diagram is the part the date alone hides: adoption
 * was staggered over `३४१` years, and because the Julian error kept running,
 * each late adopter had to strike out *more* days than the last. Britain lost
 * eleven, Russia thirteen.
 */
export function GregorianJump() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const W = 540;
  const H = 196;
  const cell = 26;
  const startX = 92;

  const before = [1, 2, 3, 4];
  const after = [15, 16, 17, 18];
  const adopters = [
    { y: 1582, days: 10, ne: "इटाली, स्पेन, पोर्चुगल", en: "Italy, Spain, Portugal" },
    { y: 1752, days: 11, ne: "बेलायत", en: "Britain" },
    { y: 1918, days: 13, ne: "रुस", en: "Russia" },
    { y: 1923, days: 13, ne: "ग्रीस", en: "Greece" },
  ];

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "अक्टोबर १५८२ मा हटाइएका दस दिन, र देशैपिच्छे फरक अपनाउने साल",
        "The ten days removed from October 1582, and the staggered adoption that followed",
      )}
      caption={bilingualText(
        lang,
        "जुलियन नियमको जम्मा भएको त्रुटि मिलाउन अक्टोबर १५८२ बाट दस दिन एकैचोटि हटाइयो — ४ गतेको भोलिपल्ट सिधै १५ गते भयो, र बीचका दस दिन कहीँ पनि अस्तित्वमा आएनन्। तर सबैले एकैचोटि अपनाएनन्, र त्रुटि चलिरहेकै हुनाले पछि अपनाउनेले झन् धेरै दिन हटाउनुपर्‍यो — बेलायतले ११, रुसले १३।",
        "Ten days were struck from October 1582 to clear the accumulated Julian error: the 4th was followed directly by the 15th, and the days between never existed anywhere. Adoption was not simultaneous, though, and because the error kept accruing, later adopters had to remove more days — eleven for Britain, thirteen for Russia.",
      )}
    >
      <text x={startX} y={22} className="fill-current text-[8.5px] font-semibold opacity-75">
        {bilingualText(lang, "अक्टोबर १५८२", "October 1582")}
      </text>

      {[...before, ...after].map((d, i) => {
        const gap = i >= before.length ? 18 : 0;
        const x = startX + i * cell + gap;
        return (
          <g key={d}>
            <rect x={x} y={34} width={cell - 4} height={cell - 4} fill={INK} opacity={0.08} rx={2.5} />
            <text x={x + (cell - 4) / 2} y={34 + (cell - 4) / 2 + 3.5} textAnchor="middle" className="fill-current text-[8.5px] tabular-nums opacity-80">
              {n(d)}
            </text>
          </g>
        );
      })}

      {/* the seam */}
      <line
        x1={startX + before.length * cell + 7}
        y1={30}
        x2={startX + before.length * cell + 7}
        y2={34 + cell + 4}
        stroke={WARN}
        strokeWidth={2}
      />
      <text x={startX + before.length * cell + 14} y={34 + cell + 16} className="text-[8px] font-semibold" style={{ fill: WARN }}>
        {bilingualText(lang, "१० दिन हटाइयो — यी कहिल्यै भएनन्", "ten days removed — these never happened")}
      </text>

      {/* staggered adoption */}
      {adopters.map((a, i) => {
        const y = 112 + i * 20;
        return (
          <g key={a.y}>
            <text x={startX} y={y} className="fill-current text-[8px] tabular-nums opacity-70">
              {n(a.y)}
            </text>
            <rect x={startX + 40} y={y - 7} width={a.days * 7} height={9} fill={WARN} opacity={0.34} rx={1.5} />
            <text x={startX + 40 + a.days * 7 + 6} y={y} className="fill-current text-[8px] opacity-65">
              {n(a.days)} {bilingualText(lang, "दिन", "days")} · {lang === "en" ? a.en : a.ne}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

/* ── ग्रहण ऋतु — the ~34-day window ──────────────────────────────────── */

/**
 * Why eclipses arrive in pairs, about two weeks apart.
 *
 * An eclipse needs the Sun near a node of the Moon's orbit, and the Sun spends
 * roughly `३४` days close enough — that window is the ग्रहण ऋतु. A औंसी and a
 * पूर्णिमा are always about `१४` days apart, so a `३४`-day window almost always
 * catches at least one of each: a solar eclipse at new Moon and a lunar one at
 * full.
 *
 * The whole argument is a comparison of two durations, which is why it is
 * drawn to scale rather than listed.
 */
export function EclipseSeasonWindow() {
  const { lang } = useLocale();
  const n = (v: string | number) => digits(lang, v);
  const W = 540;
  const H = 176;
  const L = 60;
  const Rr = W - 40;
  const x = (d: number) => L + (d / 34) * (Rr - L);

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "ग्रहण ऋतुको ~३४ दिनको झ्याल, र त्यसभित्र पर्ने औंसी–पूर्णिमा जोडी",
        "The ~34-day eclipse window and the new–full Moon pair it catches",
      )}
      caption={bilingualText(
        lang,
        "ग्रहण हुन सूर्य चन्द्रकक्षको पात नजिक हुनुपर्छ, र सूर्य त्यति नजिक करिब ३४ दिन बस्छ — त्यही ग्रहण ऋतु हो। औंसी र पूर्णिमाबीच सधैँ करिब १४ दिनको फासला हुने भएकाले, ३४ दिनको झ्यालले प्रायः दुवै समात्छ: औंसीमा सूर्यग्रहण र पूर्णिमामा चन्द्रग्रहण। त्यसैले ग्रहण एक्लै नआई जोडीमा आउँछन्।",
        "An eclipse needs the Sun near a node of the Moon's orbit, and the Sun stays that close for about 34 days — that window is the eclipse season. Since a new Moon and a full Moon are always about 14 days apart, a 34-day window almost always catches both: a solar eclipse at new Moon and a lunar one at full. That is why eclipses arrive in pairs rather than singly.",
      )}
    >
      <rect x={L} y={54} width={Rr - L} height={30} fill={MARK} opacity={0.16} rx={3} />
      <text x={(L + Rr) / 2} y={44} textAnchor="middle" className="text-[8.5px] font-semibold" style={{ fill: MARK }}>
        {bilingualText(lang, `ग्रहण ऋतु — ~${n(34)} दिन`, `eclipse season — ~${n(34)} days`)}
      </text>
      {[L, Rr].map((v) => (
        <line key={v} x1={v} y1={50} x2={v} y2={88} stroke={MARK} strokeWidth={1.3} />
      ))}

      {[
        { d: 9, fill: "#1b2430", ne: "औंसी", en: "new moon", ev: "सूर्यग्रहण", evEn: "solar eclipse" },
        { d: 23, fill: "#e8eef6", ne: "पूर्णिमा", en: "full moon", ev: "चन्द्रग्रहण", evEn: "lunar eclipse" },
      ].map((m) => (
        <g key={m.en}>
          <circle cx={x(m.d)} cy={69} r={8} fill={m.fill} stroke={INK} strokeOpacity={0.4} strokeWidth={0.8} />
          <text x={x(m.d)} y={104} textAnchor="middle" className="fill-current text-[8px] font-semibold opacity-75">
            {lang === "en" ? m.en : m.ne}
          </text>
          <text x={x(m.d)} y={117} textAnchor="middle" className="text-[7.5px]" style={{ fill: COOL }}>
            {lang === "en" ? m.evEn : m.ev}
          </text>
        </g>
      ))}

      <line x1={x(9)} y1={134} x2={x(23)} y2={134} stroke={COOL} strokeWidth={1} opacity={0.7} />
      {[9, 23].map((d) => (
        <line key={d} x1={x(d)} y1={130} x2={x(d)} y2={138} stroke={COOL} strokeWidth={1} opacity={0.7} />
      ))}
      <text x={(x(9) + x(23)) / 2} y={150} textAnchor="middle" className="text-[8px] font-semibold" style={{ fill: COOL }}>
        {bilingualText(lang, `~${n(14)} दिन`, `~${n(14)} days`)}
      </text>
    </Frame>
  );
}

/* ── किरणको कोण — the same sunlight over different ground ────────────── */

/**
 * Why a slanting beam heats less: it is the same light over more ground.
 *
 * Two beams of identical width strike the surface, one steeply and one at a
 * shallow angle. The steep beam lands on a short footprint, the shallow one
 * spreads across a long one. Nothing about the light changed — only the area
 * it had to cover, and therefore the energy each patch of ground receives.
 *
 * Drawn with genuinely equal beam widths, since the whole claim is that the
 * *input* is identical and only the footprint differs.
 */
export function SunRayAngle() {
  const { lang } = useLocale();
  const W = 540;
  const H = 210;
  const ground = 150;

  /** Beam of a fixed width arriving at `deg` from vertical. */
  function beam(cx: number, deg: number, width: number) {
    const a = deg * (Math.PI / 180);
    const foot = width / Math.cos(a);
    const dx = Math.tan(a) * (ground - 30);
    return {
      rays: [-0.5, -0.166, 0.166, 0.5].map((f) => ({
        x1: cx + f * width - dx,
        y1: 30,
        x2: cx + f * foot,
        y2: ground,
      })),
      x1: cx - foot / 2,
      x2: cx + foot / 2,
      foot,
    };
  }

  const steep = beam(148, 12, 74);
  const shallow = beam(392, 62, 74);

  return (
    <Frame
      w={W}
      h={H}
      label={bilingualText(
        lang,
        "उही मात्राको किरण ठाडो र छड्के कोणमा — फरक क्षेत्रफलमा फिँजिन्छ",
        "The same quantity of light arriving steeply and at a slant — spread over different areas",
      )}
      caption={bilingualText(
        lang,
        "दुवैतिर किरणको पुञ्ज उही चौडाइको छ — सूर्यले पठाएको ऊर्जा उही हो। ठाडो पर्दा त्यो सानो क्षेत्रमा केन्द्रित हुन्छ, छड्के पर्दा फराकिलो क्षेत्रमा फिँजिन्छ, र प्रति वर्ग मिटर ताप घट्छ। ऋतु बनाउने यही हो: झुकावले वर्षभरि किरणको कोण बदल्छ, दूरीले होइन।",
        "The beam is the same width on both sides — the Sun is sending the same energy. Arriving steeply it concentrates on a short footprint; arriving at a slant it spreads across a long one, and the heat per square metre drops. This is what makes the seasons: the tilt changes the angle of the light through the year, not the distance.",
      )}
    >
      {[
        { b: steep, cx: 148, ne: "ठाडो किरण", en: "steep rays", res: "बढी ताप → गर्मी", resEn: "more heat → summer" },
        { b: shallow, cx: 392, ne: "छड्के किरण", en: "slanting rays", res: "कम ताप → जाडो", resEn: "less heat → winter" },
      ].map((p) => (
        <g key={p.en}>
          <text x={p.cx} y={20} textAnchor="middle" className="fill-current text-[8.5px] font-semibold opacity-75">
            {lang === "en" ? p.en : p.ne}
          </text>
          {p.b.rays.map((r, i) => (
            <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={SUN} strokeWidth={1.6} opacity={0.75} />
          ))}
          {/* the footprint the beam actually lands on */}
          <line x1={p.b.x1} y1={ground} x2={p.b.x2} y2={ground} stroke={MARK} strokeWidth={5} opacity={0.85} strokeLinecap="round" />
          <text x={p.cx} y={ground + 20} textAnchor="middle" className="text-[8px] font-semibold" style={{ fill: MARK }}>
            {lang === "en"
              ? `footprint ×${(p.b.foot / 74).toFixed(1)}`
              : `क्षेत्रफल ×${digits(lang, (p.b.foot / 74).toFixed(1))}`}
          </text>
          <text x={p.cx} y={ground + 36} textAnchor="middle" className="fill-current text-[8px] opacity-70">
            {lang === "en" ? p.resEn : p.res}
          </text>
        </g>
      ))}

      <line x1={20} y1={ground} x2={W - 20} y2={ground} stroke={INK} strokeOpacity={0.4} strokeWidth={1.2} />
    </Frame>
  );
}
