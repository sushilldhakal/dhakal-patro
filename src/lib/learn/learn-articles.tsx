import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { ElongationStudy } from "@/components/tithi-mechanics/TithiMechanics";
import { HeliocentricOrbitStudy } from "@/components/learn/HeliocentricOrbitStudy";
import { SunEarthMoonStudy } from "@/components/learn/SunEarthMoonStudy";
import { EarthRotationDiagram } from "@/components/learn/EarthRotationDiagram";
import { EclipseStudy } from "@/components/learn/EclipseStudy";
import { MoonOrbitTiltStudy } from "@/components/learn/MoonOrbitTilt";
import { SolarEclipseStudy } from "@/components/learn/SolarEclipseStudy";
import { AyanamshaWheel } from "@/components/learn/AyanamshaWheel";
import { PrecessionCone } from "@/components/learn/PrecessionCone";
import { MoonPhasesStrip } from "@/components/learn/MoonPhasesStrip";
import {
  GrahaReferenceTable,
  KaranaReferenceTable,
  NakshatraReferenceTable,
  RashiReferenceTable,
  TithiReferenceTable,
  YogaReferenceTable,
} from "@/components/learn/PanchangaReferenceGuide";
import {
  SunriseTimeline,
  AdhikMassDiagram,
} from "@/components/tithi-mechanics/tithi-mechanics-diagrams";
import { HoraRing } from "@/components/panchanga/HoraRing";
import {
  resolveLocationTimezone,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { fetchPanchanga, panchangaKeys } from "@/lib/api";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";

const N = toNepaliDigits;

/* ------------------------------------------------------------------ */
/* Small presentational helpers (reuse the tm-* design system)        */
/* ------------------------------------------------------------------ */

function Lede({ children }: { children: React.ReactNode }) {
  return <p className="tm-lede">{children}</p>;
}

function Section({
  kicker,
  title,
  en,
  children,
}: {
  kicker: string;
  title: string;
  en?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tm-section">
      <div className="tm-sec-head">
        <span className="tm-sec-kicker">{kicker}</span>
        <h3 className="tm-sec-title">{title}</h3>
        {en && <span className="tm-sec-en">{en}</span>}
      </div>
      {children}
    </section>
  );
}

function Keys({ items }: { items: { h: string; p: React.ReactNode }[] }) {
  return (
    <div className="tm-keys">
      {items.map((k) => (
        <div className="tm-key" key={k.h}>
          <h4>{k.h}</h4>
          <p>{k.p}</p>
        </div>
      ))}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="tm-note">{children}</p>;
}

/* ================================================================== */
/* ARTICLES                                                            */
/* ================================================================== */

export function AstronomyBasics() {
  return (
    <>
      <Section kicker="०१" title="आकाश कसरी देखिन्छ" en="What we see from Earth">
        <Lede>
          रातको आकाशमा <span className="hl">ताराहरू</span> टाढाका सूर्यजस्तै उज्यालो
          बिन्दु हुन्। दिनमा <span className="hl-amber">सूर्य</span> सबैभन्दा चम्किलो
          देखिन्छ; रातमा <span className="hl">चन्द्रमा</span> सबैभन्दा नजिकको खगोलीय
          पिण्ड हो — यिनै तीनले नेपाली पात्रो र पञ्चाङ्गको गणनाको आधार बनाउँछन्।
        </Lede>
        <Keys
          items={[
            {
              h: "क्षितिज र zenith",
              p: "जहाँ आकाश र जमिन भेटिन्छ — क्षितिज; सिधै माथि — zenith। सबै खगोलीय वस्तु यही गोलाकार आकाशमा देखिन्छ।",
            },
            {
              h: "सूर्य पूर्व → पश्चिम",
              p: "सूर्य नभई पृथ्वी घुमिरहेको हुनाले सूर्य उदाएजस्तो लाग्छ — यो घूर्णनको परिणाम हो, परिक्रमा होइन।",
            },
            {
              h: "चन्द्रमा र ताराहरू",
              p: "चन्द्रमा सूर्यको प्रकाश परावर्तन गर्छ (आफैं बल्दैन); ताराहरू आफैं चम्किन्छन्।",
            },
          ]}
        />
      </Section>
      <Section kicker="०२" title="घूर्णन र परिक्रमा" en="Rotation vs revolution">
        <Lede>
          खगोलमा <b>दुई फरक गति</b> छन् — यिनलाई नमिलाउँदा धेरै भ्रम हुन्छ।{" "}
          <span className="hl">घूर्णन</span> = आफ्नै अक्षमा फर्किने (दिन–रात)।{" "}
          <span className="hl-amber">परिक्रमा</span> = अर्को वस्तुको वरिपरि फर्किने
          (वर्ष, महिना)।
        </Lede>
        <Keys
          items={[
            { h: "पृथ्वीको घूर्णन ≈ २४ घण्टा", p: "एक सौर दिन — सूर्य फेरि उस्तै स्थानमा देखा पर्ने समय।" },
            { h: "पृथ्वीको परिक्रमा ≈ ३६५ दिन", p: "सूर्यको वरिपरि एक फेरो — वर्ष र ऋतु यसैले बन्छ।" },
            { h: "चन्द्रको परिक्रमा ≈ २९.५ दिन", p: "पृथ्वीको वरिपरि — तिथि र पक्ष यसै गतिमा आधारित।" },
          ]}
        />
        <Note>
          पछिल्लो लेखमा यी गतिहरू चित्रसहित विस्तारमा हेर्न सकिन्छ — तर पहिले यो भिन्नता
          स्पष्ट हुनु जरूरी छ।
        </Note>
      </Section>
      <Section kicker="०३" title="कोण किन महत्त्वपूर्ण" en="Why degrees matter">
        <Lede>
          पञ्चाङ्गमा सूर्य, चन्द्र र अन्य ग्रहहरूको स्थिति <b>कोण (°)</b> मा मापिन्छ।
          पूर्ण आकाशलाई <b>{N(360)}°</b> मा बाँडेर “चन्द्र सूर्यभन्दा कति अगाडि छ” भन्ने
          प्रश्नको उत्तर दिइन्छ — तिथि, नक्षत्र र योग यही कोणबाट निकालिन्छ।
        </Lede>
        <div className="tm-formula">
          <div className="tm-fcard">
            <div className="big">
              {N(360)}
              <span className="u">°</span>
            </div>
            <div className="lbl">पूर्ण वृत्त</div>
            <div className="desc">आकाशको एक पूरा फेरो — सबै राशि र नक्षत्र यसैभित्र।</div>
          </div>
          <div className="tm-fcard">
            <div className="big">
              {N(12)}
              <span className="u">°</span>
            </div>
            <div className="lbl">१ तिथि</div>
            <div className="desc">चन्द्र–सूर्यको कोणीय दूरी — ३६०° ÷ ३० तिथि।</div>
          </div>
          <div className="tm-fcard">
            <div className="big">
              ~{N(13)}
              <span className="u">°२०′</span>
            </div>
            <div className="lbl">१ नक्षत्र</div>
            <div className="desc">३६०° ÷ २७ नक्षत्र — चन्द्रको गति यसै स्केलमा मापिन्छ।</div>
          </div>
        </div>
      </Section>
      <Section kicker="०४" title="हाम्रो दृष्टिकोण" en="Geocentric framing">
        <Lede>
          वास्तवमा पृथ्वी सूर्यको वरिपरि घुम्छ, तर पात्रो बनाउँदा हामी{" "}
          <span className="hl">पृथ्वीबाट हेर्दा</span> के देखिन्छ भन्ने दृष्टिकोण (
          <b>geocentric</b>) प्रयोग गर्छौं — “आज सूर्य कुन राशिमा छ”, “चन्द्र कति अगाडि
          सर्‍यो”। यो सुविधाजनक हो र हजारौं वर्षदेखि प्रयोग भइरहेको छ।
        </Lede>
        <Keys
          items={[
            {
              h: "सूर्यको मार्ग (ecliptic)",
              p: "सूर्य, चन्द्र र ग्रहहरू लगभग एउटै पट्टीमा देखिन्छ — यही चन्द्र–मार्ग हो।",
            },
            {
              h: "राशि चक्र",
              p: "यो मार्गलाई १२ भाग — मेषदेखि मीनसम्म; सङ्क्रान्ति = सूर्य अर्को राशिमा।",
            },
            {
              h: "heliocentric vs geocentric",
              p: "वास्तविक गति सूर्य–केन्द्रित; पात्रो गणना पृथ्वी–केन्द्रित — दुवै सही, प्रयोजन फरक।",
            },
          ]}
        />
      </Section>
      <Section kicker="०५" title="१२ राशि" en="Zodiac signs">
        <Lede>
          सूर्यको मार्ग (ecliptic) लाई <b>{N(12)} बराबर भाग</b> मा बाँडिएको छ — प्रत्येक{" "}
          <span className="hl-amber">३०°</span> को एक राशि। सङ्क्रान्ति = सूर्य अर्को राशिमा
          प्रवेश; बि.सं. को महिना पनि यही सूर्य–राशिमा आधारित।
        </Lede>
        <RashiReferenceTable />
      </Section>
      <Section kicker="०६" title="नव ग्रह" en="Nine grahas">
        <Lede>
          पञ्चाङ्ग र कुण्डलीमा <b>{N(9)} ग्रह</b> (नव ग्रह) प्रयोग हुन्छ — सात वास्तविक ग्रह
          र दुई <span className="hl">छाया बिन्दु</span> (राहु, केतु)। सबैको स्थिति कोणमा
          मापिन्छ।
        </Lede>
        <GrahaReferenceTable />
      </Section>
      <Section kicker="०७" title="२७ नक्षत्र र पाद" en="Lunar mansions & padas">
        <Lede>
          चन्द्र–मार्ग <b>{N(27)} नक्षत्र</b> मा बाँडिन्छ (प्रत्येक{" "}
          <b>{N(13)}°{N(20)}′</b>)। हरेक नक्षत्र फेरि <b>{N(4)} पाद</b> ({N(3)}°{N(20)}′
          प्रति पाद) — जन्म नामाक्षर र कुण्डलीका लागि यही पाद प्रयोग हुन्छ।
        </Lede>
        <NakshatraReferenceTable />
      </Section>
      <Section kicker="०८" title="३० तिथि" en="Lunar days">
        <Lede>
          चन्द्र र सूर्यबीचको कोण हरेक <b>{N(12)}°</b> बढ्दा नयाँ तिथि सुरु — शुक्ल पक्ष{" "}
          {N(1)}–{N(15)} (पूर्णिमासम्म), कृष्ण पक्ष {N(1)}–{N(15)} (औंसीसम्म)।
        </Lede>
        <TithiReferenceTable />
      </Section>
      <Section kicker="०९" title="२७ योग" en="Yogas">
        <Lede>
          सूर्य र चन्द्रको <b>देशान्तर जोड</b> बढ्दै गए बढ्दै {N(27)} योग बन्दै जान्छ —
          विष्कम्भदेखि वैधृतिसम्म। शुभ–अशुभ मुहूर्तमा योग पनि हेरिन्छ।
        </Lede>
        <YogaReferenceTable />
      </Section>
      <Section kicker="१०" title="११ करण" en="Karanas">
        <Lede>
          प्रत्येक तिथिको <b>आधा</b> (= {N(6)}° कोण) एक करण — महिनामा जम्मा{" "}
          <span className="hl-amber">{N(60)} करण</span>। नाम {N(11)} मात्र: {N(7)} चर
          (बारम्बार) र {N(4)} स्थिर (महिनामा एक पटक)।
        </Lede>
        <KaranaReferenceTable />
      </Section>
      <Section kicker="११" title="अर्को कदम" en="What comes next">
        <Lede>
          अब तपाईंले जान्नुपर्ने मूल कुरा — <b>के हेर्दैछौं</b>, <b>कसरी घुमिरहेको छ</b>, र{" "}
          <b>किन कोण गनिन्छ</b> — स्पष्ट भयो। अर्को लेखमा सौर्यमण्डल, पृथ्वीको झुकाव, चन्द्र
          कला र वास्तविक परिक्रमा चित्रसहित हेर्नुहोस्।
        </Lede>
        <Keys
          items={[
            { h: "सौर्यमण्डल र चन्द्र गति", p: "पृथ्वीको अण्डाकार कक्ष, २३.५° झुकाव, चन्द्रका कला।" },
            { h: "सौर vs चान्द्र पात्रो", p: "विक्रम सम्वत् किन दुई घडी मिलाएर चल्छ।" },
            { h: "पञ्चाङ्गका पाँच अङ्ग", p: "तिथि, वार, नक्षत्र, योग, करण — कोणबाट कसरी जन्मिन्छन्।" },
          ]}
        />
      </Section>
      <Note>
        यी आधार बुझिसकेपछि बाँकी लेखहरू सजिलो लाग्नेछ — प्रत्येकले माथिको एउटै भाषा (
        कोण, परिक्रमा, पृथ्वी–केन्द्रित दृष्टि) प्रयोग गर्छ।
      </Note>
    </>
  );
}

export function SolarSystem() {
  return (
    <>
      <Section kicker="०१" title="सूर्य केन्द्र, पृथ्वी परिक्रमा" en="Heliocentric view">
        <Lede>
          हाम्रो सौर्यमण्डलमा पृथ्वी सूर्यको वरिपरि झन्डै <b>३६५.२५ दिन</b> मा एक फेरो लगाउँछ —
          यही परिक्रमाले <span className="hl">वर्ष</span> बन्छ। पृथ्वी आफैँ पनि २३.५° ढल्केर
          घुम्ने हुनाले ऋतु फेरिन्छन्।
        </Lede>
        <HeliocentricOrbitStudy />
      </Section>
      <Section kicker="०२" title="चन्द्रको गति" en="Lunar motion">
        <Lede>
          चन्द्रमा पृथ्वीको वरिपरि झन्डै <b>{N(27.3)} दिन</b> (नाक्षत्र मास) मा एक फेरो लगाउँछ,
          तर सूर्यसमेत सर्ने हुनाले एक <b>अमावस्यादेखि अर्को अमावस्या</b> सम्म ~{N(29.5)} दिन
          लाग्छ (चान्द्र मास)। यिनै दुई गतिको खेलले पञ्चाङ्गका तिथि, नक्षत्र र पक्ष निर्धारण
          गर्छन्।
        </Lede>
        <ElongationStudy />
        <Keys
          items={[
            { h: "नाक्षत्र मास ~२७.३ दिन", p: "चन्द्र आकाशमा एकै तारापुञ्जमा फर्किन लाग्ने समय।" },
            { h: "चान्द्र मास ~२९.५ दिन", p: "एक अमावस्यादेखि अर्को अमावस्यासम्म — तिथि गणनाको आधार।" },
            { h: "सौर वर्ष ~३६५.२५ दिन", p: "पृथ्वीको एक पूर्ण परिक्रमा — ऋतु र साल यसैले बन्छ।" },
          ]}
        />
      </Section>
      <Section kicker="०३" title="पृथ्वीको घूर्णन" en="Earth's Rotation">
        <Lede>
          पृथ्वी आफ्नै अक्षमा <b>पश्चिमबाट पूर्वतर्फ</b> घुम्छ। एक पूरा घूर्णन पूरा गर्न करिब{" "}
          <b>{N(24)} घण्टा</b> लाग्छ। यही घूर्णनका कारण दिन र रात हुन्छन्।
        </Lede>
        <div className="tm-card pad-lg">
          <EarthRotationDiagram />
        </div>
        <Keys
          items={[
            { h: `१ घूर्णन ≈ ${N(24)} घण्टा`, p: "सौर दिन — सूर्य फेरि उस्तै स्थानमा देखा पर्ने समय।" },
            {
              h: "सूर्य पूर्वबाट उदाएजस्तो देखिनु",
              p: "पृथ्वीको घूर्णनका कारण हो — सूर्य नभई पृथ्वी नै घुमिरहेको हुन्छ।",
            },
            {
              h: "सूर्योदय र सूर्यास्तको समय",
              p: "स्थानअनुसार फरक हुन्छ — देशान्तर र समय क्षेत्रले निर्धारण गर्छ।",
            },
          ]}
        />
      </Section>
      <Section kicker="०४" title="पृथ्वीको अक्षीय झुकाव" en="Axial Tilt">
        <Lede>
          पृथ्वीको अक्ष लगभग <b>{N(23.5)}°</b> झुकेको छ। यही झुकावका कारण विभिन्न ऋतुहरू
          उत्पन्न हुन्छन् — नेपालमा छ ऋतु:
        </Lede>
        <Keys
          items={[
            { h: "वसन्त", p: "तापमान बढ्दै, दिन लामो हुँदै।" },
            { h: "ग्रीष्म", p: "सबैभन्दा लामो दिन, उच्च ताप।" },
            { h: "वर्षा", p: "मनसुन — नेपालमा प्रमुख वर्षाकाल।" },
            { h: "शरद", p: "ताप घट्दै, शुष्क र सफा आकाश।" },
            { h: "हेमन्त", p: "जाडो सुरु, रात लामो हुँदै।" },
            { h: "शिशिर", p: "सबैभन्दा चिसो, छोटो दिन।" },
          ]}
        />
        <Note>
          यदि पृथ्वीको अक्ष नझुकेको भए ऋतुहरूको परिवर्तन धेरै कम हुने थियो।
        </Note>
      </Section>
      <Section kicker="०५" title="चन्द्रका कला" en="Phases of the Moon">
        <Lede>
          चन्द्रमा आफैं प्रकाश दिने वस्तु होइन। <span className="hl">सूर्यको प्रकाश</span>{" "}
          परावर्तित गरेर चम्किन्छ। <b>अमावस्या</b> मा चन्द्र देखिँदैन; <b>पूर्णिमा</b> मा
          पूरै चम्किन्छ — यिनै कलाहरूले पक्ष र तिथिको अनुभव गराउँछन्।
        </Lede>
        <div className="tm-card pad-lg">
          <p className="ss-phases-heading">मुख्य चरणहरू</p>
          <MoonPhasesStrip />
        </div>
      </Section>
      <Note>
        खगोलीय गतिको यही नियमितताले नै नेपाली पात्रोदेखि पञ्चाङ्गसम्मका सबै गणनाको जग बसाल्छ।
      </Note>
    </>
  );
}

export function BsCalendar() {
  return (
    <>
      <Section kicker="०१" title="दुई फरक घडी" en="Two different clocks">
        <Lede>
          <span className="hl-amber">सौर पात्रो</span> सूर्यको स्थितिमा आधारित हुन्छ — ऋतुसँग
          मिल्छ। <span className="hl">चान्द्र पात्रो</span> चन्द्रको कलामा आधारित हुन्छ — तिथि र
          पर्वसँग मिल्छ। नेपाली बिक्रम सम्वत् वास्तवमा <b>चान्द्र–सौर (luni-solar)</b> पात्रो हो,
          जसले दुवैलाई मिलाएर चलाउँछ।
        </Lede>
      </Section>
      <Section kicker="०२" title="किन फरक पर्छ" en="The 11-day gap">
        <Lede>
          १२ चान्द्र मास = ~{N(354)} दिन, तर सौर वर्ष = ~{N(365)} दिन। हरेक वर्ष करिब{" "}
          <b>{N(11)} दिनको</b> फरक जम्मा हुन्छ। यही फरक नमिलाए चाडपर्व ऋतुबाट सर्दै जान्थे —
          त्यसैले बीच–बीचमा <span className="hl-amber">अधिक मास</span> थपिन्छ।
        </Lede>
        <Keys
          items={[
            { h: "सौर (Solar)", p: "सूर्य → ऋतु, संक्रान्ति, गते। ग्रेगोरियन पात्रो शुद्ध सौर हो।" },
            { h: "चान्द्र (Lunar)", p: "चन्द्र → तिथि, पक्ष, पूर्णिमा/औंसी। इस्लामी पात्रो शुद्ध चान्द्र हो।" },
            { h: "चान्द्र–सौर (Luni-solar)", p: "दुवैको मेल — बि.सं. र हिन्दू पात्रो। अधिक मासले सन्तुलन राख्छ।" },
          ]}
        />
      </Section>
      <Section kicker="०३" title="सूर्य · पृथ्वी · चन्द्र एकसाथ" en="Both cycles, side by side">
        <Lede>
          तल पृथ्वी सूर्यको वरिपरि (वर्ष, <b>{N(12)} सौर महिनामा</b> बाँडिएको) र चन्द्रमा पृथ्वीको
          वरिपरि (हरेक फेरो एक <b>चान्द्र महिना</b>) — दुवै <span className="hl">एकैसाथ</span>{" "}
          परिक्रमा गर्छन्; दुवै आफ्नै अक्षमा पनि घुम्छन् (पृथ्वी दैनिक, चन्द्र एक फेरोमा एक पटक —
          त्यसैले चन्द्रको सधैँ उस्तै पट्टि देखिन्छ)। प्ले थिचेर वा तानेर हेर्नुहोस् — पृथ्वीले
          वर्ष पूरा गर्दा चन्द्रले झन्डै {N(12)} फेरो लगाइसकेको हुन्छ, तर ठ्याक्कै होइन।
        </Lede>
        <SunEarthMoonStudy />
      </Section>
      <Section kicker="०४" title="विक्रम सम्वत् के हो" en="Bikram Sambat">
        <Lede>
          विक्रम सम्वत् (बि.सं.) नेपालको आधिकारिक पात्रो हो, जुन ग्रेगोरियन भन्दा झन्डै{" "}
          <b>{N(56)}–{N(57)} वर्ष</b> अगाडि चल्छ। यो <span className="hl">चान्द्र–सौर</span>{" "}
          पात्रो हो — महिनाको नाम चान्द्र मासबाट आउँछ भने महिनाको लम्बाइ सूर्यको राशि–गतिले तय
          गर्छ।
        </Lede>
      </Section>
      <Section kicker="०५" title="महिना कसरी बन्छ" en="Solar months">
        <Lede>
          सूर्य एक राशिबाट अर्को राशिमा प्रवेश गर्ने क्षणलाई <span className="hl-amber">
          सङ्क्रान्ति</span> भनिन्छ, र त्यही दिन नयाँ महिना सुरु हुन्छ। सूर्य कुनै राशिमा{" "}
          {N(29)} देखि {N(32)} दिनसम्म बस्ने हुनाले बि.सं. का महिना <b>{N(29)}–{N(32)} दिनका</b>{" "}
          हुन्छन् — हरेक वर्ष फरक पर्न सक्छन्।
        </Lede>
        <Keys
          items={[
            { h: "गते = सौर दिन", p: "सङ्क्रान्तिदेखि गनिने दिन — बैशाख १ गते सूर्य मेषमा पस्दा।" },
            { h: "महिना अस्थिर लम्बाइ", p: "पृथ्वीको कक्ष अण्डाकार भएकाले सूर्यको गति घटबढ हुन्छ।" },
            { h: "नयाँ वर्ष बैशाखमा", p: "मेष सङ्क्रान्ति — सामान्यतया अप्रिल मध्यतिर पर्छ।" },
          ]}
        />
      </Section>
      <Note>
        यसैकारण आउँदो वर्षको पात्रो पहिल्यै ठ्याक्क भन्न खगोलीय गणना (पञ्चाङ्ग) चाहिन्छ —
        महिनाको दिन–सङ्ख्या सूर्यको वास्तविक स्थितिले तय गर्छ।
      </Note>
    </>
  );
}

export function CalendarDifferences() {
  return (
    <>
      <Section kicker="०१" title="तीन पात्रो, तीन आधार" en="Three systems">
        <Lede>
          <b>ग्रेगोरियन (ई.सं.)</b> शुद्ध सौर पात्रो हो — महिनाको दिन निश्चित।{" "}
          <b>नेपाली (बि.सं.)</b> चान्द्र–सौर हो — महिना सूर्यको राशिले तय हुन्छ।{" "}
          <b>भारतीय</b> मा दुई धारा छन्: नागरिक शक सम्वत् (सौर) र पञ्चाङ्ग आधारित विक्रम/शालिवाहन
          (चान्द्र–सौर)।
        </Lede>
      </Section>
      <Section kicker="०२" title="मुख्य भिन्नता" en="Key differences">
        <Keys
          items={[
            { h: "वर्ष गणना", p: "बि.सं. ≈ ई.सं. + ५६/५७; शक सम्वत् ≈ ई.सं. − ७८।" },
            { h: "वर्षारम्भ", p: "ग्रेगोरियन: जनवरी १; बि.सं.: बैशाख (मेष सङ्क्रान्ति); भारतीय चान्द्र: चैत्र शुक्ल प्रतिपदा।" },
            { h: "महिनाको दिन", p: "ग्रेगोरियन: २८–३१ निश्चित; बि.सं.: २९–३२ सूर्य–गति अनुसार।" },
            { h: "अधिक मास", p: "ग्रेगोरियनमा छैन; बि.सं./भारतीय चान्द्र–सौरमा ~३ वर्षमा थपिन्छ।" },
          ]}
        />
      </Section>
      <Note>
        यही कारण मितिको रूपान्तरण साधारण जोडघटाउले मिल्दैन — पञ्चाङ्ग गणना नै सही उत्तर हो।
      </Note>
    </>
  );
}

export function WhatIsPanchang() {
  return (
    <>
      <Section kicker="०१" title="पञ्चाङ्ग = पाँच अङ्ग" en="The five limbs">
        <Lede>
          “पञ्चाङ्ग” शब्द <b>पञ्च (पाँच) + अङ्ग</b> बाट बनेको हो। हरेक दिनको खगोलीय अवस्था
          वर्णन गर्न पाँच तत्त्व प्रयोग हुन्छन् — यिनै पाँचले शुभ–अशुभ मुहूर्त, पर्व र दैनिक
          गणना निर्धारण गर्छन्।
        </Lede>
        <Keys
          items={[
            { h: "१. तिथि", p: "चन्द्र–सूर्यको १२° कोणीय दूरीले बन्ने चान्द्र दिन।" },
            { h: "२. वार", p: "हप्ताको सात दिन — सूर्य, सोम, मङ्गल…।" },
            { h: "३. नक्षत्र", p: "चन्द्र रहेको २७ तारापुञ्जमध्ये एक।" },
            { h: "४. योग", p: "सूर्य र चन्द्रको देशान्तर जोडबाट बन्ने २७ योग।" },
            { h: "५. करण", p: "तिथिको आधा भाग — एक तिथिमा दुई करण।" },
          ]}
        />
      </Section>
      <Note>
        यस ज्ञानकेन्द्रका छुट्टाछुट्टै लेखमा यी पाँचै अङ्ग कसरी गणना हुन्छन् भनेर विस्तारमा
        बुझाइएको छ।
      </Note>
    </>
  );
}

export function TithiArticle() {
  return (
    <>
      <Section kicker="०१" title="तिथि = १२° कोणीय दूरी" en="12° of elongation">
        <Lede>
          पृथ्वीबाट हेर्दा चन्द्रमा सूर्यभन्दा जति <span className="hl">कोणले अगाडि</span> पुग्छ,
          त्यही कोणले तिथि निर्धारण गर्छ। <b>०°</b> मा अमावस्या, <b>१८०°</b> मा पूर्णिमा।
          यो चित्रमा पृथ्वी पनि सूर्यको वरिपरि <span className="hl-amber">~{N(29)}°</span> सर्छ
          (एक चान्द्र मास) — त्यसैले चन्द्रले नक्षत्रमा फर्कन ~{N(27)} दिन, अर्को अमावस्यासम्म
          ~{N(29.5)} दिन। तल तानेर वा चलाउनुहोस्।
        </Lede>
        <ElongationStudy />
        <div className="tm-formula">
          <div className="tm-fcard">
            <div className="big">
              {N(12)}
              <span className="u">°</span>
            </div>
            <div className="lbl">= १ तिथि</div>
            <div className="desc">३६०° ÷ ३० तिथि। हरेक १२° कोण पार गर्दा नयाँ तिथि सुरु हुन्छ।</div>
          </div>
          <div className="tm-fcard">
            <div className="big">
              ~{N(12)}
              <span className="u">°/दिन</span>
            </div>
            <div className="lbl">चन्द्रको औसत गति</div>
            <div className="desc">वास्तवमा १०.७°–१४.३° सम्म घटबढ हुन्छ — चन्द्र कक्षको आकारका कारण।</div>
          </div>
          <div className="tm-fcard">
            <div className="big">सूर्योदय</div>
            <div className="lbl">तिथि कहिले गनिन्छ?</div>
            <div className="desc">
              जुन तिथि सूर्योदयमा चलिरहेको हुन्छ, त्यही दिनको तिथि मानिन्छ — यही नियमले वृद्धि
              र क्षय जन्माउँछ।
            </div>
          </div>
        </div>
      </Section>
      <Note>
        चन्द्रको गति स्थिर नभएकाले तिथिको लम्बाइ पनि स्थिर हुँदैन — कहिले एउटै तिथि दुई दिन
        (वृद्धि), कहिले बीचमै हराउँछ (क्षय)। ती छुट्टै लेखमा हेर्नुहोस्।
      </Note>
    </>
  );
}

export function TithiVriddhi() {
  return (
    <>
      <Section kicker="०१" title="एउटै तिथि दुई दिन" en="Repeated tithi">
        <Lede>
          जब चन्द्र <span className="hl">मन्द गतिमा</span> (~१०.७°/दिन) हिँड्छ, एउटै १२° को
          तिथि–खण्डले <b>लगातार दुई सूर्योदय</b> समेट्छ। दुवै बिहान त्यही तिथि चलिरहेकाले
          पात्रोमा त्यो तिथि <span className="hl-amber">दुई दिन</span> देखिन्छ।
        </Lede>
        <div className="tm-card pad-lg">
          <SunriseTimeline mode="vriddhi" />
          <div className="tm-card-cap">
            तृतीया खण्ड यति फराकिलो छ कि १० र ११ गते — दुवै सूर्योदय यसैभित्र परे। त्यसैले
            तृतीया दोहोरियो।
          </div>
        </div>
      </Section>
    </>
  );
}

export function TithiKshaya() {
  return (
    <>
      <Section kicker="०१" title="हराएको तिथि" en="Skipped tithi">
        <Lede>
          उल्टो, जब चन्द्र <span className="hl">द्रुत गतिमा</span> (~१४.३°/दिन) हिँड्छ, कुनै १२°
          को तिथि–खण्ड <b>दुई सूर्योदयको बीचमै</b> पूरै सकिन्छ। कुनै पनि सूर्योदयमा त्यो तिथि
          नभेटिएकाले त्यो <span className="hl-amber">क्षय</span> भई पात्रोबाट हराउँछ।
        </Lede>
        <div className="tm-card pad-lg">
          <SunriseTimeline mode="kshaya" />
          <div className="tm-card-cap">
            अष्टमी खण्ड साँघुरो भएर एक सूर्योदयदेखि अर्कोको बीचमै सकियो — कुनै बिहान अष्टमी परेन,
            त्यसैले त्यो क्षय भयो।
          </div>
        </div>
      </Section>
    </>
  );
}

export function AdhikMaas() {
  return (
    <>
      <Section kicker="०१" title="थपिने महिना" en="Extra month">
        <Lede>
          एक <b>चान्द्र मास</b> ~{N(29.5)} दिनको हुन्छ; एक <b>सौर मास</b> ~{N(30.4)} दिनको।
          चान्द्र मास छोटो भएकाले बेलाबेला एउटा चान्द्र मासभित्र{" "}
          <span className="hl">कुनै सङ्क्रान्ति पर्दैन</span> — त्यही महिना{" "}
          <span className="hl-amber">अधिक मास</span> कहलिन्छ र अघिल्लो महिनाको नाम दोहोरिन्छ।
        </Lede>
        <div className="tm-card pad-lg">
          <AdhikMassDiagram />
          <div className="tm-card-cap">
            मेष सौर मासभित्रै दुई अमावस्या परे — बीचको चान्द्र मासमा सङ्क्रान्ति नपरेकाले त्यो
            “अधिक वैशाख” बन्यो; त्यसपछिको नियमित महिना “निज वैशाख”।
          </div>
        </div>
        <Keys
          items={[
            { h: "~३२.५ महिनामा एकपटक", p: "जोडिँदै गएको फरकले झन्डै हरेक तीन वर्षमा एक अधिक मास बनाउँछ।" },
            { h: "अधिक र निज", p: "सङ्क्रान्ति बिनाको महिना “अधिक”, त्यसपछिको “निज” (साँचो)।" },
            { h: "क्षय मास", p: "विरलै एउटै चान्द्र मासमा दुई सङ्क्रान्ति परे त्यो महिना क्षय हुन्छ।" },
          ]}
        />
      </Section>
    </>
  );
}

export function Nakshatra() {
  return (
    <>
      <Section kicker="०१" title="२७ तारापुञ्ज" en="27 lunar mansions">
        <Lede>
          आकाशको चान्द्र–मार्गलाई <b>{N(27)} बराबर भाग</b> मा बाँडिएको छ, प्रत्येक{" "}
          <b>{N(360 / 27)}° ≈ १३°२०′</b> को। चन्द्रमा जुन भागमा हुन्छ, त्यही{" "}
          <span className="hl-amber">नक्षत्र</span> कहलिन्छ — अश्विनीदेखि रेवतीसम्म।
        </Lede>
      </Section>
      <Section kicker="०२" title="पाद र गणना" en="Padas">
        <Lede>
          हरेक नक्षत्र फेरि <b>चार पाद</b> मा बाँडिन्छ (३°२०′ प्रत्येक)। जन्म नक्षत्र र पादले
          कुण्डलीमा राशि र नामाक्षर तय गर्छ। नक्षत्र <span className="hl">अयनांश</span> मा भर
          पर्ने हुनाले सायन र निरयन गणनामा फरक आउँछ।
        </Lede>
        <Keys
          items={[
            { h: "१३°२०′ प्रति नक्षत्र", p: "३६०° ÷ २७ — चन्द्र दिनमा ~१ नक्षत्र पार गर्छ।" },
            { h: "४ पाद", p: "प्रत्येक नक्षत्रको चौथाइ — नवांश र नामाक्षरको आधार।" },
            { h: "अधिपति ग्रह", p: "हरेक नक्षत्रको एक स्वामी ग्रह — विंशोत्तरी दशाको जग।" },
          ]}
        />
      </Section>
    </>
  );
}

export function Yoga() {
  return (
    <>
      <Section kicker="०१" title="सूर्य + चन्द्रको जोड" en="Sun + Moon longitude">
        <Lede>
          योग पञ्चाङ्गको चौथो अङ्ग हो। यो सूर्य र चन्द्रको <b>देशान्तर जोडेर</b> निकालिन्छ —
          जोड हरेक <b>{N(360 / 27)}°</b> बढ्दा नयाँ योग सुरु हुन्छ। जम्मा{" "}
          <span className="hl-amber">{N(27)} योग</span> छन् — विष्कम्भदेखि वैधृतिसम्म।
        </Lede>
      </Section>
      <Section kicker="०२" title="किन महत्त्व" en="Why it matters">
        <Lede>
          केही योग शुभ मानिन्छन् भने केही (जस्तै व्यतीपात, वैधृति) त्याज्य। मुहूर्त निकाल्दा
          तिथि–वार–नक्षत्रसँगै योग पनि हेरिन्छ।
        </Lede>
      </Section>
    </>
  );
}

export function Karana() {
  return (
    <>
      <Section kicker="०१" title="तिथिको आधा भाग" en="Half a tithi">
        <Lede>
          करण भनेको <b>आधा तिथि</b> हो — चन्द्र–सूर्यको <b>६° कोणीय दूरी</b>। एक तिथिमा दुई
          करण पर्ने हुनाले महिनाभरि <span className="hl-amber">{N(60)} करण</span> हुन्छन्, तर
          नाम जम्मा <b>{N(11)}</b> — सात चर (बारम्बार दोहोरिने) र चार स्थिर।
        </Lede>
        <Keys
          items={[
            { h: "७ चर करण", p: "बव, बालव, कौलव… महिनाभरि घुमिफिरी आउँछन्।" },
            { h: "४ स्थिर करण", p: "शकुनि, चतुष्पाद, नाग, किंस्तुघ्न — महिनामा एक–एक पटक मात्र।" },
            { h: "मुहूर्तमा प्रयोग", p: "विष्टि (भद्रा) करण अशुभ मानिन्छ — शुभ कार्य टारिन्छ।" },
          ]}
        />
      </Section>
    </>
  );
}

export function Sankranti() {
  return (
    <>
      <Section kicker="०१" title="राशि परिवर्तनको क्षण" en="Sun enters a sign">
        <Lede>
          सूर्य एक राशिबाट अर्को राशिमा प्रवेश गर्ने ठ्याक्क क्षणलाई{" "}
          <span className="hl-amber">सङ्क्रान्ति</span> भनिन्छ। वर्षमा{" "}
          <b>{N(12)} सङ्क्रान्ति</b> हुन्छन्, र प्रत्येकले बि.सं. को नयाँ{" "}
          <span className="hl">महिनाको पहिलो गते</span> चिन्ह लगाउँछ।
        </Lede>
      </Section>
      <Section kicker="०२" title="प्रमुख सङ्क्रान्ति" en="Notable ones">
        <Keys
          items={[
            { h: "मेष सङ्क्रान्ति", p: "बैशाख १ — नेपाली नयाँ वर्ष।" },
            { h: "मकर सङ्क्रान्ति", p: "माघे सङ्क्रान्ति — सूर्य उत्तरायण हुने पर्व।" },
            { h: "महिनाको आधार", p: "हरेक सङ्क्रान्ति = नयाँ सौर महिनाको सुरुवात।" },
          ]}
        />
      </Section>
      <Note>
        अधिक मास पनि सङ्क्रान्तिमै निर्भर छ — जुन चान्द्र मासमा सङ्क्रान्ति पर्दैन, त्यो अधिक
        हुन्छ।
      </Note>
    </>
  );
}

export function Eclipses() {
  return (
    <>
      <Section kicker="०१" title="चन्द्रग्रहण — पृथ्वीको छायाँमा चन्द्र" en="Lunar eclipse: Earth's shadow">
        <Lede>
          चन्द्रग्रहण सधैँ <b>पूर्णिमा</b> मा हुन्छ — जब सूर्य, पृथ्वी र चन्द्रमा एकै रेखामा
          आउँछन् र पृथ्वीको <span className="hl">छायाँ</span> चन्द्रमाथि पर्छ। चन्द्र रातो
          देखिन सक्छ (“ब्लड मुन”), किनकि पृथ्वीको वायुमण्डलले रातो प्रकाश मोडेर पठाउँछ।
        </Lede>
      </Section>
      <Section kicker="०२" title="सूर्य–पृथ्वी–चन्द्र र राहु–केतु" en="Shadow geometry & the nodes">
        <Lede>
          सूर्यको उज्यालोले पृथ्वीपछाडि <span className="hl">प्रच्छायाँ (umbra)</span> र{" "}
          <span className="hl">उपछायाँ (penumbra)</span> को शंकु बनाउँछ। तल{" "}
          <b>▶ चलाउनुहोस्</b> — पृथ्वी क्रान्तिवृत्तमा घुम्छ, चन्द्र छिटो चर्किन्छ;{" "}
          <b>☊ पात-चक्र</b> बटनले मात्र राहु–केतु ढिलो घुमाउँछ। ग्रहण त्यतिबेला मात्र हुन्छ जब
          पूर्णिमा/अमावस्या <b>पात रेखा</b> नजिक पर्छ — वर्षमा झन्डै दुई पटक मात्र।
        </Lede>
        <EclipseStudy />
      </Section>
      <Section kicker="०३" title="चन्द्र कक्षको ५° झुकाव र ग्रहण रेखा" en="The tilted orbit, the eclipse line & 18.6-year nodal cycle">
        <Lede>
          तलको <b>त्रिआयामिक</b> चित्रमा <span className="hl">क्रान्तिवृत्त तल</span> (सूर्यपथको समतल)
          र त्यसमाथि <span className="hl-amber">~५° झुकेको</span> चन्द्र-कक्ष देखिन्छ। पृथ्वीको बीचबाट
          <span className="hl-amber"> सूर्य–पृथ्वी रेखा</span> गएको छ। <b>▶ चलाउनुहोस्</b> — सूर्यसँगै यो
          रेखा घुम्छ; जब यो <b>राहु वा केतु</b> मा पुग्छ र त्यहीँ चन्द्र (पूर्णिमा/अमावस्या) पर्छ तब
          मात्र ग्रहण हुन्छ। तल्लो स्लाइडरले पात रेखालाई <b>~१८.६ वर्षे</b> चक्रमा घुमाउँछ।
        </Lede>
        <MoonOrbitTiltStudy />
      </Section>
      <Section kicker="०४" title="चन्द्रग्रहण — प्रकार र सुरक्षा" en="Lunar types & safety">
        <Lede>
          चन्द्रको कक्ष पृथ्वीको कक्षभन्दा <b>~५° ढल्केको</b> छ, त्यसैले धेरैजसो पूर्णिमामा
          चन्द्र छायाँभन्दा माथि वा तल हुन्छ। ग्रहण त्यतिबेला मात्र हुन्छ जब पूर्णिमा{" "}
          <span className="hl-amber">राहु–केतु (पात बिन्दु)</span> नजिक पर्छ।
        </Lede>
        <Keys
          items={[
            { h: "पूर्ण ग्रहण", p: "चन्द्र पूरै पृथ्वीको गाढा छायाँ (umbra) भित्र।" },
            { h: "खण्डग्रास", p: "चन्द्रको केही भाग मात्र छायाँमा।" },
            { h: "उपछायाँ ग्रहण", p: "चन्द्र penumbra मा मात्र — हल्का मलिन देखिन्छ।" },
            { h: "खुला आँखाले सुरक्षित", p: "सूर्यग्रहणभन्दा फरक — चन्द्रग्रहण सीधै हेर्न सकिन्छ।" },
          ]}
        />
      </Section>
      <Section kicker="०५" title="सूर्यग्रहण — चन्द्रको छायाँमा पृथ्वी" en="Solar eclipse: Moon's shadow">
        <Lede>
          सूर्यग्रहण सधैँ <b>अमावस्या</b> मा हुन्छ — जब चन्द्रमा सूर्य र पृथ्वीको ठ्याक्क
          बीचमा आएर सूर्यलाई <span className="hl">ढाक्छ</span>। चन्द्रको छायाँ पृथ्वीको
          सानो भागमा मात्र पर्ने हुनाले ग्रहण सीमित क्षेत्रबाट मात्र देखिन्छ।
        </Lede>
      </Section>
      <Section kicker="०६" title="चन्द्रको छायाँ–शंकु र पृथ्वीमा मार्ग" en="Shadow cones: umbra, antumbra & penumbra">
        <Lede>
          तलको चित्रमा सूर्यको उज्यालोले चन्द्रपछाडि <span className="hl">प्रच्छायाँ (umbra)</span> को
          सानो गाढा शंकु र फराकिलो <span className="hl">उपछायाँ (penumbra)</span> बनाउँछ। <b>▶ चलाउनुहोस्</b>{" "}
          — चन्द्रको छायाँ पृथ्वीमाथि सर्छ, त्यही नै <span className="hl-amber">पूर्णताको मार्ग</span> हो।
          तल्लो स्लाइडरले चन्द्र दूरी (perigee ↔ apogee) बदल्छ — हेर्नुहोस् कसरी प्रच्छायाँ पुग्दा{" "}
          <b>पूर्ण</b> र अपुग हुँदा <b>वलयाकार</b> ग्रहण हुन्छ।
        </Lede>
        <SolarEclipseStudy />
      </Section>
      <Section kicker="०७" title="सूर्यग्रहण — प्रकार र सावधानी" en="Solar types & safety">
        <Keys
          items={[
            { h: "पूर्ण (Total)", p: "चन्द्र नजिक हुँदा प्रच्छायाँले पृथ्वी छुन्छ — सूर्य पूरै ढाकिन्छ, दिनमै अँध्यारो र सूर्यमुकुट (corona) देखिन्छ।" },
            { h: "वलयाकार (Annular)", p: "चन्द्र टाढा हुँदा प्रच्छायाँ अपुग — वलयच्छायाँ (antumbra) पुग्छ र सूर्यको किनारा “आगोको औँठी” झैँ देखिन्छ।" },
            { h: "खण्डग्रास (Partial)", p: "उपछायाँभित्र पर्ने ठूलो क्षेत्रबाट सूर्यको केही भाग मात्र ढाकिएको देखिन्छ।" },
            { h: "⚠ कहिल्यै नाङ्गो आँखाले नहेर्नुहोस्", p: "ग्रहण चश्मा वा प्रोजेक्सन मात्र — आँखा स्थायी बिग्रन सक्छ।" },
          ]}
        />
      </Section>
      <Note>
        राहु–केतु आकाशका भौतिक पिण्ड होइनन् — चन्द्रको कक्ष र सूर्यपथ (क्रान्तिवृत्त) काट्ने
        दुई गणितीय बिन्दु हुन्। यी पात बिस्तारै घुम्छन् (~१८.६ वर्षमा एक फेरो), त्यसैले ग्रहण
        ऋतु पनि सर्दै जान्छ। अमावस्या/पूर्णिमा पनि राहु–केतु नजिक परेमा मात्र ग्रहण हुन्छ — त्यसैले
        हरेक महिना हुँदैन। सूर्यग्रहणमा चन्द्रको छायाँ सानो हुनाले पृथ्वीको सीमित पट्टीबाट मात्र
        देखिन्छ।
      </Note>
    </>
  );
}

/** @deprecated merged into {@link Eclipses} */
export const LunarEclipse = Eclipses;
/** @deprecated merged into {@link Eclipses} */
export const SolarEclipse = Eclipses;

export function Ayanamsha() {
  return (
    <>
      <Section kicker="०१" title="सायन र निरयन — एउटै आकाश, दुई शून्य" en="Tropical vs sidereal zero">
        <Lede>
          राशिचक्रको <b>शून्य अंश</b> कहाँबाट सुरु गर्ने? दुई जवाफ छन्।{" "}
          <span className="hl-amber">सायन (tropical)</span> ले <b>वसन्त-विषुव</b> — जुन दिन सूर्य
          भूमध्यरेखा काटेर उत्तर लाग्छ — लाई शून्य मान्छ, त्यसैले यो <b>ऋतु</b> मा अडिन्छ।{" "}
          <span className="hl">निरयन (sidereal)</span> ले साँचो <b>तारापुञ्ज</b> (मेष राशिको
          आरम्भ) लाई शून्य मान्छ। यी दुई शून्यबीचको कोणीय फरक नै <b>अयनांश</b> हो।
        </Lede>
      </Section>

      <Section kicker="०२" title="अयनांश चक्र" en="Interactive: the precessing equinox">
        <Lede>
          तलको चक्रमा बाहिरी <b>१२ राशि तारापुञ्जमा अडिएका</b> छन् (निरयन)। <b>▶ चलाउनुहोस्</b> —
          वर्ष अघि बढ्दा पृथ्वीको अक्ष-चलनले <span className="hl-amber">सायन शून्य (☉ विषुव)</span>{" "}
          लाई ताराका सापेक्ष पछाडि सार्छ; बढ्दै जाने <span className="hl-amber">अम्बर खाँडो</span> नै
          अयनांश हो। तल्लो स्लाइडरले एउटै <span className="hl">ग्रह</span> लाई सार्छ — हेर्नुहोस्
          कसरी त्यही आकाश-स्थान निरयन र सायनमा फरक राशिमा पढिन्छ।
        </Lede>
        <AyanamshaWheel />
      </Section>

      <Section kicker="०३" title="किन सर्छ — अयन चलन" en="Precession of the equinoxes">
        <Lede>
          पृथ्वी ठ्याक्क सिधा घुम्दैन — लठ्ठा (lattu) झैँ यसको अक्ष ठूलो वृत्तमा बिस्तारै{" "}
          <span className="hl">डुल्छ</span>। एक फेरो पूरा गर्न झन्डै{" "}
          <b>{N(25800)} वर्ष</b> लाग्छ, अर्थात् विषुव बिन्दु प्रति वर्ष करिब{" "}
          <b>५०.३″</b> (हरेक <b>~{N(72)} वर्ष</b> मा १°) पछाडि सर्छ। त्यसैले अयनांश पनि वर्षेनि
          बढ्छ — आज लाहिरीमा झन्डै <b>{N(24)}°</b>।
        </Lede>
        <PrecessionCone />
      </Section>

      <Section kicker="०४" title="तीन प्रमुख प्रणाली" en="Lahiri · Raman · KP">
        <Lede>
          निरयन शून्य ठ्याक्क कुन ताराबाट गन्ने भन्नेमा मतभेद हुनाले फरक–फरक प्रणाली छन् — मूल फरक
          केही अंश/कलाको मात्र हो, तर ग्रह राशि-सन्धिमा परेमा त्यही सानो फरकले <span className="hl">राशि नै बदल्न</span>{" "}
          सक्छ। चक्रमाथिका बटनले प्रणाली बदलेर फरक हेर्नुहोस्।
        </Lede>
        <Keys
          items={[
            { h: "लाहिरी (Lahiri)", p: "भारत सरकारको आधिकारिक (चित्रा-पक्ष) — धेरैजसो पञ्चाङ्गको पूर्वनिर्धारित; आज ~२४°।" },
            { h: "रमन (Raman)", p: "बी.वी. रमनद्वारा प्रचलित — लाहिरीभन्दा झन्डै १.३° कम।" },
            { h: "कृष्णमूर्ति (KP)", p: "के.एस. कृष्णमूर्ति पद्धति — लाहिरीभन्दा अति थोरै (~६′) कम; सूक्ष्म भविष्यवाणीमा।" },
          ]}
        />
      </Section>

      <Note>
        पश्चिमी ज्योतिष प्रायः <b>सायन</b> चलाउँछ, नेपाली–भारतीय वैदिक ज्योतिष <b>निरयन</b>। यस एपको
        कुण्डली पृष्ठमा तपाईं आफैँ अयनांश प्रणाली रोज्न सक्नुहुन्छ र फरक आफ्नै आँखाले हेर्न सक्नुहुन्छ।
      </Note>
    </>
  );
}

export function HoraArticle() {
  const { location } = usePanchangaLocation();
  const todayAd = useMemo(
    () => todayAdStringInTimezone(new Date(), resolveLocationTimezone(location)),
    [location],
  );
  const panchangaQ = useQuery({
    queryKey: panchangaKeys.day(todayAd, "ad", location.params),
    queryFn: () => fetchPanchanga(todayAd, "ad", location.params),
    staleTime: 1000 * 60 * 30,
  });
  const p = panchangaQ.data;
  const timezone = resolveTimeZone(p?.location?.timezone, location.params.timezone);

  return (
    <>
      <Section kicker="०१" title="दिनका चौबीस होरा" en="Planetary hours">
        <Lede>
          प्रत्येक दिनलाई <b>चौबीस होरा</b> (ग्रहीय घण्टा) मा बाँडिन्छ — सूर्योदयदेखि अर्को
          सूर्योदयसम्म। हरेक होरालाई <span className="hl-amber">सात ग्रह</span> (आदित्य,
          शुक्र, बुध, चन्द्र, शनि, बृहस्पति, मङ्गल) ले पालैपालो शासन गर्छन्। सूर्योदयपछिको{" "}
          <b>पहिलो होरा</b> को स्वामी ग्रहले नै <span className="hl">दिनको नाम</span> दिन्छ।
        </Lede>
        {p ? (
          <div className="mt-5">
            <HoraRing p={p} isToday timezone={timezone} />
          </div>
        ) : (
          <div className="tm-card pad-lg flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
            लोड हुँदैछ…
          </div>
        )}
      </Section>

      <Section kicker="०२" title="कसरी पढ्ने" en="How to read it">
        <Keys
          items={[
            { h: "वलय = एक दिन", p: "भित्री वलय आइतबार, बाहिरी शनिबार — सात वलय सात दिन।" },
            { h: "होरा क्रम", p: "हरेक वलयभित्र चौबीस होरा; ग्रह आदित्य → शनि क्रममा घुम्छन्।" },
            { h: "दिनको स्वामी", p: "सूर्योदयको पहिलो होराको ग्रह = त्यो दिनको स्वामी (वार)।" },
            { h: "निरन्तर गणना", p: "आइतबारको अन्तिम होरा सोमबारमा गुड्छ — कहिल्यै रोकिँदैन।" },
          ]}
        />
      </Section>

      <Section kicker="०३" title="किन काम लाग्छ" en="Why it matters">
        <Lede>
          शुभ कार्यको मुहूर्त छान्दा होरा हेरिन्छ — जस्तै यात्रा वा व्यापारका लागि{" "}
          <b>बुध/बृहस्पति</b> होरा, स्थिर कामका लागि <b>शनि</b> होरा अनुकूल मानिन्छ। माथिको
          चक्र अहिलेको होरामा केन्द्रित छ; तल स्लाइडर चलाएर वा प्ले थिचेर हप्ताभरि होरा कसरी
          सर्छ हेर्नुहोस्।
        </Lede>
      </Section>
    </>
  );
}
