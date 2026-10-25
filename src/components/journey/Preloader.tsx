"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { PRELOADER_KEY as KEY } from "@/lib/preloader";
import { useJourney } from "@/store/journey";

/** Matches the CSS timeline in globals.css (.preloader-*): count, split, fade. */
const IGNITE_AT = 1000;
const REMOVE_AT = 1500;

const subscribeNoop = () => () => {};
function shouldSkip() {
  try {
    return sessionStorage.getItem(KEY) === "1" || prefersReducedMotion();
  } catch {
    return true;
  }
}

/**
 * Chapter 00. The count, bar split and fade run in CSS from first paint, so
 * they never wait for JavaScript or hold back the first render. JavaScript
 * only ignites the Core on cue and remembers the visit. Skipped on repeat
 * visits and with reduced motion.
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
    <div data-preloader aria-hidden className="preloader fixed inset-0 z-[90] flex flex-col items-center justify-center bg-ink/[0.92]">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-faint">Initializing inference…</p>
      <span className="preloader-count mt-6 font-mono text-6xl tabular-nums text-fg md:text-7xl" />
      <div className="relative mt-8 h-px w-[min(60vw,420px)] bg-line">
        <div className="preloader-bar absolute inset-0 origin-left bg-accent shadow-[0_0_12px_rgba(59,227,245,0.8)]" />
        <div className="preloader-split preloader-split--left absolute inset-y-0 left-0 w-1/2 bg-accent" />
        <div className="preloader-split preloader-split--right absolute inset-y-0 right-0 w-1/2 bg-accent" />
      </div>
    </div>
  );
}
