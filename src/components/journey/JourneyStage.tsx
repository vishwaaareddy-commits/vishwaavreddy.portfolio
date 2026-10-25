"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useMediaQuery, useReducedMotion } from "@/hooks/useMediaQuery";
import { hasWebGL } from "@/lib/webgl";

// Three.js, drei and postprocessing load only in the browser, after the HTML.
const JourneyCanvas = dynamic(() => import("./canvas/JourneyCanvas"), { ssr: false });

const subscribeNoop = () => () => {};

/**
 * Fixed backdrop for the whole page. Hero text never waits on it: the
 * canvas mounts after hydration, and a CSS glow stands in without WebGL.
 */
export function JourneyStage() {
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const mobile = useMediaQuery("(max-width: 767px)", false);
  const reduced = useReducedMotion();
  const webgl = useSyncExternalStore(subscribeNoop, () => hydrated && hasWebGL(), () => false);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-ink">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_72%_45%,rgba(30,110,130,0.22),transparent_70%)]" />
      {hydrated && webgl ? <JourneyCanvas mobile={mobile} still={reduced} /> : null}
    </div>
  );
}
