import { ArrowDown, Download } from "lucide-react";
import { HeroVisual } from "@/components/three/HeroVisual";
import { StreamingText } from "@/components/ui/StreamingText";
import { profile } from "@/data/profile";
import type { ModelBridgeRelease } from "@/lib/pypi";

export function Hero({ release }: { release: ModelBridgeRelease }) {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] items-center overflow-hidden pb-16 pt-28 lg:pb-20 lg:pt-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_72%_42%,rgba(20,74,92,0.35),transparent_70%),radial-gradient(ellipse_50%_40%_at_10%_90%,rgba(40,70,140,0.14),transparent_70%)]"
      />
      <div
        aria-hidden
        className="hairline-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_60%_45%,black,transparent_72%)]"
      />
      {/* Fade into the next section for visual continuity. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-ink-2" />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-5 md:px-8 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-ink/60 px-3 py-1 font-mono text-[0.7rem] text-soft backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
            </span>
            {profile.currentRole}
          </p>

          <h1 id="hero-title" className="mt-8 font-display tracking-tight">
            <span className="block font-mono text-sm font-normal uppercase tracking-[0.28em] text-soft">
              {profile.name}
            </span>
            <span className="mt-4 block text-[2.9rem] font-semibold leading-[0.98] text-fg sm:text-6xl xl:text-7xl">
              Applied AI
              <br />
              <span className="bg-gradient-to-r from-fg via-[#bdf6fc] to-accent bg-clip-text text-transparent">
                Engineer
              </span>
            </span>
          </h1>

          <p className="mt-7 max-w-md text-lg leading-relaxed text-fg/90">
            <StreamingText text={profile.tagline} delay={400} speed={60} />
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#work"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-ink shadow-[0_0_30px_-8px_rgba(59,227,245,0.7)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Explore selected work
              <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden />
            </a>
            <a
              href={profile.resume}
              download
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-ink/50 px-5 py-3 text-sm text-fg backdrop-blur transition-colors duration-300 hover:border-fg"
            >
              <Download className="size-4" aria-hidden />
              Résumé
            </a>
            <a href="#contact" className="px-2 py-3 text-sm text-soft underline-offset-4 transition-colors hover:text-fg hover:underline">
              Contact
            </a>
          </div>

          <a
            href="#modelbridge"
            className="group mt-10 flex max-w-md items-start gap-3 border-l border-accent/50 pl-4 text-sm text-soft transition-colors duration-300 hover:text-fg"
          >
            <span>
              <span className="font-mono text-xs uppercase tracking-wider text-accent">
                {release.published ? `Published on PyPI · ModelBridge SDK${release.version ? ` v${release.version}` : ""}` : "Built · ModelBridge SDK"}
              </span>
              <span className="mt-1 block">
                An async Python client for a multi-provider LLM gateway, with streaming and retries.
              </span>
            </span>
          </a>
        </div>

        <div className="lg:col-span-7 2xl:-mr-16">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
