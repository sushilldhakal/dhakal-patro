import { useRef, useState } from "react";
import type { PanchangaDay } from "@/lib/api";
import {
  karanaColor,
  KARANA_SEQ,
  mapElongation,
  moonIllumination,
  tithiIndexFromPanchanga,
  tithiNum,
  tithiPaksha,
  WHEEL_TITHIS,
} from "@/lib/tithi-wheel-data";

const DEG = Math.PI / 180;
const CX = 500;
const CY = 500;

const R = {
  rim: 495,
  karOut: 486,
  karIn: 458,
  bandOut: 452,
  moonIco: 410,
  tnum: 384,
  tname: 352,
  bandIn: 300,
  orbit: 150,
  earth: 24,
} as const;

function normDeg(d: number): number {
  return ((d % 360) + 360) % 360;
}

function moonPhasePath(E: number, r: number): string {
  const e = normDeg(E);
  const rx = Math.abs(Math.cos(e * DEG)) * r;
  const litRight = e <= 180;
  const gibbous = e > 90 && e < 270;
  const outerSweep = litRight ? 1 : 0;
  const termSweep = litRight ? (gibbous ? 1 : 0) : gibbous ? 0 : 1;
  return `M0,${-r} A${r},${r} 0 0 ${outerSweep} 0,${r} A${rx.toFixed(2)},${r} 0 0 ${termSweep} 0,${-r} Z`;
}

function MoonPhase({ E, r }: { E: number; r: number }) {
  const e = normDeg(E);
  return (
    <g>
      <circle cx="0" cy="0" r={r} fill="#11181c" stroke="#4a5a60" strokeWidth="0.8" />
      {e > 2 && e < 358 && <path d={moonPhasePath(E, r)} fill="#eef3f1" />}
    </g>
  );
}

interface RingLabelProps {
  L: number;
  r: number;
  cls: string;
  spin: number;
  size?: number;
  children: React.ReactNode;
}

function RingLabel({ L, r, cls, spin, size, children }: RingLabelProps) {
  const a = normDeg(L + spin);
  const flip = a > 90 && a < 270;
  return (
    <g transform={`rotate(${-(L + spin)} ${CX} ${CY})`}>
      <text
        x={CX}
        y={CY - r}
        textAnchor="middle"
        dominantBaseline="central"
        className={cls}
        style={size ? { fontSize: size } : undefined}
        transform={flip ? `rotate(180 ${CX} ${CY - r})` : undefined}
      >
        {children}
      </text>
    </g>
  );
}

type TithiHover = { type: "tithi"; i: number } | { type: "kar"; k: number };

interface TithiWheelProps {
  p: PanchangaDay;
  num: (n: number | string) => string | number;
  spin: number;
  onSpin: (deg: number) => void;
}

export function TithiWheel({ p, num, spin, onSpin }: TithiWheelProps) {
  const curIdx = tithiIndexFromPanchanga(p);
  const curE = curIdx * 12 + 6;

  const [hover, setHover] = useState<TithiHover | null>(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const [picked, setPicked] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ a: number; s0: number } | null>(null);

  const pol = (L: number, r: number): [number, number] => {
    const a = (L + spin) * DEG;
    return [CX - r * Math.sin(a), CY - r * Math.cos(a)];
  };

  const arcSeg = (L0: number, L1: number, r0: number, r1: number): string => {
    const [x1, y1] = pol(L0, r1);
    const [x2, y2] = pol(L1, r1);
    const [x3, y3] = pol(L1, r0);
    const [x4, y4] = pol(L0, r0);
    return `M${x1},${y1} A${r1},${r1} 0 0 0 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 0 1 ${x4},${y4} Z`;
  };

  const onMove = (e: React.MouseEvent) => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const angleAt = (e: React.PointerEvent) => {
    const r = wrapRef.current!.getBoundingClientRect();
    return (
      Math.atan2(
        e.clientY - (r.top + r.height / 2),
        e.clientX - (r.left + r.width / 2)
      ) / DEG
    );
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = { a: angleAt(e), s0: spin };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    onSpin(dragRef.current.s0 + (angleAt(e) - dragRef.current.a));
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current) e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  };

  const karSegs = [];
  const karHits = [];
  for (let k = 0; k < 60; k++) {
    const E0 = k * 6;
    const E1 = k * 6 + 6;
    const kd = KARANA_SEQ[k]!;
    const L0 = mapElongation(E0);
    const L1 = mapElongation(E1);
    const isCur = k === curIdx * 2 || k === curIdx * 2 + 1;
    karSegs.push(
      <path
        key={`k${k}`}
        d={arcSeg(L0, L1, R.karIn, R.karOut)}
        fill={karanaColor(kd)}
        stroke={isCur ? "var(--w-accent)" : "rgba(0,0,0,.25)"}
        strokeWidth={isCur ? 1.6 : 0.5}
        opacity={isCur ? 1 : 0.92}
      />
    );
    karHits.push(
      <path
        key={`kh${k}`}
        d={arcSeg(L0, L1, R.karIn, R.karOut)}
        className="w-hit"
        onMouseEnter={() => setHover({ type: "kar", k })}
        onMouseLeave={() => setHover(null)}
      />
    );
  }

  const tithiCells = [];
  const tithiHits = [];
  for (let i = 0; i < 30; i++) {
    const Em = i * 12 + 6;
    const Lm = mapElongation(Em);
    const [ix, iy] = pol(Lm, R.moonIco);
    const isCur = i === curIdx;
    const isSel = picked === i;
    const t = WHEEL_TITHIS[i]!;
    tithiCells.push(
      <g key={`t${i}`}>
        {isCur && (
          <circle cx={ix} cy={iy} r="20" fill="none" stroke="var(--w-accent)" strokeWidth="2" />
        )}
        <g transform={`translate(${ix},${iy})`}>
          <MoonPhase E={Em} r={14.5} />
        </g>
        <RingLabel L={Lm} r={R.tnum} cls="w-tw-num" spin={spin}>
          {num(tithiNum(i))}
        </RingLabel>
        <RingLabel
          L={Lm}
          r={R.tname}
          cls={`w-tw-name${isCur || isSel ? " sel" : ""}`}
          spin={spin}
          size={i === 14 || i === 29 ? 12.5 : 11}
        >
          {t.ne}
        </RingLabel>
      </g>
    );
    tithiHits.push(
      <path
        key={`th${i}`}
        d={arcSeg(mapElongation(i * 12), mapElongation(i * 12 + 12), R.bandIn, R.bandOut)}
        className="w-hit"
        onMouseEnter={() => setHover({ type: "tithi", i })}
        onMouseLeave={() => setHover(null)}
        onClick={() => setPicked(picked === i ? null : i)}
      />
    );
  }

  const [mx, my] = pol(mapElongation(curE), R.orbit);

  let tipNode: React.ReactNode = null;
  if (hover) {
    if (hover.type === "tithi") {
      const t = WHEEL_TITHIS[hover.i]!;
      tipNode = (
        <div className="w-tip show" style={{ left: tip.x, top: tip.y }}>
          <div className="w-tip-kind">
            {tithiPaksha(hover.i)} · {num(tithiNum(hover.i))}
          </div>
          <div className="w-tip-title">{t.ne}</div>
          <div className="w-tip-row">
            <span>चन्द्रकला</span>
            <b>{num(moonIllumination(hover.i * 12 + 6))}%</b>
          </div>
        </div>
      );
    } else {
      const kd = KARANA_SEQ[hover.k]!;
      tipNode = (
        <div className="w-tip show" style={{ left: tip.x, top: tip.y }}>
          <div className="w-tip-kind">करण · {num(hover.k + 1)}</div>
          <div className="w-tip-title">{kd.ne}</div>
          <div className="w-tip-row">
            <span>प्रकार</span>
            <b>{kd.fixed ? "स्थिर करण" : "चर करण"}</b>
          </div>
        </div>
      );
    }
  }

  let panel: React.ReactNode = null;
  if (picked !== null) {
    const t = WHEEL_TITHIS[picked]!;
    const k0 = KARANA_SEQ[picked * 2]!;
    const k1 = KARANA_SEQ[picked * 2 + 1]!;
    panel = (
      <>
        <div className="w-panel-head">
          <div className="w-panel-ico" style={{ display: "grid", placeItems: "center" }}>
            <svg viewBox="-18 -18 36 36" width="56" height="56">
              <MoonPhase E={picked * 12 + 6} r={15} />
            </svg>
          </div>
          <div>
            <div className="w-panel-kind">
              {tithiPaksha(picked)} · {num(tithiNum(picked))}
            </div>
            <h2 className="w-panel-title">{t.ne}</h2>
            <div className="w-panel-sub">{t.en}</div>
          </div>
          <button type="button" className="w-panel-close" onClick={() => setPicked(null)} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="w-panel-body">
          <div className="w-dl">
            <div className="w-dl-row">
              <span className="w-dl-k">पक्ष</span>
              <span className="w-dl-v">{tithiPaksha(picked)}</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">चन्द्रकला</span>
              <span className="w-dl-v mono">{num(moonIllumination(picked * 12 + 6))}%</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">करण १</span>
              <span className="w-dl-v">
                {k0.ne}{" "}
                <span style={{ color: "var(--w-ink-dim)" }}>· {k0.fixed ? "स्थिर" : "चर"}</span>
              </span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">करण २</span>
              <span className="w-dl-v">
                {k1.ne}{" "}
                <span style={{ color: "var(--w-ink-dim)" }}>· {k1.fixed ? "स्थिर" : "चर"}</span>
              </span>
            </div>
            {t.moon && (
              <div className="w-dl-row">
                <span className="w-dl-k">पर्व</span>
                <span className="w-dl-v">{t.moon === "full" ? "पूर्णिमा" : "औंसी"}</span>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-svg-wrap" ref={wrapRef} onMouseMove={onMove}>
      <svg
        viewBox="0 0 1000 1000"
        className="w-svg"
        onPointerDown={onDown}
        onPointerMove={onDrag}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <circle cx={CX} cy={CY} r={R.rim} className="w-rim-circle" strokeWidth="1.2" />
        <circle cx={CX} cy={CY} r={R.karIn} className="w-rim-circle" strokeWidth="0.7" opacity="0.5" />
        <circle cx={CX} cy={CY} r={R.bandIn} className="w-rim-circle" strokeWidth="0.8" opacity="0.5" />
        <circle cx={CX} cy={CY} r={R.orbit} className="w-orbit" />

        {karSegs}
        {tithiCells}

        <circle cx={mx} cy={my} r="13" fill="#11181c" />
        <g transform={`translate(${mx},${my})`}>
          <MoonPhase E={curE} r={12} />
        </g>
        <line x1={CX} y1={CY} x2={mx} y2={my} className="w-core-sep" style={{ opacity: 0.5 }} />
        <circle cx={CX} cy={CY} r={R.earth} fill="#1f6f63" />
        <circle cx={CX} cy={CY} r={R.earth} fill="none" stroke="#9fe0c8" strokeWidth="1.2" opacity="0.5" />
        <text
          x={CX}
          y={CY + 1}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 22, fill: "#bdeede" }}
        >
          ♁
        </text>

        {karHits}
        {tithiHits}

        <RingLabel L={92} r={R.bandIn - 22} cls="w-tw-paksha" spin={spin}>
          शुक्ल पक्ष
        </RingLabel>
        <RingLabel L={268} r={R.bandIn - 22} cls="w-tw-paksha" spin={spin}>
          कृष्ण पक्ष
        </RingLabel>
      </svg>

      {tipNode}
      <div
        className={`w-panel${picked !== null ? " open" : ""}`}
        style={{ pointerEvents: picked !== null ? "auto" : "none" }}
      >
        {panel}
      </div>
    </div>
  );
}
