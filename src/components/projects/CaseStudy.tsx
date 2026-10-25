import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CaseStudy as CaseStudyData } from "@/types/content";

interface CaseStudyProps {
  study: CaseStudyData;
  /** The interactive explanation for this project. */
  visual: ReactNode;
  /** "split" puts text beside the visual; "stacked" gives the visual full width. */
  layout?: "split" | "stacked";
  reverse?: boolean;
}

export function CaseStudy({ study, visual, layout = "split", reverse = false }: CaseStudyProps) {
  const text = (
    <div className={layout === "split" ? "lg:col-span-5" : "grid grid-cols-1 gap-10 lg:col-span-12 lg:grid-cols-12"}>
      <div data-reveal className={layout === "stacked" ? "lg:col-span-5" : undefined}>
        <p className="eyebrow">
          <span className="text-accent">{study.index}</span> · {study.kicker} · {study.org}
        </p>
        <h3 id={`${study.id}-title`} className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">{study.title}</h3>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={study.status} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-faint">{study.statusNote}</p>

        <h4 className="eyebrow mt-8">Problem</h4>
        <p className="mt-2 leading-relaxed text-soft">{study.problem}</p>
      </div>

      <div data-reveal className={layout === "stacked" ? "lg:col-span-7" : undefined}>
        <h4 className={`eyebrow ${layout === "stacked" ? "" : "mt-8"}`}>What I built</h4>
        <ul className="mt-3 space-y-2.5">
          {study.contribution.map((item) => (
            <li key={item} className="flex gap-3 leading-relaxed text-soft">
              <span aria-hidden className="mt-[0.6rem] h-px w-3 shrink-0 bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <h4 className="eyebrow mt-8">Result</h4>
        <p className="mt-2 leading-relaxed text-fg">{study.outcome}</p>

        <div className="mt-8 flex flex-wrap gap-2" aria-label="Built with">
          {study.stack.map((tech) => (
            <span key={tech} className="rounded-md border border-line px-2 py-1 font-mono text-[0.7rem] text-soft">
              {tech}
            </span>
          ))}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-faint">
          {study.evidence ? (
            <a
              href={study.evidence.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent"
            >
              {study.evidence.label}
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          ) : (
            <>
              <span className="font-mono uppercase tracking-wider text-soft">Evidence · </span>
              {study.evidenceNote}
            </>
          )}
        </p>
      </div>
    </div>
  );

  return (
    <Reveal
      as="article"
      id={study.id}
      aria-labelledby={`${study.id}-title`}
      className="relative border-t border-line py-16 md:py-24"
      stagger={0.12}
    >
      <span aria-hidden className="absolute -top-px left-0 h-px w-24 bg-gradient-to-r from-accent to-transparent" />
      {layout === "split" ? (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <div className={reverse ? "lg:order-2 lg:col-span-5" : "lg:col-span-5"}>{text}</div>
          <div data-reveal className={reverse ? "lg:order-1 lg:col-span-7" : "lg:col-span-7"}>{visual}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {text}
          <div data-reveal>{visual}</div>
        </div>
      )}
    </Reveal>
  );
}
