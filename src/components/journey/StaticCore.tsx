"use client";

import { useEffect, useRef } from "react";
import { useJourney } from "@/store/journey";

/** Viewport-relative stops for the image Core (x/y in vw/vh, size in vmin). */
interface Stop {
  t: number;
  x: number;
  y: number;
  size: number;
  alpha: number;
}

// Phones: top-right in the hero, out of the text's way, then dim in the corner.
const MOBILE: Stop[] = [
  { t: 1.0, x: 74, y: 15, size: 34, alpha: 1 },
  { t: 1.75, x: 70, y: 22, size: 26, alpha: 0.9 },
  { t: 2.1, x: 80, y: 18, size: 22, alpha: 0.8 },
  { t: 3.08, x: 80, y: 16, size: 20, alpha: 0.8 },
  { t: 3.99, x: 88, y: 86, size: 14, alpha: 0.12 },
  { t: 10.99, x: 88, y: 86, size: 14, alpha: 0.12 },
  // Contact: returns, larger, above the heading.
  { t: 11.2, x: 50, y: 20, size: 30, alpha: 0.9 },
];

// Larger screens without WebGL2 (or with reduced motion): right-hand side.
const DESKTOP: Stop[] = [
  { t: 1.0, x: 76, y: 48, size: 34, alpha: 1 },
  { t: 1.75, x: 64, y: 52, size: 24, alpha: 1 },
  { t: 2.1, x: 82, y: 70, size: 18, alpha: 0.9 },
  { t: 3.99, x: 94, y: 50, size: 10, alpha: 0.5 },
  { t: 10.99, x: 94, y: 50, size: 10, alpha: 0.5 },
  { t: 11.2, x: 60, y: 22, size: 22, alpha: 0.9 },
];

const smooth = (x: number) => x * x * (3 - 2 * x);

function sample(stops: Stop[], t: number): Stop {
  if (t <= stops[0].t) return stops[0];
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t <= b.t) {
      const k = smooth((t - a.t) / (b.t - a.t));
      const mix = (u: number, v: number) => u + (v - u) * k;
      return { t, x: mix(a.x, b.x), y: mix(a.y, b.y), size: mix(a.size, b.size), alpha: mix(a.alpha, b.alpha) };
    }
  }
  return stops[stops.length - 1];
}

/**
 * The Core as a pre-rendered image (one frame of the real 3D Core, ~12 KB):
 * used on phones, with reduced motion and without WebGL2, so three.js is
 * never downloaded there. Moved by the journey store with CSS transforms only.
 */
export function StaticCore({ mobile, still }: { mobile: boolean; still: boolean }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const stops = mobile ? MOBILE : DESKTOP;
    let frame = 0;
    const apply = (t: number) => {
      frame = 0;
      const s = sample(stops, still ? 1 : t);
      node.style.transform = `translate3d(calc(${s.x}vw - 50%), calc(${s.y}vh - 50%), 0)`;
      node.style.width = node.style.height = `${s.size}vmin`;
      node.style.opacity = String(s.alpha);
    };
    apply(useJourney.getState().t);
    if (still) return;
    // Subscribe outside React: no re-renders while scrolling.
    return useJourney.subscribe((state) => {
      if (!frame) frame = requestAnimationFrame(() => apply(state.t));
    });
  }, [mobile, still]);

  return (
    <div ref={el} aria-hidden className="static-core absolute left-0 top-0 will-change-transform">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed asset; next/image adds nothing here */}
      <img src="/images/core.webp" alt="" width={390} height={390} decoding="async" className={still ? "" : "static-core-float"} />
    </div>
  );
}
