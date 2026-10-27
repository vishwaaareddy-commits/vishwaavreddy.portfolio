"use client";

import { ArrowUpRight } from "lucide-react";
import { DESCENT_RANGE, WAYPOINTS } from "@/data/descent";
import { timeline } from "@/data/experience";
import { useScene3D } from "@/hooks/useScene3D";
import { gsap } from "@/lib/gsap";
import { labelRegistry } from "@/store/journey";
import { Chapter } from "../Chapter";

/** Timeline entries in descent order (oldest, highest loss first). */
const STEPS = WAYPOINTS.map((w) => ({ ...w, entry: timeline.find((e) => e.role === w.role)! })).filter((s) => s.entry);
const reachAt = (at: number) => DESCENT_RANGE[0] + at * (DESCENT_RANGE[1] - DESCENT_RANGE[0]);

/**
 * Chapter 09, gradient descent on a loss landscape: a ball descends a real
 * momentum-descent path as you scroll; each role is a waypoint, and its
 * card lights when the ball reaches it. Without 3D the list stands alone.
 */
export function ExperienceChapter() {
  const { scene3D } = useScene3D();
  return (
    <>
      <Chapter
        key={scene3D ? "3d" : "flat"}
        index={9}
        id="experience"
        pin={scene3D}
        pinOnMobile={false}
        unpinnedRange={["top 80%", "bottom 80%"]}
        length={0.7}
        aria-labelledby="experience-title"
        className="flex min-h-[100svh] items-center border-t border-line py-24 md:py-0"
        build={(tl, { root }) => {
          const cards = gsap.utils.toArray<HTMLElement>("[data-wp]", root);
          if (!cards.length) return;
          gsap.set(cards, { opacity: 0.4 });
          cards.forEach((c, i) => tl.to(c, { opacity: 1, duration: 0.03 }, Math.max(0, reachAt(STEPS[i].at) - 0.02)));
          tl.to({}, { duration: 1 }, 0);
        }}
      >
        <div className="shell relative z-10 grid w-full grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-10">
          <div data-copy className="md:col-span-6 lg:col-span-5">
            <p className="eyebrow flex items-center gap-3">
              <span className="text-accent">009</span>
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
              Experience
            </p>
            <h2 id="experience-title" className="mt-3 font-display text-3xl font-semibold tracking-tight">
              From data science to AI <span className="font-serif text-[1.1em] font-normal italic text-accent">engineering</span>.
            </h2>
            <p className="mt-2 text-sm text-faint">Dates follow the certificates where they exist.</p>
            <ol className="mt-5 space-y-3">
              {STEPS.map(({ entry, short }, i) => (
                <li key={entry.role} data-wp className="border-l border-line pl-4" style={{ borderColor: entry.current ? "rgb(59 227 245 / 0.6)" : undefined }}>
                  <p className="flex flex-wrap items-center gap-x-3 font-mono text-[0.64rem] text-faint">
                    <span className="text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <span>{entry.period}</span>
                    <span className="uppercase tracking-wider">{entry.kind}</span>
                    {entry.badge ? <span className="text-accent">{entry.badge}</span> : null}
                    {entry.certificate ? (
                      <a
                        href={entry.certificate.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-soft hover:text-accent"
                      >
                        {entry.certificate.label}
                        <ArrowUpRight className="size-3" aria-hidden />
                      </a>
                    ) : null}
                    <span className="sr-only">Waypoint: {short}</span>
                  </p>
                  <h3 className="mt-0.5 font-display text-base font-semibold tracking-tight text-fg">
                    {entry.role} <span className="text-sm font-normal text-soft">· {entry.org}</span>
                  </h3>
                  <p className="mt-0.5 text-[0.78rem] leading-snug text-faint md:line-clamp-1">{entry.summary}</p>
                </li>
              ))}
            </ol>
          </div>
          {scene3D ? (
            <div
              data-stage="loss"
              data-copy
              role="img"
              aria-label="A 3D loss surface. A glowing ball descends it along a gradient-descent path as you scroll, passing five waypoints: the BCG X simulation, the Elevate Labs internship, the EduPyramids internship, the B.Sc., and the current AI Expert role at the lowest point."
              className="relative h-[34svh] md:col-span-6 md:h-[70vh] lg:col-span-7"
            >
              <p className="absolute left-0 top-0 font-mono text-[0.62rem] text-faint">loss ↓ over time</p>
            </div>
          ) : null}
        </div>
      </Chapter>
      {scene3D ? (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[5]">
          {STEPS.map((s, i) => (
            <span
              key={s.short}
              ref={(el) => {
                if (el) labelRegistry.set(`loss-${i}`, el);
                else labelRegistry.delete(`loss-${i}`);
              }}
              style={{ display: "none" }}
              className="absolute left-0 top-0 whitespace-nowrap rounded-full border border-line-strong bg-ink/80 px-1.5 py-px font-mono text-[0.6rem] text-soft"
            >
              {s.short}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
