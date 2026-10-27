"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Download, Menu, X } from "lucide-react";
import { navItems, profile } from "@/data/profile";
import { scrambleTo } from "@/lib/motion";
import { useJourney } from "@/store/journey";

/** Nav anchor that owns the current chapter. */
function activeNav(chapter: number) {
  if (chapter >= 2 && chapter <= 7) return "#work";
  return ({ 8: "#capabilities", 9: "#experience", 10: "#about", 11: "#contact" } as Record<number, string>)[chapter];
}

const scrambleLabel = (e: MouseEvent<HTMLAnchorElement>) => {
  const label = e.currentTarget.querySelector<HTMLElement>("[data-label]");
  if (label) scrambleTo(label, label.dataset.label ?? label.textContent ?? "", 380);
};

export function Header() {
  const [open, setOpen] = useState(false);
  const current = activeNav(useJourney((s) => s.chapter));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    // Opaque band from the very top of the viewport through the nav, so no
    // content shows above or behind it; it redraws the frame lines it covers.
    <header className="fixed inset-x-0 top-0 z-50 bg-ink pt-2.5 md:pt-[18px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2.5 bottom-0 top-2.5 border border-line md:inset-x-[18px] md:top-[18px]"
      />
      <div className="shell relative flex h-16 items-center justify-between">
        <a href="#top" className="flex items-baseline gap-2 font-display text-sm font-semibold tracking-tight">
          <span>Vishwaa Reddy</span>
          <span className="hidden font-mono text-[0.68rem] font-normal text-faint sm:inline">/ applied ai</span>
        </a>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onMouseEnter={scrambleLabel}
                  aria-current={current === item.href ? "location" : undefined}
                  className="relative font-mono text-[0.72rem] uppercase tracking-[0.14em] text-soft transition-colors duration-300 hover:text-fg aria-[current=location]:text-accent"
                >
                  <span data-label={item.label}>{item.label}</span>
                  {current === item.href ? (
                    <span aria-hidden className="absolute -bottom-1.5 left-0 h-px w-full bg-accent" />
                  ) : null}
                </a>
              </li>
            ))}
            <li>
              <a
                href={profile.resume}
                download
                className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-1.5 text-sm text-fg transition-colors duration-300 hover:border-accent hover:text-accent"
              >
                <Download className="size-3.5" aria-hidden />
                Résumé
              </a>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className="-mr-2 rounded-md p-2 text-soft lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <nav id="mobile-nav" aria-label="Mobile" hidden={!open} className="border-t border-line lg:hidden">
        <ul className="mx-auto flex max-w-7xl flex-col px-5 py-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setOpen(false)} className="block py-3 text-base text-soft hover:text-fg">
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a href={profile.resume} download className="mt-2 inline-flex items-center gap-2 py-3 text-base text-accent">
              <Download className="size-4" aria-hidden />
              Download résumé
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
