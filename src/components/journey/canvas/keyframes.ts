import * as THREE from "three";

export interface CoreKey {
  /** Journey position (chapter index + progress). */
  t: number;
  pos: [number, number, number];
  scale: number;
  /** Overall opacity. Parked behind text it stays below 0.15. */
  alpha: number;
}

/**
 * Where the Core sits through chapters 01–03. From 3.82 on it travels in the
 * empty page margin (see travelPose in Core.tsx) and returns for the finale.
 */
export const DESKTOP_KEYS: CoreKey[] = [
  { t: 1.0, pos: [2.5, 0.15, 0], scale: 1, alpha: 1 },
  { t: 1.75, pos: [0.8, -0.25, 1.2], scale: 0.62, alpha: 1 },
  // Work intro: keep clear of the headline, low on the right.
  { t: 2.1, pos: [3.2, -1.4, -0.8], scale: 0.45, alpha: 1 },
  { t: 2.85, pos: [3.0, -1.2, -0.6], scale: 0.45, alpha: 1 },
  // ModelBridge: the Core is the gateway hub; it moves on as the network exits.
  { t: 3.08, pos: [0.5, 0, 0], scale: 0.48, alpha: 1 },
  { t: 3.82, pos: [0.5, 0, 0], scale: 0.48, alpha: 1 },
];

export const MOBILE_KEYS: CoreKey[] = [
  { t: 1.0, pos: [1.1, 3.1, -1.5], scale: 0.46, alpha: 1 },
  { t: 1.75, pos: [0.2, 1.2, 0], scale: 0.5, alpha: 1 },
  { t: 2.1, pos: [1.0, 2.7, -1], scale: 0.4, alpha: 1 },
  { t: 2.85, pos: [1.0, 2.7, -1], scale: 0.4, alpha: 1 },
  { t: 3.08, pos: [-0.55, 2.75, 0], scale: 0.3, alpha: 1 },
  { t: 3.82, pos: [-0.55, 2.75, 0], scale: 0.3, alpha: 1 },
];

/** Chapters whose content is mostly text: the travelling Core gets smaller and dimmer. */
export const TEXT_HEAVY = new Set([5, 7, 9]);

const smooth = (x: number) => x * x * (3 - 2 * x);

export interface CorePose {
  scale: number;
  alpha: number;
}

/** Smoothly interpolated Core transform at journey position t. */
export function sampleCore(keys: CoreKey[], t: number, outPos: THREE.Vector3): CorePose {
  if (t <= keys[0].t) {
    outPos.set(...keys[0].pos);
    return { scale: keys[0].scale, alpha: keys[0].alpha };
  }
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b.t) {
      const k = smooth((t - a.t) / (b.t - a.t));
      outPos.set(
        THREE.MathUtils.lerp(a.pos[0], b.pos[0], k),
        THREE.MathUtils.lerp(a.pos[1], b.pos[1], k),
        THREE.MathUtils.lerp(a.pos[2], b.pos[2], k),
      );
      return { scale: THREE.MathUtils.lerp(a.scale, b.scale, k), alpha: THREE.MathUtils.lerp(a.alpha, b.alpha, k) };
    }
  }
  const last = keys[keys.length - 1];
  outPos.set(...last.pos);
  return { scale: last.scale, alpha: last.alpha };
}

/**
 * Shared anchor for the contact finale, written each frame by the finale
 * scene from the contact heading's on-screen position.
 */
export const finaleAnchor = {
  /** World position just above the heading, where the Core returns. */
  above: new THREE.Vector3(),
  /** World position of the heading's centre, where the ring orbits. */
  ring: new THREE.Vector3(),
  ringRadius: 2,
  active: false,
};
