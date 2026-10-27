"use client";

import { useSyncExternalStore } from "react";
import { hasWebGL2 } from "@/lib/webgl";
import { useMediaQuery, useReducedMotion } from "./useMediaQuery";
import { useJourney } from "@/store/journey";

const subscribeNoop = () => () => {};

/**
 * Whether chapter visuals are drawn by the 3D canvas (WebGL2, motion
 * allowed). False during server rendering, so the HTML/SVG fallback is what
 * paints first. `lowPhone` is true on phones once the GPU tier drops to low,
 * where the attention chapter switches to its 2D version.
 */
export function useScene3D() {
  const reduced = useReducedMotion();
  const mobile = useMediaQuery("(max-width: 767px)", false);
  const tier = useJourney((s) => s.tier);
  const webgl = useSyncExternalStore(subscribeNoop, hasWebGL2, () => false);
  const scene3D = webgl && !reduced;
  return { scene3D, lowPhone: mobile && tier === "low", mobile };
}
