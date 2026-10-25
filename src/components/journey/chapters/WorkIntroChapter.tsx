"use client";

import { gsap } from "@/lib/gsap";
import { Chapter } from "../Chapter";

const words: { text: string; serif?: boolean }[] = [
  { text: "Four" },
  { text: "systems," },
  { text: "explained" },
  { text: "by" },
  { text: "how" },
  { text: "they" },
  { text: "work.", serif: true },
];

/** Chapter 02: words light from dim to bright as the reader scrolls (scrubbed). */
export function WorkIntroChapter() {
  return (
    <Chapter
      index={2}
      id="work"
      pin
      length={1.6}
      aria-labelledby="work-title"
      className="flex min-h-[100svh] items-center"
      build={(tl, { root }) => {
        const items = gsap.utils.toArray<HTMLElement>("[data-word]", root);
        // Dim never drops below 0.4, so text stays legible if a trigger is missed.
        gsap.set(items, { opacity: 0.4 });
        gsap.set("[data-after]", { opacity: 0.4, y: 16 });
        tl.to(items, { opacity: 1, stagger: 0.09, duration: 0.25 }, 0.05).to(
          "[data-after]",
          { opacity: 1, y: 0, duration: 0.25 },
          ">-0.1",
        );
      }}
    >
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:pl-24 md:pr-10 xl:px-8">
        <p className="eyebrow flex items-center gap-3">
          <span className="text-accent">002</span>
          <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
          Selected work
        </p>
        <h2 id="work-title" className="mt-8 max-w-5xl font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl xl:text-[5.6rem]">
          {words.map((w, i) => (
            <span key={i}>
              <span data-word className={w.serif ? "font-serif text-[1.08em] font-normal italic text-accent" : undefined}>
                {w.text}
              </span>{" "}
            </span>
          ))}
        </h2>
        <p data-after className="mt-10 max-w-xl text-base leading-relaxed text-soft md:text-lg">
          Each case study separates what I built from team results and marks its real status. The diagrams and
          animations explain each architecture; they don&apos;t run live services.
        </p>
      </div>
    </Chapter>
  );
}
