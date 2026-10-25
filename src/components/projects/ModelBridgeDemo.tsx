"use client";

import { useRef } from "react";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { StreamingText } from "@/components/ui/StreamingText";
import { useInView } from "@/hooks/useInView";
import { gsap, useGSAP } from "@/lib/gsap";

const hops = [
  { label: "Your app", sub: "Python" },
  { label: "ModelBridge client", sub: "chat · models · usage · credits" },
  { label: "HTTP layer", sub: "httpx · retries · backoff" },
  { label: "Gateway API", sub: "multi-provider" },
  { label: "OpenRouter", sub: "provider routing" },
  { label: "Gemini", sub: "model used in the build" },
];

// Shown until a published README provides the real example.
const sketch = `# Usage sketch — the README has the exact API.
import asyncio
from modelbridge_sdk import ModelBridge

async def main():
    async with ModelBridge() as client:      # API key from the environment
        async for chunk in client.chat.stream(
            model="gemini",                   # routed through OpenRouter
            messages=[{"role": "user", "content": "Explain retries in one line."}],
        ):
            print(chunk.text, end="", flush=True)

asyncio.run(main())`;

const exampleReply =
  "Retries resend a failed request after a growing pause, so brief network or rate-limit errors don't reach your users.";

interface ModelBridgeDemoProps {
  published: boolean;
  /** First Python example from the published README, when available. */
  usageExample?: string;
}

export function ModelBridgeDemo({ published, usageExample }: ModelBridgeDemoProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const flow = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, paused: true });
        tl.set("[data-req]", { left: "0%", opacity: 0 })
          .to("[data-req]", { opacity: 1, duration: 0.2 })
          .to("[data-req]", { left: "100%", duration: 2.4, ease: "power1.inOut" })
          // Each hop lights up as the request passes through it.
          .fromTo(
            "[data-hop]",
            { borderColor: "rgba(148,163,184,0.14)", backgroundColor: "rgba(7,9,13,0.6)" },
            {
              borderColor: "rgba(59,227,245,0.6)",
              backgroundColor: "rgba(59,227,245,0.08)",
              duration: 0.25,
              stagger: 0.4,
              clearProps: "borderColor,backgroundColor",
            },
            "<",
          )
          .to("[data-req]", { opacity: 0, duration: 0.2 })
          .fromTo(
            "[data-chunk]",
            { left: "100%", opacity: 0 },
            { left: "0%", opacity: 1, duration: 1.8, ease: "none", stagger: 0.18 },
          )
          .to("[data-chunk]", { opacity: 0, duration: 0.25 });
        const st = gsap.timeline({
          scrollTrigger: {
            trigger: flow.current,
            start: "top 85%",
            end: "bottom 15%",
            onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
          },
        });
        return () => {
          st.kill();
          tl.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: flow },
  );

  return (
    <div ref={ref} className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-line bg-[#05070a]">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
          </div>
          <p className="font-mono text-[0.65rem] text-faint">modelbridge-sdk</p>
        </div>

        <div className="space-y-5 p-5 font-mono text-[0.78rem] leading-relaxed">
          <div>
            <CopyCommand command="pip install modelbridge-sdk" />
            {published ? null : <p className="mt-1 text-faint"># public release in progress</p>}
          </div>

          <div>
            <p className="mb-2 text-[0.65rem] uppercase tracking-wider text-faint">usage</p>
            <pre className="overflow-x-auto text-soft">
              <code>{usageExample ?? sketch}</code>
            </pre>
          </div>

          <div className="rounded-lg border border-accent/20 bg-accent-dim/40 p-3">
            <p className="mb-1.5 text-[0.65rem] uppercase tracking-wider text-accent">streamed response</p>
            <p className="text-fg">
              <StreamingText text={exampleReply} active={inView} delay={600} speed={70} />
            </p>
          </div>
        </div>
      </div>

      <div ref={flow} className="rounded-2xl border border-line bg-panel/60 p-5 md:p-6">
        <p className="eyebrow mb-5">Request and response path</p>
        <ol className="grid gap-3 md:grid-cols-6 md:gap-2">
          {hops.map((hop, i) => (
            <li
              key={hop.label}
              data-hop
              className={`rounded-lg border px-3 py-2.5 ${
                i === 1 ? "border-accent/50 bg-accent-dim/50" : "border-line bg-ink/60"
              }`}
            >
              <p className="font-display text-[0.8rem] leading-tight text-fg">{hop.label}</p>
              <p className="mt-1 font-mono text-[0.6rem] leading-snug text-faint">{hop.sub}</p>
            </li>
          ))}
        </ol>

        <div aria-hidden className="relative mt-5 hidden h-10 md:block">
          <div className="absolute inset-x-0 top-2 h-px bg-line" />
          <div className="absolute inset-x-0 bottom-2 h-px bg-line" />
          <span className="absolute -top-0.5 left-0 font-mono text-[0.58rem] text-faint">request →</span>
          <span className="absolute -bottom-0.5 right-0 font-mono text-[0.58rem] text-faint">← streamed chunks</span>
          <span
            data-req
            className="absolute top-2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-0 shadow-[0_0_14px_3px_rgba(59,227,245,0.5)]"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              data-chunk
              className="absolute bottom-2 h-1 w-3 -translate-x-1/2 translate-y-1/2 rounded-sm bg-accent/80 opacity-0"
            />
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-soft">
          The client sends one request shape for every provider. Responses come back as an async generator, so text
          can be shown as it arrives instead of after the full answer.
        </p>
      </div>
    </div>
  );
}
