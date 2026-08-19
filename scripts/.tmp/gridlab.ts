import * as THREE from "three";
import { buildGridLabels } from "@/lib/sky3d/grid-labels";

const cam = new THREE.PerspectiveCamera(60, 2.45, 0.1, 5000);
cam.rotation.order = "YXZ";
cam.rotation.set(-0.1, Math.PI, 0);
cam.updateMatrixWorld(true);
cam.matrixWorldInverse.copy(cam.matrixWorld).invert();

for (const [fov, step] of [[80, 10], [40, 5], [25, 5], [16, 2], [12, 1]] as const) {
  const out = buildGridLabels({
    camera: cam, fovDeg: fov, width: 1370, height: 560,
    radius: 900, gridStep: step, scratch: new THREE.Vector3(),
  });
  console.log(`fov=${fov} step=${step} -> ${out.length}`,
    out.slice(0, 8).map((l) => `${l.kind}${l.value}@${l.side}(${Math.round(l.x)},${Math.round(l.y)})`).join(" "));
}
