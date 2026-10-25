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
 * Lifts every `[data-reveal]` descendant into place once, as the
 * block scrolls into view. Content is fully visible without JavaScript, with
 * reduced motion and on phones.
 */
export function Reveal({ children, as: Tag = "div", stagger = 0.08, ...rest }: RevealProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Desktop only: on phones each reveal is another ScrollTrigger to measure
      // during load for little visual gain, so content simply renders in place.
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", root.current);
        if (!items.length) return;
        // Never start below 0.4: a missed trigger must not leave text unreadable.
        gsap.from(items, {
          opacity: 0.4,
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
