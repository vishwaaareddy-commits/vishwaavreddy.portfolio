"use client";

import { useEffect, useRef } from "react";
import { CHAPTERS, useJourney } from "@/store/journey";

const LAST = CHAPTERS[CHAPTERS.length - 1].index;

/** KPR-style chrome: inset 1px frame, left rail with scroll tick and chapter counter. */
export function Frame() {
  const tick = useRef<HTMLDivElement>(null);
  const chapter = useJourney((s) => s.chapter);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (tick.current) tick.current.style.top = `${(p * 100).toFixed(2)}%`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40">
      <div className="absolute inset-2.5 border border-line md:inset-[18px]" />
      <div className="absolute bottom-[18px] left-[18px] top-[18px] hidden w-11 border-r border-line md:block">
        <p className="mt-24 text-center font-mono text-[0.6rem] leading-tight text-faint">
          <span className="block text-accent">{String(chapter).padStart(3, "0")}</span>
          <span className="block">{String(LAST).padStart(3, "0")}</span>
        </p>
        <div className="absolute bottom-24 left-1/2 top-40 w-px -translate-x-1/2 bg-line">
          <div ref={tick} className="absolute left-1/2 h-6 w-[3px] -translate-x-1/2 -translate-y-1/2 bg-accent" />
        </div>
      </div>
    </div>
  );
}
