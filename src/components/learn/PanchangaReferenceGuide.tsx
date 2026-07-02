import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import {
  KAR_FIX_NAMES,
  KAR_MOV,
  KARANA_EN,
  WHEEL_TITHIS,
  WHEEL_YOGAS,
} from "@/lib/tithi-wheel-data";
import { PADA_AKSHAR, RASHI_ELEM, RASHI_LORDS, WHEEL_RASHIS } from "@/lib/wheel-data";
import { NAK_LORD_EN, TATTVA_EN } from "@/lib/wheel-locale";
import { useLocale } from "@/i18n/locale";

const GRAHA_ROWS = [
  { sym: "☉", ne: "सूर्य", en: "Sun", note: "आत्मा, पिता, अधिकार — राशि र सङ्क्रान्तिको माप", noteEn: "Soul, father, authority — measures rashi and sankranti" },
  { sym: "☾", ne: "चन्द्र", en: "Moon", note: "मन, माता — तिथि, नक्षत्र, पक्ष", noteEn: "Mind, mother — tithi, nakshatra, paksha" },
  { sym: "♂", ne: "मंगल", en: "Mars", note: "साहस, भाइ — मङ्गलवार, होरा", noteEn: "Courage, siblings — Tuesday, hora" },
  { sym: "☿", ne: "बुध", en: "Mercury", note: "बुद्धि, वाणी — बुधवार", noteEn: "Intellect, speech — Wednesday" },
  { sym: "♃", ne: "बृहस्पति", en: "Jupiter", note: "गुरु, ज्ञान — बिहीवार", noteEn: "Teacher, knowledge — Thursday" },
  { sym: "♀", ne: "शुक्र", en: "Venus", note: "प्रेम, सौन्दर्य — शुक्रवार", noteEn: "Love, beauty — Friday" },
  { sym: "♄", ne: "शनि", en: "Saturn", note: "कर्म, धैर्य — शनिवार", noteEn: "Karma, patience — Saturday" },
  { sym: "☊", ne: "राहु", en: "Rahu", note: "छाया ग्रह — ग्रहण, अप्रत्याशित परिवर्तन", noteEn: "Shadow planet — eclipses, sudden change" },
  { sym: "☋", ne: "केतु", en: "Ketu", note: "छाया ग्रह — मोक्ष, आध्यात्म", noteEn: "Shadow planet — moksha, spirituality" },
] as const;

const YOGA_EN = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
  "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva",
  "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti",
];

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
  const { pick, digits: N } = useLocale();
  return (
    <RefTable caption={pick("१२ राशि — प्रत्येक ३०° (जम्मा ३६०°)", "12 Rashis — each 30° (360° total)")}>
      <thead>
        <tr>
          <th>#</th>
          <th>{pick("राशि", "Rashi")}</th>
          <th>English</th>
          <th>°</th>
          <th>{pick("स्वामी", "Lord")}</th>
          <th>{pick("तत्त्व", "Element")}</th>
        </tr>
      </thead>
      <tbody>
        {WHEEL_RASHIS.map((r, i) => (
          <tr key={r.ne}>
            <td className="mono">{N(i + 1)}</td>
            <td>
              <span className="learn-ref-sym">{r.sym}</span> {pick(r.ne, r.en)}
            </td>
            <td className="learn-ref-en">{r.en}</td>
            <td className="mono learn-ref-deg">
              {N(i * 30)}°–{N((i + 1) * 30)}°
            </td>
            <td>{pick(RASHI_LORDS[i], NAK_LORD_EN[RASHI_LORDS[i]] ?? RASHI_LORDS[i])}</td>
            <td>{pick(RASHI_ELEM[i], TATTVA_EN[RASHI_ELEM[i]] ?? RASHI_ELEM[i])}</td>
          </tr>
        ))}
      </tbody>
    </RefTable>
  );
}

export function GrahaReferenceTable() {
  const { pick, digits: N } = useLocale();
  return (
    <RefTable caption={pick("नव ग्रह (९) — पञ्चाङ्ग र कुण्डलीमा प्रयोग", "Nava Graha (9) — used in panchanga and kundali")}>
      <thead>
        <tr>
          <th>#</th>
          <th>{pick("ग्रह", "Graha")}</th>
          <th>English</th>
          <th>{pick("संक्षिप्त अर्थ", "Brief meaning")}</th>
        </tr>
      </thead>
      <tbody>
        {GRAHA_ROWS.map((g, i) => (
          <tr key={g.ne}>
            <td className="mono">{N(i + 1)}</td>
            <td>
              <span className="learn-ref-sym">{g.sym}</span> {pick(g.ne, g.en)}
            </td>
            <td className="learn-ref-en">{g.en}</td>
            <td>{pick(g.note, g.noteEn)}</td>
          </tr>
        ))}
      </tbody>
    </RefTable>
  );
}

export function NakshatraReferenceTable() {
  const { pick, digits: N } = useLocale();
  return (
    <RefTable caption={pick("२७ नक्षत्र — प्रत्येक १३°२०′, चार पद (३°२०′ प्रति पद)", "27 Nakshatras — each 13°20′, four padas (3°20′ per pada)")}>
      <thead>
        <tr>
          <th>#</th>
          <th>{pick("नक्षत्र", "Nakshatra")}</th>
          <th>English</th>
          <th>°</th>
          <th>{pick("स्वामी", "Lord")}</th>
          <th>{pick("चिह्न", "Symbol")}</th>
          <th>{pick("पद १", "Pada 1")}</th>
          <th>{pick("पद २", "Pada 2")}</th>
          <th>{pick("पद ३", "Pada 3")}</th>
          <th>{pick("पद ४", "Pada 4")}</th>
        </tr>
      </thead>
      <tbody>
        {NAKSHATRA_ICONS.map((nak, i) => {
          const padas = PADA_AKSHAR[i]!;
          const startDeg = i * 13;
          return (
            <tr key={nak.ne}>
              <td className="mono">{N(i + 1)}</td>
              <td>{pick(nak.ne, nak.en)}</td>
              <td className="learn-ref-en">{nak.en}</td>
              <td className="mono learn-ref-deg">
                {N(startDeg)}°{N(20)}′–{N(startDeg + 13)}°{N(20)}′
              </td>
              <td>{pick(nak.lord_ne, NAK_LORD_EN[nak.lord_ne] ?? nak.lord_ne)}</td>
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
  const { pick, digits: N } = useLocale();
  return (
    <RefTable caption={pick("३० तिथि — चन्द्र–सूर्यको १२° कोणीय दूरी", "30 Tithis — the 12° angular gap between Moon and Sun")}>
      <thead>
        <tr>
          <th>#</th>
          <th>{pick("तिथि", "Tithi")}</th>
          <th>English</th>
          <th>{pick("पक्ष", "Paksha")}</th>
          <th>{pick("कोण (≈)", "Angle (≈)")}</th>
        </tr>
      </thead>
      <tbody>
        {WHEEL_TITHIS.map((t, i) => {
          const degStart = i * 12;
          const degEnd = (i + 1) * 12;
          return (
            <tr key={`${t.ne}-${i}`} className={t.moon ? "learn-ref-highlight" : undefined}>
              <td className="mono">{N(i + 1)}</td>
              <td>{pick(t.ne, t.en)}</td>
              <td className="learn-ref-en">{t.en}</td>
              <td>{pick(t.paksha, t.pakshaEn ? `${t.pakshaEn} Paksha` : t.paksha)}</td>
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
  const { pick, digits: N } = useLocale();
  return (
    <RefTable caption={pick("२७ योग — सूर्य + चन्द्रको देशान्तर जोड (प्रत्येक १३°२०′)", "27 Yogas — sum of Sun + Moon longitude (each 13°20′)")}>
      <thead>
        <tr>
          <th>#</th>
          <th>{pick("योग", "Yoga")}</th>
          <th>{pick("° (≈)", "° (≈)")}</th>
        </tr>
      </thead>
      <tbody>
        {WHEEL_YOGAS.map((y, i) => (
          <tr key={y}>
            <td className="mono">{N(i + 1)}</td>
            <td>{pick(y, YOGA_EN[i] ?? y)}</td>
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
  const { pick, digits: N } = useLocale();
  const charRows = KAR_MOV.map((ne) => ({ ne, type: pick("चर (७)", "Movable (7)") }));
  const sthiraRows = KAR_FIX_NAMES.map((ne) => ({ ne, type: pick("स्थिर (४)", "Fixed (4)") }));

  return (
    <>
      <RefTable caption={pick("११ करण — तिथिको आधा (६° कोण); महिनामा ६० करण", "11 Karanas — half a tithi (6° angle); 60 karanas per month")}>
        <thead>
          <tr>
            <th>#</th>
            <th>{pick("करण", "Karana")}</th>
            <th>{pick("प्रकार", "Type")}</th>
            <th>{pick("टिप्पणी", "Note")}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="learn-ref-highlight">
            <td className="mono">{N(1)}</td>
            <td>{pick("किंस्तुघ्न", KARANA_EN["किंस्तुघ्न"] ?? "Kimstughna")}</td>
            <td>{pick("स्थिर", "Fixed")}</td>
            <td>{pick("शुक्ल प्रतिपदाको पहिलो आधा — वर्षमा एक पटक", "First half of Shukla Pratipada — once a year")}</td>
          </tr>
          {charRows.map((k, i) => (
            <tr key={k.ne}>
              <td className="mono">{N(i + 2)}</td>
              <td>{pick(k.ne, KARANA_EN[k.ne] ?? k.ne)}{k.ne === "विष्टि" ? pick(" (भद्रा)", " (Bhadra)") : ""}</td>
              <td>{k.type}</td>
              <td>{pick("महिनाभरि बारम्बार दोहोरिन्छ", "Repeats throughout the month")}</td>
            </tr>
          ))}
          {sthiraRows.slice(1).map((k, i) => (
            <tr key={k.ne}>
              <td className="mono">{N(i + 9)}</td>
              <td>{pick(k.ne, KARANA_EN[k.ne] ?? k.ne)}</td>
              <td>{k.type}</td>
              <td>{pick("महिनामा एक–एक पटक — कृष्ण चतुर्दशी, औंसी, शुक्ल प्रतिपदा, पूर्णिमा", "Once each per month — Krishna Chaturdashi, Amavasya, Shukla Pratipada, Purnima")}</td>
            </tr>
          ))}
        </tbody>
      </RefTable>
      <p className="tm-card-cap learn-ref-note">
        {pick(
          "क्रम: किंस्तुघ्न → (बव…विष्टि)×८ → शकुनि → चतुष्पद → नाग → किंस्तुघ्न — जम्मा ६० करण/महिना।",
          "Order: Kimstughna → (Bava…Vishti)×8 → Shakuni → Chatushpada → Naga → Kimstughna — 60 karanas/month in all.",
        )}
      </p>
    </>
  );
}
