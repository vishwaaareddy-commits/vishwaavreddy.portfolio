"use client";

import { useEffect, useRef } from "react";
import { useJourney } from "@/store/journey";

const EPOCHS = 100;
const SPARK_W = 60;
const SPARK_H = 20;

/** Deterministic noise per epoch, so scrolling back shows the same numbers. */
const noise = (e: number) => {
  const x = Math.sin(e * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};

/** A believable training curve: fast early drop, long tail, small noise. */
const loss = (e: number) => 0.055 + 0.64 * Math.exp(-e / 17) + noise(e) * 0.022 * Math.exp(-e / 60);
const accuracy = (e: number) => Math.min(98.6, 100 - 48 * Math.exp(-e / 13) + noise(e + 7) * 0.9);
/** Cosine-decayed learning rate from 3e-4. */
const lr = (e: number) => 1e-5 + (3e-4 - 1e-5) * 0.5 * (1 + Math.cos((Math.PI * (e - 1)) / (EPOCHS - 1)));

const CURVE = Array.from({ length: EPOCHS + 1 }, (_, e) => (e === 0 ? loss(1) : loss(e)));
const MAX = Math.max(...CURVE);

function sparkPath(epoch: number) {
  let d = "";
  for (let e = 1; e <= epoch; e += 1) {
    const x = ((e - 1) / (EPOCHS - 1)) * SPARK_W;
    const y = SPARK_H - 1 - (CURVE[e] / MAX) * (SPARK_H - 2);
    d += `${e === 1 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

/**
 * Fixed top-right readout styled as a training log. It is decorative: the
 * epoch is how far you have scrolled, and the curve is a formula, not a
 * real run (the real training is the hero demo). Hidden below 768px.
 */
export function TrainingHud() {
  const ignited = useJourney((s) => s.ignited);
  const epochEl = useRef<HTMLSpanElement>(null);
  const lossEl = useRef<HTMLSpanElement>(null);
  const trendEl = useRef<HTMLSpanElement>(null);
  const accEl = useRef<HTMLSpanElement>(null);
  const lrEl = useRef<HTMLSpanElement>(null);
  const path = useRef<SVGPathElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let shown = -1;
    // Hidden over any copy block (data-copy) and while the hero, which shows the real training, is on screen.
    const avoid = () => {
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const hero = document.getElementById("top")?.getBoundingClientRect();
      let blocked = !!hero && hero.bottom > r.bottom;
      if (!blocked) {
        for (const c of document.querySelectorAll<HTMLElement>("[data-copy]")) {
          const q = c.getBoundingClientRect();
          if (q.right > r.left && q.left < r.right && q.bottom > r.top && q.top < r.bottom) {
            blocked = true;
            break;
          }
        }
      }
      el.style.visibility = blocked ? "hidden" : "";
    };
    const update = () => {
      frame = 0;
      avoid();
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const e = 1 + Math.round(p * (EPOCHS - 1));
      if (e === shown) return;
      shown = e;
      const l = CURVE[e];
      if (epochEl.current) epochEl.current.textContent = String(e).padStart(3, "0");
      if (lossEl.current) lossEl.current.textContent = l.toFixed(3);
      if (trendEl.current) trendEl.current.textContent = e > 1 && l > CURVE[e - 1] ? "↑" : "↓";
      if (accEl.current) accEl.current.textContent = `${accuracy(e).toFixed(1)}%`;
      if (lrEl.current) lrEl.current.textContent = lr(e).toExponential(1);
      path.current?.setAttribute("d", sparkPath(e));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={box}
      role="img"
      aria-label="Decorative training readout: the epoch counts how far you have scrolled; loss falls and accuracy rises along a fixed curve."
      className={`pointer-events-none fixed right-[34px] top-[96px] z-40 hidden items-center gap-3 rounded-sm border border-line bg-ink px-2.5 py-1.5 font-mono text-[0.6rem] tabular-nums text-faint backdrop-blur transition-opacity duration-700 md:flex ${
        ignited ? "opacity-100" : "opacity-0"
      }`}
    >
      <span>
        epoch <span ref={epochEl} className="text-soft">001</span>/{EPOCHS}
      </span>
      <span>
        loss <span ref={lossEl} className="text-soft">0.000</span> <span ref={trendEl} className="text-accent">↓</span>
      </span>
      <span>
        acc <span ref={accEl} className="text-soft">0.0%</span>
      </span>
      <span className="hidden lg:inline">
        lr <span ref={lrEl} className="text-soft">3.0e-4</span>
      </span>
      <svg width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} aria-hidden className="overflow-visible">
        <path d={`M0 ${SPARK_H - 0.5}H${SPARK_W}`} stroke="rgb(148 163 184 / 0.18)" strokeWidth="1" />
        <path ref={path} fill="none" stroke="#3be3f5" strokeWidth="1" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
