"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { CHAPTERS, useJourney } from "@/store/journey";

/**
 * Keeps the chapter pill and nav in step for sections that are not yet
 * journey chapters (04 onward). Chapters 01–03 report themselves.
 */
export function ChapterSpy() {
  useEffect(() => {
    const { setChapter } = useJourney.getState();
    const triggers = CHAPTERS.filter((c) => c.index >= 4).flatMap((c) => {
      const el = document.getElementById(c.id);
      if (!el || el.hasAttribute("data-chapter")) return [];
      return [
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => self.isActive && setChapter(c.index),
        }),
      ];
    });
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return null;
}
