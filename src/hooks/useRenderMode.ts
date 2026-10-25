"use client";

import { useSyncExternalStore } from "react";
import { hasWebGL } from "@/lib/webgl";
import { useMediaQuery, useReducedMotion } from "./useMediaQuery";

export type RenderMode = "pending" | "3d" | "2d";

const subscribeNoop = () => () => {};

/**
 * Chooses how the hero network renders. Depends only on the environment and
 * on a real WebGL failure — never on which node is selected.
 */
export function useRenderMode(webglFailed: boolean): RenderMode {
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const wide = useMediaQuery("(min-width: 1024px)", false);
  const reduced = useReducedMotion();
  // hasWebGL is cached after its first call, so this snapshot is stable.
  const webgl = useSyncExternalStore(subscribeNoop, hasWebGL, () => false);

  if (!hydrated) return "pending";
  return wide && !reduced && webgl && !webglFailed ? "3d" : "2d";
}
