import { ArrowUpRight } from "lucide-react";
import type { CaseStudy } from "@/types/content";

/**
 * The rest of a case study (what I built, result, stack, evidence) inside a
 * closed disclosure in the chapter's copy column: real HTML, no page height
 * until opened, and it scrolls inside itself so a pinned chapter never grows.
 */
export function CaseNotes({ study }: { study: CaseStudy }) {
  return (
    <details className="group mt-5 border-t border-line pt-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-mono text-[0.68rem] uppercase tracking-wider text-soft transition-colors duration-300 hover:text-fg [&::-webkit-details-marker]:hidden">
        <span>
          <span className="text-accent">+</span> Case notes · what I built, result, stack
        </span>
        <span aria-hidden className="text-faint transition-transform duration-300 group-open:rotate-45">
          +
        </span>
      </summary>
      <div data-lenis-prevent className="mt-3 max-h-[34vh] overflow-y-auto overscroll-contain pr-2 text-sm">
        <h3 className="eyebrow">What I built</h3>
        <ul className="mt-2 space-y-1.5">
          {study.contribution.map((item) => (
            <li key={item} className="flex gap-2.5 leading-relaxed text-soft">
              <span aria-hidden className="mt-[0.6rem] h-px w-2.5 shrink-0 bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <h3 className="eyebrow mt-4">Result</h3>
        <p className="mt-1.5 leading-relaxed text-fg">{study.outcome}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Built with">
          {study.stack.map((tech) => (
            <li key={tech} className="rounded-md border border-line px-2 py-0.5 font-mono text-[0.66rem] text-soft">
              {tech}
            </li>
          ))}
        </ul>
        {study.evidence ? (
          <a
            href={study.evidence.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-xs text-accent"
          >
            {study.evidence.label}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        ) : study.evidenceNote ? (
          <p className="mt-4 text-xs text-faint">{study.evidenceNote}</p>
        ) : null}
      </div>
    </details>
  );
}
