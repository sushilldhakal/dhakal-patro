import { useEffect, useMemo, useRef, useState } from "react";
import { motSliderLabel, motSliderRow, tmCardCap, tmCardPadLg, edControls, edPlayBtn, edPresets, edPreset, edReadout, edRo, edRoK, edRoV, edScrubWrap } from "@/lib/learn-classes";
import { Pause, Play } from "lucide-react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { EclipseGeometry } from "./EclipseGeometry";
import {
  ECL_RANGE_DAYS,
  ECLIPSE_YEAR,
  NODE_PLAY_SPEED,
  SYNODIC_MONTH,
  findEclipses,
  geoFromDay,
  isSolarAlignment,
  lunarEclipseStatus,
} from "./eclipse-math";

const fmt = (n: string | number) => toNepaliDigits(n);
const RANGE = Math.round(ECL_RANGE_DAYS);
/** Simulated days per real second for Moon / Earth animation. */
const MOON_PLAY_SPEED = 9;

function phaseName(E: number): string {
  if (E < 12 || E > 348) return "अमावस्या";
  if (Math.abs(E - 180) < 12) return "पूर्णिमा";
  return E < 180 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";
}

export function EclipseStudy() {
  const [t, setT] = useState(18);
  const [precDays, setPrecDays] = useState(18);
  const [playing, setPlaying] = useState(true);
  const [playingNodes, setPlayingNodes] = useState(false);
  const rafMoon = useRef(0);
  const rafNode = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => (prev + dt * MOON_PLAY_SPEED) % RANGE);
      rafMoon.current = requestAnimationFrame(tick);
    };
    rafMoon.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafMoon.current);
  }, [playing]);

  useEffect(() => {
    if (!playingNodes) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPrecDays((prev) => (prev + dt * NODE_PLAY_SPEED) % ECLIPSE_YEAR);
      rafNode.current = requestAnimationFrame(tick);
    };
    rafNode.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafNode.current);
  }, [playingNodes]);

  const events = useMemo(() => findEclipses(RANGE), []);

  const { u, omega, omegaInertial, earthLon, g } = geoFromDay(t, precDays);
  const status = lunarEclipseStatus(g);
  const solar = isSolarAlignment(g);
  const monthNo = Math.floor(t / SYNODIC_MONTH) + 1;
  const nodeCyclePct = precDays / ECLIPSE_YEAR;

  const next = useMemo(() => {
    const after = events.filter((e) => e.t > t + 0.5);
    const list = after.length ? after : events;
    return list[0] ?? null;
  }, [events, t]);

  const jumpNext = (kind: "lunar" | "solar") => {
    const after = events.filter((e) => e.kind === kind && e.t > t + 0.5);
    const target = (after.length ? after : events.filter((e) => e.kind === kind))[0];
    if (target) {
      setPlaying(false);
      setPlayingNodes(false);
      setT(target.t);
      setPrecDays(target.t);
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
    <div className={tmCardPadLg}>
      <EclipseGeometry u={u} omega={omega} omegaInertial={omegaInertial} earthLon={earthLon} />
      <div className={edControls}>
        <div className={edReadout}>
          <div className={edRo}>
            <span className={edRoK}>दिन · चान्द्र महिना</span>
            <span className={edRoV({ mono: true })}>
              {fmt(Math.round(t))} · {fmt(monthNo)}
            </span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>चन्द्र चरण</span>
            <span className={edRoV()}>{phaseName(g.E)}</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>पात कोण ☊</span>
            <span className={edRoV({ mono: true })}>{fmt(Math.round(omegaInertial))}°</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>पात-चक्र</span>
            <span className={edRoV({ mono: true })}>
              {fmt(Math.round(precDays))} दिन · {fmt(Math.round(nodeCyclePct * 100))}%
            </span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>अवस्था</span>
            <span className={edRoV({ amber: status === "total" || status === "partial" })}>
              {statusText}
            </span>
          </div>
        </div>
        <div className={motSliderRow}>
          <span className={motSliderLabel}>☾ चन्द्र · पृथ्वी र चन्द्र (छिटो)</span>
          <div className={edScrubWrap}>
            <button
              type="button"
              className={edPlayBtn}
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
        </div>
        <div className={motSliderRow}>
          <span className={motSliderLabel}>☊ राहु–केतु · पात-चक्र (ढिलो · घडीको दिशा)</span>
          <div className={edScrubWrap}>
            <button
              type="button"
              className={edPlayBtn}
              onClick={() => setPlayingNodes((p) => !p)}
              title={playingNodes ? "रोक्नुहोस्" : "पात चलाउनुहोस्"}
              aria-label={playingNodes ? "रोक्नुहोस्" : "पात चलाउनुहोस्"}
            >
              {playingNodes ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <input
              className="ed-scrub"
              type="range"
              min={0}
              max={ECLIPSE_YEAR}
              step={0.5}
              value={precDays}
              style={{ "--fill": `${(precDays / ECLIPSE_YEAR) * 100}%` } as React.CSSProperties}
              onChange={(e) => {
                setPlayingNodes(false);
                setPrecDays(+e.target.value);
              }}
            />
          </div>
        </div>
        <div className={edPresets}>
          <button type="button" className={edPreset()} onClick={() => jumpNext("lunar")}>
            अर्को चन्द्रग्रहण →
          </button>
          <button type="button" className={edPreset()} onClick={() => jumpNext("solar")}>
            अर्को सूर्यग्रहण →
          </button>
          <button
            type="button"
            className={edPreset()}
            onClick={() => {
              setPlaying(false);
              setPlayingNodes(false);
              setT(0);
              setPrecDays(0);
            }}
          >
            सुरुमा
          </button>
        </div>
      </div>
      <p className={tmCardCap}>
        चन्द्रले ~{fmt(27)} दिनमा एक राशि पार गर्छ; <span className="hl-amber">राहु–केतु</span> भने आकाशमा
        बिस्तारै <b>घडीको दिशामा</b> घुम्छन् (~{fmt(19)}°/वर्ष, ~{fmt(19)} वर्षे पूरा चक्र) — चन्द्रभन्दा लगभग{" "}
        {fmt(250)} गुणा ढिलो। माथिको <b>☾</b> बटनले चन्द्र/पृथ्वी चलाउँछ; <b>☊</b> बटन वा स्लाइडरले मात्र पात
        रेखा सार्छ। ग्रहण तब हुन्छ जब पूर्णिमा/अमावस्या पात रेखा नजिक पर्छ — वर्षमा झन्डै दुई पटक (
        {fmt(lunarCount)} चन्द्र, {fmt(solarCount)} सूर्य यस चक्रमा)।
        {next ? ` अर्को ग्रहण ~${fmt(Math.max(0, Math.round(next.t - t)))} दिनमा।` : ""}
      </p>
    </div>
  );
}
