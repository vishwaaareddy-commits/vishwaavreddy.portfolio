import { createActivations, createMlp, forward, rng, randn, type Mlp } from "./mlp";

/** The hero network: 2 inputs (x, y) → 16 → 16 → 1 (probability of class 1). */
export const HERO_SIZES = [2, 16, 16, 1];
/** Inputs live in [-1, 1]²; scaled up so tanh units are not starved. */
const INPUT_SCALE = 2;
const ADAM = { lr: 0.005, b1: 0.9, b2: 0.999, eps: 1e-8 };

/** Two interleaved spirals (1.5 turns each) with a little noise; `n` points per class. */
export function spiral(n: number, seed: number) {
  const rand = rng(seed);
  const points = new Float32Array(n * 2 * 2);
  const labels = new Uint8Array(n * 2);
  let k = 0;
  for (let c = 0; c < 2; c += 1) {
    for (let i = 0; i < n; i += 1, k += 1) {
      const r = 0.08 + (0.88 * i) / n;
      const theta = (3 * Math.PI * i) / n + c * Math.PI + randn(rand) * 0.12;
      points[k * 2] = r * Math.cos(theta);
      points[k * 2 + 1] = r * Math.sin(theta);
      labels[k] = c;
    }
  }
  return { points, labels };
}

/**
 * Full-batch training of the hero MLP with manual backprop (tanh hidden,
 * sigmoid output, binary cross-entropy) and Adam. Plain TypeScript: runs
 * in a Web Worker in the browser and in Node for testing.
 */
export class Trainer {
  readonly net: Mlp;
  readonly points: Float32Array;
  readonly labels: Uint8Array;
  step = 0;
  loss = 0;
  acc = 0;
  private acts = createActivations(HERO_SIZES);
  private deltas = createActivations(HERO_SIZES);
  private gW: Float32Array[];
  private gb: Float32Array[];
  private mW: Float32Array[];
  private vW: Float32Array[];
  private mb: Float32Array[];
  private vb: Float32Array[];

  constructor(seed: number, perClass = 100) {
    this.net = createMlp(HERO_SIZES, seed, 1.2);
    const data = spiral(perClass, seed + 1);
    this.points = data.points;
    this.labels = data.labels;
    const zeros = (a: Float32Array[]) => a.map((x) => new Float32Array(x.length));
    this.gW = zeros(this.net.W);
    this.gb = zeros(this.net.b);
    this.mW = zeros(this.net.W);
    this.vW = zeros(this.net.W);
    this.mb = zeros(this.net.b);
    this.vb = zeros(this.net.b);
  }

  /** Probability of class 1 at (x, y) in data space. */
  predict(x: number, y: number) {
    this.acts[0][0] = x * INPUT_SCALE;
    this.acts[0][1] = y * INPUT_SCALE;
    return forward(this.net, this.acts, "sigmoid")[0];
  }

  /** One full-batch gradient step; updates loss and accuracy. */
  train() {
    const { net, acts, deltas, gW, gb } = this;
    const L = net.W.length;
    gW.forEach((g) => g.fill(0));
    gb.forEach((g) => g.fill(0));
    const N = this.labels.length;
    let loss = 0;
    let correct = 0;
    for (let s = 0; s < N; s += 1) {
      const p = this.predict(this.points[s * 2], this.points[s * 2 + 1]);
      const y = this.labels[s];
      loss -= y ? Math.log(p + 1e-7) : Math.log(1 - p + 1e-7);
      if ((p > 0.5 ? 1 : 0) === y) correct += 1;
      // Sigmoid + BCE: dL/dz at the output is simply p − y.
      deltas[L][0] = p - y;
      for (let l = L - 1; l >= 0; l -= 1) {
        const nIn = net.sizes[l];
        const nOut = net.sizes[l + 1];
        const w = net.W[l];
        const d = deltas[l + 1];
        const a = acts[l];
        for (let j = 0; j < nOut; j += 1) {
          gb[l][j] += d[j];
          const row = j * nIn;
          for (let i = 0; i < nIn; i += 1) gW[l][row + i] += d[j] * a[i];
        }
        if (l === 0) break;
        const prev = deltas[l];
        for (let i = 0; i < nIn; i += 1) {
          let sum = 0;
          for (let j = 0; j < nOut; j += 1) sum += w[j * nIn + i] * d[j];
          prev[i] = sum * (1 - a[i] * a[i]);
        }
      }
    }
    this.step += 1;
    const t = this.step;
    const c1 = 1 - ADAM.b1 ** t;
    const c2 = 1 - ADAM.b2 ** t;
    const adam = (p: Float32Array, g: Float32Array, m: Float32Array, v: Float32Array) => {
      for (let i = 0; i < p.length; i += 1) {
        const gi = g[i] / N;
        m[i] = ADAM.b1 * m[i] + (1 - ADAM.b1) * gi;
        v[i] = ADAM.b2 * v[i] + (1 - ADAM.b2) * gi * gi;
        p[i] -= (ADAM.lr * (m[i] / c1)) / (Math.sqrt(v[i] / c2) + ADAM.eps);
      }
    };
    for (let l = 0; l < L; l += 1) {
      adam(net.W[l], gW[l], this.mW[l], this.vW[l]);
      adam(net.b[l], gb[l], this.mb[l], this.vb[l]);
    }
    this.loss = loss / N;
    this.acc = correct / N;
  }

  /** Class-1 probability on a res × res grid over [-1, 1]² (row 0 at the top). */
  grid(res: number, out = new Float32Array(res * res)) {
    for (let r = 0; r < res; r += 1) {
      const y = 1 - (2 * (r + 0.5)) / res;
      for (let c = 0; c < res; c += 1) out[r * res + c] = this.predict((2 * (c + 0.5)) / res - 1, y);
    }
    return out;
  }
}
