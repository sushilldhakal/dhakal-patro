/**
 * Stereographic projection for the क्षितिज view — the same mapping Stellarium
 * uses (their status bar's "FOV 235°").
 *
 * Equidistant fisheye drew a *circle* on the screen and threw the rest away:
 * `theta > halfFov` discarded every ray that would have landed in a corner, so
 * zooming out left a disc in a black rectangle. Stereographic does not clip to
 * that disc. Vertical FOV still maps to the top and bottom of the frame; the
 * sides and corners keep going, which is how a 180°+ sky fills a rectangle
 * and still flips as a dome.
 *
 * `r = 2 tan(θ/2)` sends circles on the sphere to circles on the screen, and
 * it is defined past 180° (the antipode is at infinity). The 4×4 projection
 * matrix cannot do this, so the clip is injected into every material and
 * {@link projectHorizon} is the same maths for the DOM labels.
 */

import * as THREE from "three";

export type HorizonFisheyeUniforms = {
  uHorizonFov: { value: number };
  uHorizonAspect: { value: number };
  uHorizonStereo: { value: number };
};

export function createHorizonFisheyeUniforms(): HorizonFisheyeUniforms {
  return {
    uHorizonFov: { value: 90 },
    uHorizonAspect: { value: 1 },
    uHorizonStereo: { value: 0 },
  };
}

/** θ past this and tan(θ/2) blows up — a few degrees short of the antipode. */
const THETA_MAX = 3.0543; // 175°

const CLIP_GLSL = /* glsl */ `
uniform float uHorizonFov;
uniform float uHorizonAspect;
uniform float uHorizonStereo;
vec4 horizonClipPosition(vec4 mvPosition) {
  if (uHorizonStereo < 0.5) {
    return projectionMatrix * mvPosition;
  }
  vec3 p = mvPosition.xyz;
  float rxy = length(p.xy);
  float theta = atan(rxy, -p.z);
  if (theta > 3.0543) {
    return vec4(2.0, 2.0, 2.0, 1.0);
  }
  float halfFov = radians(uHorizonFov) * 0.5;
  /* Stereographic radius. Scale so the *vertical* field hits y = ±1; do not
     also clip x to the same circle — that is what left the black corners.
     Horizontal and diagonal rays are allowed a larger θ, which is how the
     sky fills the rectangle the way Stellarium does. */
  float rSt = 2.0 * tan(theta * 0.5);
  float maxR = 2.0 * tan(max(halfFov, 1e-4) * 0.5);
  vec2 dir = rxy > 1e-8 ? p.xy / rxy : vec2(0.0);
  vec2 film = dir * rSt;
  float x = film.x / maxR / max(uHorizonAspect, 1e-4);
  float y = film.y / maxR;
  float zEye = -length(p);
  vec4 depth = projectionMatrix * vec4(0.0, 0.0, zEye, 1.0);
  float ndcZ = depth.w != 0.0 ? depth.z / depth.w : 0.0;
  return vec4(x, y, ndcZ, 1.0);
}
`;

const PROJECT_VERTEX = /* glsl */ `
  vec4 mvPosition = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    mvPosition = instanceMatrix * mvPosition;
  #endif
  mvPosition = modelViewMatrix * mvPosition;
  gl_Position = horizonClipPosition(mvPosition);
`;

/**
 * SpriteMaterial never includes `project_vertex`. It billboards in view space
 * then does `gl_Position = projectionMatrix * mvPosition`, so राहु / केतु sat
 * on the leftover 60° perspective camera while the belt used stereographic.
 * Project the sprite *origin* through the same map, then keep the quad offset
 * in NDC so the icon stays a round billboard on the ecliptic.
 */
const SPRITE_GL_POSITION = /* glsl */ `
	vec4 mvCenter = vec4(mvPosition.xy - rotatedPosition, mvPosition.zw);
	if (uHorizonStereo > 0.5) {
		vec4 pCenter = projectionMatrix * mvCenter;
		vec4 pFull = projectionMatrix * mvPosition;
		vec2 ndcDelta = pFull.xy / max(pFull.w, 1e-4) - pCenter.xy / max(pCenter.w, 1e-4);
		vec4 stereo = horizonClipPosition(mvCenter);
		gl_Position = vec4(stereo.xy + ndcDelta, stereo.z, 1.0);
	} else {
		gl_Position = projectionMatrix * mvPosition;
	}
`;

/** Bump when the injected GLSL changes so already-patched materials recompile. */
const HORIZON_FISHEYE_VERSION = 3;

/**
 * Patch a material so its vertices go through {@link CLIP_GLSL} when
 * `uHorizonStereo` is on. Shared uniform objects, so one write per frame
 * reaches every program. Safe to call repeatedly.
 */
export function injectHorizonFisheye(
  material: THREE.Material,
  uniforms: HorizonFisheyeUniforms,
): void {
  if (material.userData.horizonFisheye === HORIZON_FISHEYE_VERSION) return;
  material.userData.horizonFisheye = HORIZON_FISHEYE_VERSION;
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev?.(shader, renderer);
    shader.uniforms.uHorizonFov = uniforms.uHorizonFov;
    shader.uniforms.uHorizonAspect = uniforms.uHorizonAspect;
    shader.uniforms.uHorizonStereo = uniforms.uHorizonStereo;
    if (!shader.vertexShader.includes("horizonClipPosition")) {
      shader.vertexShader = `${CLIP_GLSL}\n${shader.vertexShader}`;
    }
    if (shader.vertexShader.includes("mvPosition.xy += rotatedPosition")) {
      shader.vertexShader = shader.vertexShader.replace(
        /mvPosition\.xy \+= rotatedPosition;\s*gl_Position = projectionMatrix \* mvPosition;/,
        `mvPosition.xy += rotatedPosition;\n${SPRITE_GL_POSITION}`,
      );
    } else if (shader.vertexShader.includes("#include <project_vertex>")) {
      shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", PROJECT_VERTEX);
    } else {
      shader.vertexShader = shader.vertexShader
        .replace(
          /gl_Position\s*=\s*projectionMatrix\s*\*\s*modelViewMatrix\s*\*\s*vec4\(\s*position\s*,\s*1\.0\s*\)\s*;/g,
          "gl_Position = horizonClipPosition(modelViewMatrix * vec4(position, 1.0));",
        )
        .replace(
          /gl_Position\s*=\s*projectionMatrix\s*\*\s*viewMatrix\s*\*\s*modelMatrix\s*\*\s*vec4\(\s*position\s*,\s*1\.0\s*\)\s*;/g,
          "gl_Position = horizonClipPosition(viewMatrix * modelMatrix * vec4(position, 1.0));",
        )
        .replace(
          /gl_Position\s*=\s*projectionMatrix\s*\*\s*viewMatrix\s*\*\s*world\s*;/g,
          "gl_Position = horizonClipPosition(viewMatrix * world);",
        );
    }
  };
  const prevKey = material.customProgramCacheKey;
  material.customProgramCacheKey = () =>
    `${prevKey.call(material)}|horizon-stereo-fullframe-v${HORIZON_FISHEYE_VERSION}`;
  material.needsUpdate = true;
}

export function injectHorizonFisheyeIn(root: THREE.Object3D, uniforms: HorizonFisheyeUniforms): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    const raw = mesh.material;
    if (!raw) return;
    const list = Array.isArray(raw) ? raw : [raw];
    for (const mat of list) injectHorizonFisheye(mat, uniforms);
    mesh.frustumCulled = false;
  });
}

/**
 * Screen position of a world point under the same stereographic map the
 * shaders use, without any frame test. `fovDeg` is the vertical field.
 * Returns null only past {@link THETA_MAX}, where the map itself gives up.
 *
 * The grid ruler needs points that land *outside* the canvas: an almucantar is
 * labelled where it crosses the frame, and that crossing is found by walking
 * the line from off-frame to on-frame. {@link projectHorizon} is this plus the
 * cull every other caller wants.
 */
export function projectHorizonRaw(
  world: THREE.Vector3,
  camera: THREE.Camera,
  fovDeg: number,
  width: number,
  height: number,
  scratch: THREE.Vector3,
): { x: number; y: number } | null {
  scratch.copy(world).applyMatrix4(camera.matrixWorldInverse);
  const rxy = Math.hypot(scratch.x, scratch.y);
  const theta = Math.atan2(rxy, -scratch.z);
  if (theta > THETA_MAX) return null;
  const half = (fovDeg * Math.PI) / 360;
  const rSt = 2 * Math.tan(theta * 0.5);
  const maxR = 2 * Math.tan(Math.max(half, 1e-4) * 0.5);
  const dirX = rxy > 1e-8 ? scratch.x / rxy : 0;
  const dirY = rxy > 1e-8 ? scratch.y / rxy : 0;
  const aspect = width / Math.max(height, 1);
  const nx = (dirX * rSt) / maxR / aspect;
  const ny = (dirY * rSt) / maxR;
  return { x: (nx * 0.5 + 0.5) * width, y: (-ny * 0.5 + 0.5) * height };
}

/**
 * Screen position of a world point, culled to a little outside the canvas —
 * what a label anchor wants. Returns null off-frame.
 */
export function projectHorizon(
  world: THREE.Vector3,
  camera: THREE.Camera,
  fovDeg: number,
  width: number,
  height: number,
  scratch: THREE.Vector3,
): { x: number; y: number } | null {
  const hit = projectHorizonRaw(world, camera, fovDeg, width, height, scratch);
  if (!hit) return null;
  if (hit.x < -60 || hit.y < -30 || hit.x > width + 60 || hit.y > height + 30) return null;
  return hit;
}

/**
 * The half-angle from the view centre to a corner of the frame, degrees — the
 * radius of the cone the canvas actually shows.
 *
 * Under stereographic the corner is *not* at half the diagonal field of a
 * perspective camera; it is wherever `2·tan(θ/2)` reaches the corner of the
 * film rectangle. The grid ruler uses it to walk only the almucantars and
 * verticals that can reach the frame instead of all 179 of them.
 */
export function horizonConeRadiusDeg(fovDeg: number, width: number, height: number): number {
  const aspect = width / Math.max(height, 1);
  const maxR = 2 * Math.tan(Math.max((fovDeg * Math.PI) / 360, 1e-4) * 0.5);
  const corner = maxR * Math.hypot(aspect, 1);
  return (2 * Math.atan(corner / 2) * 180) / Math.PI;
}
