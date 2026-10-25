"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees. Keep it small. */
  max?: number;
}

/**
 * Restrained hover depth: a slight tilt plus a soft light that follows the
 * pointer. Only reacts to fine pointers, and does nothing with reduced motion.
 */
export function TiltCard({ children, className = "", max = 3 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const allow = (e: PointerEvent) =>
    e.pointerType === "mouse" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !allow(e)) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * max).toFixed(2)}deg) rotateY(${((px - 0.5) * max).toFixed(2)}deg) translateY(-2px)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`group/tilt relative transition-transform duration-500 ease-out will-change-transform ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/tilt:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 0%), rgba(59,227,245,0.09), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}
