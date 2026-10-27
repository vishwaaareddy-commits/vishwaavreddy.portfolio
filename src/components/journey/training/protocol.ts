/** Messages between the hero panel and the training worker. */
export type TrainerMessage =
  | { type: "start"; seed: number; instant: boolean; paused: boolean }
  | { type: "pause" }
  | { type: "resume" };

export type TrainerReply =
  | { type: "data"; points: Float32Array; labels: Uint8Array }
  | {
      type: "tick";
      step: number;
      loss: number;
      acc: number;
      done: boolean;
      /** All network parameters, flattened (see lib/mlp flatten). */
      params: Float32Array;
      /** Class-1 probability grid, res × res, or null between heatmap refreshes. */
      grid: Float32Array | null;
      res: number;
    };

/**
 * Latest state of the live training, shared with the 3D hero network
 * (which lives in a separately loaded chunk). Mutated in place; `version`
 * bumps on every update so readers can skip unchanged frames.
 */
export const heroTraining = {
  version: 0,
  params: null as Float32Array | null,
  step: 0,
  loss: 0,
  acc: 0,
  done: false,
  /** Point fed through the network for the 3D activations, in data space [-1, 1]². */
  probe: { x: 0.55, y: 0.1 },
};
