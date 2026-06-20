import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { SunEarthMoonOrbit } from "./SunEarthMoonOrbit";
import {
  BS_MONTHS,
  SYNODIC_MONTH,
  TROPICAL_YEAR,
  elongationFromDay,
  lunarMonthsCompleted,
  monthIndexFromAngle,
  yearAngleFromDay,
} from "./sun-earth-moon-math";

const PRESETS = [
  { ne: "वर्षारम्भ", day: 0 },
  { ne: "३ महिनापछि", day: TROPICAL_YEAR / 4 },
  { ne: "६ महिनापछि", day: TROPICAL_YEAR / 2 },
  { ne: "वर्ष अन्त्य", day: TROPICAL_YEAR - 2 },
];

export function SunEarthMoonStudy() {
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const fmt = (n: number) => toNepaliDigits(n);

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
  const E = elongationFromDay(day);
  const monthIdx = monthIndexFromAngle(yearAngle);
  const monthsDone = lunarMonthsCompleted(day);
  const paksha = E < 180 ? "शुक्ल" : "कृष्ण";
  const daysIntoLunarMonth = day - monthsDone * SYNODIC_MONTH;

  return (
    <div className="tm-card pad-lg">
      <SunEarthMoonOrbit
        day={day}
        onDay={(v) => {
          setPlaying(false);
          setDay(v);
        }}
      />
      <div className="ed-controls">
        <div className="ed-readout">
          <div className="ed-ro">
            <span className="ed-ro-k">सौर महिना</span>
            <span className="ed-ro-v">{BS_MONTHS[monthIdx]}</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">वर्षको दिन</span>
            <span className="ed-ro-v mono">
              {fmt(Math.round(day))} / {fmt(365)}
            </span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">चन्द्र कोण · पक्ष</span>
            <span className="ed-ro-v mono">
              {fmt(Math.round(E))}° · {paksha}
            </span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">सकिएका चान्द्र महिना</span>
            <span className="ed-ro-v amber">
              {fmt(monthsDone)} / ~{fmt(12)} · {fmt(Math.round(daysIntoLunarMonth))} दिन यो महिनाको
            </span>
          </div>
        </div>
        <div className="ed-scrub-wrap">
          <button
            type="button"
            className="ed-playbtn"
            onClick={() => setPlaying((p) => !p)}
            title={playing ? "रोक्नुहोस्" : "चलाउनुहोस्"}
            aria-label={playing ? "रोक्नुहोस्" : "चलाउनुहोस्"}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <input
            className="ed-scrub"
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
        <div className="ed-presets">
          {PRESETS.map((p) => (
            <button
              key={p.ne}
              type="button"
              className={"ed-preset" + (Math.abs(day - p.day) < 4 ? " on" : "")}
              onClick={() => {
                setPlaying(false);
                setDay(p.day);
              }}
            >
              {p.ne}
            </button>
          ))}
        </div>
      </div>
      <p className="tm-card-cap">
        पृथ्वीले सूर्यको १ फेरो (~{fmt(365)} दिन) लगाउँदा चन्द्रले पृथ्वीको ~{fmt(12)}.{fmt(4)} फेरो
        लगाउँछ — त्यसैले १२ चान्द्र महिना सकिँदा वर्ष ~{fmt(11)} दिन बाँकी रहन्छ, जसले{" "}
        <span className="hl-amber">अधिक मास</span> जन्माउँछ।
      </p>
    </div>
  );
}
