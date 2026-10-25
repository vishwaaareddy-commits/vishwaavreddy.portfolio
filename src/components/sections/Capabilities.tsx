import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TiltCard } from "@/components/ui/TiltCard";
import { capabilities } from "@/data/experience";
import { builds, caseStudies } from "@/data/projects";

const titles: Record<string, string> = Object.fromEntries(
  [...caseStudies, ...builds].map((p) => [p.id, p.title]),
);

export function Capabilities() {
  return (
    <section id="capabilities" aria-labelledby="capabilities-title" className="border-t border-line bg-ink-2">
      <div className="shell py-24 md:py-32">
        <SectionHeader
          id="capabilities-title"
          index="008"
          eyebrow="Capabilities"
          title="Tools listed only where they did real work."
          intro="Every group links to the projects that use it. Academic-only tools live in the archive further down."
        />
        <Reveal className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {capabilities.map((group) => (
            <TiltCard key={group.id} max={0} className="bg-ink-2">
            <div data-reveal className="relative h-full p-6 md:p-8">
              <h3 className="font-display text-xl font-semibold tracking-tight">{group.title}</h3>
              <ul className="mt-5 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="text-soft">
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-line pt-4">
                <p className="eyebrow mb-2">Used in</p>
                <ul className="flex flex-wrap gap-2">
                  {group.provenBy.map((id) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        className="inline-block rounded-full border border-line px-2.5 py-1 font-mono text-[0.68rem] text-soft transition-colors duration-300 hover:border-accent/60 hover:text-accent"
                      >
                        {titles[id]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            </TiltCard>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
