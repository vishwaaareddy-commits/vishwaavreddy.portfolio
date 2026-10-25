"use client";

import { useEffect } from "react";
import { getLenis } from "@/components/journey/SmoothScroll";
import { ScrollTrigger } from "@/lib/gsap";

const HEADER_OFFSET = 80;

/**
 * Direct links such as /#contact can land early when fonts, pin spacers or
 * late content change the layout after the browser's first jump. Re-align
 * after fonts load and ScrollTrigger refreshes, until the visitor scrolls.
 */
export function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let cancelled = false;

    const align = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (!el) return;
      // Pinned chapters start flush with the top; other sections clear the header.
      const offset = el.hasAttribute("data-chapter") ? 0 : -HEADER_OFFSET;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(el, { offset, immediate: true, force: true });
      else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "instant" });
    };
    const settle = () => requestAnimationFrame(() => requestAnimationFrame(align));

    document.fonts.ready.then(settle);
    window.addEventListener("load", settle, { once: true });
    ScrollTrigger.addEventListener("refresh", settle);

    const stop = () => {
      cancelled = true;
    };
    window.addEventListener("wheel", stop, { once: true, passive: true });
    window.addEventListener("touchstart", stop, { once: true, passive: true });
    window.addEventListener("keydown", stop, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", settle);
      ScrollTrigger.removeEventListener("refresh", settle);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, []);

  return null;
}
