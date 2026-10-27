"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { hasMedia } from "@/components/ui/MediaFrame";
import { profile } from "@/data/profile";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { Chapter } from "../Chapter";

// Prefer the dedicated portrait once it has been added to /public/about.
const photo = hasMedia("/about/photo.jpg") ? "/about/photo.jpg" : "/images/profile.jpg";
const SLITS = 6;

const BIO = [
  `${profile.title}, based in Mumbai. I studied Data Science at SIES College, where most of my work lived in notebooks: classifiers, forecasting models, clustering for my thesis, and a computer-vision drowsiness detector.`,
  "Internships pulled me toward building. I was named Best Performer in Elevate Labs' AI/ML internship, then completed a Python and PostgreSQL internship through IIT Bombay's Spoken Tutorial. Since April 2026 I've worked as an AI Expert at Avatar India and Colab Platforms, where the job is less about training models and more about making them useful — a client that reaches many LLMs through one interface, OCR that reads esports footage, and automation that reacts to real payments.",
  "Before that, I was Gymkhana Joint Secretary at SIES and Event Chairperson for Nexora, a college event with more than 8,000 attendees, and I hold a district certificate in Kabaddi. Running events taught me what shipping software keeps confirming: the unglamorous details decide whether something works.",
];

/** A faint field of neurons behind the photo; nodes near the cursor light up and link. */
function NeuronCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const nodes = Array.from({ length: 70 }, () => ({ x: rand(), y: rand(), a: 0 }));
    const cursor = { x: -1, y: -1 };
    let frame = 0;
    let visible = false;
    const still = prefersReducedMotion();

    const draw = () => {
      frame = 0;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (el.width !== Math.round(w * dpr)) {
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      let busy = false;
      for (const n of nodes) {
        const d = Math.hypot(n.x * w - cursor.x, n.y * h - cursor.y);
        const target = d < 140 ? 1 - d / 140 : 0;
        n.a += (target - n.a) * 0.15;
        if (Math.abs(target - n.a) > 0.01) busy = true;
      }
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot((a.x - b.x) * w, (a.y - b.y) * h);
          if (d > 90) continue;
          ctx.strokeStyle = `rgba(59,227,245,${(0.05 + 0.5 * Math.min(a.a, b.a)) * (1 - d / 90)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x * w, a.y * h);
          ctx.lineTo(b.x * w, b.y * h);
          ctx.stroke();
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${n.a > 0.5 ? "242,253,255" : "59,227,245"},${0.18 + 0.8 * n.a})`;
        ctx.beginPath();
        ctx.arc(n.x * w, n.y * h, 1.6 + 2.2 * n.a, 0, Math.PI * 2);
        ctx.fill();
      }
      if (busy && visible && !still) frame = requestAnimationFrame(draw);
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      cursor.x = e.clientX - r.left;
      cursor.y = e.clientY - r.top;
      if (visible && !still) request();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) request();
    });
    io.observe(el);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", request);
    request();
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", request);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className="absolute -inset-[12%] h-[124%] w-[124%]" />;
}

/**
 * Chapter 10: the portrait is uncovered by vertical slits, a faint neuron
 * field behind it responds to the cursor, and the bio lights word by word
 * as you scroll (scrubbed, not pinned, so it adds no height).
 */
export function AboutChapter() {
  return (
    <Chapter
      index={10}
      id="about"
      pin={false}
      unpinnedRange={["top 75%", "bottom 75%"]}
      aria-labelledby="about-title"
      className="border-t border-line"
      build={(tl, { root }) => {
        const slits = gsap.utils.toArray<HTMLElement>("[data-slit]", root);
        const words = gsap.utils.toArray<HTMLElement>("[data-word]", root);
        // Slits are open by default (no JS, reduced motion); only the scrub closes them first.
        tl.fromTo(slits, { scaleY: 1 }, { scaleY: 0, duration: 0.25, stagger: 0.03, ease: "power2.inOut" }, 0);
        // Dim never drops below 0.35, so the bio stays readable if a trigger is missed.
        gsap.set(words, { opacity: 0.35 });
        tl.to(words, { opacity: 1, duration: 0.02, stagger: 0.7 / Math.max(1, words.length) }, 0.1);
        tl.to({}, { duration: 1 }, 0);
      }}
    >
      <div className="shell relative z-10 py-24 md:py-32">
        <header className="mb-12 grid gap-6 md:mb-16 md:grid-cols-12">
          <p className="eyebrow flex items-center gap-3 md:col-span-3">
            <span className="text-accent">010</span>
            <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
            About
          </p>
          <h2 id="about-title" className="font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl md:col-span-9 md:text-5xl">
            Turning models into systems <span className="font-serif text-[1.1em] font-normal italic text-accent">people use</span>.
          </h2>
        </header>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <NeuronCanvas />
            <div data-copy className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line">
              <Image src={photo} alt="Portrait of Vishwaa Reddy" fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover object-[50%_30%]" />
              <div aria-hidden className="absolute inset-0 flex">
                {Array.from({ length: SLITS }, (_, i) => (
                  <span key={i} data-slit className={`h-full flex-1 scale-y-0 bg-ink ${i % 2 ? "origin-bottom" : "origin-top"}`} />
                ))}
              </div>
            </div>
          </div>
          <div data-copy className="space-y-6 text-lg leading-relaxed text-fg md:col-span-7 md:col-start-6">
            {BIO.map((para, i) => (
              <p key={i}>
                {para.split(" ").map((w, j) => (
                  <span key={j}>
                    <span data-word>{w}</span>{" "}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Chapter>
  );
}
