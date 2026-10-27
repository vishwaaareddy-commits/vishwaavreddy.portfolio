"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useJourney } from "@/store/journey";
import { heroTraining, type TrainerMessage, type TrainerReply } from "./protocol";

const SIZE = 208;
const VIOLET: [number, number, number] = [139, 108, 255];
const CYAN: [number, number, number] = [59, 227, 245];
const INK: [number, number, number] = [7, 9, 13];

/** Probability → colour: violet (class 0) ↔ cyan (class 1), dark at the boundary. */
function paintGrid(grid: Float32Array, res: number, small: HTMLCanvasElement) {
  const ctx = small.getContext("2d")!;
  const img = ctx.createImageData(res, res);
  for (let i = 0; i < grid.length; i += 1) {
    const p = grid[i];
    const tint = p > 0.5 ? CYAN : VIOLET;
    const k = 0.07 + 0.3 * Math.abs(2 * p - 1);
    img.data[i * 4] = INK[0] + (tint[0] - INK[0]) * k;
    img.data[i * 4 + 1] = INK[1] + (tint[1] - INK[1]) * k;
    img.data[i * 4 + 2] = INK[2] + (tint[2] - INK[2]) * k;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function draw(
  canvas: HTMLCanvasElement,
  small: HTMLCanvasElement | null,
  data: { points: Float32Array; labels: Uint8Array } | null,
) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== SIZE * dpr) {
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#07090d";
  ctx.fillRect(0, 0, SIZE, SIZE);
  if (small) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(small, 0, 0, SIZE, SIZE);
  }
  if (!data) return;
  for (let i = 0; i < data.labels.length; i += 1) {
    const x = ((data.points[i * 2] + 1) / 2) * SIZE;
    const y = ((1 - data.points[i * 2 + 1]) / 2) * SIZE;
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = data.labels[i] ? "#3be3f5" : "#a891ff";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#07090d";
    ctx.stroke();
  }
}

/**
 * Chapter 01 visual: a real 2-16-16-1 network training in a Web Worker on
 * two spirals, with its decision boundary redrawn every ~10 steps. The 3D
 * network above it (data-stage="hero") mirrors the same weights.
 */
export function TrainingPanel() {
  const ignited = useJourney((s) => s.ignited);
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const stats = useRef<HTMLParagraphElement>(null);
  const worker = useRef<Worker | null>(null);
  const [seed, setSeed] = useState(2026);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ignited) return;
    const el = canvas.current;
    if (!el) return;
    const instant = prefersReducedMotion();
    const w = new Worker(new URL("./train.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    const small = document.createElement("canvas");
    let data: { points: Float32Array; labels: Uint8Array } | null = null;
    let painted = false;

    w.onmessage = (e: MessageEvent<TrainerReply>) => {
      const msg = e.data;
      if (msg.type === "data") {
        data = { points: msg.points, labels: msg.labels };
        return;
      }
      heroTraining.params = msg.params;
      heroTraining.step = msg.step;
      heroTraining.loss = msg.loss;
      heroTraining.acc = msg.acc;
      heroTraining.done = msg.done;
      heroTraining.version += 1;
      if (stats.current) {
        stats.current.textContent = `step ${String(msg.step).padStart(3, "0")}  loss ${msg.loss.toFixed(3)}  acc ${(msg.acc * 100).toFixed(1)}%`;
      }
      if (msg.grid) {
        small.width = small.height = msg.res;
        paintGrid(msg.grid, msg.res, small);
        painted = true;
        draw(el, small, data);
      }
      if (msg.done) setDone(true);
    };
    draw(el, painted ? small : null, data);
    setDone(false);

    // Train only while the hero is on screen.
    const start: TrainerMessage = { type: "start", seed, instant, paused: false };
    w.postMessage(start);
    const io = new IntersectionObserver(([entry]) =>
      w.postMessage({ type: entry.isIntersecting ? "resume" : "pause" } satisfies TrainerMessage),
    );
    if (root.current) io.observe(root.current);
    return () => {
      io.disconnect();
      w.terminate();
      worker.current = null;
    };
  }, [ignited, seed]);

  // The probe point: follows the pointer over the plot, otherwise orbits slowly.
  useEffect(() => {
    const el = canvas.current;
    const dot = probe.current;
    if (!el || !dot) return;
    let hover = false;
    let frame = 0;
    const place = () => {
      dot.style.transform = `translate3d(${((heroTraining.probe.x + 1) / 2) * SIZE}px, ${((1 - heroTraining.probe.y) / 2) * SIZE}px, 0)`;
    };
    const orbit = (now: number) => {
      if (!hover) {
        const a = now / 2600;
        heroTraining.probe.x = Math.cos(a) * 0.55;
        heroTraining.probe.y = Math.sin(a * 1.3) * 0.55;
        place();
      }
      frame = requestAnimationFrame(orbit);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      hover = true;
      heroTraining.probe.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      heroTraining.probe.y = 1 - ((e.clientY - r.top) / r.height) * 2;
      place();
    };
    const onLeave = () => (hover = false);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    if (prefersReducedMotion()) place();
    else frame = requestAnimationFrame(orbit);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={root} data-copy className="w-full max-w-[34rem]">
      {/* Empty stage the 3D 2-16-16-1 network is fitted into. */}
      <div data-stage="hero" aria-hidden className="h-[16svh] w-full md:h-[24vh]" />
      <div className="mt-3 flex items-start gap-5 md:flex-col md:gap-3 lg:flex-row lg:gap-5">
        <figure className="relative shrink-0 overflow-hidden rounded-sm border border-line" style={{ width: SIZE, height: SIZE }}>
          <canvas
            ref={canvas}
            role="img"
            aria-label="Decision boundary of a 2-16-16-1 neural network learning to separate two interleaved spirals of points, cyan against violet. It is retrained live in your browser."
            style={{ width: SIZE, height: SIZE }}
            className="block"
          />
          <span
            ref={probe}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 -ml-[7px] -mt-[7px] size-3.5 rounded-full border border-white/90 shadow-[0_0_10px_rgba(255,255,255,0.6)]"
          />
        </figure>
        <div className="min-w-0 pt-1 font-mono text-[0.66rem] leading-relaxed text-faint">
          <p className="text-accent">● live</p>
          <p ref={stats} aria-live="off" className="mt-1 whitespace-pre-wrap text-soft">
            step 000 loss — acc —
          </p>
          <p className="mt-3">2 spirals · 200 points</p>
          <p>tanh · Adam · full batch</p>
          <p className="mt-1 hidden sm:block">hover the plot to probe it</p>
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            disabled={!done}
            data-cursor
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-1 text-soft transition-colors duration-300 hover:border-accent hover:text-accent disabled:opacity-40"
          >
            <RotateCcw className="size-3" aria-hidden />
            retrain
          </button>
        </div>
      </div>
      <p className="mt-3 font-mono text-[0.66rem] text-faint">
        Live: a 2-16-16-1 network training in your browser.
      </p>
    </div>
  );
}
