"use client";

import { useEffect, useRef } from "react";
import { scrambleTo } from "@/lib/motion";
import { CHAPTERS, useJourney } from "@/store/journey";

/** Fixed bottom-left pill: "CHAPTER 02 · Selected work", scrambling on change. */
export function ChapterPill() {
  const chapter = useJourney((s) => s.chapter);
  const label = useRef<HTMLSpanElement>(null);
  const meta = CHAPTERS.find((c) => c.index === chapter) ?? CHAPTERS[1];
  const text = `CHAPTER ${String(meta.index).padStart(2, "0")} · ${meta.name}`;

  useEffect(() => {
    if (!label.current) return;
    return scrambleTo(label.current, text);
  }, [text]);

  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-40 md:bottom-[34px] md:left-[82px]">
      <p className="flex items-center gap-2 rounded-full border border-line-strong bg-ink/75 px-3.5 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-soft backdrop-blur">
        <span aria-hidden className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(59,227,245,0.9)]" />
        <span ref={label} aria-live="polite">
          {text}
        </span>
      </p>
    </div>
  );
}
