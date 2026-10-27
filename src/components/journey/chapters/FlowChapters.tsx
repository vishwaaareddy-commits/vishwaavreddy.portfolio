"use client";

import { AutomationDemo } from "@/components/projects/AutomationDemo";
import { CaseNotes } from "@/components/projects/CaseNotes";
import { QaDemo } from "@/components/projects/QaDemo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AUTO_LABELS, AUTO_NODES, QA_NODES, QA_TIMELINE } from "@/data/flows";
import { useScene3D } from "@/hooks/useScene3D";
import { gsap } from "@/lib/gsap";
import { labelRegistry } from "@/store/journey";
import type { CaseStudy } from "@/types/content";
import { Chapter } from "../Chapter";

const register = (key: string) => (el: HTMLElement | null) => {
  if (el) labelRegistry.set(key, el);
  else labelRegistry.delete(key);
};

const QA_STEPS = [
  { label: "Plan", detail: "Phased test plan across 12 pages", at: QA_TIMELINE.plan },
  { label: "Run", detail: "AI browser agents drive the flows", at: QA_TIMELINE.run },
  { label: "Find", detail: "Glucose log: deleted instantly, no undo", at: QA_TIMELINE.find },
  { label: "Report", detail: "4 plain-language reports", at: QA_TIMELINE.report },
];

function Heading({ study, title, emphasis }: { study: CaseStudy; title: string; emphasis: string }) {
  return (
    <>
      <p className="eyebrow flex items-center gap-3">
        <span className="text-accent">{study.index}</span>
        <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
        {study.kicker} · {study.org}
      </p>
      <h2 id={`${study.id}-title`} className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
        {title} <span className="font-serif text-[1.1em] font-normal italic text-accent">{emphasis}</span>
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <StatusBadge status={study.status} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-faint">{study.statusNote}</p>
      <p className="mt-4 max-w-md leading-relaxed text-soft">{study.problem}</p>
    </>
  );
}

/** Graph labels: real HTML placed by the canvas, hidden whenever they would leave the stage. */
function Labels({ prefix, items }: { prefix: string; items: { id: string; text: string; tone?: "danger" | "hub" }[] }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[5]">
      {items.map((it) => (
        <span
          key={it.id}
          ref={register(`${prefix}${it.id}`)}
          style={{ display: "none" }}
          className={`absolute left-0 top-0 whitespace-nowrap rounded-full border bg-ink/80 px-1.5 py-px font-mono text-[0.6rem] ${
            it.tone === "danger" ? "border-danger/60 text-danger" : it.tone === "hub" ? "border-accent/60 text-accent" : "border-line-strong text-soft"
          }`}
        >
          {it.text}
        </span>
      ))}
    </div>
  );
}

/**
 * Chapter 05, test agents as a graph: agents walk the 12 tested pages, edges
 * light as each page is covered, the glucose log turns red and a red pulse
 * carries the finding to the report. The Plan/Run/Find/Report cards light in step.
 */
export function QaChapter({ study }: { study: CaseStudy }) {
  const { scene3D } = useScene3D();
  return (
    <>
      <Chapter
        key={scene3D ? "3d" : "css"}
        index={5}
        id={study.id}
        pin={scene3D}
        pinOnMobile={false}
        unpinnedRange={["top 80%", "bottom 80%"]}
        length={0.5}
        aria-labelledby={`${study.id}-title`}
        className="flex min-h-[100svh] items-center py-24 md:py-0"
        build={(tl, { root }) => {
          const cards = gsap.utils.toArray<HTMLElement>("[data-step]", root);
          if (!cards.length) return;
          gsap.set(cards, { opacity: 0.4 });
          cards.forEach((c, i) => {
            tl.to(c, { opacity: 1, borderColor: i === 2 ? "rgb(242 107 107 / 0.55)" : "rgb(59 227 245 / 0.45)", duration: 0.03 }, QA_STEPS[i].at);
          });
          tl.to({}, { duration: 1 }, 0);
        }}
      >
        <div className="shell relative z-10 grid w-full grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-10">
          <div data-copy className="md:col-span-5">
            <Heading study={study} title="TakeHealth" emphasis="QA" />
            {scene3D ? (
              <ol className="mt-5 grid grid-cols-2 gap-2">
                {QA_STEPS.map((s, i) => (
                  <li key={s.label} data-step className="rounded-lg border border-line bg-panel/60 px-3 py-2">
                    <p className="font-mono text-[0.6rem] text-faint">{String(i + 1).padStart(2, "0")}</p>
                    <p className={`font-display text-sm ${i === 2 ? "text-danger" : "text-fg"}`}>{s.label}</p>
                    <p className="mt-0.5 text-[0.7rem] leading-snug text-soft">{s.detail}</p>
                  </li>
                ))}
              </ol>
            ) : null}
            <CaseNotes study={study} />
          </div>
          <div className="md:col-span-7">
            {scene3D ? (
              <div
                data-stage="qa"
                data-copy
                role="img"
                aria-label="Graph of the 12 app pages that were tested. Test agents walk from page to page and each edge lights as it is covered; the glucose-log page turns red and a red pulse carries that critical finding to the report."
                className="relative h-[34svh] w-full md:h-[56vh]"
              >
              </div>
            ) : (
              <QaDemo />
            )}
          </div>
        </div>
      </Chapter>
      {scene3D ? (
        <Labels
          prefix="qa-"
          items={QA_NODES.map((n) => ({
            id: n.id,
            text: n.id === "glucose" ? "glucose log" : n.id,
            tone: n.alert ? "danger" : n.hub ? "hub" : undefined,
          }))}
        />
      ) : null}
    </>
  );
}

/**
 * Chapter 06, the event pipeline as signal flow: a waveform pulse travels
 * Razorpay → webhook → Pabbly → WhatsApp and each node fires like a neuron;
 * the separate AI calling flow ends in a live voice waveform.
 */
export function AutomationChapter({ study }: { study: CaseStudy }) {
  const { scene3D } = useScene3D();
  return (
    <>
      <Chapter
        key={scene3D ? "3d" : "css"}
        index={6}
        id={study.id}
        pin={scene3D}
        pinOnMobile={false}
        unpinnedRange={["top 80%", "bottom 80%"]}
        length={0.5}
        aria-labelledby={`${study.id}-title`}
        className="flex min-h-[100svh] items-center py-24 md:py-0"
      >
        <div className="shell relative z-10 grid w-full grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-10">
          <div data-copy className="md:col-span-5">
            <Heading study={study} title="WhatsApp & AI" emphasis="calling" />
            <CaseNotes study={study} />
          </div>
          <div className="md:col-span-7">
            {scene3D ? (
              <div
                data-stage="automation"
                data-copy
                role="img"
                aria-label="Signal-flow diagram: a payment event travels from Razorpay through a webhook and a Pabbly workflow to a WhatsApp Business message, each node lighting as the pulse arrives. Below, a separate flow runs from a call list through the prompt and call flow to an AI voice agent, shown with a voice waveform."
                className="relative h-[30svh] w-full md:h-[50vh]"
              >
                <p className="absolute left-0 top-0 font-mono text-[0.62rem] text-faint">payment flow · AI calling flow</p>
              </div>
            ) : (
              <AutomationDemo />
            )}
          </div>
        </div>
      </Chapter>
      {scene3D ? (
        <Labels
          prefix="auto-"
          items={AUTO_NODES.map((n) => ({ id: n.id, text: AUTO_LABELS[n.id], tone: n.hub ? "hub" : undefined }))}
        />
      ) : null}
    </>
  );
}
