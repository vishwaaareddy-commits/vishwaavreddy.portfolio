"use client";

import type { ReactNode } from "react";
import { CaseNotes } from "@/components/projects/CaseNotes";
import { CopyButton } from "@/components/ui/CopyCommand";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ATTENTION_TIMELINE as TL, PROMPT_TOKENS, ROUTE } from "@/data/attention";
import { exampleReply, usageSketch } from "@/data/modelbridge";
import { useScene3D } from "@/hooks/useScene3D";
import { gsap } from "@/lib/gsap";
import { labelRegistry } from "@/store/journey";
import type { CaseStudy } from "@/types/content";
import { Chapter } from "../Chapter";
import { AttentionFallback } from "./AttentionFallback";

const PIP = "pip install modelbridge-sdk";
/** The streamed reply split the way it is revealed: one word-ish token at a time. */
const REPLY_TOKENS = exampleReply.match(/\s*\S+/g) ?? [exampleReply];

interface TypedProps {
  name: string;
  text: string;
  className?: string;
}

/**
 * Full text rendered by React (visible without JS or with reduced motion),
 * plus an empty overlay that the scrubbed timeline types into. GSAP never
 * edits nodes React owns.
 */
function Typed({ name, text, className = "" }: TypedProps) {
  return (
    <span className={`relative block ${className}`}>
      <span data-full={name} className="block whitespace-pre-wrap">
        {text}
      </span>
      <span data-typed={name} aria-hidden className="absolute inset-0 block whitespace-pre-wrap" />
    </span>
  );
}

const seg = (p: number, [a, b]: readonly [number, number]) => Math.min(1, Math.max(0, (p - a) / (b - a)));

const register = (key: string) => (el: HTMLElement | null) => {
  if (el) labelRegistry.set(key, el);
  else labelRegistry.delete(key);
};

interface ModelBridgeChapterProps {
  study: CaseStudy;
  /** True only when PyPI lists installable files; until then no install command is shown. */
  installable: boolean;
  usageExample?: string;
  /** PyPI button, badge and counter — only rendered once a release installs. */
  endSlot: ReactNode;
}

/**
 * Chapter 03, attention + routing. The stage (right) shows the prompt's
 * tokens with illustrative attention arcs for three heads, then the output
 * routed SDK → gateway → OpenRouter → Gemini. The terminal (left) types the
 * call and then streams the reply token by token in sync with the scroll.
 */
export function ModelBridgeChapter({ study, installable, usageExample, endSlot }: ModelBridgeChapterProps) {
  const code = usageExample ?? usageSketch;
  const { scene3D, lowPhone } = useScene3D();
  const flat = !scene3D || lowPhone;

  return (
    <>
      <Chapter
        index={3}
        id="modelbridge"
        pin
        // Phones: stage plus terminal is taller than one screen, so it scrolls instead.
        pinOnMobile={false}
        // Unpinned, the visual and typing play while the section crosses the screen.
        unpinnedRange={["top 80%", "bottom 80%"]}
        length={0.9}
        aria-labelledby="modelbridge-title"
        className="flex min-h-[100svh] items-center py-24 md:py-0"
        build={(tl, { root }) => {
          const parts = ["pip", "code"].map((name) => ({
            full: root.querySelector<HTMLElement>(`[data-full="${name}"]`),
            typed: root.querySelector<HTMLElement>(`[data-typed="${name}"]`),
          }));
          const texts = parts.map((p) => p.full?.textContent ?? "");
          const reply = { full: root.querySelector<HTMLElement>('[data-full="reply"]'), typed: root.querySelector<HTMLElement>('[data-typed="reply"]') };
          const rate = root.querySelector<HTMLElement>("[data-rate]");
          // Hide the React-rendered copies (reverted with the GSAP context);
          // the overlays carry the typed text.
          gsap.set([...parts.map((p) => p.full), reply.full].filter(Boolean), { visibility: "hidden" });
          const ranges = [
            [0.0, 0.06],
            [0.06, 0.58],
          ] as const;
          const state = { p: 0 };
          let last = { n: 0, at: performance.now(), rate: 0 };
          const render = () => {
            parts.forEach((part, i) => {
              if (part.typed) part.typed.textContent = texts[i].slice(0, Math.round(seg(state.p, ranges[i]) * texts[i].length));
            });
            const n = Math.round(seg(state.p, TL.stream) * REPLY_TOKENS.length);
            if (reply.typed) reply.typed.textContent = REPLY_TOKENS.slice(0, n).join("");
            // Tokens shown per second of this replay (scroll speed), not a model's throughput.
            const now = performance.now();
            const dt = (now - last.at) / 1000;
            if (dt > 0.05) {
              const inst = Math.abs(n - last.n) / dt;
              last = { n, at: now, rate: last.rate * 0.6 + inst * 0.4 };
              if (rate) rate.textContent = n >= REPLY_TOKENS.length ? "done" : Math.round(last.rate) > 0 ? `${Math.round(last.rate)} tok/s` : "— tok/s";
            }
          };
          if (rate) rate.textContent = "— tok/s";
          render();
          tl.to(state, { p: 1, duration: 1, ease: "none", onUpdate: render }, 0);
          tl.from("[data-mb-end]", { opacity: 0.4, y: 16, duration: 0.06 }, 0.92);
        }}
      >
        <div className="shell relative z-10 grid w-full grid-cols-1 gap-6 md:grid-cols-12 md:items-center md:gap-10">
          <div data-copy className="max-w-xl md:col-span-6 lg:col-span-5">
            <p className="eyebrow flex items-center gap-3">
              <span className="text-accent">003</span>
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
              {study.kicker} · {study.org}
            </p>
            <h2 id="modelbridge-title" className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              ModelBridge <span className="font-serif text-[1.1em] font-normal italic text-accent">SDK</span>
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge status={study.status} />
              <p className="text-sm text-faint">{study.statusNote}</p>
            </div>
            <p className="mt-3 hidden text-sm leading-relaxed text-soft lg:block">{study.problem}</p>

            <div className="notch mt-5 overflow-hidden border border-line bg-[#05070a]/90 backdrop-blur">
              <div className="flex items-center justify-between border-b border-line px-4 py-2">
                <div className="flex gap-1.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-line-strong" />
                  <span className="size-2.5 rounded-full bg-line-strong" />
                  <span className="size-2.5 rounded-full bg-line-strong" />
                </div>
                <p className="font-mono text-[0.65rem] text-faint">modelbridge-sdk</p>
              </div>
              <div className="space-y-3 p-4 font-mono text-[0.74rem] leading-relaxed">
                {installable ? (
                  <div className="flex items-start justify-between gap-3 text-fg">
                    <span className="flex gap-2">
                      <span className="select-none text-accent">$</span>
                      <Typed name="pip" text={PIP} />
                    </span>
                    <CopyButton command={PIP} />
                  </div>
                ) : (
                  <p className="text-soft">Install instructions coming with the public release.</p>
                )}
                <pre className="hidden max-h-[18vh] overflow-hidden text-soft md:block">
                  <code>
                    <Typed name="code" text={code} />
                  </code>
                </pre>
                <div className="rounded-lg border border-accent/20 bg-accent-dim/40 p-3 text-fg">
                  <p className="mb-1.5 flex justify-between text-[0.62rem] uppercase tracking-wider text-accent">
                    <span>streamed response</span>
                    <span className="text-faint normal-case">
                      replay · <span data-rate />
                    </span>
                  </p>
                  <Typed name="reply" text={exampleReply} />
                </div>
              </div>
            </div>

            <div data-mb-end>{endSlot}</div>
            <CaseNotes study={study} />
          </div>

          {/* The stage: the 3D scene is fitted here, or the SVG version renders inside it. */}
          <div
            data-stage="attention"
            data-copy
            role="img"
            aria-label={`Illustrative attention over the prompt tokens ${PROMPT_TOKENS.map((t) => `"${t.trim()}"`).join(", ")} across three heads, then the request routed ${ROUTE.join(" → ")} and streamed back.`}
            className="relative h-[34svh] md:col-span-6 md:h-[72vh] lg:col-span-7"
          >
            <p className="absolute left-0 top-0 font-mono text-[0.6rem] uppercase tracking-wider text-faint">illustrative</p>
            <p className="absolute right-0 top-0 font-mono text-[0.62rem] text-soft">
              <span ref={register("att-head")} />
            </p>
            {flat ? <AttentionFallback still={!scene3D} /> : null}
          </div>
        </div>
      </Chapter>

      {/* Token and route labels: real HTML, placed by the canvas inside the stage only. */}
      {flat ? null : (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[5]">
          {PROMPT_TOKENS.map((tok, i) => (
            <span
              key={`t${i}`}
              ref={register(`att-tok-${i}`)}
              style={{ display: "none" }}
              className="absolute left-0 top-0 whitespace-pre rounded border border-line-strong bg-ink/80 px-1.5 py-0.5 font-mono text-[0.66rem] text-fg"
            >
              {tok}
            </span>
          ))}
          {ROUTE.map((name, i) => (
            <span
              key={name}
              ref={register(`att-node-${i}`)}
              style={{ display: "none" }}
              className={`absolute left-0 top-0 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[0.62rem] backdrop-blur-sm ${
                i === 0 ? "border-accent/60 bg-ink/80 text-accent" : "border-line-strong bg-ink/70 text-soft"
              }`}
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
