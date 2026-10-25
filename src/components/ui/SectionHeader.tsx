import { Reveal } from "./Reveal";

interface SectionHeaderProps {
  index: string;
  eyebrow: string;
  title: string;
  intro?: string;
  id?: string;
}

export function SectionHeader({ index, eyebrow, title, intro, id }: SectionHeaderProps) {
  return (
    <Reveal as="header" className="mb-12 grid gap-6 md:mb-16 md:grid-cols-12">
      <p data-reveal className="eyebrow flex items-center gap-3 md:col-span-3">
        <span className="text-accent">{index}</span>
        <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
        {eyebrow}
      </p>
      <div className="md:col-span-9">
        <h2
          data-reveal
          id={id}
          className="font-display text-3xl font-semibold tracking-tight text-fg text-balance sm:text-4xl md:text-5xl"
        >
          {title}
        </h2>
        {intro ? (
          <p data-reveal className="mt-5 max-w-2xl text-base leading-relaxed text-soft md:text-lg">
            {intro}
          </p>
        ) : null}
      </div>
    </Reveal>
  );
}
