"use client";

import { ArrowUpRight, FileText, Mail } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/BrandIcons";
import { profile } from "@/data/profile";
import { gsap } from "@/lib/gsap";
import { Chapter } from "../Chapter";

const links = [
  { label: "Email", value: profile.email, href: `mailto:${profile.email}`, Icon: Mail, external: false },
  { label: "LinkedIn", value: "vishwaa-reddy", href: profile.links.linkedin, Icon: LinkedInIcon, external: true },
  { label: "GitHub", value: "vishwaaareddy-commits", href: profile.links.github, Icon: GitHubIcon, external: true },
  { label: "Résumé", value: "PDF download", href: profile.resume, Icon: FileText, external: false, download: true },
];

/** Next-token logits; softmax picks "build". Illustrative, and tagged as such. */
const TOKENS = [
  { token: "build", logit: 2.2 },
  { token: "ship", logit: 1.0 },
  { token: "talk", logit: 0.6 },
];
const softmax = (k: number) => {
  const e = TOKENS.map((t) => Math.exp(t.logit * k));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / sum);
};
const FINAL = softmax(1);
const HEADLINE = "Let's build";

/** Scroll schedule (chapter progress). */
const BARS = [0.3, 0.68] as const;
const TYPE = [0.68, 0.84] as const;
const seg = (p: number, [a, b]: readonly [number, number]) => Math.min(1, Math.max(0, (p - a) / (b - a)));

/**
 * Chapter 11, the output layer. The background network converges onto one
 * output neuron (stage "output"); a softmax over the next token settles on
 * "build"; "Let's build" types out as the generated token; the form fades
 * up. Scrubbed on normal scroll. Final values are what React renders, so
 * no-JS and reduced motion see the finished state.
 */
export function ContactChapter() {
  return (
    <Chapter
      index={11}
      id="contact"
      pin={false}
      unpinnedRange={["top 90%", "top 5%"]}
      aria-labelledby="contact-title"
      className="relative overflow-hidden border-t border-line"
      build={(tl, { root }) => {
        const bars = gsap.utils.toArray<HTMLElement>("[data-bar]", root);
        const pcts = gsap.utils.toArray<HTMLElement>("[data-pct]", root);
        const full = root.querySelector<HTMLElement>("[data-full]");
        const typed = root.querySelector<HTMLElement>("[data-typed]");
        if (full) gsap.set(full, { visibility: "hidden" });
        gsap.set("[data-rise]", { opacity: 0.4, y: 16 });
        const state = { p: 0 };
        const render = () => {
          // From uniform (temperature high) to the final distribution.
          const probs = softmax(seg(state.p, BARS));
          bars.forEach((b, i) => (b.style.transform = `scaleX(${probs[i].toFixed(3)})`));
          pcts.forEach((el, i) => (el.textContent = `${Math.round(probs[i] * 100)}%`));
          bars[0]?.toggleAttribute("data-win", state.p >= BARS[1]);
          if (typed) {
            const n = Math.round(seg(state.p, TYPE) * HEADLINE.length);
            const plain = HEADLINE.slice(0, Math.min(n, 6));
            const serif = n > 6 ? HEADLINE.slice(6, n) : "";
            typed.innerHTML = "";
            typed.append(plain);
            if (serif) {
              const s = document.createElement("span");
              s.className = "font-serif text-[1.1em] font-normal italic text-accent";
              s.textContent = serif;
              typed.append(s);
            }
            if (n < HEADLINE.length && state.p > TYPE[0]) {
              const caret = document.createElement("span");
              caret.className = "token-caret";
              typed.append(caret);
            }
          }
        };
        render();
        tl.to(state, { p: 1, duration: 1, ease: "none", onUpdate: render }, 0);
        tl.to("[data-rise]", { opacity: 1, y: 0, duration: 0.1, stagger: 0.04 }, 0.82);
      }}
    >
      <div className="shell relative z-10 py-24 md:py-32">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div data-copy className="md:col-span-7">
            <p className="eyebrow flex items-center gap-3">
              <span className="text-accent">011</span>
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
              Contact
            </p>
            <h2 id="contact-title" className="relative mt-6 font-display text-5xl font-semibold tracking-tight text-fg md:text-7xl">
              <span data-full>
                Let&apos;s <span className="font-serif text-[1.1em] font-normal italic text-accent">build</span>
              </span>
              <span data-typed aria-hidden className="absolute inset-0" />
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-soft md:text-lg">
              Have a system that should use AI? I&apos;m based in {profile.location}. Email is the fastest way to reach me.
            </p>
          </div>
          <div className="md:col-span-5">
            {/* The network converges onto the output neuron drawn in this stage. */}
            <div data-stage="output" aria-hidden className="h-28 w-full md:h-36" />
            <figure data-copy className="mt-3" aria-label={`Illustrative next-token probabilities: ${TOKENS.map((t, i) => `${t.token} ${Math.round(FINAL[i] * 100)}%`).join(", ")}. "build" wins.`}>
              <figcaption className="flex justify-between font-mono text-[0.62rem] uppercase tracking-wider text-faint">
                <span>next token</span>
                <span>illustrative</span>
              </figcaption>
              <ul className="mt-2 space-y-1.5 font-mono text-xs">
                {TOKENS.map((t, i) => (
                  <li key={t.token} className="grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-3">
                    <span className={i === 0 ? "text-accent" : "text-soft"}>{t.token}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-line">
                      <span
                        data-bar
                        className="block h-full origin-left rounded-full bg-soft/60 data-[win]:bg-accent data-[win]:shadow-[0_0_10px_rgba(59,227,245,0.7)]"
                        style={{ transform: `scaleX(${FINAL[i].toFixed(3)})` }}
                        {...(i === 0 ? { "data-win": "" } : {})}
                      />
                    </span>
                    <span data-pct aria-hidden className="text-right tabular-nums text-faint">
                      {Math.round(FINAL[i] * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </figure>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <ul data-copy data-rise className="space-y-3 lg:col-span-5">
            {links.map(({ label, value, href, Icon, external, download }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  {...(download ? { download: true } : {})}
                  className="group flex items-center gap-4 rounded-xl border border-line px-4 py-3.5 transition-colors duration-300 hover:border-accent/50"
                >
                  <Icon className="size-4 text-soft group-hover:text-accent" />
                  <span className="flex-1">
                    <span className="block font-mono text-[0.65rem] uppercase tracking-wider text-faint">{label}</span>
                    <span className="block text-fg">{value}</span>
                  </span>
                  <ArrowUpRight
                    className="size-4 text-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
          <div data-copy data-rise className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </div>
    </Chapter>
  );
}
