"use client";

import { useRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface RevealProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  as?: ElementType;
  /** Seconds between items marked with `data-reveal`. */
  stagger?: number;
}

/**
 * Fades and lifts every `[data-reveal]` descendant into place once, as the
 * block scrolls into view. Content is fully visible without JavaScript and
 * with reduced motion.
 */
export function Reveal({ children, as: Tag = "div", stagger = 0.08, ...rest }: RevealProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", root.current);
        if (!items.length) return;
        gsap.from(items, {
          opacity: 0,
          y: 28,
          duration: 0.6,
          ease: "power3.out",
          stagger,
          clearProps: "opacity,transform",
          scrollTrigger: { trigger: root.current, start: "top 82%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Tag ref={root} {...rest}>
      {children}
    </Tag>
  );
}
