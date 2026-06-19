import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { HeliocentricOrbitDiagram } from "./HeliocentricOrbitDiagram";
import {
  ORBIT_MARKERS,
  ORBIT_PRESETS,
  meanFromTrue,
  orbitFromMeanAnomaly,
} from "./orbit-math";

type OrbitPresetWithDiff = (typeof ORBIT_PRESETS)[number] & { diff: number };

function nearestPreset(meanDeg: number): OrbitPresetWithDiff {
  return ORBIT_PRESETS.reduce<OrbitPresetWithDiff>((best, p) => {
    const diff = Math.abs((((meanDeg - p.meanDeg + 180) % 360) + 360) % 360 - 180);
    return diff < best.diff ? { ...p, diff } : best;
  }, { ...ORBIT_PRESETS[0], diff: Infinity });
}

function seasonLabel(meanDeg: number): string {
  const { nuDeg } = orbitFromMeanAnomaly(meanDeg);
  if (nuDeg < 45 || nuDeg >= 315) return "हिम ऋतु";
  if (nuDeg < 135) return "वसंत ऋतु";
  if (nuDeg < 225) return "ग्रीष्म ऋतु";
  return "शरद ऋतु";
}

function orbitEvent(meanDeg: number): string {
  const near = nearestPreset(meanDeg);
  if (near.diff < 10) return near.ne;
  return seasonLabel(meanDeg);
}

export function HeliocentricOrbitStudy() {
  const [meanDeg, setMeanDeg] = useState(() => meanFromTrue(180));
  const [spinDeg, setSpinDeg] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const fmt = (n: number) => toNepaliDigits(n);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setMeanDeg((prev) => (prev + dt * 10) % 360);
      setSpinDeg((prev) => (prev + dt * 95) % 360);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const orbit = orbitFromMeanAnomaly(meanDeg);
  const dayOfYear = Math.round((meanDeg / 360) * 365.25);

  return (
    <div className="tm-card pad-lg">
      <HeliocentricOrbitDiagram
        meanDeg={meanDeg}
        spinDeg={spinDeg}
        onMeanDeg={(v) => {
          setPlaying(false);
          setMeanDeg(v);
        }}
      />
      <p className="tm-card-cap">
        सूर्य एउटा केन्द्रबिन्दु (focus) मा छ — पृथ्वी वास्तविक दीर्घवृत्तमा{" "}
        <b>वामावर्त</b> घुम्छ। नजिक हुँदा छिटो (उपसौर / हिमतिर), टाढा हुँदा ढिलो (अपसौर /
        ग्रीष्मतिर) — यसैले केही महिनामा दिन छिटो बित्छ। ध्रुव {fmt(23.5)}° ढल्किएकाले
        सङ्क्रान्तिमा लामो/छोटो दिन र विषुवमा बराबर दिन–रात हुन्छ।
      </p>
      <div className="ed-controls">
        <div className="ed-readout">
          <div className="ed-ro">
            <span className="ed-ro-k">माध्य कोण (वर्ष)</span>
            <span className="ed-ro-v mono">{fmt(Math.round(meanDeg))}°</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">वर्षको दिन (लगभग)</span>
            <span className="ed-ro-v mono">{fmt(dayOfYear)}</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">घटना · ऋतु</span>
            <span className="ed-ro-v amber">{orbitEvent(meanDeg)}</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">सूर्यदेखि दूरी</span>
            <span className="ed-ro-v mono">
              {orbit.speed > 1.02 ? "नजिक · छिटो" : orbit.speed < 0.98 ? "टाढा · ढिलो" : "मध्यम"}
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
            max={360}
            step={0.5}
            value={meanDeg}
            style={{ "--fill": `${(meanDeg / 360) * 100}%` } as React.CSSProperties}
            onChange={(e) => {
              setPlaying(false);
              setMeanDeg(+e.target.value);
            }}
          />
        </div>
        <div className="ed-presets">
          {ORBIT_MARKERS.map((m) => {
            const preset = ORBIT_PRESETS.find((p) => p.ne === m.ne)!;
            return (
              <button
                key={m.ne}
                type="button"
                className={
                  "ed-preset" +
                  (Math.abs((((meanDeg - preset.meanDeg + 180) % 360) + 360) % 360 - 180) < 8
                    ? " on"
                    : "")
                }
                onClick={() => {
                  setPlaying(false);
                  setMeanDeg(preset.meanDeg);
                }}
              >
                {m.ne}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
