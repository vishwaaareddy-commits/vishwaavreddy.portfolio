/// <reference lib="webworker" />
import { flatten } from "@/lib/mlp";
import { Trainer } from "@/lib/trainer";
import type { TrainerMessage, TrainerReply } from "./protocol";

/** Decision-boundary resolution sent to the page. */
const RES = 48;
const STEPS_PER_TICK = 3;
const TICK_MS = 33;
/** Heatmap refresh: every ~10 steps. */
const GRID_EVERY = 9;
const MAX_STEPS = 900;
const TARGET_LOSS = 0.01;

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let trainer: Trainer | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let lastGrid = -Infinity;

const done = () => !!trainer && trainer.step > 0 && (trainer.step >= MAX_STEPS || trainer.loss < TARGET_LOSS);

function post(withGrid: boolean) {
  if (!trainer) return;
  const params = flatten(trainer.net);
  const grid = withGrid ? trainer.grid(RES) : null;
  const reply: TrainerReply = {
    type: "tick",
    step: trainer.step,
    loss: trainer.loss,
    acc: trainer.acc,
    done: done(),
    params,
    grid,
    res: RES,
  };
  ctx.postMessage(reply, grid ? [params.buffer, grid.buffer] : [params.buffer]);
}

function loop() {
  if (!trainer) return;
  for (let i = 0; i < STEPS_PER_TICK && !done(); i += 1) trainer.train();
  const withGrid = done() || trainer.step - lastGrid >= GRID_EVERY;
  if (withGrid) lastGrid = trainer.step;
  post(withGrid);
  timer = done() ? undefined : setTimeout(loop, TICK_MS);
}

ctx.onmessage = (e: MessageEvent<TrainerMessage>) => {
  const msg = e.data;
  if (msg.type === "start") {
    clearTimeout(timer);
    trainer = new Trainer(msg.seed);
    lastGrid = -Infinity;
    const data: TrainerReply = { type: "data", points: trainer.points.slice(), labels: trainer.labels.slice() };
    ctx.postMessage(data);
    if (msg.instant) {
      // Reduced motion: train to the end off screen, show only the final frame.
      while (!done()) trainer.train();
      post(true);
      return;
    }
    post(true);
    if (!msg.paused) timer = setTimeout(loop, TICK_MS);
  } else if (msg.type === "pause") {
    clearTimeout(timer);
    timer = undefined;
  } else if (msg.type === "resume") {
    if (trainer && !timer && !done()) timer = setTimeout(loop, TICK_MS);
  }
};
