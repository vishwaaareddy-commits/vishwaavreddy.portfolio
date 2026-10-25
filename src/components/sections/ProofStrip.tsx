import { builds, caseStudies } from "@/data/projects";

const proof = [
  {
    value: "Apr 2026",
    label: "AI Expert since",
    note: "Avatar India · Colab Platforms",
  },
  {
    value: "4",
    label: "Organisations delivered for",
    note: "Avatar India, Colab Platforms, TakeHealth, AyushWellness",
  },
  {
    value: String(caseStudies.length + builds.length),
    label: "Professional projects below",
    note: "Each labelled with its real status",
  },
  {
    value: "1",
    label: "Python SDK built",
    note: "ModelBridge, ported from TypeScript",
  },
];

export function ProofStrip() {
  return (
    <section aria-label="At a glance" className="border-y border-line bg-ink-2">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 px-5 md:px-8 lg:grid-cols-4">
        {proof.map((item, i) => (
          <div
            key={item.label}
            className={`flex flex-col gap-1 py-8 pr-4 ${i % 2 === 1 ? "pl-4 sm:pl-6" : ""} ${
              i > 0 ? "lg:border-l lg:border-line lg:pl-6" : ""
            } ${i % 2 === 1 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line lg:border-t-0" : ""}`}
          >
            <dt className="order-2 text-sm text-soft">{item.label}</dt>
            <dd className="order-1 font-display text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              {item.value}
            </dd>
            <dd className="order-3 font-mono text-[0.68rem] leading-relaxed text-faint">{item.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
