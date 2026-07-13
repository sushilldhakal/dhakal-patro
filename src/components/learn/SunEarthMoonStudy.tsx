import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { edScrub } from "@/lib/diagram-classes";
import { tmCardCap, tmCardPadLg, edControls, edPlayBtn, edPresets, edPreset, edReadout, edRo, edRoK, edRoV, edScrubWrap } from "@/lib/learn-classes";
import { Pause, Play } from "lucide-react";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { useLocale } from "@/i18n/locale";
import { WHEEL_RASHIS } from "@/lib/wheel-data";
import { SunEarthMoonOrbit } from "./SunEarthMoonOrbit";
import {
  BS_MONTHS,
  SYNODIC_MONTH,
  TROPICAL_YEAR,
  earthOrbitFromMeanAnomaly,
  elongationFromDay,
  lunarMonthsCompleted,
  nakshatraIndexFromLon,
  rashiIndexFromLon,
  sunSiderealLonFromEarthNu,
  yearAngleFromDay,
} from "./sun-earth-moon-math";

const PRESETS = [
  { ne: "वर्षारम्भ", en: "Year start", day: 0 },
  { ne: "३ महिनापछि", en: "After 3 months", day: TROPICAL_YEAR / 4 },
  { ne: "६ महिनापछि", en: "After 6 months", day: TROPICAL_YEAR / 2 },
  { ne: "वर्ष अन्त्य", en: "Year end", day: TROPICAL_YEAR - 2 },
];

export function SunEarthMoonStudy() {
  const { pick, digits } = useLocale();
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const fmt = (n: number) => digits(n);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setDay((prev) => (prev + dt * 14) % TROPICAL_YEAR);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const yearAngle = yearAngleFromDay(day);
  const { nuDeg } = earthOrbitFromMeanAnomaly(yearAngle);
  const sunLon = sunSiderealLonFromEarthNu(nuDeg);
  const rashiIdx = rashiIndexFromLon(sunLon);
  const nakIdx = nakshatraIndexFromLon(sunLon);
  const E = elongationFromDay(day);
  const monthIdx = rashiIdx;
  const monthsDone = lunarMonthsCompleted(day);
  const paksha = E < 180 ? pick("शुक्ल", "Shukla") : pick("कृष्ण", "Krishna");
  const daysIntoLunarMonth = day - monthsDone * SYNODIC_MONTH;

  return (
    <div className={tmCardPadLg}>
      <SunEarthMoonOrbit
        day={day}
        onDay={(v) => {
          setPlaying(false);
          setDay(v);
        }}
      />
      <div className={edControls}>
        <div className={edReadout}>
          <div className={edRo}>
            <span className={edRoK}>{pick("सौर महिना", "Solar month")}</span>
            <span className={edRoV()}>{BS_MONTHS[monthIdx]}</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{pick("सूर्य राशि · नक्षत्र", "Sun sign · nakshatra")}</span>
            <span className={edRoV()}>
              {pick(WHEEL_RASHIS[rashiIdx]!.ne, WHEEL_RASHIS[rashiIdx]!.en)} · {pick(NAKSHATRA_ICONS[nakIdx]!.ne, NAKSHATRA_ICONS[nakIdx]!.en)}
            </span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{pick("सूर्य देशान्तर", "Sun longitude")}</span>
            <span className={edRoV({ mono: true })}>{fmt(Math.round(sunLon))}°</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{pick("वर्षको दिन", "Day of year")}</span>
            <span className={edRoV({ mono: true })}>
              {fmt(Math.round(day))} / {fmt(365)}
            </span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{pick("चन्द्र कोण · पक्ष", "Moon angle · paksha")}</span>
            <span className={edRoV({ mono: true })}>
              {fmt(Math.round(E))}° · {paksha}
            </span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{pick("सकिएका चान्द्र महिना", "Lunar months done")}</span>
            <span className={edRoV({ amber: true })}>
              {fmt(monthsDone)} / ~{fmt(12)} · {fmt(Math.round(daysIntoLunarMonth))}{" "}
              {pick("दिन यो महिनाको", "days into this month")}
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
            max={TROPICAL_YEAR}
            step={0.5}
            value={day}
            style={{ "--fill": `${(day / TROPICAL_YEAR) * 100}%` } as React.CSSProperties}
            onChange={(e) => {
              setPlaying(false);
              setDay(+e.target.value);
            }}
          />
        </div>
        <div className={edPresets}>
          {PRESETS.map((p) => (
            <button
              key={p.ne}
              type="button"
              className={edPreset(Math.abs(day - p.day) < 4)}
              onClick={() => {
                setPlaying(false);
                setDay(p.day);
              }}
            >
              {pick(p.ne, p.en)}
            </button>
          ))}
        </div>
      </div>
      <p className={tmCardCap}>
        {pick(
          <>
            बाहिरी {fmt(12)} राशि र {fmt(27)} नक्षत्रको ग्रिडले पृथ्वीबाट देखिने{" "}
            <span className={cn("hl-amber")}>सूर्यको स्थिति</span> देखाउँछ — सूर्य नयाँ राशि वा नक्षत्रमा
            प्रवेश गर्दा ग्रिड सीमा पार हुन्छ (सङ्क्रान्ति)। पृथ्वीले सूर्यको १ फेरो (~{fmt(365)}{" "}
            दिन) लगाउँदा चन्द्रले ~{fmt(12)}.{fmt(4)} फेरो लगाउँछ — त्यसैले १२ चान्द्र महिना सकिँदा
            वर्ष ~{fmt(11)} दिन बाँकी रहन्छ, जसले <span className={cn("hl-amber")}>अधिक मास</span>{" "}
            जन्माउँछ।
          </>,
          <>
            The outer grid of {fmt(12)} rashis and {fmt(27)} nakshatras shows the{" "}
            <span className={cn("hl-amber")}>Sun's position</span> as seen from Earth — when the Sun
            enters a new rashi or nakshatra it crosses a grid boundary (sankranti). While the Earth
            makes 1 orbit of the Sun (~{fmt(365)} days) the Moon makes ~{fmt(12)}.{fmt(4)} orbits —
            so after 12 lunar months about {fmt(11)} days of the year remain, which gives rise to{" "}
            <span className={cn("hl-amber")}>Adhika Masa</span>.
          </>,
        )}
      </p>
    </div>
  );
}
