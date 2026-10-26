import { PipelineDiagram } from "@/components/projects/PipelineDiagram";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TiltCard } from "@/components/ui/TiltCard";
import { builds } from "@/data/projects";
import type { Build } from "@/types/content";

const omsFlow = [
  { label: "Provider webhook", detail: "Cashfree, Shopify or Shiprocket posts an event." },
  { label: "Verify signature", detail: "HMAC / signature check, with support for rotating secrets." },
  { label: "Idempotency check", detail: "Events already seen are not processed twice." },
  { label: "Store event", detail: "The webhook event is persisted in PostgreSQL." },
  { label: "Celery worker", detail: "Processing happens off the request path." },
  { label: "Order state updated", detail: "Payment and shipment status reach the order record." },
];

function BuildCard({ build }: { build: Build }) {
  return (
    <TiltCard className="h-full rounded-2xl">
    <article
      id={build.id}
      className="relative flex h-full flex-col rounded-2xl border border-line bg-panel/50 p-6 transition-colors duration-500 group-hover/tilt:border-accent/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">{build.org}</p>
        <StatusBadge status={build.status} />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">{build.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-soft">{build.summary}</p>
      <p className="mt-4 border-l border-accent/50 pl-3 text-sm leading-relaxed text-fg/90">{build.highlight}</p>
      {build.ownership ? <p className="mt-4 text-xs leading-relaxed text-faint">{build.ownership}</p> : null}
      <ul className="mt-auto flex flex-wrap gap-1.5 pt-6" aria-label="Built with">
        {build.stack.map((tech) => (
          <li key={tech} className="rounded border border-line px-1.5 py-0.5 font-mono text-[0.65rem] text-soft">
            {tech}
          </li>
        ))}
      </ul>
    </article>
    </TiltCard>
  );
}

export function MoreBuilds() {
  const [oms, ...rest] = builds;
  return (
    <section id="builds" aria-labelledby="builds-title" className="border-t border-line">
      <div data-copy className="shell py-24 md:py-32">
        <SectionHeader
          id="builds-title"
          index="007"
          eyebrow="More builds"
          title="Production work in progress, labelled honestly."
          intro="Client and team systems from my current role. Private code stays private — these entries describe the architecture and my part in it."
        />

        <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div data-reveal className="lg:col-span-5">
            <BuildCard build={oms} />
          </div>
          <div data-reveal className="lg:col-span-7">
            <PipelineDiagram
              title="OMS · webhook processing path"
              steps={omsFlow}
            />
          </div>
        </Reveal>

        <Reveal className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {rest.map((build) => (
            <div key={build.id} data-reveal>
              <BuildCard build={build} />
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
