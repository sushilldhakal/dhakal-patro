/**
 * The sky's compass — a rotary dial docked bottom-centre over the canvas.
 *
 * The web counterpart of the mobile app's `CompassControl`: same three
 * behaviours, `PanResponder` swapped for the Pointer Events API a browser
 * already gives a plain `<div>`.
 *
 * 1. **Drag it.** Spin the dial with a mouse or a finger and the camera's
 *    yaw follows, the same way turning a real compass card under a fixed
 *    lubber line does — N/E/S/W paint on the rotating disc, a fixed pointer
 *    at the top names whichever one you're currently facing.
 * 2. **Double-click/double-tap it.** Toggles AR mode — the back camera
 *    behind the sky, the dial itself switched from something you turn to
 *    something that reports the phone's own heading.
 * 3. **In AR mode**, the dial is read-only: {@link heading} is driven by
 *    `useDeviceOrientation` rather than by pointer drags, so it is always
 *    showing the direction the lens is actually pointed.
 */

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Camera } from "lucide-react";
import { useLocale, bilingualText } from "@/i18n/locale";
import { COMPASS_POINTS } from "@/lib/sky3d/sky-geometry";
import { normalizeDeg } from "@/lib/sky3d/geocentric-model";

const DIAL_SIZE = 84;
const RADIUS = DIAL_SIZE / 2;
/** A drag shorter than this, released quickly, reads as a tap rather than a spin. */
const TAP_SLOP_PX = 6;
const DOUBLE_TAP_MS = 320;

const POINTS = COMPASS_POINTS.filter((p) => p.major);

export function CompassControl({
  heading,
  onHeadingChange,
  arMode,
  onToggleArMode,
  visible = true,
}: {
  /** Degrees, 0 = north, clockwise — the same frame the sky's own az is in. */
  heading: number;
  /** Fired continuously while dragging (ignored while {@link arMode} is on). */
  onHeadingChange: (heading: number) => void;
  arMode: boolean;
  onToggleArMode: () => void;
  /** Hidden outside the horizon view — there is no "facing direction" from space or the globe. */
  visible?: boolean;
}) {
  const { lang } = useLocale();
  const pick = (ne: string, en: string) => bilingualText(lang, ne, en);

  const gesture = useRef({ startAngle: 0, startHeading: 0, moved: 0, pointerId: null as number | null });
  const lastTapAt = useRef(0);

  const angleAt = (clientX: number, clientY: number, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button != null && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    gesture.current = {
      startAngle: angleAt(e.clientX, e.clientY, rect),
      startHeading: heading,
      moved: 0,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (gesture.current.pointerId !== e.pointerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const angle = angleAt(e.clientX, e.clientY, rect);
    gesture.current.moved = Math.max(
      gesture.current.moved,
      Math.abs(angle - gesture.current.startAngle) * (RADIUS * Math.PI / 180),
    );
    if (arMode) return;
    const delta = angle - gesture.current.startAngle;
    onHeadingChange(normalizeDeg(gesture.current.startHeading + delta));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (gesture.current.pointerId !== e.pointerId) return;
    gesture.current.pointerId = null;
    if (gesture.current.moved > TAP_SLOP_PX) return;
    const now = Date.now();
    if (now - lastTapAt.current < DOUBLE_TAP_MS) {
      lastTapAt.current = 0;
      onToggleArMode();
    } else {
      lastTapAt.current = now;
    }
  };

  if (!visible) return null;

  return (
    <div
      data-sky-controls
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="absolute bottom-3 flex items-center justify-center rounded-full border border-white/20 bg-black/45"
      style={{
        width: DIAL_SIZE,
        height: DIAL_SIZE,
        left: "50%",
        marginLeft: -RADIUS,
        touchAction: "none",
        cursor: arMode ? "default" : "grab",
        userSelect: "none",
      }}
    >
      {/* The lubber line: fixed, names whichever cardinal is currently faced. */}
      <div
        className="pointer-events-none absolute -top-1 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[5px] border-b-[7px] border-x-transparent"
        style={{ borderBottomColor: arMode ? "#f4c542" : "rgba(255,255,255,0.75)" }}
      />

      {/* The card itself: turns opposite the heading, so its printed N/E/S/W stay world-anchored. */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: DIAL_SIZE,
          height: DIAL_SIZE,
          transform: `rotate(${-heading}deg)`,
        }}
      >
        {POINTS.map((p) => {
          const a = (p.az * Math.PI) / 180;
          const r = RADIUS - 14;
          const x = RADIUS + r * Math.sin(a);
          const y = RADIUS - r * Math.cos(a);
          return (
            <span
              key={p.az}
              className="absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[11px] font-bold"
              style={{ left: x, top: y, color: p.az === 0 ? "#ff8a8a" : "rgba(255,255,255,0.85)" }}
            >
              {pick(p.ne, p.en)}
            </span>
          );
        })}
      </div>

      {arMode ? (
        <div className="pointer-events-none absolute -bottom-1 rounded-full bg-black/70 px-1">
          <Camera className="size-2.5" color="#f4c542" />
        </div>
      ) : null}
    </div>
  );
}
