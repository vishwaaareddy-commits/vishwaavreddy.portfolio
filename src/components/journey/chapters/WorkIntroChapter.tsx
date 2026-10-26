"use client";

import { gsap } from "@/lib/gsap";
import { labelRegistry } from "@/store/journey";
import { Chapter } from "../Chapter";

/** The heading as subword tokens: `explain|ed` splits like a real tokenizer would. */
const words: { tokens: string[]; serif?: boolean; tail?: string }[] = [
  { tokens: ["Four"] },
  { tokens: ["systems"], tail: "," },
  { tokens: ["explain", "ed"] },
  { tokens: ["by"] },
  { tokens: ["how"] },
  { tokens: ["they"] },
  { tokens: ["work"], serif: true, tail: "." },
];

/** Every token in reading order, numbered once (the trailing punctuation is its own token). */
const sentence = (() => {
  let index = 0;
  return words.map((w) => ({
    ...w,
    parts: [...w.tokens, ...(w.tail ? [w.tail] : [])].map((text, j) => ({ text, index: index++, split: j > 0 })),
  }));
})();

/** Embedding clusters; each one is a chapter that follows. */
export const CLUSTERS = [
  { name: "LLM tooling", href: "#modelbridge", chapter: "03", title: "ModelBridge SDK" },
  { name: "Vision", href: "#esports-ocr", chapter: "04", title: "BGMI esports OCR" },
  { name: "QA", href: "#takehealth-qa", chapter: "05", title: "TakeHealth QA" },
  { name: "Automation", href: "#automation", chapter: "06", title: "Automation" },
] as const;

const CHIP_TINTS = ["rgb(59 227 245 / 0.32)", "rgb(139 108 255 / 0.4)"];

function Token({ text, index, split }: { text: string; index: number; split: boolean }) {
  return (
    <span
      data-token={index}
      className={`relative inline-block rounded-[0.12em] border border-transparent px-[0.04em] ${split ? "-ml-px" : ""}`}
    >
      {text}
      {/* The copy that flies into the embedding cloud; the real token stays put. */}
      <span
        data-ghost
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[0.12em] border border-accent/60 px-[0.04em] text-accent opacity-0"
      >
        {text}
      </span>
    </span>
  );
}

/**
 * Chapter 02, tokens → embeddings. The sentence splits into token chips,
 * copies of the chips fly into a 3D embedding cloud (stage "embeddings"),
 * and the cloud's ~2,000 points morph from noise into four labelled
 * clusters — the four chapters that follow. Scrubbed and reversible.
 */
export function WorkIntroChapter() {
  return (
    <>
      <Chapter
        index={2}
        id="work"
        pin
        length={1.3}
        aria-labelledby="work-title"
        className="flex min-h-[100svh] items-center pb-6 pt-24 md:py-0"
        build={(tl, { root }) => {
          const tokens = gsap.utils.toArray<HTMLElement>("[data-token]", root);
          const ghosts = gsap.utils.toArray<HTMLElement>("[data-ghost]", root);
          const stage = root.querySelector<HTMLElement>('[data-stage="embeddings"]');
          // Dim never drops below 0.4, so text stays legible if a trigger is missed.
          gsap.set(tokens, { opacity: 0.4 });
          gsap.set("[data-cluster], [data-after]", { opacity: 0.4, y: 12 });

          // 1. Words light up.
          tl.to(tokens, { opacity: 1, stagger: 0.02, duration: 0.12 }, 0);
          // 2. They split into token chips.
          tokens.forEach((el, i) => {
            tl.to(el, { borderColor: CHIP_TINTS[i % 2], backgroundColor: "rgb(59 227 245 / 0.04)", duration: 0.06 }, 0.12 + i * 0.012);
          });
          // 3. Copies fly into the cloud and are absorbed.
          if (stage) {
            const toStage = (axis: "x" | "y") => (i: number) => {
              const s = stage.getBoundingClientRect();
              const g = tokens[i].getBoundingClientRect();
              return axis === "x" ? s.left + s.width / 2 - (g.left + g.width / 2) : s.top + s.height / 2 - (g.top + g.height / 2);
            };
            // Ghosts materialise once they are clear of the heading, then shrink into the cloud.
            tl.fromTo(
              ghosts,
              { x: 0, y: 0, scale: 0.8 },
              { x: toStage("x"), y: toStage("y"), scale: 0.3, duration: 0.2, stagger: 0.02, ease: "power1.in" },
              0.3,
            );
            tl.fromTo(ghosts, { opacity: 0 }, { opacity: 0.9, duration: 0.06, stagger: 0.02 }, 0.37);
            tl.to(ghosts, { opacity: 0, duration: 0.04, stagger: 0.02 }, 0.46);
          }
          // 4. Clusters form in 3D (driven by the same progress); their names land here.
          tl.to("[data-cluster]", { opacity: 1, y: 0, stagger: 0.03, duration: 0.08 }, 0.8);
          tl.to("[data-after]", { opacity: 1, y: 0, duration: 0.08 }, 0.9);
          tl.to({}, { duration: 1 }, 0);
        }}
      >
        <div className="shell relative z-10 grid w-full grid-cols-1 gap-5 md:grid-cols-12 md:items-center md:gap-10">
          <div data-copy className="md:col-span-6 lg:col-span-5">
            <p className="eyebrow flex items-center gap-3">
              <span className="text-accent">002</span>
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
              Selected work
            </p>
            <h2
              id="work-title"
              className="mt-5 font-display text-[2rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl md:mt-8 lg:text-[3.4rem] xl:text-[3.9rem]"
            >
              {sentence.map((w, i) => (
                <span key={i} className={w.serif ? "font-serif text-[1.08em] font-normal italic text-accent" : undefined}>
                  <span className="whitespace-nowrap">
                    {w.parts.map((t) => (
                      <Token key={t.index} {...t} />
                    ))}
                  </span>{" "}
                </span>
              ))}
            </h2>
            <ol className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[0.68rem] md:mt-8 md:grid-cols-1 md:gap-2 md:text-xs">
              {CLUSTERS.map((c) => (
                <li key={c.name} data-cluster>
                  <a href={c.href} className="group inline-flex items-baseline gap-2 text-soft transition-colors duration-300 hover:text-fg">
                    <span className="text-accent">{c.chapter}</span>
                    <span className="uppercase tracking-wider">{c.name}</span>
                    <span aria-hidden className="hidden text-faint md:inline">
                      → {c.title}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
            <p data-after className="mt-5 max-w-md text-sm leading-relaxed text-soft md:mt-8 md:text-base">
              Each case study separates what I built from team results and marks its real status. The diagrams and
              animations explain each architecture; they don&apos;t run live services.
            </p>
          </div>
          <div
            data-stage="embeddings"
            data-copy
            role="img"
            aria-label="Illustrative embedding cloud: about two thousand points drift from random noise into four labelled clusters — LLM tooling, Vision, QA and Automation — as you scroll."
            className="h-[26svh] md:col-span-6 md:h-[70vh] lg:col-span-7"
          />
        </div>
      </Chapter>

      {/* Cluster labels: real HTML, placed by the canvas inside the stage only. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[5]">
        {CLUSTERS.map((c, i) => (
          <span
            key={c.name}
            ref={(el) => {
              if (el) labelRegistry.set(`emb-${i}`, el);
              else labelRegistry.delete(`emb-${i}`);
            }}
            style={{ display: "none" }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-full border border-line-strong bg-ink/80 px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-soft backdrop-blur-sm"
          >
            <span className="text-accent">{c.chapter}</span> {c.name}
          </span>
        ))}
      </div>
    </>
  );
}
