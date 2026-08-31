import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTranslation } from "react-i18next";
import type { BWall, FloorConcept, HouseConcept, PlannedRoom } from "@/lib/house-plan/types";

const WALL_H = 2.75;
const DOOR_H = 2.1;
const WIN_H = 1.15;
const WIN_SILL = 0.9;
const STOREY_H = 3.05;

type Piece = {
  key: string;
  x: number;
  y: number;
  z: number;
  length: number;
  height: number;
  thickness: number;
  angle: number;
  color: string;
};

function floorTint(kind: PlannedRoom["kind"], id: string): string {
  if (kind === "brahmasthan" && id.startsWith("center_")) return "#7f9a68";
  if (kind === "brahmasthan" || kind === "verandah") return "#c8d0c2";
  if (kind === "foyer" || kind === "hall" || kind === "landing") return "#d7c6a6";
  if (kind === "kitchen") return "#e4cfc0";
  if (kind === "puja") return "#ead9b4";
  if (kind === "toilet" || kind === "bathroom" || kind === "combined") return "#cfd9de";
  if (kind === "staircase") return "#c4beb4";
  return "#efe7d8";
}

function wallEnds(wall: BWall, verts: Map<string, { x: number; y: number }>): { x1: number; y1: number; x2: number; y2: number; len: number } | null {
  const a = verts.get(wall.a);
  const b = verts.get(wall.b);
  if (!a || !b) return null;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 0.05) return null;
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, len };
}

function wallPieces(floor: FloorConcept, ox: number, oz: number, baseY: number): Piece[] {
  const verts = new Map(floor.layer.vertices.map((v) => [v.id, v]));
  const out: Piece[] = [];
  for (const wall of floor.layer.walls) {
    const ends = wallEnds(wall, verts);
    if (!ends) continue;
    const { x1, y1, x2, y2, len } = ends;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const holes = floor.layer.holes.filter((h) => h.wallId === wall.id).sort((a, b) => a.offset - b.offset);
    const cuts = holes.map((h) => ({
      hole: h,
      lo: Math.max(0, h.offset - h.width / 2 / len),
      hi: Math.min(1, h.offset + h.width / 2 / len),
    }));
    let cursor = 0;
    const color = wall.role === "exterior" ? "#c4bdb2" : "#ddd6cc";
    const pushBox = (lo: number, hi: number, y0: number, height: number, suffix: string) => {
      if (hi - lo < 0.012) return;
      const mid = (lo + hi) / 2;
      const length = (hi - lo) * len;
      out.push({
        key: `${wall.id}_${suffix}_${lo.toFixed(3)}`,
        x: x1 + Math.cos(angle) * mid * len - ox,
        y: baseY + y0 + height / 2,
        z: y1 + Math.sin(angle) * mid * len - oz,
        length,
        height,
        thickness: wall.thickness,
        angle: -angle,
        color,
      });
    };
    for (const cut of cuts) {
      pushBox(cursor, cut.lo, 0, WALL_H, "s");
      if (cut.hole.type === "window") {
        const sill = cut.hole.sill ?? WIN_SILL;
        const wh = cut.hole.height ?? WIN_H;
        pushBox(cut.lo, cut.hi, 0, sill, "sill");
        pushBox(cut.lo, cut.hi, sill + wh, WALL_H - (sill + wh), "head");
      } else {
        const dh = Math.min(cut.hole.height ?? DOOR_H, WALL_H - 0.2);
        pushBox(cut.lo, cut.hi, dh, WALL_H - dh, "lintel");
      }
      cursor = cut.hi;
    }
    pushBox(cursor, 1, 0, WALL_H, "e");
  }
  return out;
}

function OrbitCamera({ target, radius }: { target: [number, number, number]; radius: number }) {
  const { camera, gl } = useThree();
  const state = useRef({ theta: 0.85, phi: 0.95, r: radius, drag: false, x: 0, y: 0 });
  useEffect(() => {
    state.current.r = radius;
  }, [radius]);
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      state.current.drag = true;
      state.current.x = e.clientX;
      state.current.y = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!state.current.drag) return;
      state.current.theta -= (e.clientX - state.current.x) * 0.008;
      state.current.phi = Math.min(1.35, Math.max(0.28, state.current.phi + (e.clientY - state.current.y) * 0.008));
      state.current.x = e.clientX;
      state.current.y = e.clientY;
    };
    const up = () => {
      state.current.drag = false;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      state.current.r = Math.min(radius * 2.6, Math.max(radius * 0.4, state.current.r + e.deltaY * 0.018));
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl, radius]);
  useFrame(() => {
    const { theta, phi, r } = state.current;
    camera.position.set(
      target[0] + r * Math.sin(phi) * Math.cos(theta),
      target[1] + r * Math.cos(phi),
      target[2] + r * Math.sin(phi) * Math.sin(theta),
    );
    camera.lookAt(target[0], target[1], target[2]);
  });
  return null;
}

function HouseMesh({ concept }: { concept: HouseConcept }) {
  const ox = concept.width / 2;
  const oz = concept.height / 2;
  const built = useMemo(() => {
    const pieces: Piece[] = [];
    const slabs: { key: string; x: number; z: number; w: number; h: number; y: number; color: string }[] = [];
    const stairs: { key: string; x: number; z: number; w: number; h: number; y: number }[] = [];
    const doors: { key: string; x: number; z: number; y: number; w: number; h: number; angle: number; swing: number }[] = [];
    for (const floor of concept.floors) {
      const baseY = floor.storey * STOREY_H;
      pieces.push(...wallPieces(floor, ox, oz, baseY));
      const verts = new Map(floor.layer.vertices.map((v) => [v.id, v]));
      for (const room of floor.rooms) {
        slabs.push({
          key: `${room.id}-slab`,
          x: room.rect.x + room.rect.w / 2 - ox,
          z: room.rect.y + room.rect.h / 2 - oz,
          w: room.rect.w,
          h: room.rect.h,
          y: baseY + 0.03,
          color: floorTint(room.kind, room.id),
        });
        if (room.kind === "staircase") {
          const steps = 8;
          for (let i = 0; i < steps; i++) {
            const t = (i + 1) / steps;
            stairs.push({
              key: `${room.id}-st${i}`,
              x: room.rect.x + room.rect.w / 2 - ox,
              z: room.rect.y + room.rect.h * (t / 2 + 0.25) - oz,
              w: room.rect.w * 0.86,
              h: room.rect.h * (1 - t * 0.55),
              y: baseY + 0.08 + i * (STOREY_H / steps),
            });
          }
        }
      }
      for (const hole of floor.layer.holes) {
        if (hole.type === "window") continue;
        const wall = floor.layer.walls.find((w) => w.id === hole.wallId);
        if (!wall) continue;
        const ends = wallEnds(wall, verts);
        if (!ends) continue;
        const angle = Math.atan2(ends.y2 - ends.y1, ends.x2 - ends.x1);
        const along = hole.offset * ends.len;
        const hx = ends.x1 + Math.cos(angle) * along - ox;
        const hz = ends.y1 + Math.sin(angle) * along - oz;
        const dh = Math.min(hole.height ?? hole.width * 2, WALL_H - 0.2);
        doors.push({
          key: hole.id,
          x: hx,
          z: hz,
          y: baseY + dh / 2,
          w: hole.width,
          h: dh,
          angle: -angle,
          swing: hole.swing === "right" ? -0.7 : 0.7,
        });
      }
    }
    return { pieces, slabs, stairs, doors };
  }, [concept, ox, oz]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[concept.width + 8, concept.height + 8]} />
        <meshStandardMaterial color="#8ea07a" />
      </mesh>
      {built.slabs.map((slab) => (
        <mesh key={slab.key} position={[slab.x, slab.y, slab.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[slab.w, slab.h]} />
          <meshStandardMaterial color={slab.color} />
        </mesh>
      ))}
      {built.pieces.map((p) => (
        <mesh key={p.key} position={[p.x, p.y, p.z]} rotation={[0, p.angle, 0]} castShadow receiveShadow>
          <boxGeometry args={[p.length, p.height, p.thickness]} />
          <meshStandardMaterial color={p.color} roughness={0.86} />
        </mesh>
      ))}
      {built.doors.map((d) => (
        <mesh
          key={d.key}
          position={[d.x, d.y, d.z]}
          rotation={[0, d.angle + d.swing, 0]}
          castShadow
        >
          <boxGeometry args={[0.04, d.h, d.w]} />
          <meshStandardMaterial color="#8b5a32" roughness={0.7} />
        </mesh>
      ))}
      {built.stairs.map((s) => (
        <mesh key={s.key} position={[s.x, s.y, s.z]} castShadow>
          <boxGeometry args={[s.w, 0.14, s.h]} />
          <meshStandardMaterial color="#b7b0a6" />
        </mesh>
      ))}
      <mesh position={[concept.width / 2 - ox - 0.4, 0.02, -oz - 0.55]}>
        <coneGeometry args={[0.18, 0.45, 7]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
    </group>
  );
}

function Scene({ concept }: { concept: HouseConcept }) {
  const span = Math.max(concept.width, concept.height);
  const height = Math.max(2.2, (concept.floors.length - 1) * STOREY_H + 1.2);
  return (
    <>
      <color attach="background" args={["#d7ddd2"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[12, 18, -8]} intensity={1.15} castShadow />
      <hemisphereLight color="#f3efe6" groundColor="#7f8d70" intensity={0.35} />
      <HouseMesh concept={concept} />
      <OrbitCamera target={[0, height * 0.35, 0]} radius={Math.max(14, span * 1.35)} />
    </>
  );
}

export function HousePlan3D({ concept }: { concept: HouseConcept }) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) {
    return <div className="flex h-80 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">{t("vastu.plan.view.3d")}</div>;
  }
  return (
    <div className="space-y-2">
      <div className="h-[28rem] overflow-hidden rounded-lg border border-border bg-[color-mix(in_srgb,var(--background)_70%,var(--card))]">
        <Canvas shadows camera={{ fov: 42, near: 0.2, far: 80 }} gl={{ antialias: true }}>
          <Scene concept={concept} />
        </Canvas>
      </div>
      <p className="text-xs text-muted-foreground">{t("vastu.plan.view.3d_hint")}</p>
    </div>
  );
}

export default HousePlan3D;
