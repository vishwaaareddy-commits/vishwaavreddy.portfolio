import * as THREE from "three";

export interface CoreKey {
  /** Journey position (chapter index + progress). */
  t: number;
  pos: [number, number, number];
  scale: number;
}

/** Where the Core sits through the journey. Chapters 04+ park it until they are built. */
export const DESKTOP_KEYS: CoreKey[] = [
  { t: 1.0, pos: [2.5, 0.15, 0], scale: 1 },
  { t: 1.85, pos: [0.8, -0.25, 1.2], scale: 0.62 },
  // Work intro: keep clear of the headline, low on the right.
  { t: 2.1, pos: [3.2, -1.4, -0.8], scale: 0.45 },
  { t: 2.85, pos: [3.0, -1.2, -0.6], scale: 0.45 },
  { t: 3.05, pos: [0.5, 0, 0], scale: 0.48 },
  { t: 3.9, pos: [0.5, 0, 0], scale: 0.48 },
  { t: 4.3, pos: [3.9, -2.3, -2], scale: 0.26 },
];

export const MOBILE_KEYS: CoreKey[] = [
  { t: 1.0, pos: [1.1, 3.1, -1.5], scale: 0.46 },
  { t: 1.85, pos: [0.2, 1.2, 0], scale: 0.5 },
  { t: 2.1, pos: [1.0, 2.7, -1], scale: 0.4 },
  { t: 2.85, pos: [1.0, 2.7, -1], scale: 0.4 },
  { t: 3.05, pos: [-0.55, 2.75, 0], scale: 0.3 },
  { t: 3.9, pos: [-0.55, 2.75, 0], scale: 0.3 },
  { t: 4.3, pos: [1.9, -3.6, -2], scale: 0.22 },
];

const smooth = (x: number) => x * x * (3 - 2 * x);

/** Smoothly interpolated Core transform at journey position t. */
export function sampleCore(keys: CoreKey[], t: number, outPos: THREE.Vector3) {
  if (t <= keys[0].t) {
    outPos.set(...keys[0].pos);
    return keys[0].scale;
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
      return THREE.MathUtils.lerp(a.scale, b.scale, k);
    }
  }
  const last = keys[keys.length - 1];
  outPos.set(...last.pos);
  return last.scale;
}

/** 0→1→0 envelope: rises over [a, b], falls over [c, d]. */
export function envelope(t: number, a: number, b: number, c: number, d: number) {
  const up = THREE.MathUtils.smoothstep(t, a, b);
  const down = 1 - THREE.MathUtils.smoothstep(t, c, d);
  return Math.min(up, down);
}
