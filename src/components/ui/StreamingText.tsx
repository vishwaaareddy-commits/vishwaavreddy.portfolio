"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useMediaQuery";

interface StreamingTextProps {
  text: string;
  /** Milliseconds between tokens. */
  speed?: number;
  delay?: number;
  className?: string;
  /** Start only when true, e.g. once the element scrolls into view. */
  active?: boolean;
}

/**
 * Reveals text word by word, like a streamed model response.
 * Screen readers get the full text immediately; the animated copy is aria-hidden.
 */
export function StreamingText({ text, speed = 55, delay = 0, className, active = true }: StreamingTextProps) {
  const reduced = useReducedMotion();
  const tokens = text.split(/(\s+)/);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active || reduced) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      i += 1;
      setCount(i);
      if (i < tokens.length) timer = setTimeout(tick, speed);
    };
    timer = setTimeout(tick, delay);
    return () => clearTimeout(timer);
  }, [active, reduced, tokens.length, speed, delay]);

  const done = reduced || count >= tokens.length;

  // The invisible full copy reserves the final height from the first paint,
  // so streaming never pushes later content down (which broke hash links).
  return (
    <span className={`grid ${className ?? ""}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {text}
      </span>
      <span aria-hidden className={`col-start-1 row-start-1 ${done ? "" : "stream-caret"}`}>
        {done ? text : tokens.slice(0, count).join("")}
      </span>
    </span>
  );
}
