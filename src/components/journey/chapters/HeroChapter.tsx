"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Download } from "lucide-react";
import { Magnetic } from "@/components/journey/chrome/Magnetic";
import { TrainingPanel } from "@/components/journey/training/TrainingPanel";
import { StreamingText } from "@/components/ui/StreamingText";
import { profile } from "@/data/profile";
import { useJourney } from "@/store/journey";
import { Chapter } from "../Chapter";

const LINE_1 = "Applied AI";
const LINE_2 = "Engineer";
const TOTAL = LINE_1.length + LINE_2.length;
/** One character per tick, like tokens streaming from a model. */
const TOKEN_MS = 55;
/** The caret keeps blinking a moment after the last token. */
const HOLD_MS = 1300;

/** The headline as it is "generated": typed so far, then a blinking caret. */
function Generated({ count }: { count: number }) {
  const caret = <span className="token-caret" />;
  const second = Math.max(0, count - LINE_1.length);
  return (
    <span aria-hidden className="absolute inset-0">
      {LINE_1.slice(0, count)}
      {count < LINE_1.length ? caret : null}
      <br />
      <span className="font-serif text-[1.12em] font-normal italic text-accent">
        {LINE_2.slice(0, second)}
        {count >= LINE_1.length ? caret : null}
      </span>
    </span>
  );
}

/**
 * Chapter 01. The headline is one real text element, visible from first
 * paint (it is the LCP element). When the network ignites, an aria-hidden
 * overlay types the same words one character at a time behind a blinking
 * caret, then hands back to the real text. Beside it, a real network trains
 * live. On scroll the content lifts away while the camera pulls back.
 */
export function HeroChapter({ releaseLabel }: { releaseLabel: string }) {
  const ignited = useJourney((s) => s.ignited);
  const [count, setCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const typing = ignited && !finished;

  useEffect(() => {
    if (!ignited) return;
    let n = 0;
    let hold: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      n += 1;
      setCount(n);
      if (n >= TOTAL) {
        clearInterval(id);
        hold = setTimeout(() => setFinished(true), HOLD_MS);
      }
    }, TOKEN_MS);
    return () => {
      clearInterval(id);
      clearTimeout(hold);
    };
  }, [ignited]);

  return (
    <Chapter
      index={1}
      id="top"
      pin
      // Phones: no pin. Pinning wraps the hero in a spacer after hydration, which
      // counts as re-inserting the heading and pushes LCP back by seconds.
      pinOnMobile={false}
      length={0.7}
      aria-labelledby="hero-title"
      className="flex min-h-[100svh] items-end pb-20 pt-28 md:items-center md:pb-24"
      build={(tl) => {
        // Fills the whole (short) pin, so no empty screen follows the hero.
        // Copy is gone by mid-pin; the rest of the pin is the network revealing.
        tl.to("[data-lift]", { yPercent: -35, opacity: 0, stagger: 0.03, duration: 0.35 }, 0.05);
        tl.to({}, { duration: 0.45 }, 0.55);
      }}
    >
      <div className="shell relative z-10 grid w-full grid-cols-1 gap-12 md:grid-cols-12 md:items-center md:gap-8">
        <div data-copy className="max-w-2xl md:order-2 md:col-span-7">
          <p data-lift className="inline-flex items-center gap-2 rounded-full border border-line bg-ink/60 px-3 py-1 font-mono text-[0.7rem] text-soft backdrop-blur">
            <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(59,227,245,0.9)]" />
            {profile.currentRole}
          </p>

          <h1 id="hero-title" className="hero-title mt-8 font-display tracking-tight">
            <span data-lift className="block font-mono text-sm font-normal uppercase tracking-[0.3em] text-soft">
              {profile.name}
            </span>
            <span data-lift className="relative mt-5 block text-[3.1rem] font-semibold leading-[0.95] text-fg sm:text-7xl md:text-[3.6rem] lg:text-7xl xl:text-[6.2rem]">
              <span className={typing ? "opacity-0" : undefined}>
                Applied AI
                <br />
                <span className="font-serif text-[1.12em] font-normal italic text-accent">Engineer</span>
              </span>
              {typing ? <Generated count={count} /> : null}
            </span>
          </h1>

          <p data-lift className="mt-8 max-w-md text-lg leading-relaxed text-fg/90">
            <StreamingText text={profile.tagline} delay={700} speed={55} active={ignited} />
          </p>

          <div data-lift className="mt-10 flex flex-wrap items-center gap-3">
            <Magnetic>
              <a
                href="#work"
                data-cursor
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-ink shadow-[0_0_30px_-8px_rgba(59,227,245,0.7)]"
              >
                Explore selected work
                <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden />
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={profile.resume}
                download
                className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-ink/50 px-5 py-3 text-sm text-fg backdrop-blur transition-colors duration-300 hover:border-fg"
              >
                <Download className="size-4" aria-hidden />
                Résumé
              </a>
            </Magnetic>
            <a href="#contact" className="link-draw px-2 py-3 text-sm text-soft hover:text-fg">
              Contact
            </a>
          </div>

          <a
            data-lift
            href="#modelbridge"
            className="group mt-10 flex max-w-md items-start gap-3 border-l border-accent/50 pl-4 text-sm text-soft transition-colors duration-300 hover:text-fg"
          >
            <span>
              <span className="font-mono text-xs uppercase tracking-wider text-accent">{releaseLabel}</span>
              <span className="mt-1 block">An async Python client for a multi-provider LLM gateway, with streaming and retries.</span>
            </span>
          </a>
        </div>
        <div data-lift className="md:order-1 md:col-span-5">
          <TrainingPanel />
        </div>
      </div>
    </Chapter>
  );
}
