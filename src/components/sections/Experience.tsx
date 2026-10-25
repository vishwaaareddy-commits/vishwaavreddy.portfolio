import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { timeline } from "@/data/experience";

export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="border-t border-line">
      <div className="shell py-24 md:py-32">
        <SectionHeader
          id="experience-title"
          index="009"
          eyebrow="Experience"
          title="From data science to applied AI."
          intro="Dates follow the certificates where they exist."
        />
        <div className="relative md:ml-[25%]">
          {/* Decorative rail sits beside the list: an <ol> may only contain <li>. */}
          <div aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-line" />
          <Reveal as="ol" className="relative" stagger={0.1}>
          {timeline.map((entry) => (
            <li key={`${entry.role}-${entry.org}`} data-reveal className="relative pb-12 pl-10 last:pb-0">
              <span
                aria-hidden
                className={`absolute left-0 top-1.5 size-[11px] rounded-full border ${
                  entry.current ? "border-accent bg-accent shadow-[0_0_14px_2px_rgba(59,227,245,0.4)]" : "border-line-strong bg-ink"
                }`}
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-mono text-xs text-soft">{entry.period}</p>
                <span className="font-mono text-[0.62rem] uppercase tracking-wider text-faint">{entry.kind}</span>
              </div>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">{entry.role}</h3>
              <p className="mt-0.5 text-sm text-soft">{entry.org}</p>
              <p className="mt-3 max-w-2xl leading-relaxed text-soft">{entry.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {entry.badge ? (
                  <span className="rounded-full border border-accent/40 px-2.5 py-0.5 font-mono text-[0.65rem] text-accent">
                    {entry.badge}
                  </span>
                ) : null}
                {entry.certificate ? (
                  <a
                    href={entry.certificate.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[0.68rem] text-soft hover:text-accent"
                  >
                    {entry.certificate.label}
                    <ArrowUpRight className="size-3" aria-hidden />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
