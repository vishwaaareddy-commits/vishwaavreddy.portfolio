let cached: boolean | undefined;

/**
 * True when the browser can create a WebGL context. Client-only.
 *
 * The result is cached for the page's lifetime and the probe context is
 * released straight away. Probing on every render leaks contexts until the
 * browser evicts the oldest one — which is the live scene's.
 */
export function hasWebGL(): boolean {
  if (cached !== undefined) return cached;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    cached = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}
