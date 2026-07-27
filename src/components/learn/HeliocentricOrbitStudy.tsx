import { useEffect, useRef, useState } from "react";
import { edScrub } from "@/lib/diagram-classes";
import { tmCardCap, tmCardPadLg, edControls, edPlayBtn, edPresets, edPreset, edReadout, edRo, edRoK, edRoV, edScrubWrap } from "@/lib/learn-classes";
import { Pause, Play } from "lucide-react";
import { HeliocentricOrbitDiagram } from "./HeliocentricOrbitDiagram";
import { useLocale, bilingualText, bilingualNode } from "@/i18n/locale";
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

function seasonLabel(meanDeg: number, isEn: boolean): string {
  const { nuDeg } = orbitFromMeanAnomaly(meanDeg);
  if (nuDeg < 45 || nuDeg >= 315) return isEn ? "Winter" : "हिम ऋतु";
  if (nuDeg < 135) return isEn ? "Spring" : "वसंत ऋतु";
  if (nuDeg < 225) return isEn ? "Summer" : "ग्रीष्म ऋतु";
  return isEn ? "Autumn" : "शरद ऋतु";
}

function orbitEvent(meanDeg: number, isEn: boolean): string {
  const near = nearestPreset(meanDeg);
  if (near.diff < 10) return isEn ? near.en : near.ne;
  return seasonLabel(meanDeg, isEn);
}

export function HeliocentricOrbitStudy() {
  const { lang, digits } = useLocale();
  const isEn = lang === "en";
  const [meanDeg, setMeanDeg] = useState(() => meanFromTrue(180));
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const fmt = (n: number) => digits(n);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setMeanDeg((prev) => (prev + dt * 10) % 360);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const orbit = orbitFromMeanAnomaly(meanDeg);
  const dayOfYear = Math.round((meanDeg / 360) * 365.25);

  return (
    <div className={tmCardPadLg}>
      <HeliocentricOrbitDiagram
        meanDeg={meanDeg}
        onMeanDeg={(v) => {
          setPlaying(false);
          setMeanDeg(v);
        }}
      />
      <p className={tmCardCap}>
        {bilingualNode(lang, <>
            सूर्य एउटा केन्द्रबिन्दु (focus) मा छ — पृथ्वी वास्तविक दीर्घवृत्तमा{" "}
            <b>वामावर्त</b> घुम्छ। नजिक हुँदा छिटो (उपसौर / हिमतिर), टाढा हुँदा ढिलो (अपसौर /
            ग्रीष्मतिर) — यसैले केही महिनामा दिन छिटो बित्छ। ध्रुव {fmt(23.5)}° ढल्किएकाले
            सङ्क्रान्तिमा लामो/छोटो दिन र विषुवमा बराबर दिन–रात हुन्छ।
          </>,
          <>
            The Sun sits at one focus — the Earth orbits the true ellipse{" "}
            <b>counter-clockwise</b>. Faster when near (perihelion / around winter), slower when
            far (aphelion / around summer) — which is why some months pass more quickly. Because
            the pole is tilted {fmt(23.5)}°, solstices give long/short days and equinoxes give
            equal day and night.
          </>,
        )}
      </p>
      <div className={edControls}>
        <div className={edReadout}>
          <div className={edRo}>
            <span className={edRoK}>{bilingualText(lang, "माध्य कोण (वर्ष)", "Mean angle (year)")}</span>
            <span className={edRoV({ mono: true })}>{fmt(Math.round(meanDeg))}°</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{bilingualText(lang, "वर्षको दिन (लगभग)", "Day of year (approx)")}</span>
            <span className={edRoV({ mono: true })}>{fmt(dayOfYear)}</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{bilingualText(lang, "घटना · ऋतु", "Event · season")}</span>
            <span className={edRoV({ amber: true })}>{orbitEvent(meanDeg, isEn)}</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>{bilingualText(lang, "सूर्यदेखि दूरी", "Distance from Sun")}</span>
            <span className={edRoV({ mono: true })}>
              {orbit.speed > 1.02 ? bilingualText(lang, "नजिक · छिटो", "Near · fast") : orbit.speed < 0.98 ? bilingualText(lang, "टाढा · ढिलो", "Far · slow") : bilingualText(lang, "मध्यम", "Medium")}
            </span>
          </div>
        </div>
        <div className={edScrubWrap}>
          <button
            type="button"
            className={edPlayBtn}
            onClick={() => setPlaying((p) => !p)}
            title={playing ? bilingualText(lang, "रोक्नुहोस्", "Pause") : bilingualText(lang, "चलाउनुहोस्", "Play")}
            aria-label={playing ? bilingualText(lang, "रोक्नुहोस्", "Pause") : bilingualText(lang, "चलाउनुहोस्", "Play")}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <input
            className={edScrub}
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
        <div className={edPresets}>
          {ORBIT_MARKERS.map((m) => {
            const preset = ORBIT_PRESETS.find((p) => p.ne === m.ne)!;
            return (
              <button
                key={m.ne}
                type="button"
                className={edPreset(
                  Math.abs((((meanDeg - preset.meanDeg + 180) % 360) + 360) % 360 - 180) < 8,
                )}
                onClick={() => {
                  setPlaying(false);
                  setMeanDeg(preset.meanDeg);
                }}
              >
                {bilingualText(lang, m.ne, m.en)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
