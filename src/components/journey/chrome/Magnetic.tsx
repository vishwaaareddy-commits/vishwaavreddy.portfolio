"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/** Pulls its child gently toward the pointer (fine pointers only, max ~8px). */
export function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  const onMove = (e: PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = Math.max(-8, Math.min(8, (e.clientX - (r.left + r.width / 2)) * strength));
    const y = Math.max(-8, Math.min(8, (e.clientY - (r.top + r.height / 2)) * strength));
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="inline-block transition-transform duration-300 ease-out"
    >
      {children}
    </span>
  );
}
