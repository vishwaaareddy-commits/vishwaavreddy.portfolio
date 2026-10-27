"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { CHAPTERS } from "@/store/journey";

/** Anything the pill must never sit on top of. */
const CARD = ".rounded-2xl, .rounded-xl, form, table, pre, [data-card]";

const label = (index: number) => {
  const meta = CHAPTERS.find((c) => c.index === index) ?? CHAPTERS[1];
  return `CHAPTER ${String(meta.index).padStart(2, "0")} · ${meta.name}`;
};

/**
 * Fixed bottom-left pill: "CHAPTER 02 · Selected work". The chapter is the
 * section under the viewport centre (its own IntersectionObserver, so it
 * never lags the scroll triggers); a change crossfades over 200 ms. Hidden
 * during the hero, while the footer is on screen, and over cards.
 */
export function ChapterPill() {
  const [chapter, setChapter] = useState(1);
  const [shown, setShown] = useState(1);
  const [fading, setFading] = useState(false);
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

  // Which chapter section crosses the horizontal centre line of the viewport.
  // A change crossfades over 200 ms: 100 ms out, swap the text, 100 ms in.
  useEffect(() => {
    const crossing = new Set<number>();
    const reduced = prefersReducedMotion();
    let target = 1;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const index = Number((e.target as HTMLElement).dataset.pillIndex);
          if (e.isIntersecting) crossing.add(index);
          else crossing.delete(index);
        }
        if (!crossing.size) return;
        // A pinned section and its neighbour can both touch the line for a frame: the later one wins.
        const next = Math.max(...crossing);
        if (next === target) return;
        target = next;
        setChapter(next);
        clearTimeout(timer);
        if (reduced) {
          setShown(next);
          return;
        }
        setFading(true);
        timer = setTimeout(() => {
          setShown(target);
          setFading(false);
        }, 100);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    // Chapters that remount (3D vs fallback) replace their section: observe the new one.
    const watched = new Map<string, HTMLElement>();
    const scan = () => {
      for (const c of CHAPTERS) {
        const el = document.getElementById(c.id);
        if (!el || watched.get(c.id) === el) continue;
        const old = watched.get(c.id);
        if (old) {
          io.unobserve(old);
          crossing.delete(c.index);
        }
        el.dataset.pillIndex = String(c.index);
        watched.set(c.id, el);
        io.observe(el);
      }
    };
    scan();
    const rescan = setInterval(scan, 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(rescan);
      io.disconnect();
    };
  }, []);

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
        <span aria-live="polite" className={`transition-opacity duration-100 ${fading ? "opacity-0" : "opacity-100"}`}>
          {label(shown)}
        </span>
      </p>
    </div>
  );
}
