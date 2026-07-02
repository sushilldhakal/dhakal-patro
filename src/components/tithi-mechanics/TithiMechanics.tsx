import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { moonIllumination, WHEEL_TITHIS, tithiIndexFromElongation, tithiNum, tithiPaksha, tithiPakshaEn } from "@/lib/tithi-wheel-data";
import { ElongationDiagram, EARTH_ARC_SYNODIC, earthOrbitDegFromElongation } from "./ElongationDiagram";
import { SYNODIC_MONTH } from "@/components/learn/sun-earth-moon-math";
import { cn } from "@/lib/utils"
import { edScrub } from "@/lib/diagram-classes";
;
import { AdhikMassDiagram, SunriseTimeline } from "./tithi-mechanics-diagrams";
import { useLocale } from "@/i18n/locale";
import { tmCardCap, tmCardPadLg, tmFcard, tmFormula, tmHero, tmHeroEyebrow, tmHeroSub, tmHeroTitle, tmKey, tmKeys, tmLede, tmNote, tmPageShell, tmSecEn, tmSecHead, tmSecKicker, tmSecTitle, tmSection, tmWrap, edControls, edPlayBtn, edPresets, edPreset, edReadout, edRo, edRoK, edRoV, edScrubWrap } from "@/lib/learn-classes";

const PRESETS = [
  { ne: "अमावस्या", en: "Amavasya", E: 354 },
  { ne: "शुक्ल अष्टमी", en: "Shukla Ashtami", E: 90 },
  { ne: "पूर्णिमा", en: "Purnima", E: 174 },
  { ne: "कृष्ण अष्टमी", en: "Krishna Ashtami", E: 270 },
];

export function ElongationStudy() {
  const { pick, digits } = useLocale();
  const [E, setE] = useState(87);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const fmt = (n: number) => digits(n);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setE((prev) => (prev + dt * 26) % 360);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const idx = tithiIndexFromElongation(E);
  const t = WHEEL_TITHIS[idx]!;
  const paksha = pick(tithiPaksha(idx), tithiPakshaEn(idx));
  const tno = tithiNum(idx);
  const illum = moonIllumination(E);
  const tithiLabel = t.moon === "full" ? pick("पूर्णिमा", "Purnima") : t.moon === "new" ? pick("औंसी", "Aunsi") : pick(t.ne, t.en);
  const earthArc = earthOrbitDegFromElongation(E);
  const siderealDays = 27.321661;

  return (
    <div className={tmCardPadLg}>
      <ElongationDiagram E={E} onE={(v) => { setPlaying(false); setE(v); }} />
      <div className={edControls}>
        <div className={edReadout}>
          <div className={edRo}>
            <span className={edRoK}>{pick("कोणीय दूरी", "Elongation")}</span>
            <span className={edRoV({ mono: true })}>{fmt(Math.round(E))}°</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{pick("मास · पक्ष", "Month · Paksha")}</span>
            <span className={edRoV()}>{pick("असार", "Ashadh")} {paksha}</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{pick("तिथि", "Tithi")}</span>
            <span className={edRoV({ amber: true })}>
              {tithiLabel} · {fmt(tno)}
            </span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{pick("चन्द्रकला", "Illumination")}</span>
            <span className={edRoV({ mono: true })}>{fmt(illum)}%</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{pick("पृथ्वी सार · चान्द्र मास", "Earth arc · lunar month")}</span>
            <span className={edRoV({ mono: true })}>
              {fmt(Math.round(earthArc))}° / ~{fmt(Math.round(EARTH_ARC_SYNODIC))}°
            </span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{pick("नाक्षत्र vs चान्द्र मास", "Sidereal vs synodic month")}</span>
            <span className={edRoV({ amber: true })}>
              ~{fmt(Math.round(siderealDays))} {pick("दिन", "days")} vs ~{fmt(Math.round(SYNODIC_MONTH))} {pick("दिन", "days")}
            </span>
          </div>
        </div>
        <div className={edScrubWrap}>
          <button
            type="button"
            className={edPlayBtn}
            onClick={() => setPlaying((p) => !p)}
            title={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
            aria-label={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <input
            className={edScrub}
            type="range"
            min={0}
            max={360}
            step={0.5}
            value={E}
            style={{ "--fill": `${(E / 360) * 100}%` } as React.CSSProperties}
            onChange={(e) => {
              setPlaying(false);
              setE(+e.target.value);
            }}
          />
        </div>
        <div className={edPresets}>
          {PRESETS.map((p) => (
            <button
              key={p.ne}
              type="button"
              className={edPreset(
                Math.abs((((E - p.E + 180) % 360) + 360) % 360 - 180) < 6,
              )}
              onClick={() => {
                setPlaying(false);
                setE(p.E);
              }}
            >
              {pick(p.ne, p.en)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TithiMechanics() {
  return (
    <div className={cn(tmPageShell, "rounded-2xl border border-border overflow-hidden")}>
      <div className={tmWrap}>
        <header className={tmHero}>
          <div className={tmHeroEyebrow}>पञ्चाङ्ग · तिथिको गणित</div>
          <h2 className={tmHeroTitle}>
            तिथि कसरी बन्छ — र किन कहिले <b>दोहोरिन्छ वा हराउँछ</b>
          </h2>
          <p className={tmHeroSub}>
            एक तिथि भनेको चन्द्र र सूर्यबीचको <b>१२° कोणीय दूरी</b> हो। यो कोण फरक–फरक गतिमा
            बढ्ने हुनाले कहिलेकाहीँ एउटै तिथि दुई दिन पर्छ, कहिले एउटा तिथि नै छुट्छ, अनि चान्द्र
            र सौर मासको भिन्नताले अधिक मास जन्मन्छ।
          </p>
        </header>

        <section className={tmSection}>
          <div className={tmSecHead}>
            <span className={tmSecKicker}>०१</span>
            <h3 className={tmSecTitle}>सूर्य · पृथ्वी · चन्द्र — तिथिको आधार</h3>
          </div>
          <p className={tmLede}>
            पृथ्वीबाट हेर्दा चन्द्रमा सूर्यभन्दा जति <span className={cn("hl")}>कोणले अगाडि</span> पुग्छ,
            त्यही कोणले तिथि निर्धारण गर्छ। <b>०°</b> मा दुवै एकै दिशामा हुन्छन् —{" "}
            <span className={cn("hl-amber")}>अमावस्या</span>। कोण बढ्दै <b>१८०°</b> पुग्दा चन्द्र ठ्याक्क
            विपरीत — <span className={cn("hl-amber")}>पूर्णिमा</span>। तल मुनको गोलो तानेर वा चलाउनुहोस्।
          </p>
          <ElongationStudy />

          <div className={tmFormula}>
            <div className={tmFcard}>
              <div className={cn("big")}>
                {toNepaliDigits(12)}
                <span className={cn("u")}>°</span>
              </div>
              <div className={cn("lbl")}>= १ तिथि</div>
              <div className={cn("desc")}>३६०° ÷ ३० तिथि। हरेक १२° कोण पार गर्दा नयाँ तिथि सुरु हुन्छ।</div>
            </div>
            <div className={tmFcard}>
              <div className={cn("big")}>
                ~{toNepaliDigits(12)}
                <span className={cn("u")}>°/दिन</span>
              </div>
              <div className={cn("lbl")}>चन्द्रको औसत गति</div>
              <div className={cn("desc")}>
                तर वास्तवमा १०.७°–१४.३° सम्म घटबढ हुन्छ — चन्द्र कक्षको आकारका कारण।
              </div>
            </div>
            <div className={tmFcard}>
              <div className={cn("big")}>सूर्योदय</div>
              <div className={cn("lbl")}>तिथि कहिले गनिन्छ?</div>
              <div className={cn("desc")}>
                जुन तिथि <b>सूर्योदयमा</b> चलिरहेको हुन्छ, त्यही दिनको तिथि मानिन्छ — यही नियमले
                वृद्धि र क्षय जन्माउँछ।
              </div>
            </div>
          </div>
        </section>

        <section className={tmSection}>
          <div className={tmSecHead}>
            <span className={tmSecKicker}>०२</span>
            <h3 className={tmSecTitle}>तिथि वृद्धि — एउटै तिथि दुई दिन</h3>
            <span className={tmSecEn}>Repeated tithi</span>
          </div>
          <p className={tmLede}>
            जब चन्द्र <span className={cn("hl")}>मन्द गतिमा</span> (~१०.७°/दिन) हिँड्छ, एउटै १२° को
            तिथि–खण्डले <b>लगातार दुई सूर्योदय</b> समेट्छ। दुवै बिहान त्यही तिथि चलिरहेकाले
            पात्रोमा त्यो तिथि <span className={cn("hl-amber")}>दुई दिन</span> देखिन्छ।
          </p>
          <div className={tmCardPadLg}>
            <SunriseTimeline mode="vriddhi" />
            <div className={tmCardCap}>
              तृतीया खण्ड यति फराकिलो छ कि १० र ११ गते — दुवै सूर्योदय यसैभित्र परे। त्यसैले
              तृतीया दोहोरियो।
            </div>
          </div>
        </section>

        <section className={tmSection}>
          <div className={tmSecHead}>
            <span className={tmSecKicker}>०३</span>
            <h3 className={tmSecTitle}>तिथि क्षय — हराएको तिथि</h3>
            <span className={tmSecEn}>Skipped tithi</span>
          </div>
          <p className={tmLede}>
            उल्टो, जब चन्द्र <span className={cn("hl")}>द्रुत गतिमा</span> (~१४.३°/दिन) हिँड्छ, कुनै १२° को
            तिथि–खण्ड <b>दुई सूर्योदयको बीचमै</b> पूरै सकिन्छ। कुनै पनि सूर्योदयमा त्यो तिथि
            नभेटिएकाले त्यो <span className={cn("hl-amber")}>क्षय</span> भई पात्रोबाट हराउँछ।
          </p>
          <div className={tmCardPadLg}>
            <SunriseTimeline mode="kshaya" />
            <div className={tmCardCap}>
              अष्टमी खण्ड साँघुरो भएर एक सूर्योदयदेखि अर्कोको बीचमै सकियो — कुनै बिहान अष्टमी परेन,
              त्यसैले त्यो क्षय भयो।
            </div>
          </div>
        </section>

        <section className={tmSection}>
          <div className={tmSecHead}>
            <span className={tmSecKicker}>०४</span>
            <h3 className={tmSecTitle}>अधिक मास — थपिने महिना</h3>
            <span className={tmSecEn}>Extra month</span>
          </div>
          <p className={tmLede}>
            एक <b>चान्द्र मास</b> (अमावस्यादेखि अमावस्या) ~२९.५ दिनको हुन्छ; एक <b>सौर मास</b> (सूर्य
            एक राशिमा रहने अवधि) ~३०.४ दिनको। चान्द्र मास छोटो भएकाले बेलाबेला एउटा चान्द्र
            मासभित्र <span className={cn("hl")}>कुनै सङ्क्रान्ति पर्दैन</span> — त्यही महिना{" "}
            <span className={cn("hl-amber")}>अधिक मास</span> कहलिन्छ र अघिल्लो महिनाको नाम दोहोरिन्छ।
          </p>
          <div className={tmCardPadLg}>
            <AdhikMassDiagram />
            <div className={tmCardCap}>
              यहाँ मेष सौर मासभित्रै दुई अमावस्या परे — बीचको चान्द्र मासमा कुनै सङ्क्रान्ति
              नपरेकाले त्यो “अधिक वैशाख” बन्यो; त्यसपछिको नियमित महिना “निज वैशाख”।
            </div>
          </div>
          <div className={tmKeys}>
            <div className={tmKey}>
              <h4>~३२.५ महिनामा एकपटक</h4>
              <p>
                यसरी जोडिँदै गएको फरक झन्डै हरेक तीन वर्षमा एक अधिक मास बनाउँछ, जसले चान्द्र र सौर
                वर्षलाई मिलाउँछ।
              </p>
            </div>
            <div className={tmKey}>
              <h4>अधिक र निज</h4>
              <p>
                सङ्क्रान्ति बिनाको महिना “अधिक”, र त्यसपछि सङ्क्रान्ति परेको महिना “निज” (साँचो)
                भनिन्छ — जस्तै अधिक जेठ अनि निज जेठ।
              </p>
            </div>
            <div className={tmKey}>
              <h4>क्षय मास</h4>
              <p>
                विरलै, एउटै चान्द्र मासमा दुई सङ्क्रान्ति परे त्यो महिना क्षय हुन्छ — अधिक मासको
                ठीक विपरीत।
              </p>
            </div>
          </div>
        </section>

        <p className={tmNote}>
          टिप्पणी: माथिका अङ्क र गति अवधारणा बुझाउन सरलीकृत गरिएका हुन्। वास्तविक पात्रोमा
          चन्द्र–सूर्यको खास स्थिति गणना गर्न पञ्चाङ्ग इन्जिन प्रयोग गरिन्छ।
        </p>
      </div>
    </div>
  );
}
