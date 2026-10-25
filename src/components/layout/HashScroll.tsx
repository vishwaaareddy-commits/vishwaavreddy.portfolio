"use client";

import { useEffect } from "react";

/**
 * Direct links such as /#contact can land early when fonts or late content
 * change the layout after the browser's first jump. Re-align once fonts are
 * ready and layout has settled. Targets use `scroll-margin-top` for the header.
 */
export function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let cancelled = false;
    const align = () => {
      if (cancelled) return;
      document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
    };
    const settle = () => requestAnimationFrame(() => requestAnimationFrame(align));
    document.fonts.ready.then(settle);
    window.addEventListener("load", settle, { once: true });
    // Stop correcting as soon as the visitor scrolls on their own.
    const stop = () => {
      cancelled = true;
    };
    window.addEventListener("wheel", stop, { once: true, passive: true });
    window.addEventListener("touchstart", stop, { once: true, passive: true });
    window.addEventListener("keydown", stop, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", settle);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, []);

  return null;
}
