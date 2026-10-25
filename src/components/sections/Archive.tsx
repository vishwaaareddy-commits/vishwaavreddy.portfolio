import { ArrowUpRight, ChevronDown } from "lucide-react";
import { archive } from "@/data/projects";

export function Archive() {
  return (
    <section aria-labelledby="archive-title" className="border-t border-line bg-ink-2">
      <div className="shell py-16 md:py-20">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="eyebrow">Archive</p>
              <h2 id="archive-title" className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                Academic & personal projects
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs text-soft">
              <span className="group-open:hidden">Show {archive.length}</span>
              <span className="hidden group-open:inline">Hide</span>
              <ChevronDown className="size-3.5 transition-transform duration-300 group-open:rotate-180" aria-hidden />
            </span>
          </summary>

          <ul className="mt-10 divide-y divide-line border-y border-line">
            {archive.map((project) => (
              <li key={project.title} className="grid gap-3 py-5 md:grid-cols-12 md:items-baseline md:gap-6">
                <div className="md:col-span-4">
                  <h3 className="font-display text-base text-fg">{project.title}</h3>
                  <p className="font-mono text-[0.65rem] text-faint">{project.context}</p>
                </div>
                <p className="text-sm leading-relaxed text-soft md:col-span-5">{project.summary}</p>
                <div className="flex flex-wrap items-center gap-1.5 md:col-span-3 md:justify-end">
                  {project.stack.map((tech) => (
                    <span key={tech} className="font-mono text-[0.65rem] text-faint">
                      {tech}
                    </span>
                  ))}
                  {project.link ? (
                    <a
                      href={project.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 inline-flex items-center gap-0.5 font-mono text-[0.65rem] text-accent"
                    >
                      {project.link.label}
                      <ArrowUpRight className="size-3" aria-hidden />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}
