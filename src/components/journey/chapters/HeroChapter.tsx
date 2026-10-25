"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Download } from "lucide-react";
import { Magnetic } from "@/components/journey/chrome/Magnetic";
import { StreamingText } from "@/components/ui/StreamingText";
import { profile } from "@/data/profile";
import { useJourney } from "@/store/journey";
import { Chapter } from "../Chapter";

function Letters({ text, offset = 0, className = "" }: { text: string; offset?: number; className?: string }) {
  return (
    <span aria-hidden className={className}>
      {[...text].map((ch, i) => (
        <span key={i} className="hero-letter" style={{ ["--i" as string]: i + offset }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

const ASSEMBLE_MS = 1400;

/**
 * Chapter 01. The headline is one real text element, visible from first
 * paint (it is the LCP element). When the Core ignites, an aria-hidden
 * overlay assembles the same words letter by letter from depth, then hands
 * back to the real text. On scroll the content lifts away (scrubbed).
 */
export function HeroChapter({ releaseLabel }: { releaseLabel: string }) {
  const ignited = useJourney((s) => s.ignited);
  const [assembled, setAssembled] = useState(false);
  const assembling = ignited && !assembled;

  useEffect(() => {
    if (!ignited) return;
    const id = setTimeout(() => setAssembled(true), ASSEMBLE_MS);
    return () => clearTimeout(id);
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
        tl.to("[data-lift]", { yPercent: -35, opacity: 0, stagger: 0.05, duration: 0.6 }, 0.1);
      }}
    >
      <div className="shell relative z-10">
        <div className="max-w-2xl">
          <p data-lift className="inline-flex items-center gap-2 rounded-full border border-line bg-ink/60 px-3 py-1 font-mono text-[0.7rem] text-soft backdrop-blur">
            <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(59,227,245,0.9)]" />
            {profile.currentRole}
          </p>

          <h1 id="hero-title" className="hero-title mt-8 font-display tracking-tight">
            <span data-lift className="block font-mono text-sm font-normal uppercase tracking-[0.3em] text-soft">
              {profile.name}
            </span>
            <span data-lift className="relative mt-5 block text-[3.1rem] font-semibold leading-[0.95] text-fg sm:text-7xl xl:text-[6.2rem]">
              <span className={assembling ? "opacity-0" : undefined}>
                Applied AI
                <br />
                <span className="font-serif text-[1.12em] font-normal italic text-accent">Engineer</span>
              </span>
              {assembling ? (
                <span aria-hidden className="absolute inset-0">
                  <Letters text="Applied AI" />
                  <br />
                  <Letters text="Engineer" offset={10} className="font-serif text-[1.12em] font-normal italic text-accent" />
                </span>
              ) : null}
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
      </div>
    </Chapter>
  );
}
