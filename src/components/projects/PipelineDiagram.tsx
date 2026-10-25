"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export interface PipelineStep {
  label: string;
  detail: string;
}

interface PipelineDiagramProps {
  title: string;
  steps: PipelineStep[];
  caption?: string;
}

/**
 * Vertical system diagram whose stages light up in order as it scrolls
 * through the viewport. With reduced motion, every stage is shown lit.
 */
export function PipelineDiagram({ title, steps, caption }: PipelineDiagramProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const stages = gsap.utils.toArray<HTMLElement>("[data-stage]");
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top 75%",
            end: "bottom 45%",
            scrub: 0.6,
          },
        });
        tl.fromTo("[data-rail]", { scaleY: 0 }, { scaleY: 1, ease: "none", duration: stages.length }, 0);
        // A data packet travels down the rail as the reader scrolls.
        tl.fromTo("[data-packet]", { top: "0%", opacity: 0 }, { top: "100%", opacity: 1, ease: "none", duration: stages.length }, 0);
        stages.forEach((stage, i) => {
          tl.fromTo(
            stage,
            { opacity: 0.45 },
            { opacity: 1, duration: 0.5, ease: "power1.out" },
            i,
          ).fromTo(
            stage.querySelector("[data-dot]"),
            { backgroundColor: "rgba(59,227,245,0)", boxShadow: "0 0 0 0 rgba(59,227,245,0)" },
            { backgroundColor: "rgba(59,227,245,1)", boxShadow: "0 0 18px 2px rgba(59,227,245,0.45)", duration: 0.4 },
            i,
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative overflow-hidden rounded-2xl border border-line bg-panel/60 p-6 md:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-accent/[0.05] blur-3xl" />
      <p className="eyebrow mb-6">{title}</p>
      <div className="relative">
        {/* Decorative rail sits beside the list: an <ol> may only contain <li>. */}
        <div aria-hidden className="absolute bottom-3 left-[5px] top-3 w-px">
          <span className="absolute inset-0 bg-line" />
          <span data-rail className="absolute inset-0 origin-top bg-accent motion-reduce:scale-y-100" />
          <span
            data-packet
            className="absolute left-1/2 h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-transparent via-white to-accent opacity-0 shadow-[0_0_14px_3px_rgba(59,227,245,0.55)] motion-reduce:hidden"
          />
        </div>
        <ol className="relative">
        {steps.map((step, i) => (
          <li key={step.label} data-stage className="relative flex gap-5 pb-7 last:pb-0">
            <span
              aria-hidden
              data-dot
              className="relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full border border-accent bg-accent"
            />
            <div>
              <p className="font-mono text-[0.68rem] text-faint">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-0.5 font-display text-base text-fg">{step.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-soft">{step.detail}</p>
            </div>
          </li>
        ))}
        </ol>
      </div>
      {caption ? <p className="mt-6 font-mono text-[0.65rem] text-faint">{caption}</p> : null}
    </div>
  );
}
