"use client";

import { useEffect, useRef } from "react";
import { ATTENTION_TIMELINE as TL, HEADS, PROMPT_TOKENS, ROUTE, headMix, span } from "@/data/attention";
import { chapterProgress, useJourney } from "@/store/journey";

const W = 360;
const H = 220;
const BASE = 168;
const x = (i: number) => 30 + i * 60;
const HEAD_COLORS = ["#3be3f5", "#8b6cff", "#d8f8ff"];

/**
 * 2D attention view for phones on the low GPU tier and for reduced motion:
 * the same tokens, illustrative arcs and route as the 3D scene, as SVG.
 * Scrubbed from the journey store without React re-renders; reduced motion
 * shows the first head and the full route.
 */
export function AttentionFallback({ still }: { still: boolean }) {
  const heads = useRef<(SVGGElement | null)[]>([]);
  const route = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const apply = (t: number) => {
      const p = still ? 0.62 : chapterProgress(t, 3);
      const mix = still ? [1, 0, 0] : headMix(p);
      heads.current.forEach((g, i) => g?.setAttribute("opacity", String(mix[i])));
      const r = still ? 1 : span(p, TL.route);
      route.current.forEach((li, i) => li?.toggleAttribute("data-on", r * ROUTE.length > i));
    };
    apply(useJourney.getState().t);
    if (still) return;
    return useJourney.subscribe((s) => apply(s.t));
  }, [still]);

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[0.62rem]">
        {ROUTE.map((name, i) => (
          <li
            key={name}
            ref={(el) => {
              route.current[i] = el;
            }}
            className="rounded-full border border-line px-2 py-0.5 text-faint transition-colors duration-300 data-[on]:border-accent/60 data-[on]:text-accent"
          >
            {name}
          </li>
        ))}
      </ol>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
        {HEADS.map((h, hi) => (
          <g
            key={h.name}
            ref={(el) => {
              heads.current[hi] = el;
            }}
            opacity={0}
            fill="none"
            stroke={HEAD_COLORS[hi]}
            strokeLinecap="round"
          >
            {h.arcs.map(([from, to, w]) => {
              const height = 22 + 24 * (to - from);
              return (
                <path
                  key={`${from}-${to}`}
                  d={`M${x(from)} ${BASE} Q${(x(from) + x(to)) / 2} ${BASE - height * 2} ${x(to)} ${BASE}`}
                  strokeWidth={0.8 + 3.2 * w}
                  strokeOpacity={0.35 + 0.6 * w}
                />
              );
            })}
          </g>
        ))}
        {PROMPT_TOKENS.map((tok, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={BASE} r={4} fill="#3be3f5" />
            <text x={x(i)} y={BASE + 22} textAnchor="middle" className="fill-soft font-mono text-[11px]">
              {tok.trim() || tok}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
