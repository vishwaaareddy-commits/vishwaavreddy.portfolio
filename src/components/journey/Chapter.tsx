"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { isMobileViewport, prefersReducedMotion } from "@/lib/motion";
import { useJourney } from "@/store/journey";

export interface ChapterContext {
  root: HTMLElement;
  mobile: boolean;
}

interface ChapterProps {
  index: number;
  id: string;
  children: ReactNode;
  /** Pin the section while its timeline scrubs. */
  pin?: boolean;
  /** Pin length in viewport heights on desktop (mobile always uses 1). */
  length?: number;
  /** Adds scrubbed tweens to the chapter timeline (0 → 1 over the pin). */
  build?: (tl: gsap.core.Timeline, ctx: ChapterContext) => void;
  className?: string;
  "aria-labelledby"?: string;
}

/**
 * One chapter of the journey. Scroll position drives a scrubbed (reversible)
 * timeline and the shared journey store; reduced motion gets no pins or scrub.
 */
export function Chapter({ index, id, children, pin = false, length = 2, build, className = "", ...rest }: ChapterProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const { setChapter, setT } = useJourney.getState();

      // Which chapter is "current" for the pill and nav: the one at mid-screen.
      ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => self.isActive && setChapter(index),
      });

      if (prefersReducedMotion()) return;

      const mobile = isMobileViewport();
      const len = mobile ? 1 : length;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: pin ? () => `+=${window.innerHeight * len}` : "bottom top",
          pin,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setT(index + self.progress),
          onLeave: () => setT(index + 1),
          onEnterBack: (self) => setT(index + self.progress),
        },
      });
      build?.(tl, { root: el, mobile });
      // Keep the timeline exactly as long as the scroll range it maps to.
      if (tl.duration() === 0) tl.to({}, { duration: 1 });
    },
    { scope: root },
  );

  return (
    <section ref={root} id={id} data-chapter={index} className={`relative ${className}`} {...rest}>
      {children}
    </section>
  );
}
