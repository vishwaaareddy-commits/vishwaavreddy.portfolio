"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useMediaQuery, useReducedMotion } from "@/hooks/useMediaQuery";
import { hasWebGL2 } from "@/lib/webgl";
import { StaticNetwork } from "./StaticNetwork";

// Three.js, R3F, drei and postprocessing: only requested when this renders.
const JourneyCanvas = dynamic(() => import("./canvas/JourneyCanvas"), { ssr: false });

const subscribeNoop = () => () => {};

/**
 * Fixed backdrop for the whole page: the neural network. WebGL2 gets the 3D
 * field (phones start on a lighter tier; reduced motion renders one static
 * frame). Without WebGL2 an SVG drawing of the same network is shown, so
 * three.js is never downloaded there.
 */
export function JourneyStage() {
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const mobile = useMediaQuery("(max-width: 767px)", false);
  const reduced = useReducedMotion();
  const webgl = useSyncExternalStore(subscribeNoop, hasWebGL2, () => false);
  // The 3D chunk loads once the page has loaded and the browser is idle: the
  // HTML (hero copy, training panel) is what paints and becomes interactive first.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idle = 0;
    const go = () => {
      const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
      idle = ric(() => setReady(true), { timeout: 2500 });
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      window.cancelIdleCallback?.(idle);
    };
  }, []);

  return (
    <div
      role="img"
      aria-label="Background: a neural network whose neurons light up as activation flows from the input layer to the output layer while you scroll."
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_45%,rgba(30,110,130,0.16),transparent_70%)]" />
      {!hydrated ? null : webgl ? ready ? <JourneyCanvas mobile={mobile} still={reduced} /> : null : <StaticNetwork />}
    </div>
  );
}
