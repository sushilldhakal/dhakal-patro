import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { EclipseGeometry } from "./EclipseGeometry";
import {
  ECL_RANGE_DAYS,
  SYNODIC_MONTH,
  findEclipses,
  geoFromDay,
  isSolarAlignment,
  lunarEclipseStatus,
  realBeta,
} from "./eclipse-math";

const fmt = (n: string | number) => toNepaliDigits(n);
const RANGE = Math.round(ECL_RANGE_DAYS);

function phaseName(E: number): string {
  if (E < 12 || E > 348) return "अमावस्या";
  if (Math.abs(E - 180) < 12) return "पूर्णिमा";
  return E < 180 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";
}

export function EclipseStudy() {
  const [t, setT] = useState(18);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => (prev + dt * 9) % RANGE);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const events = useMemo(() => findEclipses(RANGE), []);

  const { u, omega, g } = geoFromDay(t);
  const status = lunarEclipseStatus(g);
  const solar = isSolarAlignment(g);
  const monthNo = Math.floor(t / SYNODIC_MONTH) + 1;

  const next = useMemo(() => {
    const after = events.filter((e) => e.t > t + 0.5);
    const list = after.length ? after : events; // wrap to start
    return list[0] ?? null;
  }, [events, t]);

  const jumpNext = (kind: "lunar" | "solar") => {
    const after = events.filter((e) => e.kind === kind && e.t > t + 0.5);
    const target = (after.length ? after : events.filter((e) => e.kind === kind))[0];
    if (target) {
      setPlaying(false);
      setT(target.t);
    }
  };

  const statusText =
    status === "total"
      ? "पूर्ण ग्रहण"
      : status === "partial"
        ? "खण्डग्रास"
        : status === "penumbral"
          ? "उपछाया ग्रहण"
          : solar
            ? "सूर्यग्रहण"
            : "ग्रहण छैन";

  const lunarCount = events.filter((e) => e.kind === "lunar").length;
  const solarCount = events.filter((e) => e.kind === "solar").length;

  return (
    <div className="tm-card pad-lg">
      <EclipseGeometry u={u} omega={omega} />
      <div className="ed-controls">
        <div className="ed-readout">
          <div className="ed-ro">
            <span className="ed-ro-k">दिन · चान्द्र महिना</span>
            <span className="ed-ro-v mono">
              {fmt(Math.round(t))} · {fmt(monthNo)}
            </span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">चन्द्र चरण</span>
            <span className="ed-ro-v">{phaseName(g.E)}</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">चन्द्र अक्षांश β</span>
            <span className="ed-ro-v mono">{fmt(Math.abs(realBeta(g.betaDeg)).toFixed(1))}°</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">अवस्था</span>
            <span
              className={
                "ed-ro-v" +
                (status === "total" || status === "partial"
                  ? " amber"
                  : "")
              }
            >
              {statusText}
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
            max={RANGE}
            step={0.5}
            value={t}
            style={{ "--fill": `${(t / RANGE) * 100}%` } as React.CSSProperties}
            onChange={(e) => {
              setPlaying(false);
              setT(+e.target.value);
            }}
          />
        </div>
        <div className="ed-presets">
          <button type="button" className="ed-preset" onClick={() => jumpNext("lunar")}>
            अर्को चन्द्रग्रहण →
          </button>
          <button type="button" className="ed-preset" onClick={() => jumpNext("solar")}>
            अर्को सूर्यग्रहण →
          </button>
          <button
            type="button"
            className="ed-preset"
            onClick={() => {
              setPlaying(false);
              setT(0);
            }}
          >
            सुरुमा
          </button>
        </div>
      </div>
      <p className="tm-card-cap">
        सूर्यलाई बायाँ स्थिर राखेर हेर्दा <span className="hl-amber">राहु–केतु रेखा</span> ~{fmt(347)}{" "}
        दिनमा एक फेरो घुम्छ। चन्द्रले हरेक ~{fmt(30)} दिनमा पूर्णिमा ल्याउँछ, तर ग्रहण त्यतिबेला
        मात्र हुन्छ जब पूर्णिमा/अमावस्या <b>पात रेखा</b> नजिक पर्छ — वर्षमा झन्डै दुई पटक मात्र
        (<span className="hl">ग्रहण ऋतु</span>)। यो एक वर्षमा {fmt(lunarCount)} चन्द्रग्रहण र{" "}
        {fmt(solarCount)} सूर्यग्रहण देखिन्छन्{next ? `; अर्को ग्रहण ~${fmt(Math.max(0, Math.round(next.t - t)))} दिनमा।` : "।"}
      </p>
    </div>
  );
}
