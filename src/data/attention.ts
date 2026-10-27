/**
 * Chapter 03's attention view. These weights are ILLUSTRATIVE: hand-written
 * to show three typical head patterns, not taken from any model. The page
 * labels them as such.
 */
export const PROMPT_TOKENS = ["Explain", " retries", " in", " one", " line", "."] as const;

/** [from (key) token, to (query) token, weight 0–1]; queries only look back. */
export type Arc = [number, number, number];

export const HEADS: { name: string; arcs: Arc[] }[] = [
  {
    // Previous-token head.
    name: "previous token",
    arcs: [
      [0, 1, 0.85],
      [1, 2, 0.8],
      [2, 3, 0.75],
      [3, 4, 0.8],
      [4, 5, 0.7],
      [0, 2, 0.15],
    ],
  },
  {
    // Topic head: everything looks back at " retries".
    name: "topic",
    arcs: [
      [1, 2, 0.55],
      [1, 3, 0.6],
      [1, 4, 0.65],
      [1, 5, 0.7],
      [0, 5, 0.3],
      [0, 1, 0.5],
    ],
  },
  {
    // Phrase head: " one line" binds; the full stop closes the instruction.
    name: "phrase",
    arcs: [
      [3, 4, 0.9],
      [2, 3, 0.45],
      [0, 5, 0.6],
      [4, 5, 0.35],
      [0, 4, 0.25],
    ],
  },
];

/** Scroll schedule (chapter progress 0–1), shared by the 3D scene and the 2D fallback. */
export const ATTENTION_TIMELINE = {
  tokensIn: [0.02, 0.1],
  heads: [
    [0.08, 0.26],
    [0.26, 0.44],
    [0.44, 0.6],
  ],
  route: [0.6, 0.78],
  stream: [0.8, 0.97],
} as const;

/** Gateway route the output travels, in order; streamed chunks come back the other way. */
export const ROUTE = ["ModelBridge SDK", "Gateway API", "OpenRouter", "Gemini"] as const;

/** 0→1 inside [a, b]. */
export const span = (p: number, [a, b]: readonly [number, number]) => Math.min(1, Math.max(0, (p - a) / (b - a)));

/** Weight of each head at progress p: crossfades at the boundaries. */
export function headMix(p: number): [number, number, number] {
  const fade = 0.025;
  return ATTENTION_TIMELINE.heads.map(([a, b]) => {
    const up = Math.min(1, Math.max(0, (p - a + fade) / (2 * fade)));
    const down = Math.min(1, Math.max(0, (b + fade - p) / (2 * fade)));
    return Math.min(up, down);
  }) as [number, number, number];
}
