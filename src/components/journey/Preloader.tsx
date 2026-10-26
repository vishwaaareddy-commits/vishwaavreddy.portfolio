"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { PRELOADER_KEY as KEY } from "@/lib/preloader";
import { useJourney } from "@/store/journey";

/** Matches the CSS timeline in globals.css (.preloader-*): log, count, fade. */
const IGNITE_AT = 1150;
const REMOVE_AT = 1650;

/** Shapes match the real networks: the hero's 2-16-16-1 and the background field. */
const LOG = [
  "loading model.safetensors",
  "layer.0.weight  [16, 2]",
  "layer.1.weight  [16, 16]",
  "layer.2.weight  [1, 16]",
  "field.weight ×5  16→32→48→48→32→16",
  "seed 2026",
  "warmup forward pass",
  "ready",
];

const subscribeNoop = () => () => {};
function shouldSkip() {
  try {
    return sessionStorage.getItem(KEY) === "1" || prefersReducedMotion();
  } catch {
    return true;
  }
}

/**
 * Chapter 00, "Loading weights". The log, count and fade run in CSS from
 * first paint, so they never wait for JavaScript or hold back the first
 * render. JavaScript only ignites the network on cue (it lights layer by
 * layer, left to right) and remembers the visit. Skipped on repeat visits
 * and with reduced motion.
 */
export function Preloader() {
  const skip = useSyncExternalStore(subscribeNoop, shouldSkip, () => false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const { ignite } = useJourney.getState();
    if (skip) {
      ignite();
      return;
    }
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    // The CSS timeline started at first paint; line up with it.
    const elapsed = performance.now();
    const timers = [
      setTimeout(ignite, Math.max(0, IGNITE_AT - elapsed)),
      setTimeout(() => setRemoved(true), Math.max(0, REMOVE_AT - elapsed)),
    ];
    return () => timers.forEach(clearTimeout);
  }, [skip]);

  if (skip || removed) return null;

  return (
    <div data-preloader aria-hidden className="preloader fixed inset-0 z-[90] flex items-center justify-center bg-ink/[0.94]">
      <div className="w-[min(84vw,420px)]">
        <div className="flex items-end justify-between gap-6">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-faint">Loading weights</p>
          <span className="preloader-count font-mono text-5xl tabular-nums leading-none text-fg md:text-6xl" />
        </div>
        <div className="relative mt-5 h-px w-full bg-line">
          <div className="preloader-bar absolute inset-0 origin-left bg-accent shadow-[0_0_12px_rgba(59,227,245,0.8)]" />
        </div>
        <ol className="mt-5 space-y-1 font-mono text-[0.7rem] leading-relaxed text-soft">
          {LOG.map((line, i) => (
            <li key={line} className="preloader-line" style={{ ["--i" as string]: i }}>
              <span className="text-accent">&gt;</span> {line}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
