import { toNepaliDigits } from "@/lib/panchanga-format";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import {
  KAR_FIX_NAMES,
  KAR_MOV,
  WHEEL_TITHIS,
  WHEEL_YOGAS,
} from "@/lib/tithi-wheel-data";
import { PADA_AKSHAR, RASHI_ELEM, RASHI_LORDS, WHEEL_RASHIS } from "@/lib/wheel-data";

const N = toNepaliDigits;

const GRAHA_ROWS = [
  { sym: "☉", ne: "सूर्य", en: "Sun", note: "आत्मा, पिता, अधिकार — राशि र सङ्क्रान्तिको माप" },
  { sym: "☾", ne: "चन्द्र", en: "Moon", note: "मन, माता — तिथि, नक्षत्र, पक्ष" },
  { sym: "♂", ne: "मंगल", en: "Mars", note: "साहस, भाइ — मङ्गलवार, होरा" },
  { sym: "☿", ne: "बुध", en: "Mercury", note: "बुद्धि, वाणी — बुधवार" },
  { sym: "♃", ne: "बृहस्पति", en: "Jupiter", note: "गुरु, ज्ञान — बिहीवार" },
  { sym: "♀", ne: "शुक्र", en: "Venus", note: "प्रेम, सौन्दर्य — शुक्रवार" },
  { sym: "♄", ne: "शनि", en: "Saturn", note: "कर्म, धैर्य — शनिवार" },
  { sym: "☊", ne: "राहु", en: "Rahu", note: "छाया ग्रह — ग्रहण, अप्रत्याशित परिवर्तन" },
  { sym: "☋", ne: "केतु", en: "Ketu", note: "छाया ग्रह — मोक्ष, आध्यात्म" },
] as const;

function RefTable({
  caption,
  children,
}: {
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="learn-ref-wrap">
      <table className="learn-ref-table">
        {caption && <caption className="learn-ref-caption">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function RashiReferenceTable() {
  return (
    <RefTable caption="१२ राशि — प्रत्येक ३०° (जम्मा ३६०°)">
      <thead>
        <tr>
          <th>#</th>
          <th>राशि</th>
          <th>English</th>
          <th>°</th>
          <th>स्वामी</th>
          <th>तत्त्व</th>
        </tr>
      </thead>
      <tbody>
        {WHEEL_RASHIS.map((r, i) => (
          <tr key={r.ne}>
            <td className="mono">{N(i + 1)}</td>
            <td>
              <span className="learn-ref-sym">{r.sym}</span> {r.ne}
            </td>
            <td className="learn-ref-en">{r.en}</td>
            <td className="mono learn-ref-deg">
              {N(i * 30)}°–{N((i + 1) * 30)}°
            </td>
            <td>{RASHI_LORDS[i]}</td>
            <td>{RASHI_ELEM[i]}</td>
          </tr>
        ))}
      </tbody>
    </RefTable>
  );
}

export function GrahaReferenceTable() {
  return (
    <RefTable caption="नव ग्रह (९) — पञ्चाङ्ग र कुण्डलीमा प्रयोग">
      <thead>
        <tr>
          <th>#</th>
          <th>ग्रह</th>
          <th>English</th>
          <th>संक्षिप्त अर्थ</th>
        </tr>
      </thead>
      <tbody>
        {GRAHA_ROWS.map((g, i) => (
          <tr key={g.ne}>
            <td className="mono">{N(i + 1)}</td>
            <td>
              <span className="learn-ref-sym">{g.sym}</span> {g.ne}
            </td>
            <td className="learn-ref-en">{g.en}</td>
            <td>{g.note}</td>
          </tr>
        ))}
      </tbody>
    </RefTable>
  );
}

export function NakshatraReferenceTable() {
  return (
    <RefTable caption="२७ नक्षत्र — प्रत्येक १३°२०′, चार पाद (३°२०′ प्रति पाद)">
      <thead>
        <tr>
          <th>#</th>
          <th>नक्षत्र</th>
          <th>English</th>
          <th>°</th>
          <th>स्वामी</th>
          <th>चिह्न</th>
          <th>पाद १</th>
          <th>पाद २</th>
          <th>पाद ३</th>
          <th>पाद ४</th>
        </tr>
      </thead>
      <tbody>
        {NAKSHATRA_ICONS.map((nak, i) => {
          const padas = PADA_AKSHAR[i]!;
          const startDeg = i * 13;
          return (
            <tr key={nak.ne}>
              <td className="mono">{N(i + 1)}</td>
              <td>{nak.ne}</td>
              <td className="learn-ref-en">{nak.en}</td>
              <td className="mono learn-ref-deg">
                {N(startDeg)}°{N(20)}′–{N(startDeg + 13)}°{N(20)}′
              </td>
              <td>{nak.lord_ne}</td>
              <td className="learn-ref-sym-ne">{nak.sym_ne}</td>
              {padas.map((p, pi) => (
                <td key={pi} className="learn-ref-pada">
                  {p}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </RefTable>
  );
}

export function TithiReferenceTable() {
  return (
    <RefTable caption="३० तिथि — चन्द्र–सूर्यको १२° कोणीय दूरी">
      <thead>
        <tr>
          <th>#</th>
          <th>तिथि</th>
          <th>English</th>
          <th>पक्ष</th>
          <th>कोण (≈)</th>
        </tr>
      </thead>
      <tbody>
        {WHEEL_TITHIS.map((t, i) => {
          const degStart = i * 12;
          const degEnd = (i + 1) * 12;
          return (
            <tr key={`${t.ne}-${i}`} className={t.moon ? "learn-ref-highlight" : undefined}>
              <td className="mono">{N(i + 1)}</td>
              <td>{t.ne}</td>
              <td className="learn-ref-en">{t.en}</td>
              <td>{t.paksha}</td>
              <td className="mono learn-ref-deg">
                {N(degStart)}°–{N(degEnd)}°
              </td>
            </tr>
          );
        })}
      </tbody>
    </RefTable>
  );
}

export function YogaReferenceTable() {
  return (
    <RefTable caption="२७ योग — सूर्य + चन्द्रको देशान्तर जोड (प्रत्येक १३°२०′)">
      <thead>
        <tr>
          <th>#</th>
          <th>योग</th>
          <th>° (≈)</th>
        </tr>
      </thead>
      <tbody>
        {WHEEL_YOGAS.map((y, i) => (
          <tr key={y}>
            <td className="mono">{N(i + 1)}</td>
            <td>{y}</td>
            <td className="mono learn-ref-deg">
              {N(i * 13)}°{N(20)}′–{N((i + 1) * 13)}°{N(20)}′
            </td>
          </tr>
        ))}
      </tbody>
    </RefTable>
  );
}

export function KaranaReferenceTable() {
  const charRows = KAR_MOV.map((ne) => ({ ne, type: "चर (७)" }));
  const sthiraRows = KAR_FIX_NAMES.map((ne) => ({ ne, type: "स्थिर (४)" }));

  return (
    <>
      <RefTable caption="११ करण — तिथिको आधा (६° कोण); महिनामा ६० करण">
        <thead>
          <tr>
            <th>#</th>
            <th>करण</th>
            <th>प्रकार</th>
            <th>टिप्पणी</th>
          </tr>
        </thead>
        <tbody>
          <tr className="learn-ref-highlight">
            <td className="mono">{N(1)}</td>
            <td>किंस्तुघ्न</td>
            <td>स्थिर</td>
            <td>शुक्ल प्रतिपदाको पहिलो आधा — वर्षमा एक पटक</td>
          </tr>
          {charRows.map((k, i) => (
            <tr key={k.ne}>
              <td className="mono">{N(i + 2)}</td>
              <td>{k.ne}{k.ne === "विष्टि" ? " (भद्रा)" : ""}</td>
              <td>{k.type}</td>
              <td>महिनाभरि बारम्बार दोहोरिन्छ</td>
            </tr>
          ))}
          {sthiraRows.slice(1).map((k, i) => (
            <tr key={k.ne}>
              <td className="mono">{N(i + 9)}</td>
              <td>{k.ne}</td>
              <td>{k.type}</td>
              <td>महिनामा एक–एक पटक — कृष्ण चतुर्दशी, औंसी, शुक्ल प्रतिपदा, पूर्णिमा</td>
            </tr>
          ))}
        </tbody>
      </RefTable>
      <p className="tm-card-cap learn-ref-note">
        क्रम: किंस्तुघ्न → (बव…विष्टि)×८ → शकुनि → चतुष्पाद → नाग → किंस्तुघ्न — जम्मा ६०
        करण/महिना।
      </p>
    </>
  );
}
