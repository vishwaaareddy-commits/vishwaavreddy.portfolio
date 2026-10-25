"use client";

import { useRef, type ReactNode } from "react";
import { gsap, scheduleRefresh, ScrollTrigger, useGSAP } from "@/lib/gsap";
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
  /** Set false when the mobile layout is taller than one screen and must scroll normally. */
  pinOnMobile?: boolean;
  /** Adds scrubbed tweens to the chapter timeline (0 → 1 over the pin). */
  build?: (tl: gsap.core.Timeline, ctx: ChapterContext) => void;
  className?: string;
  "aria-labelledby"?: string;
}

/**
 * One chapter of the journey. Scroll position drives a scrubbed (reversible)
 * timeline and the shared journey store; reduced motion gets no pins or scrub.
 */
export function Chapter({
  index,
  id,
  children,
  pin = false,
  length = 2,
  pinOnMobile = true,
  build,
  className = "",
  ...rest
}: ChapterProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const { setChapter, setT } = useJourney.getState();

      // Which chapter is "current" for the pill and nav: the one at mid-screen.
      // Created after the pin (below) so its range includes the pin spacing.
      // A pinned chapter stays current for its whole pin, not just its own height.
      const trackActive = (pinLength = 0) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: pinLength ? () => `+=${window.innerHeight * (1 + pinLength)}` : "bottom 55%",
          onToggle: (self) => self.isActive && setChapter(index),
        });

      if (prefersReducedMotion()) {
        trackActive();
        return;
      }

      const mobile = isMobileViewport();
      const pinned = pin && (pinOnMobile || !mobile);
      const len = mobile ? 1 : length;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: pinned ? () => `+=${window.innerHeight * len}` : "bottom top",
          pin: pinned,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setT(index + self.progress),
          onLeave: () => setT(index + 1),
          onEnterBack: (self) => setT(index + self.progress),
        },
      });
      trackActive(pinned ? len : 0);
      build?.(tl, { root: el, mobile });
      // Keep the timeline exactly as long as the scroll range it maps to.
      if (tl.duration() === 0) tl.to({}, { duration: 1 });
      // A pin spacer changes everything below it: re-sort and re-measure all triggers.
      scheduleRefresh();
    },
    { scope: root },
  );

  return (
    <section ref={root} id={id} data-chapter={index} className={`relative ${className}`} {...rest}>
      {children}
    </section>
  );
}
