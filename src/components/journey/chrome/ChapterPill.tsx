"use client";

import { useEffect, useRef, useState } from "react";
import { scrambleTo } from "@/lib/motion";
import { CHAPTERS, useJourney } from "@/store/journey";

/** Anything the pill must never sit on top of. */
const CARD = ".rounded-2xl, .rounded-xl, form, table, pre, [data-card]";

const label = (index: number) => {
  const meta = CHAPTERS.find((c) => c.index === index) ?? CHAPTERS[1];
  return `CHAPTER ${String(meta.index).padStart(2, "0")} · ${meta.name}`;
};

/**
 * Fixed bottom-left pill: "CHAPTER 02 · Selected work". Scrambles once,
 * within 300 ms, when the chapter settles on a new value; hidden during the
 * hero, while the footer is on screen, and whenever a card is beneath it.
 */
export function ChapterPill() {
  const chapter = useJourney((s) => s.chapter);
  const text = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  const [footerInView, setFooterInView] = useState(false);
  const [overCard, setOverCard] = useState(false);
  const pill = useRef<HTMLDivElement>(null);

  // Sample what is under the pill (it ignores pointer events, so it is skipped).
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const el = pill.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const y = r.top + r.height / 2;
      const hit = [r.left + 6, r.left + r.width / 2, r.right - 6].some((x) =>
        document.elementsFromPoint(x, y).some((node) => node.closest(CARD)),
      );
      setOverCard(hit);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const io = new IntersectionObserver(([entry]) => setFooterInView(entry.isIntersecting));
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  // Debounce so crossing a boundary quickly never triggers repeated scrambles.
  // A chapter change cancels any running scramble, which lands on its exact
  // target first; the new one then starts from clean text.
  useEffect(() => {
    const el = text.current;
    if (!el) return;
    let cancel = () => {};
    const id = setTimeout(() => {
      if (shown.current === chapter) return;
      const first = shown.current === null;
      shown.current = chapter;
      if (first) el.textContent = label(chapter);
      else cancel = scrambleTo(el, label(chapter), 280);
    }, 120);
    return () => {
      clearTimeout(id);
      cancel();
    };
  }, [chapter]);

  const hidden = chapter <= 1 || footerInView || overCard;
  return (
    <div
      ref={pill}
      data-pill
      aria-hidden={hidden}
      className={`pointer-events-none fixed bottom-6 left-6 z-40 transition-opacity duration-300 md:bottom-[34px] md:left-[82px] ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
    >
      <p className="flex items-center gap-2 rounded-full border border-line-strong bg-ink/90 px-3.5 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-soft backdrop-blur">
        <span aria-hidden className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(59,227,245,0.9)]" />
        <span ref={text} aria-live="polite">
          {label(1)}
        </span>
      </p>
    </div>
  );
}
