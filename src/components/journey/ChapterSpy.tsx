"use client";

import { useEffect } from "react";
import { scheduleRefresh, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { CHAPTERS, useJourney } from "@/store/journey";

/**
 * Journey position for sections that are not pinned chapters (05 onward):
 * reports the current chapter and keeps `t` advancing, so no chapter scene
 * can stay on screen past its own range.
 */
export function ChapterSpy() {
  useEffect(() => {
    const { setChapter, setT } = useJourney.getState();
    const reduced = prefersReducedMotion();
    const triggers: ScrollTrigger[] = [];

    for (const c of CHAPTERS.filter((ch) => ch.index >= 4)) {
      const el = document.getElementById(c.id);
      if (!el || el.hasAttribute("data-chapter")) continue;
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => self.isActive && setChapter(c.index),
        }),
      );
      if (reduced) continue;
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: "bottom top",
          onUpdate: (self) => setT(c.index + self.progress),
          onLeave: () => setT(c.index + 1),
          onEnterBack: (self) => setT(c.index + self.progress),
          onLeaveBack: () => setT(c.index),
        }),
      );
    }

    scheduleRefresh();
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return null;
}
