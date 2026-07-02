import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PanchangaDay } from "@/lib/api";
import { Pause, Play } from "lucide-react";
import {
  HORA_CX,
  HORA_CY,
  HORA_DEVA,
  HORA_NRINGS,
  HORA_PLANETS,
  HORA_R_HUB,
  HORA_R_OUT0,
  HORA_SEG,
  HORA_TOTAL,
  HORA_WEEK,
  HORA_WEEK_MS,
  horaPad,
  horaPol,
  horaProgFromRingHora,
  horaRingFromJsDay,
  horaRingInner,
  horaRingMid,
  horaRingOuter,
  horaRingSeq,
  horaRulerAt,
  horaSegPath,
  horaTextArc,
  type HoraPlanetKey,
} from "@/lib/hora-data";
import { minutesSinceMidnightInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import { useLocale } from "@/i18n/locale";
import { buildWheelDetail } from "@/lib/wheel-data";
import { PlanetIcon } from "./hora/PlanetIcon";

const LS_KEY = "dhakalHoraRing.v1";

interface HoraCell {
  order: number;
  ring: number;
  horaIdx: number;
  planet: HoraPlanetKey;
  pathD: string;
  tick: { x1: number; y1: number; x2: number; y2: number };
  label?: {
    pathId: string;
    pathD: string;
    name: string;
    fontSize: number;
    fill: string;
  };
}

interface Props {
  p: PanchangaDay;
  isToday?: boolean;
  timezone?: string;
}

function loadState(): { prog: number; playing: boolean } {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || "{}") as {
      prog?: number;
      playing?: boolean;
    };
    return {
      prog: typeof s.prog === "number" ? s.prog : 0,
      playing: typeof s.playing === "boolean" ? s.playing : false,
    };
  } catch {
    return { prog: 0, playing: false };
  }
}

function initialProg(scrubG?: number, isToday?: boolean): number {
  if (isToday && scrubG != null) {
    const ring = horaRingFromJsDay(new Date().getDay());
    const horaIdx = Math.min(23, Math.floor((scrubG / 60) * 24));
    return horaProgFromRingHora(ring, horaIdx);
  }
  return loadState().prog;
}

function CompassMarker({ deg, nep, en }: { deg: number; nep: string; en: string }) {
  const r = HORA_R_OUT0 + 34;
  const [x, y] = horaPol(r, deg);
  const [nx0, ny0] = horaPol(HORA_R_OUT0 + 4, deg);
  const [nx1, ny1] = horaPol(HORA_R_OUT0 + 14, deg);
  return (
    <g>
      <text className="hora-compass-nep" x={x} y={y - 2} textAnchor="middle">
        {nep}
      </text>
      <text className="hora-compass-en" x={x} y={y + 15} textAnchor="middle">
        {en}
      </text>
      <line
        x1={nx0}
        y1={ny0}
        x2={nx1}
        y2={ny1}
        stroke="rgba(255,255,255,.3)"
        strokeWidth="1.4"
      />
    </g>
  );
}

export function HoraRing({ p, isToday, timezone }: Props) {
  const { pick, digits } = useLocale();
  const det = useMemo(() => buildWheelDetail(p), [p]);
  const tz = resolveTimeZone(p?.location?.timezone, timezone);
  const [now, setNow] = useState(() => new Date());

  const scrubG = useMemo(() => {
    const mins = minutesSinceMidnightInTimezone(now, tz, true);
    let g = (mins - det.sunriseMin) / 24;
    if (g < 0) g += 60;
    return Math.max(0, Math.min(60, g));
  }, [now, det.sunriseMin, tz]);

  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [isToday]);

  const saved = loadState();
  const [prog, setProg] = useState(() => initialProg(scrubG, isToday));
  const [playing, setPlaying] = useState(saved.playing);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastRef = useRef(performance.now());
  const saveTimerRef = useRef(0);

  const cells = useMemo(() => {
    const out: HoraCell[] = [];
    for (let r = 0; r < HORA_NRINGS; r++) {
      const rO = horaRingOuter(r);
      const rI = horaRingInner(r);
      const rM = horaRingMid(r);
      const seq = horaRingSeq(r);
      for (let i = 0; i < 24; i++) {
        const planet = seq[i]!;
        const P = HORA_PLANETS[planet];
        const a0 = i * HORA_SEG + 1.1 / 2;
        const a1 = (i + 1) * HORA_SEG - 1.1 / 2;
        const mid = (a0 + a1) / 2;
        const flip = mid > 90 && mid < 270;
        const [tx0, ty0] = horaPol(rI, a0 - 1.1 / 2);
        const [tx1, ty1] = horaPol(rO, a0 - 1.1 / 2);
        const name = HORA_DEVA[planet];
        const arcLen = (2 * Math.PI * rM * (HORA_SEG - 1.1)) / 360;
        let fs = arcLen / (name.length * 0.62);
        let label: HoraCell["label"];
        if (fs >= 8 || i === 0) {
          fs = Math.max(8, Math.min(13.5, fs));
          const pathId = `hora-tp-${r}-${i}`;
          label = {
            pathId,
            pathD: horaTextArc(rM, a0, a1, flip),
            name,
            fontSize: fs,
            fill: P.text,
          };
        }
        out.push({
          order: r * 24 + i,
          ring: r,
          horaIdx: i,
          planet,
          pathD: horaSegPath(rO, rI, a0, a1),
          tick: { x1: tx0, y1: ty0, x2: tx1, y2: ty1 },
          label,
        });
      }
    }
    return out;
  }, []);

  const labelPaths = useMemo(
    () => cells.filter((c) => c.label).map((c) => ({ id: c.label!.pathId, d: c.label!.pathD })),
    [cells]
  );

  const save = useCallback((p: number, pl: boolean) => {
    localStorage.setItem(LS_KEY, JSON.stringify({ prog: p, playing: pl }));
  }, []);

  const gHora = prog * HORA_TOTAL;
  let gr = Math.floor(gHora / 24);
  if (gr > HORA_NRINGS - 1) gr = HORA_NRINGS - 1;
  const gi = gHora - gr * 24;
  const gii = Math.min(23, Math.floor(gi));
  const leadOrder = Math.min(HORA_TOTAL - 1, Math.floor(gHora));
  const week = HORA_WEEK[gr]!;
  const rulerKey = horaRulerAt(gr, gii);
  const ruler = HORA_PLANETS[rulerKey];
  const [mx, my] = horaPol(horaRingOuter(gr) + 5, gi * HORA_SEG);
  const [dx0, dy0] = horaPol(HORA_R_HUB, 0);
  const [dx1, dy1] = horaPol(HORA_R_OUT0 + 12, 0);

  const scrubAt = useCallback((clientX: number) => {
    const b = trackRef.current?.getBoundingClientRect();
    if (!b) return;
    const p = Math.min(0.99999, Math.max(0, (clientX - b.left) / b.width));
    setProg(p);
    save(p, playing);
  }, [playing, save]);

  useEffect(() => {
    if (!isToday || scrubG == null || draggingRef.current || playing) return;
    const ring = horaRingFromJsDay(new Date().getDay());
    const horaIdx = Math.min(23, Math.floor((scrubG / 60) * 24));
    setProg(horaProgFromRingHora(ring, horaIdx));
  }, [scrubG, isToday, playing]);

  useEffect(() => {
    let frame = 0;
    const loop = (now: number) => {
      const dt = now - lastRef.current;
      lastRef.current = now;
      if (playing) {
        setProg((prev) => {
          let next = prev + dt / HORA_WEEK_MS;
          if (next >= 1) next -= 1;
          saveTimerRef.current += dt;
          if (saveTimerRef.current > 800) {
            saveTimerRef.current = 0;
            save(next, true);
          }
          return next;
        });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, save]);

  const num = (n: number | string) => digits(n);

  return (
    <div className="pn-hora rounded-2xl border border-border overflow-hidden">
      <div className="hora-stage">
        <div className="hora-glow teal" />
        <div className="hora-glow violet" />
        <div className="hora-glow amber" />
        <div className="hora-grid-bg" />

        <div className="hora-layout">
          <div className="hora-intro">
            <div className="hora-eyebrow">{pick("होरा · ग्रहीय होरा", "Hora · Planetary Hours")}</div>
            <h2 className="hora-title">
              {pick("एक हप्ता,", "One week,")}
              <br />
              <span className="hora-title-accent">{pick("निरन्तर होरा", "unbroken hora")}</span>
            </h2>
            {pick(
              <p className="hora-lede">
                हरेक वलय एउटै दिन हो — सात ग्रहले पालो–पालोमा शासन गर्ने चौबीस{" "}
                <em>होरा</em>। सूर्योदयपछिको <em>पहिलो</em> होराको ग्रहले दिनको नाम दिन्छ। गणना
                कहिल्यै रोकिँदैन: <span className="hora-deva">आइतबार</span>को अन्तिम होरा{" "}
                <span className="hora-deva">सोम</span>मा गुड्छ र{" "}
                <span className="hora-deva">सोमबार</span> खोल्छ। केन्द्रबाट बाहिरतिर —{" "}
                <span className="hora-deva">आदित्य → शनि</span> — हप्ताभरि सर्पिल अनुसरण गर्नुहोस्।
              </p>,
              <p className="hora-lede">
                Each ring is one day — twenty-four <em>horas</em> ruled in turn by the seven
                planets. The planet of the <em>first</em> hora after sunrise gives the day its
                name. The count never stops: the last hora of{" "}
                <span className="hora-deva">Sunday</span> rolls into{" "}
                <span className="hora-deva">Monday</span> and opens{" "}
                <span className="hora-deva">Monday</span>. Follow the spiral from the centre
                outward — <span className="hora-deva">Sun → Saturn</span> — across the week.
              </p>,
            )}
          </div>

          <div className="hora-ringwrap">
            <svg viewBox="0 0 960 900" className="hora-ring-svg" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="hora-hubSun" cx="42%" cy="38%" r="68%">
                  <stop offset="0%" stopColor="#ffe79a" />
                  <stop offset="55%" stopColor="#f8b133" />
                  <stop offset="100%" stopColor="#e07d12" />
                </radialGradient>
                <radialGradient id="hora-hubHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(246,166,35,.5)" />
                  <stop offset="55%" stopColor="rgba(246,166,35,.12)" />
                  <stop offset="100%" stopColor="rgba(246,166,35,0)" />
                </radialGradient>
                <filter id="hora-markGlow" x="-150%" y="-150%" width="400%" height="400%">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
                {labelPaths.map((lp) => (
                  <path key={lp.id} id={lp.id} d={lp.d} fill="none" />
                ))}
              </defs>

              <line
                x1={dx0}
                y1={dy0}
                x2={dx1}
                y2={dy1}
                stroke="rgba(255,215,10,.32)"
                strokeWidth="1.2"
                strokeDasharray="3 4"
              />

              {cells.map((c) => {
                const passed = gHora >= c.order;
                const active = c.order === leadOrder;
                const P = HORA_PLANETS[c.planet];
                return (
                  <g key={c.order}>
                    <path
                      d={c.pathD}
                      fill={P.color}
                      className="hora-seg"
                      style={{
                        opacity: passed ? 1 : 0.07,
                        filter: active
                          ? "brightness(1.2) drop-shadow(0 0 10px rgba(255,255,255,.22))"
                          : undefined,
                      }}
                    />
                    <line
                      className="hora-tickline"
                      x1={c.tick.x1}
                      y1={c.tick.y1}
                      x2={c.tick.x2}
                      y2={c.tick.y2}
                      opacity={0.3}
                    />
                    {c.label && (
                      <g className="hora-segtext" style={{ opacity: passed ? 1 : 0 }}>
                        <text
                          textAnchor="middle"
                          fill={c.label.fill}
                          style={{
                            dominantBaseline: "middle",
                            fontSize: `${c.label.fontSize}px`,
                          }}
                        >
                          <textPath href={`#${c.label.pathId}`} startOffset="50%">
                            {c.label.name}
                          </textPath>
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              <CompassMarker deg={0} nep="Sūryodaya" en="Sunrise" />
              <CompassMarker deg={90} nep="Madhyāhna" en="Midday" />
              <CompassMarker deg={180} nep="Sūryāsta" en="Sunset" />
              <CompassMarker deg={270} nep="Madhyarāta" en="Midnight" />

              <g>
                <circle cx={HORA_CX} cy={HORA_CY - 30} r={98} fill="url(#hora-hubHalo)" />
                <g stroke="#f6a623" strokeWidth="2.4" strokeLinecap="round" opacity="0.85">
                  {Array.from({ length: 12 }, (_, i) => {
                    const a = (i * 30 * Math.PI) / 180;
                    const sunR = 27;
                    const r1 = sunR + 5;
                    const r2 = sunR + 13;
                    const cy = HORA_CY - 50;
                    return (
                      <line
                        key={i}
                        x1={HORA_CX + Math.cos(a) * r1}
                        y1={cy + Math.sin(a) * r1}
                        x2={HORA_CX + Math.cos(a) * r2}
                        y2={cy + Math.sin(a) * r2}
                      />
                    );
                  })}
                </g>
                <circle cx={HORA_CX} cy={HORA_CY - 50} r={27} fill="url(#hora-hubSun)" />
              </g>

              <text className="hora-hub-day" x={HORA_CX} y={HORA_CY + 2} textAnchor="middle">
                {pick(week.day, week.en)}
              </text>
              <text className="hora-hub-rom" x={HORA_CX} y={HORA_CY + 20} textAnchor="middle">
                {pick(week.rom, ruler.en)}
              </text>
              <text className="hora-hub-num" x={HORA_CX} y={HORA_CY + 42} textAnchor="middle">
                HORĀ {horaPad(gii + 1)} / 24
              </text>
              <text
                className="hora-hub-ruler"
                x={HORA_CX}
                y={HORA_CY + 78}
                textAnchor="middle"
                fill={ruler.color}
              >
                {pick(HORA_DEVA[rulerKey], ruler.en)}
              </text>

              <circle cx={mx} cy={my} r={15} fill="#ffd70a" opacity={0.5} filter="url(#hora-markGlow)" />
              <circle cx={mx} cy={my} r={10} fill="none" stroke="#ffd70a" strokeWidth="2.4" />
              <circle cx={mx} cy={my} r={6} fill="#fff" />
            </svg>
          </div>

          <div className="hora-legend">
            <div className="hora-legend-head">{pick("सात दिन · भित्र → बाहिर", "Seven days · inner → outer")}</div>
            {HORA_WEEK.map((w, i) => {
              const P = HORA_PLANETS[w.ruler];
              return (
                <div className="hora-lrow" key={w.day}>
                  <span className="hora-lrow-ring">{i + 1}</span>
                  <span className="hora-lrow-ico">
                    <PlanetIcon planet={w.ruler} size={30} />
                  </span>
                  <span className="hora-lrow-names">
                    <span className="hora-deva">{pick(w.day, w.en)}</span>
                    <span className="hora-lrow-rom">
                      {pick(`${w.rom} · ${HORA_DEVA[w.ruler]} ${P.nep}`, `${P.en} · ${P.nep}`)}
                    </span>
                  </span>
                  <span className="hora-lrow-bar" style={{ background: P.color }} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="hora-controls">
          <button
            type="button"
            className="hora-pp"
            aria-label={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
            onClick={() => {
              const next = !playing;
              setPlaying(next);
              save(prog, next);
            }}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div
            className="hora-track"
            ref={trackRef}
            onPointerDown={(e) => {
              draggingRef.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              setPlaying(false);
              scrubAt(e.clientX);
            }}
            onPointerMove={(e) => {
              if (draggingRef.current) scrubAt(e.clientX);
            }}
            onPointerUp={() => {
              draggingRef.current = false;
            }}
          >
            <div className="hora-ticks">
              {Array.from({ length: HORA_NRINGS - 1 }, (_, i) => (
                <i key={i} style={{ left: `${((i + 1) / HORA_NRINGS) * 100}%` }} />
              ))}
            </div>
            <div className="hora-rail">
              <div className="hora-fill" style={{ width: `${prog * 100}%` }} />
            </div>
            <div className="hora-knob" style={{ left: `${prog * 100}%` }} />
          </div>
          <div className="hora-readout">
            <b>{pick(week.day, week.en)}</b> · {pick("होरा", "Hora")} {horaPad(gii + 1)} ·{" "}
            {pick(ruler.nep, ruler.en)}
            {isToday && (
              <span className="hora-readout-ne">
                {" "}
                · {pick(HORA_DEVA[rulerKey], ruler.en)} · {num(gii + 1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
