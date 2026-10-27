"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { heroTraining } from "@/components/journey/training/protocol";
import { createActivations, createMlp, forward, unflatten } from "@/lib/mlp";
import { HERO_SIZES } from "@/lib/trainer";
import { useJourney } from "@/store/journey";
import { fitToStage } from "../stage";
import { buildGraph, edgeWeights } from "./graph";
import { NetworkMesh, type NetworkHandle } from "./NetworkMesh";

const CONTENT = { w: 7, h: 3.4 };
const INPUT_SCALE = 2;

/**
 * The hero's 2-16-16-1 network in 3D, fitted to the hero stage. Edge colour
 * and width come from the worker's real weights as it trains; neuron
 * brightness is a forward pass of the probe point shown on the plot.
 */
export function HeroNet({ still }: { still: boolean }) {
  const outer = useRef<THREE.Group>(null);
  // The canvas can mount after ignition (it loads when idle): sweep from whichever is later.
  const mountedAt = useRef(performance.now());
  const inner = useRef<THREE.Group>(null);
  const net = useRef<NetworkHandle>(null);
  const seen = useRef(-1);

  const model = useMemo(() => {
    const mlp = createMlp(HERO_SIZES, 2026, 1.2);
    const graph = buildGraph(mlp, (l, i, n, out) => {
      out[0] = (l - 1.5) * 2.2;
      out[1] = (i - (n - 1) / 2) * (n > 2 ? 0.2 : 0.9);
      out[2] = 0;
    });
    return { mlp, graph, acts: createActivations(HERO_SIZES), weights: edgeWeights(mlp, graph, new Float32Array(graph.edgeCount)) };
  }, []);

  useFrame(({ camera, size, clock }) => {
    const g = outer.current;
    const h = net.current;
    if (!g || !h) return;
    const fit = fitToStage("hero", g, camera as THREE.PerspectiveCamera, size, CONTENT.w, CONTENT.h, { fill: 0.94 });
    g.visible = fit.visible && fit.opacity > 0.01;
    if (!g.visible) return;
    const time = still ? 0 : clock.elapsedTime;
    if (inner.current) inner.current.rotation.y = Math.sin(time * 0.35) * 0.22;

    const { mlp, graph, acts } = model;
    if (heroTraining.version !== seen.current && heroTraining.params) {
      seen.current = heroTraining.version;
      unflatten(heroTraining.params, mlp);
      edgeWeights(mlp, graph, h.weights);
      h.commitWeights();
    }
    acts[0][0] = heroTraining.probe.x * INPUT_SCALE;
    acts[0][1] = heroTraining.probe.y * INPUT_SCALE;
    forward(mlp, acts, "sigmoid");
    let n = 0;
    for (let l = 0; l < acts.length; l += 1) {
      const a = acts[l];
      for (let j = 0; j < a.length; j += 1, n += 1) {
        // Inputs are shown as they are; the output as 2p − 1 (cyan = class 1, violet = class 0).
        h.activations[n] = l === 0 ? a[j] / INPUT_SCALE : l === acts.length - 1 ? 2 * a[j] - 1 : a[j];
      }
    }
    h.commitActivations();

    const { ignited, ignitedAt } = useJourney.getState();
    const u = h.uniforms;
    u.uTime.value = time;
    u.uIgnite.value = still ? 10 : ignited ? (performance.now() - Math.max(ignitedAt, mountedAt.current)) / 1000 : 0;
    // A forward pass sweeping input → output, repeating.
    u.uWave.value = still ? 0.5 : ((time * 0.35) % 1.4) - 0.2;
    u.uAlpha.value = fit.opacity;
  });

  return (
    <group ref={outer}>
      <group ref={inner}>
        <NetworkMesh ref={net} graph={model.graph} initialWeights={model.weights} radius={0.085} width={1.6} />
      </group>
    </group>
  );
}
