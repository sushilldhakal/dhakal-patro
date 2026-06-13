import { type ReactElement, useEffect, useMemo, useId, useState } from "react";
import type { PanchangaDay } from "@/lib/api";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { minutesSinceMidnightInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import { buildDayTimelineData, type TimelineRowData } from "./day-timeline-data";

// ─── geometry ────────────────────────────────────────────────────────────────

const CX = 320;
const CY = 320;

function polarToCart(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function donutArc(iR: number, oR: number, a0: number, a1: number): string {
  if (a1 - a0 >= 360) a1 = a0 + 359.98;
  const [ox1, oy1] = polarToCart(oR, a0);
  const [ox2, oy2] = polarToCart(oR, a1);
  const [ix2, iy2] = polarToCart(iR, a1);
  const [ix1, iy1] = polarToCart(iR, a0);
  const lg = a1 - a0 > 180 ? 1 : 0;
  return `M${ox1} ${oy1}A${oR} ${oR} 0 ${lg} 1 ${ox2} ${oy2}L${ix2} ${iy2}A${iR} ${iR} 0 ${lg} 0 ${ix1} ${iy1}Z`;
}

/** Arc path that always flows left-to-right (for textPath). */
function textArcPath(midR: number, a0: number, a1: number): string {
  const mid = (a0 + a1) / 2;
  if (mid > 90 && mid <= 270) {
    // bottom half — reverse direction so text isn't upside-down
    const [x1, y1] = polarToCart(midR, a1);
    const [x2, y2] = polarToCart(midR, a0);
    const lg = a1 - a0 > 180 ? 1 : 0;
    return `M${x1} ${y1}A${midR} ${midR} 0 ${lg} 0 ${x2} ${y2}`;
  }
  const [x1, y1] = polarToCart(midR, a0);
  const [x2, y2] = polarToCart(midR, a1);
  const lg = a1 - a0 > 180 ? 1 : 0;
  return `M${x1} ${y1}A${midR} ${midR} 0 ${lg} 1 ${x2} ${y2}`;
}

function gToDeg(g: number) { return (g / 60) * 360; }

// ─── ring config ─────────────────────────────────────────────────────────────

interface Ring {
  key: string;
  ne: string;
  en: string;
  iR: number;
  oR: number;
  colors: [string, string];   // [even, odd] alternating segment fill
  badColor?: string;
  special?: "earth";
}

const RINGS: Ring[] = [
  // innermost → outermost
  {
    key: "tithi", ne: "तिथि", en: "Tithi",
    iR: 104, oR: 130,
    colors: ["#164e63", "#0e7490"],
  },
  {
    key: "nakshatra", ne: "नक्षत्र", en: "Nakshatra",
    iR: 133, oR: 159,
    colors: ["#1e3a8a", "#1d4ed8"],
  },
  {
    key: "yoga", ne: "योग", en: "Yoga",
    iR: 162, oR: 188,
    colors: ["#134e4a", "#0f766e"],
  },
  {
    key: "karana", ne: "करण", en: "Karana",
    iR: 191, oR: 217,
    colors: ["#4c1d95", "#6d28d9"],
    badColor: "#7f1d1d",
  },
  {
    key: "lagna", ne: "लग्न", en: "Lagna",
    iR: 220, oR: 246,
    colors: ["#1e1b4b", "#3730a3"],
  },
  {
    key: "graha", ne: "ग्रह", en: "Graha",
    iR: 249, oR: 275,
    colors: ["#451a03", "#92400e"],
  },
  {
    key: "earth", ne: "पृथ्वी", en: "Earth",
    iR: 278, oR: 304,
    colors: ["#92400e", "#1e3a5f"],
    special: "earth",
  },
];

// ─── segment helpers ──────────────────────────────────────────────────────────

interface Seg { fromG: number; toG: number; label: string; idx: number; bad?: boolean }

function rowToSegs(row: TimelineRowData): Seg[] {
  const out: Seg[] = [];
  let prev = 0;
  for (let i = 0; i < row.items.length; i++) {
    const it = row.items[i]!;
    const toG = it.endG != null ? Math.min(it.endG, 60) : 60;
    out.push({ fromG: prev, toG, label: it.name, idx: i, bad: it.bad });
    prev = toG;
  }
  return out;
}

// ─── inner: planet glows ─────────────────────────────────────────────────────

const PLANET_COLORS: Record<string, string> = {
  सूर्य: "#fbbf24", चन्द्र: "#e2e8f0", मंगल: "#ef4444",
  बुध: "#84cc16",   बृहस्पति: "#f97316", शुक्र: "#f9a8d4",
  शनि: "#94a3b8",   राहु: "#9333ea",     केतु: "#6366f1",
};
const PLANET_SYM: Record<string, string> = {
  सूर्य: "☉", चन्द्र: "☽", मंगल: "♂", बुध: "☿",
  बृहस्पति: "♃", शुक्र: "♀", शनि: "♄", राहु: "☊", केतु: "☋",
};

// ─── main component ───────────────────────────────────────────────────────────

interface Props {
  p: PanchangaDay;
  dateAd?: string;
  isToday?: boolean;
  timezone?: string;
  needleClock?: string;
}

export function PanchangaCircularDiagram({ p, dateAd, isToday, timezone, needleClock }: Props) {
  const uid = useId().replace(/:/g, "");
  const [now, setNow] = useState(() => new Date());
  const tz = resolveTimeZone(p?.location?.timezone, timezone);

  useEffect(() => {
    if (!isToday && !needleClock) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isToday, needleClock]);

  const tl = useMemo(() => buildDayTimelineData(p, dateAd), [p, dateAd]);

  const needleG = useMemo(() => {
    if (needleClock) {
      const [hh, mm] = needleClock.split(":").map(Number);
      if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
        const mins = hh * 60 + (mm ?? 0);
        let g = (mins - (tl?.sunriseMin ?? 0)) / 24;
        if (g < 0) g += 60;
        return Math.min(g, 60);
      }
    }
    if (isToday) {
      const mins = minutesSinceMidnightInTimezone(now, tz, true);
      let g = (mins - (tl?.sunriseMin ?? 0)) / 24;
      if (g < 0) g += 60;
      return Math.min(g, 60);
    }
    return null;
  }, [now, isToday, needleClock, tl, tz]);

  if (!tl) return null;

  const rowMap: Record<string, TimelineRowData | undefined> = {
    tithi:     tl.rows.find((r) => r.label === "तिथि"),
    nakshatra: tl.rows.find((r) => r.label === "नक्षत्र"),
    yoga:      tl.rows.find((r) => r.label === "योग"),
    karana:    tl.rows.find((r) => r.label === "करण"),
    lagna:     tl.rows.find((r) => r.label === "लग्न"),
    graha:     tl.rows.find((r) => r.label === "ग्रह"),
  };

  const needleDeg = needleG != null ? gToDeg(needleG) : null;
  const gh = needleG != null ? Math.floor(needleG) : null;
  const pa = needleG != null ? Math.floor((needleG - Math.floor(needleG)) * 60) : null;

  // planets for center display
  const planets = tl.grahaSpashta.filter((pl) => pl.rashiNe);

  // 24-hour civil time ticks
  const HOUR_TICKS = Array.from({ length: 24 }, (_, i) => i);
  // Ghati labels every 10 ghati
  const GHATI_LABELS = [0, 10, 20, 30, 40, 50];

  return (
    <div
      className="rounded-2xl border border-border overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #091520 100%)" }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/70">
            पञ्चाङ्ग चक्र · Vedic Day Wheel
          </div>
          <div className="text-[13px] font-semibold text-white/80 mt-0.5">
            {tl.weekdayNe} · {tl.sunriseLabel} उदय — {tl.sunsetLabel} अस्त
          </div>
        </div>
        {gh != null && pa != null && (
          <div className="text-right">
            <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest">अहिले</div>
            <div className="font-mono text-[22px] font-bold leading-none text-white tabular-nums">
              {toNepaliDigits(String(gh).padStart(2, "0"))}
              <span className="text-white/30">:</span>
              {toNepaliDigits(String(pa).padStart(2, "0"))}
            </div>
            <div className="text-[9px] text-cyan-400/60">घडी : पला</div>
          </div>
        )}
      </div>

      {/* SVG diagram */}
      <div className="flex justify-center px-2 pb-3">
        <svg
          viewBox="0 0 640 640"
          width="100%"
          style={{ maxWidth: 560 }}
          aria-label="Panchanga day wheel"
        >
          <defs>
            {/* Radial background gradient */}
            <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0d2137" />
              <stop offset="60%" stopColor="#091520" />
              <stop offset="100%" stopColor="#060d14" />
            </radialGradient>
            {/* Center glow */}
            <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a4a6b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0a1628" stopOpacity="0" />
            </radialGradient>
            {/* Needle glow filter */}
            <filter id={`${uid}-needle-glow`}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Text arc paths (generated per ring segment) */}
            {RINGS.map((ring) => {
              if (ring.special === "earth") return null;
              const row = rowMap[ring.key];
              if (!row) return null;
              const segs = rowToSegs(row);
              const midR = (ring.iR + ring.oR) / 2 + 2;
              return segs.map((seg, si) => {
                const a0 = gToDeg(seg.fromG);
                const a1 = gToDeg(seg.toG);
                if (a1 - a0 < 14) return null;
                return (
                  <path
                    key={`${ring.key}-tp-${si}`}
                    id={`${uid}-${ring.key}-arc-${si}`}
                    d={textArcPath(midR, a0, a1)}
                    fill="none"
                  />
                );
              });
            })}

            {/* Earth ring text arcs */}
            <path id={`${uid}-earth-day-arc`}
              d={textArcPath((RINGS[6]!.iR + RINGS[6]!.oR) / 2, 0, gToDeg(tl.dayG))}
              fill="none" />
            <path id={`${uid}-earth-night-arc`}
              d={textArcPath((RINGS[6]!.iR + RINGS[6]!.oR) / 2, gToDeg(tl.dayG), 360)}
              fill="none" />
          </defs>

          {/* Background */}
          <circle cx={CX} cy={CY} r={320} fill={`url(#${uid}-bg)`} />

          {/* Subtle radial grid lines */}
          {Array.from({ length: 12 }, (_, i) => {
            const [x, y] = polarToCart(305, i * 30);
            return (
              <line key={i} x1={CX} y1={CY} x2={x} y2={y}
                stroke="#ffffff06" strokeWidth={1} />
            );
          })}

          {/* ── Rings ── */}
          {RINGS.map((ring) => {
            /* Earth ring: day/night */
            if (ring.special === "earth") {
              const dayDeg = gToDeg(tl.dayG);
              const earthMidR = (ring.iR + ring.oR) / 2;
              return (
                <g key="earth">
                  <path d={donutArc(ring.iR, ring.oR, 0, dayDeg)}
                    fill="#92400e" opacity={0.9} />
                  <path d={donutArc(ring.iR, ring.oR, dayDeg, 360)}
                    fill="#0c1f3a" opacity={0.95} />
                  {/* divider radii */}
                  {[0, dayDeg].map((deg) => {
                    const [x1, y1] = polarToCart(ring.iR, deg);
                    const [x2, y2] = polarToCart(ring.oR, deg);
                    return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#ffffff40" strokeWidth={1.5} />;
                  })}
                  {/* day/night labels */}
                  <text fontSize={9.5} fill="#fcd34d" fontWeight="bold">
                    <textPath href={`#${uid}-earth-day-arc`} startOffset="25%" textAnchor="middle">
                      ☀ दिन
                    </textPath>
                  </text>
                  <text fontSize={9.5} fill="#93c5fd" fontWeight="bold">
                    <textPath href={`#${uid}-earth-night-arc`} startOffset="25%" textAnchor="middle">
                      ☾ रात
                    </textPath>
                  </text>
                  {/* sunrise dot */}
                  {(() => {
                    const [sx, sy] = polarToCart(earthMidR, 0);
                    return <circle cx={sx} cy={sy} r={5} fill="#fbbf24"
                      filter={`url(#${uid}-needle-glow)`} />;
                  })()}
                  {/* sunset dot */}
                  {(() => {
                    const [sx, sy] = polarToCart(earthMidR, dayDeg);
                    return <circle cx={sx} cy={sy} r={5} fill="#f97316"
                      filter={`url(#${uid}-needle-glow)`} />;
                  })()}
                </g>
              );
            }

            /* Regular anga ring */
            const row = rowMap[ring.key];
            if (!row) {
              return (
                <circle key={ring.key} cx={CX} cy={CY}
                  r={(ring.iR + ring.oR) / 2}
                  fill="none" stroke="#ffffff08"
                  strokeWidth={ring.oR - ring.iR} />
              );
            }

            const segs = rowToSegs(row);
            return (
              <g key={ring.key}>
                {segs.map((seg, si) => {
                  const a0 = gToDeg(seg.fromG);
                  const a1 = gToDeg(seg.toG);
                  const spanDeg = a1 - a0;
                  const fill = seg.bad && ring.badColor
                    ? ring.badColor
                    : ring.colors[seg.idx % 2];
                  const opacity = seg.idx % 2 === 0 ? 1 : 0.82;

                  const labelEl: ReactElement | null = spanDeg >= 14
                    ? (
                      <text
                        key={`lbl-${si}`}
                        fontSize={spanDeg >= 30 ? 9 : 7.5}
                        fill="rgba(255,255,255,0.85)"
                        fontWeight="500"
                      >
                        <textPath
                          href={`#${uid}-${ring.key}-arc-${si}`}
                          startOffset="50%"
                          textAnchor="middle"
                        >
                          {seg.label.length > 8 ? seg.label.slice(0, 7) + "…" : seg.label}
                        </textPath>
                      </text>
                    )
                    : null;

                  return (
                    <g key={si}>
                      <path d={donutArc(ring.iR, ring.oR, a0, a1)}
                        fill={fill!} opacity={opacity} />
                      {/* segment separator */}
                      {si > 0 && (() => {
                        const [x1, y1] = polarToCart(ring.iR, a0);
                        const [x2, y2] = polarToCart(ring.oR, a0);
                        return <line x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke="#00000060" strokeWidth={1} />;
                      })()}
                      {labelEl}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* ── Ring border circles ── */}
          {RINGS.map((ring) => (
            <circle key={`b-${ring.key}`} cx={CX} cy={CY}
              r={ring.iR - 1.5} fill="none"
              stroke="#ffffff18" strokeWidth={1.5} />
          ))}
          {/* outer border */}
          <circle cx={CX} cy={CY} r={305} fill="none"
            stroke="#ffffff25" strokeWidth={1.5} />

          {/* ── Outer time scale ring ── */}
          {/* 24h civil hour ticks */}
          {HOUR_TICKS.map((h) => {
            const deg = (h / 24) * 360;
            const isMajor = h % 6 === 0;
            const [x1, y1] = polarToCart(306, deg);
            const [x2, y2] = polarToCart(isMajor ? 316 : 311, deg);
            return (
              <line key={h} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isMajor ? "#ffffff60" : "#ffffff30"}
                strokeWidth={isMajor ? 1.5 : 1} />
            );
          })}
          {/* Ghati labels */}
          {GHATI_LABELS.map((g) => {
            const deg = gToDeg(g);
            const [lx, ly] = polarToCart(325, deg);
            const sr = tl.sunriseMin;
            const civil = Math.floor(((sr + g * 24) % 1440) / 60);
            return (
              <text key={g} x={lx} y={ly}
                fontSize={9} fill="#ffffff50"
                textAnchor="middle" dominantBaseline="central"
                style={{ userSelect: "none" }}
              >
                {toNepaliDigits(civil)}
              </text>
            );
          })}

          {/* ── Ring name labels (outside, at 9 o'clock position) ── */}
          {RINGS.map((ring) => {
            const midR = (ring.iR + ring.oR) / 2;
            const [lx, ly] = polarToCart(midR, 270);
            return (
              <text key={`rn-${ring.key}`}
                x={lx - 6} y={ly}
                fontSize={8}
                fill="#ffffff55"
                textAnchor="end"
                dominantBaseline="central"
                style={{ userSelect: "none" }}
              >
                {ring.ne}
              </text>
            );
          })}

          {/* ── Center area ── */}
          <circle cx={CX} cy={CY} r={102} fill="#040d18" />
          <circle cx={CX} cy={CY} r={102} fill={`url(#${uid}-glow)`} />
          <circle cx={CX} cy={CY} r={102} fill="none"
            stroke="#1a4a6b" strokeWidth={1} />

          {/* Faint cross-hairs */}
          <line x1={CX - 95} y1={CY} x2={CX + 95} y2={CY}
            stroke="#ffffff08" strokeWidth={1} />
          <line x1={CX} y1={CY - 95} x2={CX} y2={CY + 95}
            stroke="#ffffff08" strokeWidth={1} />

          {/* Planets as glowing dots arranged in concentric mini-orbits */}
          {planets.slice(0, 9).map((pl, i) => {
            const orbitR = 28 + (i % 3) * 22;
            const angle = (i / Math.max(planets.length, 1)) * 360;
            const [px, py] = polarToCart(orbitR, angle);
            const color = PLANET_COLORS[pl.label] ?? "#94a3b8";
            const sym = PLANET_SYM[pl.label] ?? "●";
            return (
              <g key={pl.label}>
                <circle cx={px} cy={py} r={9}
                  fill={color} opacity={0.15} />
                <circle cx={px} cy={py} r={5}
                  fill={color} opacity={0.6} />
                <text x={px} y={py}
                  fontSize={6.5} fill={color}
                  textAnchor="middle" dominantBaseline="central"
                  style={{ userSelect: "none" }}
                >
                  {sym}
                </text>
              </g>
            );
          })}

          {/* Center time display */}
          {gh != null && pa != null ? (
            <>
              <text x={CX} y={CY - 8}
                fontSize={18} fontWeight="bold" fill="white"
                textAnchor="middle" dominantBaseline="central"
                fontFamily="monospace"
                style={{ userSelect: "none" }}
              >
                {toNepaliDigits(String(gh).padStart(2, "0"))}
                <tspan fill="rgba(255,255,255,0.3)">:</tspan>
                {toNepaliDigits(String(pa).padStart(2, "0"))}
              </text>
              <text x={CX} y={CY + 12}
                fontSize={7.5} fill="rgba(255,255,255,0.4)"
                textAnchor="middle" dominantBaseline="central"
                style={{ userSelect: "none" }}
              >
                घडी:पला
              </text>
            </>
          ) : (
            <text x={CX} y={CY}
              fontSize={22} fill="rgba(255,255,255,0.3)"
              textAnchor="middle" dominantBaseline="central"
            >
              ☉
            </text>
          )}

          {/* ── Clock needle ── */}
          {needleDeg != null && (() => {
            const [nx, ny] = polarToCart(298, needleDeg);
            const [bx, by] = polarToCart(20, needleDeg + 180);
            return (
              <g filter={`url(#${uid}-needle-glow)`}>
                {/* main needle */}
                <line x1={CX} y1={CY} x2={nx} y2={ny}
                  stroke="#ef4444" strokeWidth={1.5} strokeLinecap="round" opacity={0.9} />
                {/* counter-weight */}
                <line x1={CX} y1={CY} x2={bx} y2={by}
                  stroke="#ef4444" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
                {/* pivot */}
                <circle cx={CX} cy={CY} r={4} fill="#ef4444" />
              </g>
            );
          })()}

          {/* Sunrise marker line at top */}
          <line x1={CX} y1={CY - 104} x2={CX} y2={CY - 308}
            stroke="#fbbf2440" strokeWidth={1} strokeDasharray="3 4" />
        </svg>
      </div>

      {/* ── Legend row ── */}
      <div
        className="grid gap-x-4 gap-y-2 px-5 pb-4 pt-1"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}
      >
        {[...RINGS].reverse().map((ring) => (
          <div key={ring.key} className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-sm shrink-0"
              style={{ background: ring.colors[0] }} />
            <span className="text-[11px] font-medium text-white/60 truncate">
              {ring.ne}
            </span>
          </div>
        ))}
        {/* needle legend */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-0.5 rounded bg-red-500 shrink-0" />
          <span className="text-[11px] font-medium text-white/60">अहिले</span>
        </div>
      </div>
    </div>
  );
}
