"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useMediaQuery";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** Rolls up to the real pepy.tech download count once it scrolls into view. */
export function DownloadsCounter({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1400);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, value]);

  const display = reduced || !inView ? value : shown;
  return (
    <span ref={ref} className="font-display text-3xl font-semibold tabular-nums text-fg">
      <span className="sr-only">{value.toLocaleString("en")} downloads</span>
      <span aria-hidden>{compact.format(display)}</span>
    </span>
  );
}
