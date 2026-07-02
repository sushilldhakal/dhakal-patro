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
import { patroWheelShell } from "@/lib/patro-classes";
import {
  horaCompassEn,
  horaCompassNep,
  horaGlowAmber,
  horaGlowTeal,
  horaGlowViolet,
  horaGridBg,
  horaHubDay,
  horaHubNum,
  horaHubRom,
  horaHubRuler,
  horaSeg,
  horaSegText,
  horaStage,
  horaTheme,
  horaTickline,
} from "@/lib/hora-classes";
import { cn } from "@/lib/utils";
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
      <text className={horaCompassNep} x={x} y={y - 2} textAnchor="middle">
        {nep}
      </text>
      <text className={horaCompassEn} x={x} y={y + 15} textAnchor="middle">
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
    <div className={cn(horaTheme, patroWheelShell)}>
      <div className={horaStage}>
        <div className={horaGlowTeal} />
        <div className={horaGlowViolet} />
        <div className={horaGlowAmber} />
        <div className={horaGridBg} />

        <div className="relative z-[2] flex flex-col items-center gap-7 px-6 pt-8 pb-[100px] text-center max-sm:gap-5 max-sm:px-4 max-sm:pt-5 max-sm:pb-24">
          <div className="w-full max-w-[640px]">
            <div className="flex items-center justify-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-secondary before:h-px before:w-[22px] before:bg-secondary/70 before:content-[''] dark:text-[var(--hora-yellow)] dark:before:bg-[var(--hora-yellow)]/70">
              {pick("होरा · ग्रहीय होरा", "Hora · Planetary Hours")}
            </div>
            <h2 className="mt-3.5 text-[clamp(28px,4vw,40px)] font-bold leading-tight tracking-tight text-foreground dark:text-[var(--hora-ink)]">
              {pick("एक हप्ता,", "One week,")}
              <br />
              <span className="text-secondary dark:text-[var(--hora-yellow)]">{pick("निरन्तर होरा", "unbroken hora")}</span>
            </h2>
            {pick(
              <p className="mx-auto mt-3.5 max-w-[600px] text-sm leading-relaxed text-muted-foreground dark:text-[var(--hora-ink-dim)] [&_em]:italic [&_em]:text-foreground dark:[&_em]:text-[var(--hora-ink)] [&_span]:font-semibold [&_span]:text-foreground dark:[&_span]:text-[var(--hora-ink)]">
                हरेक वलय एउटै दिन हो — सात ग्रहले पालो–पालोमा शासन गर्ने चौबीस{" "}
                <em>होरा</em>। सूर्योदयपछिको <em>पहिलो</em> होराको ग्रहले दिनको नाम दिन्छ। गणना
                कहिल्यै रोकिँदैन: <span>आइतबार</span>को अन्तिम होरा{" "}
                <span>सोम</span>मा गुड्छ र{" "}
                <span>सोमबार</span> खोल्छ। केन्द्रबाट बाहिरतिर —{" "}
                <span>आदित्य → शनि</span> — हप्ताभरि सर्पिल अनुसरण गर्नुहोस्।
              </p>,
              <p className="mx-auto mt-3.5 max-w-[600px] text-sm leading-relaxed text-muted-foreground dark:text-[var(--hora-ink-dim)] [&_em]:italic [&_em]:text-foreground dark:[&_em]:text-[var(--hora-ink)] [&_span]:font-semibold [&_span]:text-foreground dark:[&_span]:text-[var(--hora-ink)]">
                Each ring is one day — twenty-four <em>horas</em> ruled in turn by the seven
                planets. The planet of the <em>first</em> hora after sunrise gives the day its
                name. The count never stops: the last hora of{" "}
                <span>Sunday</span> rolls into{" "}
                <span>Monday</span> and opens{" "}
                <span>Monday</span>. Follow the spiral from the centre
                outward — <span>Sun → Saturn</span> — across the week.
              </p>,
            )}
          </div>

          <div className="relative mx-auto aspect-[960/900] w-full max-w-[640px]">
            <svg viewBox="0 0 960 900" className="block h-full w-full" preserveAspectRatio="xMidYMid meet">
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
                      className={horaSeg}
                      style={{
                        opacity: passed ? 1 : 0.07,
                        filter: active
                          ? "brightness(1.2) drop-shadow(0 0 10px rgba(255,255,255,.22))"
                          : undefined,
                      }}
                    />
                    <line
                      className={horaTickline}
                      x1={c.tick.x1}
                      y1={c.tick.y1}
                      x2={c.tick.x2}
                      y2={c.tick.y2}
                      opacity={0.3}
                    />
                    {c.label && (
                      <g className={horaSegText} style={{ opacity: passed ? 1 : 0 }}>
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

              <text className={horaHubDay} x={HORA_CX} y={HORA_CY + 2} textAnchor="middle">
                {pick(week.day, week.en)}
              </text>
              <text className={horaHubRom} x={HORA_CX} y={HORA_CY + 20} textAnchor="middle">
                {pick(week.rom, ruler.en)}
              </text>
              <text className={horaHubNum} x={HORA_CX} y={HORA_CY + 42} textAnchor="middle">
                HORĀ {horaPad(gii + 1)} / 24
              </text>
              <text
                className={horaHubRuler}
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

          <div className="w-full max-w-[440px] text-left">
            <div className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-[var(--hora-ink-faint)]">
              {pick("सात दिन · भित्र → बाहिर", "Seven days · inner → outer")}
            </div>
            {HORA_WEEK.map((w, i) => {
              const P = HORA_PLANETS[w.ruler];
              return (
                <div className="flex items-center gap-2.5 py-1.5" key={w.day}>
                  <span className="w-5 shrink-0 text-center text-[10px] font-semibold font-num text-muted-foreground dark:text-[var(--hora-ink-faint)]">
                    {i + 1}
                  </span>
                  <span className="grid h-[30px] w-[30px] shrink-0 place-items-center">
                    <PlanetIcon planet={w.ruler} size={30} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-px">
                    <span className="font-semibold text-foreground dark:text-[var(--hora-ink)]">{pick(w.day, w.en)}</span>
                    <span className="text-[10.5px] text-muted-foreground dark:text-[var(--hora-ink-faint)]">
                      {pick(`${w.rom} · ${HORA_DEVA[w.ruler]} ${P.nep}`, `${P.en} · ${P.nep}`)}
                    </span>
                  </span>
                  <span className="h-[7px] w-[38px] shrink-0 rounded-full" style={{ background: P.color }} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 z-[5] flex w-[min(720px,calc(100%-32px))] -translate-x-1/2 items-center gap-3.5 rounded-full border border-border bg-card/95 px-3.5 py-2.5 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-[rgba(13,16,22,0.82)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
          <button
            type="button"
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border-0 bg-primary text-primary-foreground transition-[transform,filter] hover:brightness-105 active:translate-y-px active:scale-95 dark:bg-[var(--hora-yellow)] dark:text-[#1a1408] dark:hover:bg-[#ffe24a] dark:hover:brightness-100"
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
            className="relative flex h-8 flex-1 cursor-pointer touch-none items-center"
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
            <div className="pointer-events-none absolute inset-x-0 h-[5px]">
              {Array.from({ length: HORA_NRINGS - 1 }, (_, i) => (
                <span
                  key={i}
                  className="absolute top-0 h-[5px] w-px bg-foreground/28 dark:bg-white/30"
                  style={{ left: `${((i + 1) / HORA_NRINGS) * 100}%` }}
                />
              ))}
            </div>
            <div className="absolute inset-x-0 h-[5px] overflow-hidden rounded-full bg-foreground/14 dark:bg-white/12">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#f6a623] to-secondary dark:to-[var(--hora-yellow)]"
                style={{ width: `${prog * 100}%` }}
              />
            </div>
            <div
              className="pointer-events-none absolute h-[13px] w-[13px] -translate-x-1/2 rounded-full border-2 border-secondary bg-card shadow-sm dark:border-0 dark:bg-white dark:shadow-[0_0_10px_rgba(255,215,10,0.8)]"
              style={{ left: `${prog * 100}%` }}
            />
          </div>
          <div className="min-w-0 shrink-0 text-right text-[11.5px] font-medium font-num tabular-nums text-muted-foreground dark:text-[var(--hora-ink-dim)] [&_b]:font-semibold [&_b]:text-foreground dark:[&_b]:text-white">
            <b>{pick(week.day, week.en)}</b> · {pick("होरा", "Hora")} {horaPad(gii + 1)} ·{" "}
            {pick(ruler.nep, ruler.en)}
            {isToday && (
              <span className="text-muted-foreground/80 dark:text-[var(--hora-ink-faint)]">
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
