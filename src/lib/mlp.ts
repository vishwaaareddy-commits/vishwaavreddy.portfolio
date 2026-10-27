/**
 * A tiny dense network in plain TypeScript: tanh hidden layers, weights as
 * row-major Float32Arrays ([out][in]). Shared by the background field's
 * forward pass and the hero's training worker; no dependencies.
 */

export interface Mlp {
  sizes: number[];
  /** W[l] maps layer l → l+1, shape [sizes[l+1]][sizes[l]]. */
  W: Float32Array[];
  b: Float32Array[];
}

/** Small, fast, seedable PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box–Muller). */
export function randn(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/** Xavier-initialised network; `gain` > 1 gives livelier activations. */
export function createMlp(sizes: number[], seed: number, gain = 1): Mlp {
  const rand = rng(seed);
  const W: Float32Array[] = [];
  const b: Float32Array[] = [];
  for (let l = 0; l < sizes.length - 1; l += 1) {
    const fanIn = sizes[l];
    const fanOut = sizes[l + 1];
    const std = gain * Math.sqrt(2 / (fanIn + fanOut));
    const w = new Float32Array(fanIn * fanOut);
    for (let i = 0; i < w.length; i += 1) w[i] = randn(rand) * std;
    W.push(w);
    b.push(new Float32Array(fanOut));
  }
  return { sizes, W, b };
}

/** Activations buffer for every layer (layer 0 is the input). */
export function createActivations(sizes: number[]) {
  return sizes.map((n) => new Float32Array(n));
}

/**
 * Forward pass into `acts` (acts[0] must already hold the input). Hidden
 * layers use tanh; the last layer uses `out`. `boost[l]`, when given, is
 * added to layer l's pre-activation (used for cursor input).
 */
export function forward(
  net: Mlp,
  acts: Float32Array[],
  out: "tanh" | "sigmoid" = "tanh",
  boost?: Float32Array[],
) {
  const L = net.sizes.length - 1;
  for (let l = 0; l < L; l += 1) {
    const inp = acts[l];
    const res = acts[l + 1];
    const w = net.W[l];
    const bias = net.b[l];
    const nIn = net.sizes[l];
    const nOut = net.sizes[l + 1];
    const extra = boost?.[l + 1];
    for (let j = 0; j < nOut; j += 1) {
      let z = bias[j];
      const row = j * nIn;
      for (let i = 0; i < nIn; i += 1) z += w[row + i] * inp[i];
      if (extra) z += extra[j];
      res[j] = l === L - 1 && out === "sigmoid" ? 1 / (1 + Math.exp(-z)) : Math.tanh(z);
    }
  }
  return acts[L];
}

/** Total parameter count (weights then biases, layer by layer). */
export function paramCount(sizes: number[]) {
  let n = 0;
  for (let l = 0; l < sizes.length - 1; l += 1) n += sizes[l] * sizes[l + 1] + sizes[l + 1];
  return n;
}

/** Copies all parameters into one flat array (for posting from a worker). */
export function flatten(net: Mlp, into = new Float32Array(paramCount(net.sizes))) {
  let o = 0;
  for (let l = 0; l < net.W.length; l += 1) {
    into.set(net.W[l], o);
    o += net.W[l].length;
    into.set(net.b[l], o);
    o += net.b[l].length;
  }
  return into;
}

/** Inverse of flatten: loads a flat parameter array into `net`. */
export function unflatten(flat: Float32Array, net: Mlp) {
  let o = 0;
  for (let l = 0; l < net.W.length; l += 1) {
    net.W[l].set(flat.subarray(o, o + net.W[l].length));
    o += net.W[l].length;
    net.b[l].set(flat.subarray(o, o + net.b[l].length));
    o += net.b[l].length;
  }
  return net;
}
