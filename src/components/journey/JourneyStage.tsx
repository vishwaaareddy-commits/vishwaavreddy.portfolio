"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useMediaQuery, useReducedMotion } from "@/hooks/useMediaQuery";
import { hasWebGL2 } from "@/lib/webgl";
import { StaticCore } from "./StaticCore";

// Three.js, R3F, drei and postprocessing: only requested when this renders.
const JourneyCanvas = dynamic(() => import("./canvas/JourneyCanvas"), { ssr: false });

const subscribeNoop = () => () => {};

/**
 * Fixed backdrop for the whole page. The 3D canvas is used only on screens
 * ≥768px with WebGL2 and motion allowed; the decision is made before the
 * dynamic import renders, so phones never download the 3D chunk. Everyone
 * else gets the pre-rendered Core image.
 */
export function JourneyStage() {
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const mobile = useMediaQuery("(max-width: 767px)", false);
  const reduced = useReducedMotion();
  const canUse3D = useSyncExternalStore(
    subscribeNoop,
    () => !window.matchMedia("(max-width: 767px)").matches && !reduced && hasWebGL2(),
    () => false,
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_72%_45%,rgba(30,110,130,0.22),transparent_70%)]" />
      {!hydrated ? null : canUse3D ? <JourneyCanvas mobile={false} still={false} /> : <StaticCore mobile={mobile} still={reduced} />}
    </div>
  );
}
