"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import { useRenderMode } from "@/hooks/useRenderMode";
import { networkNodes, networkOverview, networkStages, nodeById } from "./graph";
import { NetworkFallback, VIEW_H, VIEW_W, project2D } from "./NetworkFallback";
import { SceneBoundary } from "./SceneBoundary";

// Three.js is only downloaded when the 3D mode is actually used.
const InferenceNetwork = dynamic(() => import("./InferenceNetwork"), { ssr: false });

// 2D label offsets keep neighbouring labels apart on narrow screens.
const flatLabelTransform: Record<string, string> = {
  request: "translate(-30%, -210%)",
  output: "translate(-80%, 18px)",
};

const PANEL_ID = "network-detail";

/**
 * The hero's inference network. Selection state is independent of the render
 * mode: choosing a node only changes highlights, never which renderer is shown.
 */
export function HeroVisual() {
  const reduced = useReducedMotion();
  const [webglFailed, setWebglFailed] = useState(false);
  const mode = useRenderMode(webglFailed);
  const is3D = mode === "3d";

  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectionTick, setSelectionTick] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const activeId = hovered ?? selected;
  const panelNode = activeId ? nodeById[activeId] : null;
  const panel = panelNode ?? networkOverview;

  const stage = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLElement | null>>({});

  const select = useCallback((id: string) => {
    setSelected(id);
    setSelectionTick((t) => t + 1);
  }, []);
  const handleContextLost = useCallback(() => setWebglFailed(true), []);
  const handleReady = useCallback(() => setSceneReady(true), []);

  // Called by the 3D scene every frame with each label's projected position.
  const placeLabel = useCallback((id: string, x: number, y: number) => {
    const el = labelRefs.current[id];
    if (!el) return;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) ${
      id.startsWith("stage-") ? "translate(-50%, -50%)" : "translate(-50%, 26px)"
    }`;
    el.style.opacity = "1";
  }, []);

  // Pause rendering while the hero is off screen.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Escape returns to the overview.
  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        setHovered(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const showFlat = !is3D || !sceneReady;

  return (
    <figure data-hero-network data-mode={mode} aria-labelledby="network-title" className="relative">
      <p className="sr-only">
        Diagram: a request enters an integration layer, which routes it to one of four services — the ModelBridge
        SDK, a vision and OCR service, automation workflows, or an order and data system — each producing a shipped
        feature. Use the node buttons to explore each part.
      </p>

      <div
        ref={stage}
        className="relative w-full overflow-hidden rounded-[28px] border border-line bg-[radial-gradient(ellipse_at_45%_40%,#0f2229_0%,#0a1016_45%,#07090d_80%)]"
        style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
      >
        <div aria-hidden className="hairline-grid absolute inset-0 opacity-60" />

        <div
          className={`absolute inset-0 transition-opacity duration-700 ${showFlat ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <NetworkFallback activeId={activeId} animate={!reduced && showFlat} />
        </div>

        {is3D ? (
          <SceneBoundary onError={handleContextLost}>
            <div className={`absolute inset-0 transition-opacity duration-700 ${sceneReady ? "opacity-100" : "opacity-0"}`}>
              <InferenceNetwork
                activeId={activeId}
                selectionTick={selectionTick}
                running={onScreen}
                onHover={setHovered}
                onSelect={select}
                placeLabel={placeLabel}
                onReady={handleReady}
                onContextLost={handleContextLost}
              />
            </div>
          </SceneBoundary>
        ) : null}

        {/* Stage annotations (the 2D version draws its own inside the SVG). */}
        {is3D && sceneReady
          ? networkStages.map((s) => (
              <span
                key={s.id}
                aria-hidden
                ref={(el) => {
                  labelRefs.current[s.id] = el;
                }}
                className="pointer-events-none absolute left-0 top-0 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-faint opacity-0"
              >
                {s.label}
              </span>
            ))
          : null}

        <ul className="pointer-events-none absolute inset-0" aria-label="Network nodes">
          {networkNodes.map((node) => {
            const flat = project2D(node.position);
            const projected = is3D && sceneReady;
            const isActive = node.id === activeId;
            return (
              <li key={node.id}>
                <button
                  type="button"
                  data-node-label
                  ref={(el) => {
                    labelRefs.current[node.id] = el;
                  }}
                  onClick={() => select(node.id)}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(node.id)}
                  onBlur={() => setHovered(null)}
                  aria-pressed={selected === node.id}
                  aria-controls={PANEL_ID}
                  className={`pointer-events-auto absolute left-0 top-0 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[0.6rem] tracking-wide backdrop-blur-sm transition-[color,border-color,background-color,box-shadow] duration-300 sm:px-2.5 sm:py-1 sm:text-[0.68rem] ${
                    isActive
                      ? "border-accent/70 bg-ink/85 text-accent shadow-[0_0_18px_-4px_rgba(59,227,245,0.6)]"
                      : "border-line-strong bg-ink/70 text-soft hover:text-fg"
                  }`}
                  style={
                    projected
                      ? { opacity: 0 }
                      : {
                          left: `${(flat.x / VIEW_W) * 100}%`,
                          top: `${(flat.y / VIEW_H) * 100}%`,
                          transform: flatLabelTransform[node.id] ?? "translate(-50%, 18px)",
                        }
                  }
                >
                  {node.label}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="pointer-events-none absolute bottom-3 right-4 hidden font-mono text-[0.6rem] text-faint sm:block">
          Illustrative · no live model calls
        </p>
      </div>

      <figcaption
        id={PANEL_ID}
        data-node-panel
        aria-live="polite"
        className="mt-4 grid gap-4 rounded-2xl border border-line bg-panel/70 p-5 backdrop-blur sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <div>
          <p id="network-title" className="eyebrow">
            fig. 01 — inference network · <span className="text-soft">{panel.role}</span>
          </p>
          <p data-panel-title className="mt-2 font-display text-xl text-fg">
            {panel.label}
          </p>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-soft">{panel.detail}</p>
          <p className="mt-2 max-w-xl font-mono text-[0.7rem] leading-relaxed text-accent/90">
            <span className="text-faint">In the scene · </span>
            {panel.shows}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
          <a
            href={panel.link.href}
            className="group inline-flex items-center gap-1.5 rounded-full border border-accent/40 px-3.5 py-2 font-mono text-xs text-accent transition-colors duration-300 hover:bg-accent-dim"
          >
            {panel.link.label}
            <ArrowUpRight
              className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>
          {selected ? (
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setHovered(null);
              }}
              className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] text-faint hover:text-fg"
            >
              <RotateCcw className="size-3" aria-hidden />
              Overview <kbd className="rounded border border-line px-1 text-[0.6rem]">Esc</kbd>
            </button>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}
