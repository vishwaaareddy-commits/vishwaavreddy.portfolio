"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useMediaQuery";

const stages = [
  { key: "frame", label: "Sample frame", detail: "Read a frame from the match video; skip frames that repeat the previous kill feed." },
  { key: "mask", label: "HSV mask", detail: "Isolate the kill-feed region by its colour range with OpenCV." },
  { key: "icons", label: "Template match", detail: "Locate event icons in each feed line to split the actor from the target." },
  { key: "ocr", label: "Upscale + OCR", detail: "Upscale the name crops 2× and read them with PaddleOCR." },
  { key: "match", label: "Fuzzy match", detail: "Map stylised Unicode tags to registered roster names with difflib." },
  { key: "row", label: "Structured row", detail: "Emit clean records for the results table instead of manual entry." },
] as const;

// Fictional, clearly schematic feed lines. Not real players or matches.
const feed = [
  { raw: "ᴘʟᴀʏᴇʀ·ᴀʟᴘʜᴀ", clean: "PlayerAlpha", target: "ᴘʟᴀʏᴇʀ_ʙʀᴀᴠᴏ", targetClean: "PlayerBravo" },
  { raw: "ꜱᴀᴍᴘʟᴇ⚡ᴛᴀɢ", clean: "SampleTag", target: "ᴅᴇᴍᴏ·ɴᴀᴍᴇ", targetClean: "DemoName" },
];

const STEP_MS = 2100;

export function OcrDemo() {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const current = reduced ? stages.length - 1 : step;

  useEffect(() => {
    if (!inView || reduced || !playing) return;
    const id = setInterval(() => setStep((s) => (s + 1) % stages.length), STEP_MS);
    return () => clearInterval(id);
  }, [inView, reduced, playing]);

  const at = (key: (typeof stages)[number]["key"]) => current >= stages.findIndex((s) => s.key === key);

  return (
    <div ref={ref} className="grid gap-5 lg:grid-cols-12">
      {/* Schematic frame */}
      <div className="lg:col-span-8">
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-[#0a0d12]">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,#1b2430,transparent_60%),radial-gradient(ellipse_at_80%_20%,#141b25,transparent_55%)]"
          />
          <div aria-hidden className="hairline-grid absolute inset-0 opacity-60" />
          {/* Abstract terrain shapes */}
          <div aria-hidden className="absolute bottom-0 left-0 h-1/3 w-full bg-gradient-to-t from-[#111822] to-transparent" />
          <div aria-hidden className="absolute bottom-[18%] left-[12%] h-[18%] w-[22%] rounded-sm bg-[#18212d]" />
          <div aria-hidden className="absolute bottom-[22%] left-[48%] h-[10%] w-[14%] rounded-sm bg-[#151d28]" />

          {/* Frame counter */}
          <p className="absolute left-3 top-3 font-mono text-[0.6rem] text-faint">
            frame 0412 {at("frame") ? "· unique" : ""}
          </p>

          {/* Scan line */}
          {!reduced && current === 0 ? (
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="h-1/3 w-full bg-gradient-to-b from-transparent via-accent/10 to-transparent [animation:scan_2s_linear_infinite]" />
            </div>
          ) : null}

          {/* Kill feed region */}
          <div
            className={`absolute right-[3%] top-[10%] w-[46%] rounded-md p-1.5 transition-all duration-500 ${
              at("mask") ? "outline outline-1 outline-accent/80" : "outline outline-1 outline-transparent"
            }`}
          >
            {at("mask") ? (
              <span className="absolute -top-4 left-0 font-mono text-[0.55rem] text-accent">kill_feed · hsv</span>
            ) : null}
            <ul className="space-y-1.5">
              {feed.map((line, i) => (
                <li
                  key={line.raw}
                  className="flex items-center justify-between gap-2 rounded bg-black/45 px-2 py-1 font-mono text-[0.6rem] text-fg/85 sm:text-[0.7rem]"
                >
                  <span className={`rounded px-0.5 transition-colors duration-500 ${at("ocr") ? "outline outline-1 outline-warn/80" : ""}`}>
                    {at("match") ? line.clean : line.raw}
                  </span>
                  <span
                    className={`grid size-4 place-items-center rounded-sm text-[0.55rem] transition-colors duration-500 ${
                      at("icons") ? "outline outline-1 outline-accent text-accent" : "text-soft"
                    }`}
                    aria-hidden
                  >
                    ✕
                  </span>
                  <span className={`rounded px-0.5 transition-colors duration-500 ${at("ocr") ? "outline outline-1 outline-warn/80" : ""}`}>
                    {at("match") ? line.targetClean : line.target}
                  </span>
                  <span className="sr-only">{`Schematic feed line ${i + 1}`}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="absolute bottom-3 right-3 rounded bg-black/50 px-2 py-1 font-mono text-[0.58rem] text-soft">
            Schematic — not real match footage
          </p>
        </div>

        {/* Stage controls */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!reduced ? (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="mr-1 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-mono text-[0.65rem] text-soft hover:text-fg"
              aria-label={playing ? "Pause walkthrough" : "Play walkthrough"}
            >
              {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
              {playing ? "Pause" : "Play"}
            </button>
          ) : null}
          {stages.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setStep(i);
                setPlaying(false);
              }}
              aria-current={current === i ? "step" : undefined}
              className={`rounded-full border px-3 py-1.5 font-mono text-[0.65rem] transition-colors duration-300 ${
                current === i ? "border-accent/60 text-accent" : "border-line text-faint hover:text-soft"
              }`}
            >
              {String(i + 1).padStart(2, "0")} {s.label}
            </button>
          ))}
        </div>
        <p className="mt-3 min-h-[2.75rem] text-sm leading-relaxed text-soft" aria-live="polite">
          {stages[current].detail}
        </p>
      </div>

      {/* Structured result panel */}
      <div className="lg:col-span-4">
        <div className="h-full rounded-2xl border border-line bg-[#05070a] p-5 font-mono text-[0.72rem] leading-relaxed">
          <p className="mb-3 text-[0.62rem] uppercase tracking-wider text-faint">result · schematic</p>
          {at("row") ? (
            <pre className="whitespace-pre-wrap text-soft">
              {feed
                .map(
                  (l) =>
                    `{\n  "player": "${l.clean}",\n  "read_as": "${l.raw}",\n  "opponent": "${l.targetClean}",\n  "finish_count": null\n}`,
                )
                .join(",\n")}
            </pre>
          ) : (
            <p className="text-faint">Waiting for matched names…</p>
          )}
          <p className="mt-4 border-t border-line pt-3 text-[0.65rem] text-warn/90">
            finish_count stays empty here: pairing finishes with the right player was still being fixed in the latest build.
          </p>
        </div>
      </div>
    </div>
  );
}
