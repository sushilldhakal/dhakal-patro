import { useLocale, bilingualNode } from "@/i18n/locale";
import {
  ComputationReferenceTables,
  EclipticBeltStudy,
  PrecessionSkyStudy,
} from "@/components/learn/ComputationSkyDiagrams";
import { ServerPipelineDiagram } from "@/components/learn/ServerPipelineDiagram";
import {
  learnRefCaption,
  learnRefHighlightRow,
  learnRefTable,
  learnRefWrap,
  tmFcard,
  tmFormula,
  tmKey,
  tmKeys,
  tmLede,
  tmNote,
  tmSecEn,
  tmSecHead,
  tmSecKicker,
  tmSecTitle,
  tmSection,
} from "@/lib/learn-classes";

function Lede({ children }: { children: React.ReactNode }) {
  return <p className={tmLede}>{children}</p>;
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
  const { lang } = useLocale();
  return (
    <section className={tmSection}>
      <div className={tmSecHead}>
        <span className={tmSecKicker}>{kicker}</span>
        <h3 className={tmSecTitle}>{title}</h3>
        {lang === "en" && en ? <span className={tmSecEn}>{en}</span> : null}
      </div>
      {children}
    </section>
  );
}

function RefTable({
  caption,
  headers,
  rows,
  highlightRow,
}: {
  caption: string;
  headers: string[];
  rows: string[][];
  highlightRow?: number;
}) {
  return (
    <div className={learnRefWrap}>
      <table className={learnRefTable}>
        <caption className={learnRefCaption}>{caption}</caption>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={highlightRow === i ? learnRefHighlightRow : undefined}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArticleNe() {
  return (
    <>
      <Section kicker="००" title="सारांश" en="Summary">
        <Lede>
          भारी खगोलशास्त्र र पञ्चाङ्ग गणना{" "}
          <span className="hl">नेपाली-होलिडे-एपीआई</span> (फास्टएपीआई +{" "}
          <span className="hl-amber">स्विस एफेमेरिस / जेपीएल</span>, लाहिरी अयनांश) मा
          हुन्छ। रियाक्ट एप <span className="hl">वेदिक पात्रो</span> एपीआई बोलाएर लेबल
          देखाउँछ — उही ग्रहपात फेरि चलाउँदैन।
        </Lede>
        <ServerPipelineDiagram lang="ne" />
      </Section>

      <Section kicker="०१" title="राशि भनेको के?" en="What is rashi?">
        <Lede>
          <span className="hl">राशि</span> भनेको क्रान्तिवृत्त मार्गमा बाँडिएका{" "}
          <b>१२ बराबर खण्ड</b>, प्रत्येक <span className="hl-amber">३०°</span> — मेष ०° देखि
          मीन ३५०°–३६०° सम्म। यो <span className="hl">निरयन</span> चक्र तारापुञ्जसँग
          जोडिएको छ; पश्चिमी राशिफलको “सूर्य राशि” प्रायः <b>सायन</b> हुन्छ, नेपाली
          पात्रो/पञ्चाङ्ग <b>निरयन</b>।
        </Lede>
        <KeysBlock
          items={[
            {
              h: "कक्षा (क्रान्तिवृत्त)",
              p: "सूर्य, चन्द्र र ग्रहहरू प्रायः एउटै तल्लो कक्षीय तलमा हिँड्छन् — पृथ्वीको वरिपरि “राशि पट्टी” यही कक्षाको ३६०° कोठा हो।",
            },
            {
              h: "नक्षत्र",
              p: "उही कक्षामा २७ भाग, प्रत्येक १३°२०′ — चन्द्रको नक्षत्र यही सूक्ष्म जालबाट।",
            },
            {
              h: "लग्न",
              p: "पूर्व क्षितिजमा उदाउँदै गरेको कक्षीय बिन्दु — तपाईंको अक्षांश, देशान्तर र घण्टाअनुसार ग्रहपातबाट लग्न कोण निकालिन्छ।",
            },
          ]}
        />
        <div className={tmFormula}>
          <div className={tmFcard}>
            <div className="big">
              floor(λ ÷ 30) <span className="u">→ ०–११</span>
            </div>
            <div className="lbl">राशि सूचकाङ्क</div>
            <div className="desc">
              लाहिरी निरयन देशान्तर λ लाई ३०° मा भाग — मेष ०° देखि मीन सम्म
            </div>
          </div>
          <div className={tmFcard}>
            <div className="big">
              floor(λ ÷ 13°20′) <span className="u">→ ०–२६</span>
            </div>
            <div className="lbl">नक्षत्र</div>
            <div className="desc">चन्द्रको λ; पद = नक्षत्र भित्रको बाँकी ÷ ३°२०′</div>
          </div>
        </div>
      </Section>

      <Section
        kicker="०२"
        title="पृथ्वी, कक्षा र राशि–नक्षत्र पट्टी"
        en="Earth, ecliptic & the rashi belt"
      >
        <Lede>
          तलको चित्र <span className="hl">भूकेन्द्रित</span> दृश्य हो: पृथ्वी बीचमा, सूर्य दूर
          (दिशा मात्र), चन्द्रको कक्ष, र बाहिर{" "}
          <span className="hl-amber">१२ राशि + २७ नक्षत्र</span> को जाल — सूर्यको निरयन
          देशान्तर अनुसार कुन खण्ड उज्यालो हुन्छ हेर्नुहोस्। वर्ष स्लाइडर / चलाउनुहोस् ले सूर्यलाई
          पट्टीमा सार्छ; पढाइमा <b>सूर्य राशि</b>, <b>नक्षत्र</b>, <b>तिथि कोण</b> (चन्द्र−सूर्य)
          देखिन्छ — यही कोण सर्भरमा तिथि बनाउँछ।
        </Lede>
        <EclipticBeltStudy />
        <Note>
          यो चित्र शिक्षाका लागि सरलीकृत कक्ष हो; उत्पादनमा स्विस एफेमेरिसले जेपीएल
          ग्रहपात, अपवर्तन र अवलोककको उचाइ प्रयोग गर्छ।
        </Note>
      </Section>

      <Section kicker="०३" title="झुकाव, विषुव र अयन चलन" en="Tilt, equinox & precession">
        <Lede>
          पृथ्वीको धुरी <span className="hl-amber">≈ २३°२६′</span> ले कक्षासँग झुकिएको छ —
          त्यसैले <b>वसन्त/शरद विषुव</b> र <b>ग्रीष्म/हेमन्त अयनान्त</b> बन्छन्। अक्ष लट्टु
          झैँ <span className="hl">२६,००० वर्ष</span> को शंकुमा डुल्दा विषुव बिन्दु तारापुञ्ज
          माथि पछाडि सर्छ — <b>अयनांश (लाहिरी)</b>। एपीआईमा प्रत्येक क्षणको लाहिरी अयनांश
          स्विस एफेमेरिसबाट; दैनिक पेलोडमा उदय जुलियन दिनमा पनि लेखिन्छ।
        </Lede>
        <Lede>
          पहिलो ठूलो चित्र: <b>निरयन राशि चक्र स्थिर</b>, विषुवत् रेखा र विषुव काट अयन चलन
          सँग घुम्छ। दोस्रो: <b>ध्रुव तारा</b> बदल्दै अक्ष शंकु — अयनांश किन वर्षेनि बढ्छ।
        </Lede>
        <PrecessionSkyStudy />
      </Section>

      <Section kicker="०४" title="आधार — स्थान, समय, ग्रहपात" en="Foundation — place, time, ephemeris">
        <Lede>
          हरेक गणना एउटै सूत्रबाट सुरु हुन्छ: <span className="hl">अवलोककको स्थान</span>{" "}
          (अक्षांश, देशान्तर, समय क्षेत्र, उचाइ), <span className="hl">नागरिक दिन</span> (ग्रेगोरियन,
          ई.पू., वा बि.सं. ठेगाना), र त्यो दिनको <span className="hl-amber">जुलियन दिन</span>। स्थानीय
          घडी आईएएनए समय क्षेत्रबाट; उदय/अस्तका लागि साँचो क्षितिज, अपवर्तन र क्षितिज झुकाव
          समावेश।
        </Lede>
        <KeysBlock
          items={[
            {
              h: "स्विस एफेमेरिस (जेपीएल)",
              p: "सूर्य, चन्द्र, ग्रह, पातका ज्यामितीय स्थान — गति, उदय/अस्त, अयनांश सहित। सबै निरयन देशान्तर लाहिरी अयनांश घटाएर।",
            },
            {
              h: "उदय–आधारित दिन",
              p: "पात्रो/पञ्चाङ्गको मुख्य दिन = स्थानीय सूर्योदयदेखि अर्को सूर्योदयसम्म (वैकल्पिक: नागरिक मध्यरातको झलक)।",
            },
            {
              h: "सङ्क्रान्ति",
              p: "निरयन सूर्य जब ०°, ३०°, ६०°… काट्छ — द्विभाजनले काट्ने क्षण खोजिन्छ; मेष/मकर वर्षारम्भ र ऋतु यहीबाट।",
            },
          ]}
        />
        <ComputationReferenceTables />
      </Section>

      <Section kicker="०५" title="पञ्चाङ्ग कसरी गणना हुन्छ" en="How panchanga is computed">
        <Lede>
          <span className="hl">पञ्चाङ्गका अङ्ग</span> सबै निरयन देशान्तरबाट — चन्द्र र सूर्यको कोणीय
          अन्तर वा जोड। <span className="hl-amber">उदय तिथि</span> = तपाईंको स्थानमा सूर्योदय
          भएको क्षणमा; नक्षत्र/योग/करण पनि उही निरयन देशान्तरबाट।
        </Lede>
        <div className={tmFormula}>
          <div className={tmFcard}>
            <div className="big">
              (चन्द्र − सूर्य) ÷ 12° <span className="u">→ तिथि १–३०</span>
            </div>
            <div className="lbl">तिथि</div>
            <div className="desc">१२° = एक तिथि; शुक्ल/कृष्ण पक्ष चन्द्रको कोणान्तरबाट</div>
          </div>
          <div className={tmFcard}>
            <div className="big">
              चन्द्र ÷ (360/27) <span className="u">→ नक्षत्र + पद</span>
            </div>
            <div className="lbl">नक्षत्र</div>
            <div className="desc">२७ नक्षत्र, प्रत्येक १३°२०′, ४ पद</div>
          </div>
          <div className={tmFcard}>
            <div className="big">
              (सूर्य + चन्द्र) ÷ (360/27) <span className="u">→ योग</span>
            </div>
            <div className="lbl">योग</div>
            <div className="desc">२७ योग — देशान्तर जोड ३६०° मा बेरेर</div>
          </div>
          <div className={tmFcard}>
            <div className="big">
              (चन्द्र − सूर्य) ÷ 6° <span className="u">→ करण</span>
            </div>
            <div className="lbl">करण</div>
            <div className="desc">तिथिको आधा — ११ नाम + अन्तिम स्थिर करणहरू</div>
          </div>
        </div>
        <Lede>
          <span className="hl-amber">अङ्ग समाप्ति समय</span>: ग्रहपातमा चन्द्र−सूर्य (वा चन्द्र मात्र) कोण
          सीमा काट्ने क्षण द्विआधारी खोज — चक्र र समयरेखा यही सीमा जुलियन दिन
          प्रयोग गर्छ।
        </Lede>
        <RefTable
          caption="एक पञ्चाङ्ग दिन — गणनाको क्रम (विधि)"
          headers={["क्रम", "के गणना", "कसरी"]}
          rows={[
            ["१", "सूर्योदय, सूर्यास्त, अर्को उदय", "स्विस उदय/अस्त — अवलोककको अक्षांश/देशान्तर, अपवर्तन"],
            ["२", "चन्द्र उदय/अस्त", "उदयपछिको चन्द्र उदय/अस्त"],
            ["३", "उदय तिथि, वार", "उदय जुलियन दिनमा चन्द्र−सूर्य → तिथि सूचकाङ्क"],
            ["४", "दिनमान · रात्रिमान", "उदय–अस्त–अर्को उदयको अवधि"],
            ["५", "मध्याह्न, लाहिरी अयनांश", "स्थानीय मध्याह्न जुलियन दिन; सूर्योदयमा अयनांश"],
            ["६", "पक्ष; तिथि/नक्षत्र/योग/करण + अन्त", "निरयन सूत्र + सीमा खोज"],
            ["७", "चान्द्र/पूर्णिमान्त मास", "सूर्य–चन्द्र पक्ष नियम; अधिक/क्षय मास"],
            ["८", "९ ग्रह उदयमा", "प्रत्येक ग्रहको देशान्तर, राशि, नक्षत्र, पद, गति"],
            ["९", "लग्न अवधि", "दिनभर लग्नले ३०° राशि सीमा काट्ने"],
            ["१०", "मुहूर्त, चौघडी, होरा", "उदय–अर्को उदय विभाजन — परम्परागत खण्ड"],
            ["११", "सम्वत्सर, बि.सं./ने.सं.", "सङ्क्रान्ति वर्ष + चान्द्र मास नियम"],
          ]}
          highlightRow={0}
        />
        <Note>
          कुनै घण्टामा झलक चाहिन्छ भने उही ग्रहपात क्षणमा अङ्ग पुन: गणना — नागरिक
          मध्यरात दिन भने दुई उदय पेलोड बीच मिलाइन्छ (देखाउन मात्र, दोस्रो ग्रहपात पास
          होइन)।
        </Note>
      </Section>

      <Section kicker="०६" title="ग्रह गोचर कसरी गणना हुन्छ" en="How graha gochar is computed">
        <Lede>
          <span className="hl">गोचर</span> = कुनै क्षणमा प्रत्येक ग्रह कुन{" "}
          <span className="hl-amber">निरयन राशि / नक्षत्र / पद</span> मा छ र कहिले अर्को
          मा प्रवेश गर्छ। पात्रो गोचर सामान्यतः <b>स्थानीय सूर्योदय</b> मा झलक;
          प्रवेश सूची महिनाभरका काट्ने घटना।
        </Lede>
        <RefTable
          caption="गोचर — मुख्य चरण"
          headers={["विषय", "गणना"]}
          rows={[
            [
              "वर्तमान स्थिति",
              "प्रत्येक ग्रहको लाहिरी निरयन देशान्तर → राशि (÷३०°), नक्षत्र (÷१३°२०′), पद (÷३°२०′); केतु = राहु + १८०°",
            ],
            [
              "वक्री / मार्गी",
              "क्रान्तिवृत्तीय देशान्तरको गति चिन्ह — मंगल…शनि; राहु/केतु सधैँ वक्री परम्परा",
            ],
            [
              "अस्त",
              "ग्रह सूर्य नजिक — कोणीय दूरीको सीमा (ग्रहअनुसार फरक)",
            ],
            [
              "अर्को राशि प्रवेश",
              "देशान्तर ०°, ३०°, … काट्ने — पहिले मोटो समय खोज, त्यसपछि द्विभाजन (~१५ मिनेट सहिष्णुता)",
            ],
            [
              "अर्को नक्षत्र / पद",
              "उही द्विभाजन — नक्षत्र सूचकाङ्क वा पद खण्ड परिवर्तन",
            ],
            [
              "वक्री/मार्गी स्थान",
              "गति चिन्ह फेरिने क्षणको खोज (प्रवेश दायराभित्र)",
            ],
            [
              "आगामी घटना सूची",
              "चयनित महिनाका ई.सं. सीमाभित्र सबै प्रवेश/स्थान घटना → स्थानीय समय + बि.सं. दिन",
            ],
          ]}
        />
        <KeysBlock
          items={[
            {
              h: "ढिलो र छिटो ग्रह",
              p: "चन्द्र/बुध छिटो — राशि बदल्न दिन/हप्ता; शनि/राहु महिना/वर्ष। खोज सञ्झ्याल ग्रहअनुसार ठूलो राखिन्छ ताकि वक्री घुम्ती पनि नछुटोस्।",
            },
            {
              h: "पात्रो र कुण्डली",
              p: "गोचर पृष्ठ = यात्रा तालिका + प्रवेश; कुण्डली = जन्म क्षण / वर्गीय चार्ट — उही निरयन इन्जिन, फरक अङ्कुर समय।",
            },
          ]}
        />
      </Section>

      <Section kicker="०७" title="ग्रहण कसरी गणना हुन्छ" en="How eclipses are computed">
        <Lede>
          <span className="hl">सूर्यग्रहण</span> र <span className="hl">चन्द्रग्रहण</span> स्विस
          एफेमेरिसका समर्पित ग्रहण विधिबाट — ज्यामितीय युति र छाया शंकु, जेपीएल
          ग्रहपातमाथि। पर्व/पञ्चाङ्ग दृश्यले वर्षभरि गएका र आउने सूची देखाउँछ।
        </Lede>
        <RefTable
          caption="ग्रहण — विधि"
          headers={["चरण", "के हुन्छ"]}
          rows={[
            [
              "विश्वव्यापी चरम",
              "अर्को/अघिल्लो ग्रहणको चरम जुलियन दिन — सूर्य: सूर्य–चन्द्र पङ्क्ति; चन्द्र: पूर्णिमा पृथ्वीको छायाँबाट",
            ],
            [
              "प्रकार",
              "सूर्य: पूर्ण, वलयाकार, मिश्र, आंशिक; चन्द्र: पूर्ण, आंशिक, उपछाया — ग्रहपातको सङ्केतबाट",
            ],
            [
              "स्थानीय दृश्यता",
              "अवलोकक (देशान्तर, अक्षांश, उचाइ) दिएपछि स्थानीय सम्पर्क समय — केही ठाउँमा आंशिक/पूर्ण देखिन्छ कि छैन",
            ],
            [
              "स्थानीय सूर्य खोज",
              "विश्वव्यापी चरम नजिक स्थानीय चरम — नदेखिए अर्को ग्रहणसम्म अगाडि",
            ],
            [
              "स्थानीय चन्द्र",
              "चरम / उपछाया सुरुमा चन्द्र क्षितिजमाथि — देखिने झण्डा",
            ],
            [
              "पात्रो प्रदर्शन",
              "नेपाली लेबल, बि.सं./ई.सं. मिति, त्यो नागरिक दिनको दैनिक पञ्चाङ्ग लिङ्क",
            ],
          ]}
        />
        <Note>
          ग्रहण समय विश्वव्यापी समय/जुलियन दिनमा शुद्ध; स्थानीय पात्रो मिति = तपाईंको समय क्षेत्र + वैदिक सूर्योदय नियम
          (उदयअघिको रात्रि घटना अघिल्लो पञ्चाङ्ग दिनमा) जहाँ लागू हुन्छ।
        </Note>
      </Section>

      <Section kicker="०८" title="यो वेबसाइट के देखाउँछ" en="What this site displays">
        <Lede>
          <span className="hl">वेदिक पात्रो</span> मुख्यतया एपीआईबाट आएको गणित{" "}
          <span className="hl-amber">स्वरूप</span> गर्छ — नेपाली अङ्क, ठेगाना ब्राउज, लेआउट।
          तिथि/नक्षत्र समय, उदय/अस्त, ग्रह, गोचर प्रवेश, ग्रहण, मुहूर्त, पर्व, साइत, कुण्डली
          बल — उत्पादनमा सर्भर-पक्ष ग्रहपातबाट; ब्राउजरले स्थान फेरि गणना
          गर्दैन।
        </Lede>
        <Note>
          क्यास भएको वर्ष/दिनपछि सादा प्राप्ति छिटो हुन सक्छ — गणना पहिले नै भइसकेको पेलोड।
        </Note>
      </Section>
    </>
  );
}

function ArticleEn() {
  return (
    <>
      <Section kicker="00" title="Summary" en="Summary">
        <Lede>
          Heavy astronomy and panchanga math runs in{" "}
          <span className="hl">nepali-holiday-api</span> (FastAPI +{" "}
          <span className="hl-amber">Swiss Ephemeris / JPL</span>, Lahiri ayanamsa).{" "}
          <span className="hl">Vedic Patro</span> calls the API and formats labels — it does
          not re-run the ephemeris.
        </Lede>
        <ServerPipelineDiagram lang="en" />
      </Section>

      <Section kicker="01" title="What is rashi?" en="What is rashi?">
        <Lede>
          A <span className="hl">rashi</span> is one of <b>12 equal sectors</b> along the{" "}
          <span className="hl-amber">ecliptic</span>, each <b>30°</b> wide — Mesha 0° through
          Meena 350°–360°. This is the <span className="hl">sidereal (nirayana)</span> zodiac tied
          to star-clusters; Western “Sun signs” are usually <b>tropical (sayana)</b>, while Nepali
          patro and panchanga use <b>sidereal</b>.
        </Lede>
        <KeysBlock
          items={[
            {
              h: "Ecliptic plane",
              p: "The Sun, Moon and planets move near one flat plane — the “rashi belt” around Earth is how we partition that 360° circle.",
            },
            {
              h: "Nakshatra",
              p: "The same circle split into 27 parts of 13°20′ each — the Moon’s nakshatra comes from this finer grid.",
            },
            {
              h: "Lagna (ascendant)",
              p: "The ecliptic point rising on the eastern horizon — computed from your latitude, longitude, and clock time via the ephemeris ascendant.",
            },
          ]}
        />
        <div className={tmFormula}>
          <div className={tmFcard}>
            <div className="big">
              floor(λ ÷ 30) <span className="u">→ 0–11</span>
            </div>
            <div className="lbl">Rashi index</div>
            <div className="desc">
              Lahiri sidereal longitude λ split into 30° sectors — Mesha 0° through Meena
            </div>
          </div>
          <div className={tmFcard}>
            <div className="big">
              floor(λ ÷ 13°20′) <span className="u">→ 0–26</span>
            </div>
            <div className="lbl">Nakshatra</div>
            <div className="desc">Moon λ; pada = remainder inside nakshatra ÷ 3°20′</div>
          </div>
        </div>
      </Section>

      <Section
        kicker="02"
        title="Earth, ecliptic & the rashi belt"
        en="Earth, ecliptic & the rashi belt"
      >
        <Lede>
          The diagram below is a <span className="hl">geocentric</span> teaching view: Earth at the
          centre, the Sun as direction only, the Moon’s orbit, and an outer{" "}
          <span className="hl-amber">12-rashi + 27-nakshatra</span> grid — watch which sector
          highlights from the Sun’s sidereal longitude. The year slider / play moves the Sun along
          the belt; readouts show <b>Sun sign</b>, <b>nakshatra</b>, and the <b>tithi angle</b>{" "}
          (Moon − Sun) — the same angle the server uses for tithi.
        </Lede>
        <EclipticBeltStudy />
        <Note>
          Orbits here are simplified for learning; production uses Swiss Ephemeris with JPL files,
          refraction, and observer elevation.
        </Note>
      </Section>

      <Section kicker="03" title="Tilt, equinox & precession" en="Tilt, equinox & precession">
        <Lede>
          Earth’s axis is tilted <span className="hl-amber">≈ 23°26′</span> to the ecliptic — that
          creates the <b>equinoxes</b> and <b>solstices</b>. The axis wobbles on a{" "}
          <span className="hl">~26,000-year</span> cone, so the equinox drifts backward against the
          stars — the growing <b>Lahiri ayanamsha</b>. The API reads Lahiri ayanamsha from Swiss
          Ephemeris at each instant; the daily payload also stores it at sunrise JD.
        </Lede>
        <Lede>
          First large diagram: <b>sidereal rashi ring fixed</b>, equator and equinox cross rotate
          with precession. Second: the <b>pole-star</b> cone — why ayanamsha increases every year.
        </Lede>
        <PrecessionSkyStudy />
      </Section>

      <Section kicker="04" title="Foundation — place, time, ephemeris" en="Foundation">
        <Lede>
          Every run starts the same way: the observer&apos;s{" "}
          <span className="hl">latitude, longitude, timezone, elevation</span>, the chosen{" "}
          <span className="hl">civil day</span> (Gregorian, BCE, or BS from the URL), and its{" "}
          <span className="hl-amber">Julian Day</span>. Local clock uses the IANA timezone; sunrise
          and set include refraction and horizon dip.
        </Lede>
        <KeysBlock
          items={[
            {
              h: "Swiss Ephemeris (JPL)",
              p: "Geometric positions for Sun, Moon, planets, and nodes — speeds, rise/set, ayanamsa. Sidereal longitudes subtract Lahiri ayanamsa.",
            },
            {
              h: "Sunrise-anchored day",
              p: "Patro/panchanga days usually run from local sunrise to the next sunrise (optional civil-midnight snapshot).",
            },
            {
              h: "Sankranti",
              p: "When sidereal Sun crosses 0°, 30°, 60°… — bisection finds the crossing instant; Mesh/Makara year starts and ritus follow.",
            },
          ]}
        />
        <ComputationReferenceTables />
      </Section>

      <Section kicker="05" title="How panchanga is computed" en="Panchanga">
        <Lede>
          <span className="hl">Panchanga limbs</span> all come from sidereal longitudes — angular
          difference or sum of Sun and Moon. <span className="hl-amber">Udaya tithi</span> is the
          tithi at local sunrise; nakshatra, yoga, and karana use the same λ at that anchor.
        </Lede>
        <div className={tmFormula}>
          <div className={tmFcard}>
            <div className="big">
              (Moon − Sun) ÷ 12° <span className="u">→ tithi 1–30</span>
            </div>
            <div className="lbl">Tithi</div>
            <div className="desc">12° per tithi; paksha from lunar elongation</div>
          </div>
          <div className={tmFcard}>
            <div className="big">
              Moon ÷ (360/27) <span className="u">→ nakshatra + pada</span>
            </div>
            <div className="lbl">Nakshatra</div>
            <div className="desc">27 nakshatras of 13°20′, four padas each</div>
          </div>
          <div className={tmFcard}>
            <div className="big">
              (Sun + Moon) ÷ (360/27) <span className="u">→ yoga</span>
            </div>
            <div className="lbl">Yoga</div>
            <div className="desc">27 yogas from longitude sum mod 360°</div>
          </div>
          <div className={tmFcard}>
            <div className="big">
              (Moon − Sun) ÷ 6° <span className="u">→ karana</span>
            </div>
            <div className="lbl">Karana</div>
            <div className="desc">Half of a tithi — eleven names plus fixed tail karanas</div>
          </div>
        </div>
        <Lede>
          <span className="hl-amber">End times</span> for each limb: binary search on the ephemeris
          until Moon−Sun (or Moon-only) crosses the next threshold — UI wheels and timelines use
          those boundary Julian Days.
        </Lede>
        <RefTable
          caption="One panchanga day — calculation order (method)"
          headers={["Step", "What", "How"]}
          rows={[
            ["1", "Sunrise, sunset, next sunrise", "Swiss rise/set for observer lat/lon with refraction"],
            ["2", "Moonrise / moonset", "Lunar rise/set after today’s sunrise"],
            ["3", "Udaya tithi, vara", "Moon−Sun at sunrise JD → tithi index"],
            ["4", "Dinamaan · ratrimana", "Durations between sunrise, sunset, next sunrise"],
            ["5", "Madhyahna, Lahiri ayanamsa", "Local noon JD; ayanamsa stored at sunrise"],
            ["6", "Paksha; limbs + end times", "Sidereal formulas + boundary search"],
            ["7", "Amanta/purnimanta month", "Sun–Moon phase rules; adhik/kshaya maas"],
            ["8", "Nine grahas at sunrise", "Each λ, rashi, nakshatra, pada, speed"],
            ["9", "Lagna spans", "Ascendant crossing 30° rashi boundaries through the day"],
            ["10", "Muhurta, choghadiya, hora", "Divide sunrise→next sunrise by traditional rules"],
            ["11", "Samvatsara, BS/NS labels", "Sankranti year + lunar month conventions"],
          ]}
          highlightRow={0}
        />
        <Note>
          A clock snapshot recomputes limbs at that instant. Civil-midnight days may interpolate
          between two sunrise payloads for display only — not a second full ephemeris pass.
        </Note>
      </Section>

      <Section kicker="06" title="How graha gochar is computed" en="Gochar">
        <Lede>
          <span className="hl">Gochar</span> is where each graha sits in the{" "}
          <span className="hl-amber">sidereal sign / nakshatra / pada</span> at a chosen instant,
          and when it enters the next. The Patro gochar page uses a{" "}
          <b>local sunrise (udaya)</b> snapshot; ingress lists collect boundary crossings through
          the browsed month.
        </Lede>
        <RefTable
          caption="Gochar — main steps"
          headers={["Topic", "Calculation"]}
          rows={[
            [
              "Current position",
              "Lahiri sidereal λ per graha → rashi (÷30°), nakshatra (÷13°20′), pada (÷3°20′); Ketu = Rahu + 180°",
            ],
            [
              "Retrograde / direct",
              "Sign of ecliptic speed — Mars through Saturn; Rahu/Ketu treated as retrograde by convention",
            ],
            ["Combust (asta)", "Angular separation from the Sun against graha-specific limits"],
            [
              "Next sign entry",
              "λ crossing 0°, 30°, … — coarse time scan, then bisection (~15 minute tolerance)",
            ],
            ["Next nakshatra / pada", "Same bisection when nakshatra index or flat pada slot changes"],
            ["Retrograde stations", "Instant when speed changes sign inside the search window"],
            [
              "Upcoming event list",
              "All ingress/station events in the month’s AD bounds → local time + BS day labels",
            ],
          ]}
        />
        <KeysBlock
          items={[
            {
              h: "Slow vs fast grahas",
              p: "Moon/Mercury change signs in days; Saturn/Rahu in months or years. Search windows are widened so retrograde loops are not missed.",
            },
            {
              h: "Patro vs kundali",
              p: "Gochar pages show transits and ingress; kundali uses birth time and divisional charts — same sidereal engine, different anchor.",
            },
          ]}
        />
      </Section>

      <Section kicker="07" title="How eclipses are computed" en="Eclipses">
        <Lede>
          <span className="hl">Solar and lunar eclipses</span> use Swiss Ephemeris eclipse routines
          on JPL ephemeris — geometric syzygy and shadow geometry. The patro UI lists past and
          upcoming eclipses for the year.
        </Lede>
        <RefTable
          caption="Eclipse — method"
          headers={["Stage", "What happens"]}
          rows={[
            [
              "Global maximum",
              "Next/previous eclipse maximum JD — solar: Sun–Moon alignment; lunar: Full Moon in Earth’s shadow",
            ],
            [
              "Type",
              "Solar: total, annular, hybrid, partial; lunar: total, partial, penumbral — from ephemeris flags",
            ],
            [
              "Local visibility",
              "With observer lon/lat/elevation: local contact times and whether the eclipse is seen at all",
            ],
            [
              "Solar local search",
              "Near global maximum, find local maximum; if invisible, advance to the next eclipse",
            ],
            ["Lunar local", "Moon above horizon at maximum / penumbral start → visible flag"],
            ["Patro display", "Nepali/English labels, BS/AD dates, link to that day’s panchanga"],
          ]}
        />
        <Note>
          Eclipse instants are exact in UTC/JD; your patro date applies timezone plus vedic sunrise
          rules where events before sunrise belong to the previous panchanga day.
        </Note>
      </Section>

      <Section kicker="08" title="What this site displays" en="Frontend">
        <Lede>
          <span className="hl">Vedic Patro</span> mostly <span className="hl-amber">formats</span>{" "}
          numbers from the API — Nepali digits, URL browse, layout. Tithi/nakshatra times, rise/set,
          grahas, gochar ingress, eclipses, muhurtas, festivals, sait, and kundali strengths are
          computed on the server; the browser does not re-run the ephemeris.
        </Lede>
        <Note>
          Cached year/day payloads can make plain GETs fast after the first calculation.
        </Note>
      </Section>
    </>
  );
}

function KeysBlock({ items }: { items: { h: string; p: React.ReactNode }[] }) {
  return (
    <div className={tmKeys}>
      {items.map((k) => (
        <div className={tmKey} key={k.h}>
          <h4>{k.h}</h4>
          <p>{k.p}</p>
        </div>
      ))}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className={tmNote}>{children}</p>;
}

export function HowWeCalculateStudy() {
  const { lang } = useLocale();
  return bilingualNode(lang, <ArticleNe />, <ArticleEn />);
}

export function HowWeCalculateArticle() {
  return <HowWeCalculateStudy />;
}
