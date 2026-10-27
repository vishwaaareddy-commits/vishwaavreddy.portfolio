"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createActivations, createMlp, forward, rng } from "@/lib/mlp";
import { chapterProgress, CHAPTERS, pointer, useJourney, type Tier } from "@/store/journey";
import { buildGraph, edgeWeights } from "./graph";
import { NetworkMesh, type NetworkHandle } from "./NetworkMesh";

/** 6 layers × 16–48 neurons; the low tier halves every layer. */
const SIZES: Record<Tier, number[]> = {
  high: [16, 32, 48, 48, 32, 16],
  medium: [16, 32, 48, 48, 32, 16],
  low: [8, 16, 24, 24, 16, 8],
};
/** World centre of the field and the x span from input to output layer. */
export const FIELD_CENTER = new THREE.Vector3(0, 0, -6);
export const FIELD_HALF_SPAN = 8;

/** Cursor reach in CSS px and how hard it drives a neuron's pre-activation. */
const CURSOR_RADIUS = 110;
const CURSOR_GAIN = 3;

const projected = new THREE.Vector3();

/**
 * How present the field is per chapter: quiet behind the hero copy, full
 * once the camera pulls back, and stepped back wherever a chapter has its
 * own stage visual so the two never compete.
 */
const ALPHA_BY_CHAPTER = [0.3, 0.35, 0.75, 0.3, 0.25, 0.3, 0.3, 0.5, 0.6, 0.6, 0.5, 0.7];
function fieldAlpha(t: number) {
  const c = Math.max(0, Math.min(ALPHA_BY_CHAPTER.length - 1, Math.floor(t)));
  const next = Math.min(ALPHA_BY_CHAPTER.length - 1, c + 1);
  // Hero: pull back reveals the network over the whole pin.
  if (c === 1) return THREE.MathUtils.lerp(ALPHA_BY_CHAPTER[1], ALPHA_BY_CHAPTER[2], chapterProgress(t, 1));
  return THREE.MathUtils.lerp(ALPHA_BY_CHAPTER[c], ALPHA_BY_CHAPTER[next], THREE.MathUtils.smoothstep(t - c, 0.8, 1));
}

/**
 * The background network. Activations come from a real forward pass of a
 * fixed, seeded MLP; each chapter feeds it a different seeded input, the
 * cursor injects extra input into nearby neurons, and downstream layers
 * respond a little later than upstream ones so signal visibly travels.
 */
export function NeuralField({ tier, still }: { tier: Tier; still: boolean }) {
  const net = useRef<NetworkHandle>(null);
  const group = useRef<THREE.Group>(null);

  const model = useMemo(() => {
    const sizes = SIZES[tier];
    const mlp = createMlp(sizes, 2026, 1.7);
    const L = sizes.length;
    const graph = buildGraph(
      mlp,
      (l, i, n, out) => {
        // Each layer is a disc of neurons (phyllotaxis) in the y–z plane.
        const r = 0.36 * Math.sqrt(n) * Math.sqrt((i + 0.5) / n);
        const a = i * 2.39996;
        out[0] = -FIELD_HALF_SPAN + (2 * FIELD_HALF_SPAN * l) / (L - 1);
        out[1] = r * Math.cos(a);
        out[2] = r * Math.sin(a) * 0.85;
      },
      { keep: tier === "low" ? 0.3 : 0.18 },
    );
    const weights = edgeWeights(mlp, graph, new Float32Array(graph.edgeCount));
    // One seeded input vector per chapter: the model sees different data as you scroll.
    const rand = rng(91);
    const inputs = CHAPTERS.map(() => Float32Array.from({ length: sizes[0] }, () => rand() * 2 - 1));
    const freq = Float32Array.from({ length: sizes[0] }, () => 0.3 + rand() * 0.6);
    return {
      mlp,
      graph,
      weights,
      inputs,
      freq,
      acts: createActivations(sizes),
      boost: createActivations(sizes),
      // Downstream layers settle more slowly, so a cursor pulse travels forward.
      rate: sizes.map((_, l) => 9 / (1 + l * 0.8)),
    };
  }, [tier]);

  useFrame(({ clock, camera, size }, dt) => {
    const h = net.current;
    const g = group.current;
    if (!h || !g) return;
    const { t, ignited, ignitedAt } = useJourney.getState();
    const time = still ? 4 : clock.elapsedTime;
    const { mlp, graph, inputs, freq, acts, boost, rate } = model;

    // Input: blend between this chapter's and the next chapter's vectors.
    const c = Math.max(0, Math.min(inputs.length - 1, Math.floor(t)));
    const next = Math.min(inputs.length - 1, c + 1);
    const k = THREE.MathUtils.smoothstep(t - c, 0.2, 0.9);
    const x0 = acts[0];
    for (let i = 0; i < x0.length; i += 1) {
      x0[i] = THREE.MathUtils.lerp(inputs[c][i], inputs[next][i], k) * 1.2 + Math.sin(time * freq[i] + i) * 0.35;
    }

    // Cursor input: neurons near the pointer on screen get driven harder.
    g.updateMatrixWorld();
    const active = pointer.active && !still;
    let n = 0;
    for (let l = 0; l < acts.length; l += 1) {
      const b = boost[l];
      for (let j = 0; j < b.length; j += 1, n += 1) {
        b[j] = 0;
        if (!active) continue;
        projected.fromArray(graph.positions, n * 3).applyMatrix4(g.matrixWorld).project(camera);
        if (projected.z > 1) continue;
        const dx = ((projected.x - pointer.x) * size.width) / 2;
        const dy = ((projected.y - pointer.y) * size.height) / 2;
        const d = Math.hypot(dx, dy);
        if (d < CURSOR_RADIUS) b[j] = CURSOR_GAIN * (1 - d / CURSOR_RADIUS) ** 2;
      }
    }
    for (let j = 0; j < x0.length; j += 1) x0[j] = Math.tanh(x0[j] + boost[0][j]);
    forward(mlp, acts, "tanh", boost);

    // Ease displayed activations towards the new pass, slower further downstream.
    const shown = h.activations;
    n = 0;
    for (let l = 0; l < acts.length; l += 1) {
      const a = acts[l];
      const blend = still ? 1 : 1 - Math.exp(-rate[l] * dt);
      for (let j = 0; j < a.length; j += 1, n += 1) shown[n] += (a[j] - shown[n]) * blend;
    }
    h.commitActivations();

    const u = h.uniforms;
    u.uTime.value = time;
    u.uIgnite.value = still ? 10 : ignited ? (performance.now() - ignitedAt) / 1000 : 0;
    // Scroll = forward pass: the wavefront moves input → output over the journey.
    u.uWave.value = THREE.MathUtils.clamp((t - 1) / (CHAPTERS.length - 2), 0, 1);
    u.uAlpha.value = still ? 0.8 : fieldAlpha(t);
  });

  return (
    <group ref={group} position={FIELD_CENTER}>
      <NetworkMesh
        key={tier}
        ref={net}
        graph={model.graph}
        initialWeights={model.weights}
        radius={0.055}
        width={1.1}
        edgeAlpha={0.85}
        fogNear={9}
        fogFar={26}
        // Nothing draws over copy: additive edges overlap by the dozen, so any floor would add up.
        maskFloor={0}
      />
    </group>
  );
}
