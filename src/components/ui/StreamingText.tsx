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

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className={done ? undefined : "stream-caret"}>
        {done ? text : tokens.slice(0, count).join("")}
      </span>
    </span>
  );
}
