"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useMediaQuery";

const process = [
  { label: "Plan", detail: "Phased test plan across 12 pages" },
  { label: "Run", detail: "AI browser agents drive the flows" },
  { label: "Find", detail: "Functional and UI/UX issues logged" },
  { label: "Report", detail: "4 plain-language reports" },
];

type Mode = "observed" | "safe";
type Phase = "idle" | "tapped" | "confirm" | "deleted";

const ROWS = 4;
const TARGET = 1;

function PhoneMock({ mode, phase }: { mode: Mode; phase: Phase }) {
  const removed = phase === "deleted" || (mode === "observed" && phase !== "idle");
  return (
    <div className="relative mx-auto w-full max-w-[260px] rounded-[1.6rem] border border-line-strong bg-[#0a0d12] p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="font-display text-sm text-fg">Glucose log</p>
        <span className="font-mono text-[0.55rem] text-faint">schematic</span>
      </div>
      <ul className="space-y-2">
        {Array.from({ length: ROWS }, (_, i) => {
          const isTarget = i === TARGET;
          const gone = isTarget && removed;
          return (
            <li
              key={i}
              className={`flex items-center justify-between rounded-lg border px-3 transition-all duration-500 ${
                gone ? "max-h-0 border-transparent py-0 opacity-0" : "max-h-14 border-line py-2.5"
              } ${isTarget && phase === "tapped" && mode === "safe" ? "border-danger/50" : ""}`}
            >
              <span className="flex flex-col gap-1.5" aria-hidden>
                <span className="h-1.5 w-16 rounded bg-line-strong" />
                <span className="h-1.5 w-10 rounded bg-line" />
              </span>
              <Trash2 className={`size-3.5 ${isTarget ? "text-danger" : "text-faint"}`} aria-hidden />
            </li>
          );
        })}
      </ul>

      {mode === "safe" && phase === "confirm" ? (
        <div className="absolute inset-x-3 top-1/3 rounded-xl border border-line-strong bg-panel p-3 shadow-2xl">
          <p className="text-xs text-fg">Delete this reading?</p>
          <p className="mt-1 text-[0.65rem] text-faint">You can undo for a few seconds.</p>
          <div className="mt-3 flex justify-end gap-2 text-[0.65rem]">
            <span className="rounded px-2 py-1 text-soft">Cancel</span>
            <span className="rounded bg-danger/80 px-2 py-1 text-ink">Delete</span>
          </div>
        </div>
      ) : null}

      {mode === "safe" && phase === "deleted" ? (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-panel px-3 py-2 text-[0.65rem] text-soft">
          Reading deleted
          <span className="inline-flex items-center gap-1 text-accent">
            <RotateCcw className="size-3" aria-hidden /> Undo
          </span>
        </div>
      ) : null}

      {mode === "observed" && phase !== "idle" ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[0.65rem] text-danger">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          Record removed instantly — no confirmation, no undo.
        </div>
      ) : null}
    </div>
  );
}

export function QaDemo() {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [mode, setMode] = useState<Mode>("observed");
  const [phase, setPhase] = useState<Phase>("idle");
  const [run, setRun] = useState(0);

  // With reduced motion, jump straight to each mode's end state.
  const shownPhase: Phase = reduced ? (mode === "observed" ? "tapped" : "deleted") : phase;

  useEffect(() => {
    if (!inView || reduced) return;
    const seq: [Phase, number][] =
      mode === "observed"
        ? [["idle", 0], ["tapped", 1100]]
        : [["idle", 0], ["tapped", 900], ["confirm", 1500], ["deleted", 2900]];
    const timers = seq.map(([p, ms]) => setTimeout(() => setPhase(p), ms));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduced, mode, run]);

  return (
    <div ref={ref} className="space-y-5">
      <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {process.map((p, i) => (
          <li key={p.label} className="rounded-lg border border-line bg-panel/60 px-3 py-2.5">
            <p className="font-mono text-[0.6rem] text-faint">{String(i + 1).padStart(2, "0")}</p>
            <p className="font-display text-sm text-fg">{p.label}</p>
            <p className="mt-0.5 text-[0.72rem] leading-snug text-soft">{p.detail}</p>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-line bg-panel/60 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Deletion behaviour" className="inline-flex rounded-full border border-line p-1">
            {(
              [
                ["observed", "Observed in testing"],
                ["safe", "Safe-deletion pattern"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={mode === key}
                onClick={() => {
                  setMode(key);
                  setRun((r) => r + 1);
                }}
                className={`rounded-full px-3 py-1.5 font-mono text-[0.65rem] transition-colors duration-300 ${
                  mode === key ? (key === "observed" ? "bg-danger/15 text-danger" : "bg-accent-dim text-accent") : "text-faint"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {!reduced ? (
            <button
              type="button"
              onClick={() => setRun((r) => r + 1)}
              className="inline-flex items-center gap-1.5 font-mono text-[0.65rem] text-soft hover:text-fg"
            >
              <RotateCcw className="size-3" aria-hidden /> Replay
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid items-center gap-6 sm:grid-cols-2">
          <PhoneMock mode={mode} phase={shownPhase} />
          <div aria-live="polite">
            {mode === "observed" ? (
              <>
                <p className="eyebrow text-danger">Critical finding</p>
                <p className="mt-2 text-sm leading-relaxed text-soft">
                  A single tap on delete removed a glucose reading permanently. For health records, an accidental tap
                  meant lost data with no way back — so it was flagged as the top-priority fix.
                </p>
              </>
            ) : (
              <>
                <p className="eyebrow text-accent">Standard safeguard</p>
                <p className="mt-2 text-sm leading-relaxed text-soft">
                  The usual pattern for destructive actions: confirm first, then offer a short undo window. Shown to
                  explain the risk, not as the shipped fix — fixes belonged to the product team.
                </p>
              </>
            )}
          </div>
        </div>
        <p className="mt-6 font-mono text-[0.62rem] text-faint">
          Schematic recreation — not the TakeHealth interface. No patient data is shown.
        </p>
      </div>
    </div>
  );
}
