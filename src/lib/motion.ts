"use client";

/** True when the visitor asked for reduced motion. Client-only. */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True below the mobile breakpoint used for shorter pins and lighter 3D. */
export function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·_";

/**
 * Scrambles an element's text into `next`, resolving left to right.
 * Returns a cancel function. Writes textContent directly (no re-renders).
 */
export function scrambleTo(el: HTMLElement, next: string, duration = 520) {
  if (prefersReducedMotion()) {
    el.textContent = next;
    return () => {};
  }
  const start = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const settled = Math.floor(p * next.length);
    let out = next.slice(0, settled);
    for (let i = settled; i < next.length; i += 1) {
      out += next[i] === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    el.textContent = out;
    if (p < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
