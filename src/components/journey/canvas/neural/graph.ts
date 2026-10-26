import type { Mlp } from "@/lib/mlp";
import { rng } from "@/lib/mlp";

/** Renderable layout of a layered network: one entry per neuron and per edge. */
export interface Graph {
  sizes: number[];
  count: number;
  /** Neuron centres, xyz per neuron (local units). */
  positions: Float32Array;
  /** 0 at the input layer → 1 at the output layer. */
  depth: Float32Array;
  /** First neuron index of each layer. */
  offsets: number[];
  /** Per edge: src/dst neuron index, weight index into W[layer], phase. */
  edgeSrc: Float32Array;
  edgeDst: Float32Array;
  edgeLayer: Uint8Array;
  edgeWeightIndex: Uint32Array;
  edgePhase: Float32Array;
  edgeCount: number;
}

type Place = (layer: number, i: number, n: number, out: [number, number, number]) => void;

/**
 * Builds neurons and edges for `net`. Edges with small |w| are pruned to
 * `keep` of each layer pair (the strongest ones), so dense layers read as
 * structure instead of a grey mesh.
 */
export function buildGraph(net: Mlp, place: Place, { keep = 1, seed = 7 } = {}): Graph {
  const { sizes } = net;
  const count = sizes.reduce((a, b) => a + b, 0);
  const positions = new Float32Array(count * 3);
  const depth = new Float32Array(count);
  const offsets: number[] = [];
  const p: [number, number, number] = [0, 0, 0];
  let k = 0;
  sizes.forEach((n, l) => {
    offsets.push(k);
    for (let i = 0; i < n; i += 1, k += 1) {
      place(l, i, n, p);
      positions.set(p, k * 3);
      depth[k] = sizes.length > 1 ? l / (sizes.length - 1) : 0;
    }
  });

  const rand = rng(seed);
  const src: number[] = [];
  const dst: number[] = [];
  const layer: number[] = [];
  const wIndex: number[] = [];
  for (let l = 0; l < sizes.length - 1; l += 1) {
    const w = net.W[l];
    const nIn = sizes[l];
    let order = Array.from(w.keys());
    if (keep < 1) {
      order.sort((a, b) => Math.abs(w[b]) - Math.abs(w[a]));
      order = order.slice(0, Math.max(nIn, Math.round(w.length * keep)));
    }
    for (const idx of order) {
      const j = Math.floor(idx / nIn);
      const i = idx % nIn;
      src.push(offsets[l] + i);
      dst.push(offsets[l + 1] + j);
      layer.push(l);
      wIndex.push(idx);
    }
  }
  const edgeCount = src.length;
  return {
    sizes,
    count,
    positions,
    depth,
    offsets,
    edgeSrc: Float32Array.from(src),
    edgeDst: Float32Array.from(dst),
    edgeLayer: Uint8Array.from(layer),
    edgeWeightIndex: Uint32Array.from(wIndex),
    edgePhase: Float32Array.from({ length: edgeCount }, () => rand()),
    edgeCount,
  };
}

/**
 * Normalised edge weights in [-1, 1] (per layer pair, by max |w|) written
 * into `out`. Called once for fixed nets and on every update for the hero.
 */
export function edgeWeights(net: Mlp, g: Graph, out: Float32Array) {
  const maxAbs = net.W.map((w) => {
    let m = 1e-6;
    for (let i = 0; i < w.length; i += 1) m = Math.max(m, Math.abs(w[i]));
    return m;
  });
  for (let e = 0; e < g.edgeCount; e += 1) {
    const l = g.edgeLayer[e];
    out[e] = net.W[l][g.edgeWeightIndex[e]] / maxAbs[l];
  }
  return out;
}
