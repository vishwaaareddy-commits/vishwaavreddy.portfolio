"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const INTERACTIVE = "a, button, [role=button], [data-cursor], summary, label";

/**
 * Crosshair cursor for fine pointers. Expands over links and cards; the native
 * cursor returns in text fields. Not rendered on touch or with reduced motion.
 */
export function Cursor() {
  const enabled = useMediaQuery("(pointer: fine) and (min-width: 768px) and (prefers-reduced-motion: no-preference)");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = root.current;
    if (!el) return;
    document.documentElement.classList.add("has-custom-cursor");
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let frame = 0;
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.28;
      pos.y += (target.y - pos.y) * 0.28;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      frame = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const t = e.target as Element | null;
      el.dataset.state = t?.closest("input, textarea, select")
        ? "text"
        : t?.closest(INTERACTIVE)
          ? "active"
          : "idle";
    };
    const onLeave = () => (el.dataset.state = "hidden");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div ref={root} aria-hidden data-state="hidden" className="journey-cursor pointer-events-none fixed left-0 top-0 z-[100]">
      <span className="cursor-ring" />
      <span className="cursor-h" />
      <span className="cursor-v" />
    </div>
  );
}
