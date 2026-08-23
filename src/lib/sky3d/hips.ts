/**
 * The Milky Way as a real HiPS survey — DSS2 Color, tiled by CDS off the
 * original Digitized Sky Survey plates — instead of one fixed-resolution
 * panorama. See `public/sky3d/milkyway-hips/properties.txt` for the
 * catalogue's own metadata; every constant below is read from that file,
 * not guessed.
 *
 * This module owns the HEALPix/HiPS math only: tile paths, tile geometry,
 * which tiles a view needs. It renders nothing itself and knows nothing
 * about क्षितिज, ग्रह, or the rest of the scene — `AakashGocharScene.tsx`
 * mounts a group of tiles built from these functions and rotates it exactly
 * the way it already rotates the Milky Way panorama sphere
 * (`equatorialToHorizonMatrix`), so the two stay in perfect agreement
 * without this file needing to know that rotation exists.
 *
 * HEALPix math itself comes from `healpix-ts` (MIT, zero dependencies, a
 * direct port of Górski et al. 2005's reference algorithm) rather than
 * anything hand-rolled — verified against the published order-0 reference
 * values (base pixel 0 centred at RA 45°, Dec +41.8103°) before a single
 * tile was rendered. HiPS itself always uses the NESTED scheme; confirmed
 * both in `stellarium-web-engine`'s own `hips.c` (its `pix*4+i` child
 * relationship is NESTED's own definition) and directly in this survey's
 * `properties.txt`-adjacent behaviour.
 */

import * as THREE from "three";
import {
  order2nside,
  pixcoord2VecNest,
  cornersNestLonLat,
  pix2VecNest,
  maxPixelRadius,
} from "healpix-ts";

/** `hips_tile_width` in `properties.txt` — every tile is a 512×512 JPEG. */
export const HIPS_TILE_WIDTH = 512;

/** `hips_order_min` in `properties.txt`. */
export const HIPS_ORDER_MIN = 0;

/**
 * The deepest order actually downloaded (see `properties.txt`'s own
 * `hips_order = 9` — the survey goes deeper; the local copy does not).
 * Nothing here requests an order past this.
 */
export const HIPS_MAX_LOCAL_ORDER = 3;

/** Where the downloaded tiles live — mirrors the HiPS server's own layout. */
const HIPS_BASE_URL = `${import.meta.env.BASE_URL}sky3d/milkyway-hips`;

/**
 * `obs_copyright` / `hips_copyright` from `properties.txt`, verbatim: the
 * DSS2 Color survey's own required credit line.
 */
export const HIPS_ATTRIBUTION =
  "Digitized Sky Survey — STScI/NASA, Colored & Healpixed by CDS (CNRS/Unistra), ODbL-1.0";

/** How many HEALPix base pixels exist at a given order — `12 · nside²`. */
export function hipsTileCount(order: number): number {
  const nside = order2nside(order);
  return 12 * nside * nside;
}

/**
 * The path a tile's own HiPS metadata says it lives at: `Norder{o}/Dir{d}/
 * Npix{p}.jpg`, `d` rounded down to the nearest 10,000 — the standard HiPS
 * layout, the same one the download script already used, verified by
 * fetching real tiles from the origin server before any of this was
 * written (`Norder0/Dir0/Npix0.jpg` through `Norder3/Dir0/Npix767.jpg`,
 * all 200 OK).
 */
export function hipsTilePath(order: number, pix: number): string {
  const dir = Math.floor(pix / 10000) * 10000;
  return `${HIPS_BASE_URL}/Norder${order}/Dir${dir}/Npix${pix}.jpg`;
}

/** The fallback preview image — the whole order-0–3 sky in one small file. */
export function hipsAllskyPath(): string {
  return `${HIPS_BASE_URL}/Norder${HIPS_MAX_LOCAL_ORDER}/Allsky.jpg`;
}

/**
 * A tile's four corners, RA/Dec degrees, `[north, west, south, east]` —
 * `healpix-ts`'s own `cornersNestLonLat`, with `hips_frame = equatorial`
 * (`properties.txt`) read as [RA, Dec] directly: HEALPix's own "longitude"
 * *is* right ascension for an equatorial-frame survey, no rotation between
 * the two.
 */
export function hipsTileCornersRaDec(order: number, pix: number): [number, number][] {
  const nside = order2nside(order);
  return cornersNestLonLat(nside, pix);
}

/**
 * One tile's geometry, built directly in the same equatorial J2000 unit
 * frame {@link makeMilkyWayGeometry} (`AakashGocharScene.tsx`) already
 * bakes its own sphere in — `pixcoord2VecNest`'s `[X, Y, Z]` uses the
 * identical axis convention (`+Z` the north celestial pole, `+X` toward
 * RA 0°/Dec 0°), confirmed numerically against that function's own formula
 * for a real position (M8: RA 271.5359°, Dec −24.0736°) before this was
 * written. A group of these tiles can therefore share that sphere's own
 * per-frame `equatorialToHorizonMatrix` rotation verbatim — no second
 * coordinate system, no extra rotation to keep in sync.
 *
 * Subdivided into an `n×n` grid rather than one flat quad from the 4
 * corners: a HEALPix pixel is not flat in RA/Dec (most visibly near the
 * poles), and a single quad visibly distorts once the pixel spans more
 * than a few degrees — exactly the failure mode a low `order` tile would
 * hit. `pixcoord2VecNest(nside, pix, ne, nw)` samples the pixel's own true
 * curved interior at every grid vertex instead of interpolating between
 * corners in the wrong (flat) space.
 *
 * UV is `(ne, nw)` directly — HiPS's own per-pixel image layout is a
 * further NESTED subdivision, not a plain grid, so this is the same
 * "naive"/affine approximation real HiPS clients fall back to for quick
 * display (the `hips` Python package's own drawing algorithm does the
 * same thing) rather than a bit-exact per-texel remap. Close, not
 * pixel-perfect — and the one piece of this file that a visual check
 * against a known object (M8 again) can catch and correct if the image
 * comes out mirrored or rotated.
 */
export function buildHipsTileGeometry(
  order: number,
  pix: number,
  radius: number,
  subdivisions = 8,
): THREE.BufferGeometry {
  const nside = order2nside(order);
  const n = Math.max(1, subdivisions);
  const rows = n + 1;
  const positions = new Float32Array(rows * rows * 3);
  const uvs = new Float32Array(rows * rows * 2);
  let vi = 0;
  let ui = 0;
  for (let j = 0; j < rows; j += 1) {
    const nw = j / n;
    for (let i = 0; i < rows; i += 1) {
      const ne = i / n;
      const [x, y, z] = pixcoord2VecNest(nside, pix, ne, nw);
      positions[vi++] = x * radius;
      positions[vi++] = y * radius;
      positions[vi++] = z * radius;
      uvs[ui++] = ne;
      uvs[ui++] = nw;
    }
  }
  const indices: number[] = [];
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const a = j * rows + i;
      const b = a + rows;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * The tile boundary as a closed loop of points on the sphere — for a debug
 * outline, or any other use that wants the pixel's true (curved) edge
 * rather than its 4 corners joined by straight lines.
 */
export function buildHipsTileOutline(
  order: number,
  pix: number,
  radius: number,
  segmentsPerSide = 12,
): THREE.Vector3[] {
  const nside = order2nside(order);
  const out: THREE.Vector3[] = [];
  const edges: [number, number, number, number][] = [
    [0, 0, 1, 0], // south -> east
    [1, 0, 1, 1], // east -> north
    [1, 1, 0, 1], // north -> west
    [0, 1, 0, 0], // west -> south
  ];
  for (const [ne0, nw0, ne1, nw1] of edges) {
    for (let s = 0; s < segmentsPerSide; s += 1) {
      const t = s / segmentsPerSide;
      const ne = ne0 + (ne1 - ne0) * t;
      const nw = nw0 + (nw1 - nw0) * t;
      const [x, y, z] = pixcoord2VecNest(nside, pix, ne, nw);
      out.push(new THREE.Vector3(x * radius, y * radius, z * radius));
    }
  }
  out.push(out[0].clone()); // close the loop exactly, not just approximately
  return out;
}

/* ── LOD selection (Step 7) ──────────────────────────────────────────── */

/**
 * The field of view, degrees, below which a given order takes over —
 * descending, so {@link hipsOrderForFov} can just walk the list and stop at
 * the first one the current field still clears.
 *
 * Chosen off each order's own angular tile size (order 0 ≈ 58.6° a side,
 * halving each order after), aiming for a handful of tiles across the
 * frame rather than one giant tile filling it or dozens of tiny ones: order
 * 0 alone reads as one soft wash once the field drops much past 90°, order
 * 1 the same past roughly 45°, and so on. Matches the brief's own worked
 * examples (180°→order 0, 60°→order 1, 30°→order 2, 10°→order 3) rather
 * than a single continuous formula, the same "tier table" style
 * {@link GRID_TIERS} (`sky-geometry.ts`) already uses for the alt-az cage.
 */
const HIPS_ORDER_BREAKPOINTS: readonly { maxFov: number; order: number }[] = [
  { maxFov: Infinity, order: 0 },
  { maxFov: 90, order: 1 },
  { maxFov: 45, order: 2 },
  { maxFov: 20, order: HIPS_MAX_LOCAL_ORDER },
];

/** Which order best serves a given vertical field of view, degrees. */
export function hipsOrderForFov(fovDeg: number): number {
  let order = HIPS_ORDER_BREAKPOINTS[0].order;
  for (const tier of HIPS_ORDER_BREAKPOINTS) {
    if (fovDeg < tier.maxFov) order = tier.order;
  }
  return Math.min(order, HIPS_MAX_LOCAL_ORDER);
}

/* ── tile visibility (Step 8) ─────────────────────────────────────────── */

/** Half-angle from a tile's centre to its farthest corner, degrees. */
export function hipsTileRadiusDeg(order: number): number {
  return (maxPixelRadius(order2nside(order)) * 180) / Math.PI;
}

/**
 * Every tile at `order` whose centre falls within `coneDeg` (plus the
 * tile's own radius, so a tile is kept the instant any part of it could
 * still be in view rather than only once its centre is) of `dirEquatorial`
 * — the camera's own forward direction, but expressed in the *tiles' own*
 * equatorial frame rather than the horizon frame the camera actually
 * lives in.
 *
 * That one inverse rotation (done once by the caller, not here) is cheaper
 * than rotating every candidate tile's own vector into horizon space to
 * compare against the camera directly, and this file does not need to know
 * the rotation exists either way — see the module doc comment.
 *
 * A conservative test, exactly as the brief allows for: order 3 is at most
 * 768 tiles, cheap enough to walk in full every time the view changes
 * rather than needing a spatial index, and a little margin costs a few
 * extra tiles loaded off-screen, not a hole in the sky.
 */
export function hipsVisibleTiles(
  order: number,
  dirEquatorial: THREE.Vector3,
  coneDeg: number,
): number[] {
  const nside = order2nside(order);
  const n = hipsTileCount(order);
  const limit = coneDeg + hipsTileRadiusDeg(order);
  const cosLimit = Math.cos((limit * Math.PI) / 180);
  const out: number[] = [];
  for (let pix = 0; pix < n; pix += 1) {
    const [x, y, z] = pix2VecNest(nside, pix);
    const cosSep = dirEquatorial.x * x + dirEquatorial.y * y + dirEquatorial.z * z;
    if (cosSep >= cosLimit) out.push(pix);
  }
  return out;
}

/* ── tile lifecycle (Steps 9–11) ──────────────────────────────────────── */

export type HipsTileState = "idle" | "loading" | "ready" | "failed";

/** One tile's live GPU/network state — created lazily, cached by {@link hipsTileKey}, never discarded (see the module doc comment: the whole order 0–3 set is ~45MB, well inside what is safe to keep once fetched). */
export type HipsTileEntry = {
  order: number;
  pix: number;
  state: HipsTileState;
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
};

/** The cache key a tile lives under — `"order/pix"`. */
export function hipsTileKey(order: number, pix: number): string {
  return `${order}/${pix}`;
}

/** How many tile fetches may be in flight at once — see `loadNebulaTexture`'s own identical reasoning in `AakashGocharScene.tsx`; the same trade-off applies here. */
export const HIPS_MAX_CONCURRENT_LOADS = 4;

let hipsLoadsInFlight = 0;

/** How many fetches this module currently has in flight — for a debug HUD. */
export function hipsLoadsInFlightCount(): number {
  return hipsLoadsInFlight;
}

/**
 * Creates (or returns the already-cached) mesh for one tile. Geometry and
 * material only — no texture yet, and the mesh starts invisible; the
 * caller (the scene) owns adding it to its own group and deciding when it
 * should actually show, the same division of labour {@link ensureHipsTile}
 * name is meant to signal: this makes sure the *object* exists, nothing
 * about whether it belongs on screen this frame.
 */
export function ensureHipsTile(
  cache: Map<string, HipsTileEntry>,
  order: number,
  pix: number,
  radius: number,
  subdivisions = 8,
): HipsTileEntry {
  const key = hipsTileKey(order, pix);
  const existing = cache.get(key);
  if (existing) return existing;
  const geometry = buildHipsTileGeometry(order, pix, radius, subdivisions);
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: false,
    /* `BackSide` is what a viewer standing inside the panorama sphere
       wants — same as {@link makeMilkyWayGeometry}'s own sphere — but
       HEALPix base pixels are rotated four different ways around the
       sky (NESTED's own `pixcoord2VecNest` ne/nw axes do not wind the
       same way in every base pixel), so a single fixed triangle index
       order in `buildHipsTileGeometry` cannot match `BackSide`'s
       expected winding for all twelve of them at once. `BackSide` alone
       silently back-face-culled every tile — nothing rendered even
       though position, texture, and the fisheye shader patch were all
       correct (confirmed by forcing `DoubleSide` and watching a `ff00ff`
       debug tint fill the whole dome). `DoubleSide` costs nothing
       noticeable for an 8×8-subdivided patch and needs no per-base-pixel
       winding table. */
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  const entry: HipsTileEntry = { order, pix, state: "idle", mesh, material };
  cache.set(key, entry);
  return entry;
}

/**
 * Starts fetching one tile's texture, the first time anything actually
 * needs it — mirrors `loadNebulaTexture`'s own reasoning in
 * `AakashGocharScene.tsx` almost exactly: lazy, capped concurrency, a
 * failed tile is left `failed` rather than retried every frame.
 */
export function loadHipsTileTexture(entry: HipsTileEntry): void {
  if (entry.state !== "idle") return;
  if (hipsLoadsInFlight >= HIPS_MAX_CONCURRENT_LOADS) return;
  entry.state = "loading";
  hipsLoadsInFlight += 1;
  new THREE.TextureLoader().load(
    hipsTilePath(entry.order, entry.pix),
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      entry.material.map = tex;
      entry.material.needsUpdate = true;
      entry.state = "ready";
      hipsLoadsInFlight = Math.max(0, hipsLoadsInFlight - 1);
    },
    undefined,
    () => {
      entry.state = "failed";
      hipsLoadsInFlight = Math.max(0, hipsLoadsInFlight - 1);
    },
  );
}

/**
 * Step-14 debug HUD data — the scene lives inside the Canvas and this app
 * has no DOM-overlay bridge into it (no `Html` from drei anywhere in this
 * codebase's sky3d tree), while the HUD itself is plain DOM markup drawn by
 * the parent page outside the Canvas. A mutable module singleton is the
 * simplest bridge: the scene overwrites it in place once per frame (only
 * while debug is on), and the HUD polls it on an interval. Deliberately not
 * React state on the write side — this runs inside `useFrame` and must never
 * trigger a re-render of the 3D scene.
 */
export interface HipsDebugSnapshot {
  on: boolean;
  fovDeg: number;
  order: number;
  maxOrder: number;
  tileRadiusDeg: number;
  visibleCount: number;
  readyCount: number;
  loadingCount: number;
  cachedCount: number;
  inFlight: number;
}

const hipsDebugSnapshot: HipsDebugSnapshot = {
  on: false,
  fovDeg: 0,
  order: 0,
  maxOrder: HIPS_MAX_LOCAL_ORDER,
  tileRadiusDeg: 0,
  visibleCount: 0,
  readyCount: 0,
  loadingCount: 0,
  cachedCount: 0,
  inFlight: 0,
};

export function writeHipsDebugSnapshot(next: Omit<HipsDebugSnapshot, "on" | "maxOrder">): void {
  hipsDebugSnapshot.on = true;
  hipsDebugSnapshot.fovDeg = next.fovDeg;
  hipsDebugSnapshot.order = next.order;
  hipsDebugSnapshot.tileRadiusDeg = next.tileRadiusDeg;
  hipsDebugSnapshot.visibleCount = next.visibleCount;
  hipsDebugSnapshot.readyCount = next.readyCount;
  hipsDebugSnapshot.loadingCount = next.loadingCount;
  hipsDebugSnapshot.cachedCount = next.cachedCount;
  hipsDebugSnapshot.inFlight = next.inFlight;
}

export function clearHipsDebugSnapshot(): void {
  hipsDebugSnapshot.on = false;
}

export function readHipsDebugSnapshot(): HipsDebugSnapshot {
  return hipsDebugSnapshot;
}

