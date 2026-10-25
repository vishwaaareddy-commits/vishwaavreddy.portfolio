"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

let lenis: Lenis | null = null;

/** The active Lenis instance, or null when native scrolling is used. */
export function getLenis() {
  return lenis;
}

/**
 * Lenis inertia scrolling, driven by GSAP's ticker so pinned, scrubbed
 * ScrollTriggers stay in lock-step. Disabled for reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const instance = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: { offset: -80 } });
    lenis = instance;
    instance.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      lenis = null;
    };
  }, []);

  return null;
}
