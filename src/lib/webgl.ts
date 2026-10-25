let cached: boolean | undefined;

/**
 * True when the browser can create a WebGL2 context (required for the 3D
 * journey). Client-only. Probes once per page and releases the probe context
 * straight away: probing on every render leaks contexts until the browser
 * evicts the oldest one — which can be the live scene's.
 */
export function hasWebGL2(): boolean {
  if (cached !== undefined) return cached;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    cached = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}
