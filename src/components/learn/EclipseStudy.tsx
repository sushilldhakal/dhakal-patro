import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { EclipseGeometry } from "./EclipseGeometry";
import { lunarEclipseStatus, isSolarAlignment, moonGeo } from "./eclipse-math";

/** Ascending-node longitude presets — “where the Rahu–Ketu line points”. */
const SEASONS = [
  { ne: "ग्रहण ऋतु", sub: "पात रेखा सूर्यतिर", omega: 0 },
  { ne: "सामान्य महिना", sub: "पात रेखा छेउतिर", omega: 90 },
  { ne: "अर्को पात", sub: "केतु सूर्यतिर", omega: 180 },
];

const fmt = (n: number) => toNepaliDigits(n);

function phaseName(E: number): string {
  if (E < 12 || E > 348) return "अमावस्या";
  if (Math.abs(E - 180) < 12) return "पूर्णिमा";
  return E < 180 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";
}

export function EclipseStudy() {
  const [u, setU] = useState(58);
  const [omega, setOmega] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setU((prev) => (prev + dt * 42) % 360);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const g = moonGeo(u, omega);
  const status = lunarEclipseStatus(g);
  const solar = isSolarAlignment(g);

  const statusText =
    status === "total"
      ? "पूर्ण चन्द्रग्रहण — चन्द्र पूरै प्रच्छायामा"
      : status === "partial"
        ? "खण्डग्रास — चन्द्रको केही भाग प्रच्छायामा"
        : status === "penumbral"
          ? "उपछाया ग्रहण — मधुरो अँध्यारो मात्र"
          : solar
            ? "नयाँ चन्द्र पातमा — सूर्यग्रहणको रेखा"
            : "ग्रहण छैन — चन्द्र छायाँभन्दा माथि/तल";

  return (
    <div className="tm-card pad-lg">
      <EclipseGeometry
        u={u}
        omega={omega}
        onU={(v) => {
          setPlaying(false);
          setU(v);
        }}
      />
      <div className="ed-controls">
        <div className="ed-readout">
          <div className="ed-ro">
            <span className="ed-ro-k">चन्द्र चरण</span>
            <span className="ed-ro-v">{phaseName(g.E)}</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">कोणीय दूरी</span>
            <span className="ed-ro-v mono">{fmt(Math.round(g.E))}°</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">चन्द्र अक्षांश β</span>
            <span className="ed-ro-v mono">{fmt(Math.abs(Math.round(g.betaDeg)))}°</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">अवस्था</span>
            <span
              className={
                "ed-ro-v " +
                (status === "total" || status === "partial"
                  ? "amber"
                  : status === "penumbral" || solar
                    ? ""
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
            max={360}
            step={1}
            value={u}
            style={{ "--fill": `${(u / 360) * 100}%` } as React.CSSProperties}
            onChange={(e) => {
              setPlaying(false);
              setU(+e.target.value);
            }}
          />
        </div>
        <div className="ed-presets">
          {SEASONS.map((s) => (
            <button
              key={s.ne}
              type="button"
              className={"ed-preset" + (omega === s.omega ? " on" : "")}
              onClick={() => setOmega(s.omega)}
              title={s.sub}
            >
              {s.ne}
            </button>
          ))}
        </div>
      </div>
      <p className="tm-card-cap">
        <span className="hl-amber">राहु–केतु</span> भनेको चन्द्रको झुकेको कक्ष क्रान्तिवृत्तसँग
        काट्ने दुई बिन्दु (पात) हुन्। चन्द्रग्रहण त्यतिबेला मात्र हुन्छ जब{" "}
        <b>पूर्णिमा</b> यी पातमध्ये कुनै नजिक पर्छ — तब चन्द्र पृथ्वीको{" "}
        <span className="hl">प्रच्छायाँ</span> भित्र छिर्छ। “सामान्य महिना” रोजेर{" "}
        {fmt(360)}° घुमाउनुहोस् — पूर्णिमामा चन्द्र छायाँभन्दा माथि वा तल चुकेको देखिन्छ।
      </p>
    </div>
  );
}
