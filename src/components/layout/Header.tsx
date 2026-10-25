"use client";

import { useEffect, useState } from "react";
import { Download, Menu, X } from "lucide-react";
import { navItems, profile } from "@/data/profile";
import { ScrollProgress } from "./ScrollProgress";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open ? "border-b border-line bg-ink/85 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <a href="#top" className="flex items-baseline gap-2 font-display text-sm font-semibold tracking-tight">
          <span>Vishwaa Reddy</span>
          <span className="hidden font-mono text-[0.68rem] font-normal text-faint sm:inline">/ applied ai</span>
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-sm text-soft transition-colors duration-300 hover:text-fg">
                  {item.label}
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
          className="-mr-2 rounded-md p-2 text-soft md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <ScrollProgress />

      <nav id="mobile-nav" aria-label="Mobile" hidden={!open} className="border-t border-line md:hidden">
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
