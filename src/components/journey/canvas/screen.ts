import * as THREE from "three";

const ndc = new THREE.Vector3();
const dir = new THREE.Vector3();

/**
 * World point on the plane z = `planeZ` under a viewport pixel. Lets 3D
 * objects sit exactly over empty HTML columns at any viewport size.
 */
export function screenToWorld(
  x: number,
  y: number,
  size: { width: number; height: number },
  camera: THREE.Camera,
  out: THREE.Vector3,
  planeZ = 0,
) {
  ndc.set((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1, 0.5).unproject(camera);
  dir.copy(ndc).sub(camera.position).normalize();
  const dist = (planeZ - camera.position.z) / dir.z;
  return out.copy(camera.position).addScaledVector(dir, dist);
}
