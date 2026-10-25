"use client";

import type { ReactNode } from "react";
import { CopyButton } from "@/components/ui/CopyCommand";
import { gsap } from "@/lib/gsap";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { exampleReply, modelBridgeLabels, usageSketch } from "@/data/modelbridge";
import { labelRegistry } from "@/store/journey";
import type { ProjectStatus } from "@/types/content";
import { Chapter } from "../Chapter";

const PIP = "pip install modelbridge-sdk";

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

const seg = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));

interface ModelBridgeChapterProps {
  status: ProjectStatus;
  statusNote: string;
  usageExample?: string;
  /** PyPI button, badge and counter — only rendered once a release installs. */
  endSlot: ReactNode;
}

/** Chapter 03: install, code and stream type in step with the 3D request packet. */
export function ModelBridgeChapter({ status, statusNote, usageExample, endSlot }: ModelBridgeChapterProps) {
  const code = usageExample ?? usageSketch;

  return (
    <>
      <Chapter
        index={3}
        id="modelbridge"
        pin
        length={2.5}
        aria-labelledby="modelbridge-title"
        className="flex min-h-[100svh] items-end pb-20 md:items-center md:pb-0"
        build={(tl, { root }) => {
          const parts = ["pip", "code", "reply"].map((name) => ({
            full: root.querySelector<HTMLElement>(`[data-full="${name}"]`),
            typed: root.querySelector<HTMLElement>(`[data-typed="${name}"]`),
          }));
          const texts = parts.map((p) => p.full?.textContent ?? "");
          // Hide the React-rendered copies (reverted with the GSAP context);
          // the overlays carry the typed text.
          gsap.set(parts.map((p) => p.full).filter(Boolean), { visibility: "hidden" });
          const ranges: [number, number][] = [
            [0.02, 0.14],
            [0.16, 0.6],
            [0.62, 0.9],
          ];
          const state = { p: 0 };
          const render = () => {
            parts.forEach((part, i) => {
              if (!part.typed) return;
              const [a, b] = ranges[i];
              part.typed.textContent = texts[i].slice(0, Math.round(seg(state.p, a, b) * texts[i].length));
            });
          };
          render();
          tl.to(state, { p: 1, duration: 1, ease: "none", onUpdate: render }, 0);
          tl.from("[data-mb-end]", { opacity: 0.4, y: 24, duration: 0.08 }, 0.9);
        }}
      >
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:pl-24 md:pr-10 xl:px-8">
          <div className="max-w-xl">
            <p className="eyebrow flex items-center gap-3">
              <span className="text-accent">003</span>
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
              LLM tooling · Colab Platforms
            </p>
            <h2 id="modelbridge-title" className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-6xl">
              ModelBridge <span className="font-serif text-[1.1em] font-normal italic text-accent">SDK</span>
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusBadge status={status} />
              <p className="text-sm text-faint">{statusNote}</p>
            </div>

            <div className="notch mt-7 overflow-hidden border border-line bg-[#05070a]/90 backdrop-blur">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <div className="flex gap-1.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-line-strong" />
                  <span className="size-2.5 rounded-full bg-line-strong" />
                  <span className="size-2.5 rounded-full bg-line-strong" />
                </div>
                <p className="font-mono text-[0.65rem] text-faint">modelbridge-sdk</p>
              </div>
              <div className="space-y-4 p-5 font-mono text-[0.76rem] leading-relaxed">
                <div className="flex items-start justify-between gap-3 text-fg">
                  <span className="flex gap-2">
                    <span className="select-none text-accent">$</span>
                    <Typed name="pip" text={PIP} />
                  </span>
                  <CopyButton command={PIP} />
                </div>
                <pre className="hidden max-h-[38vh] overflow-auto text-soft md:block">
                  <code>
                    <Typed name="code" text={code} />
                  </code>
                </pre>
                <div className="rounded-lg border border-accent/20 bg-accent-dim/40 p-3 text-fg">
                  <p className="mb-1.5 text-[0.62rem] uppercase tracking-wider text-accent">streamed response</p>
                  <Typed name="reply" text={exampleReply} />
                </div>
              </div>
            </div>

            <div data-mb-end>{endSlot}</div>
          </div>
        </div>
      </Chapter>

      {/* Diagram labels: real HTML, positioned each frame by the canvas. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[5]">
        {modelBridgeLabels.map(({ id, label }) => (
          <span
            key={id}
            ref={(el) => {
              if (el) labelRegistry.set(id, el);
              else labelRegistry.delete(id);
            }}
            className={`absolute left-0 top-0 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[0.62rem] opacity-0 backdrop-blur-sm ${
              id === "mb-sdk" ? "border-accent/60 bg-ink/80 text-accent" : "border-line-strong bg-ink/70 text-soft"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <p className="sr-only">
        Diagram: your app calls the ModelBridge SDK, which exposes chat, models, usage and credits resources and
        sends requests through the gateway API and OpenRouter to Gemini; responses stream back the same way.
      </p>
    </>
  );
}
