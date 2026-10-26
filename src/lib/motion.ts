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
const FRAME_MS = 1000 / 60;
/** The scramble running on each element, so a new one always replaces it. */
const running = new WeakMap<HTMLElement, () => void>();

/**
 * Scrambles an element's text into `next`, resolving left to right over a
 * fixed number of frames (at most 400 ms at 60 fps). Every exit path — the
 * last frame, cancel, a newer scramble on the same element, or a throttled
 * tab — writes exactly `next`. Returns a cancel function.
 */
export function scrambleTo(el: HTMLElement, next: string, duration = 280) {
  running.get(el)?.();
  if (prefersReducedMotion()) {
    el.textContent = next;
    return () => {};
  }
  const frames = Math.max(1, Math.min(24, Math.round(Math.min(duration, 400) / FRAME_MS)));
  let n = 0;
  let raf = 0;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    clearTimeout(fallback);
    el.textContent = next;
    if (running.get(el) === finish) running.delete(el);
  };
  const tick = () => {
    n += 1;
    if (n >= frames) return finish();
    const settled = Math.floor((n / frames) * next.length);
    let out = next.slice(0, settled);
    for (let i = settled; i < next.length; i += 1) {
      out += next[i] === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    el.textContent = out;
    raf = requestAnimationFrame(tick);
  };
  // rAF pauses in background tabs: never leave scrambled text behind.
  const fallback = setTimeout(finish, frames * FRAME_MS + 150);
  running.set(el, finish);
  raf = requestAnimationFrame(tick);
  return finish;
}
