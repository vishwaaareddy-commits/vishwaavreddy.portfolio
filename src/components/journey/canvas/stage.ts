import * as THREE from "three";

/**
 * Stages: every chapter visual is fitted into an empty HTML element
 * (`data-stage="name"`) in its own grid column, so 3D content can never be
 * drawn over copy at any viewport size. Copy blocks (`data-copy`) are passed
 * to the background shaders as soft masks so the field fades behind text.
 * Stages are marked `data-copy` too, so the field steps back behind each
 * chapter's own visual instead of competing with it.
 */

export interface StageFit {
  /** Stage is laid out and at least partly on screen. */
  visible: boolean;
  /** Opacity of the stage's nearest [data-lift]/[data-fade] ancestor (scrubbed tweens). */
  opacity: number;
  /** Stage rect in CSS pixels. */
  rect: DOMRect | null;
}

const cache = new Map<string, HTMLElement | null>();

/** Stage element by name; looked up again if it was unmounted. */
export function stageElement(name: string) {
  let el = cache.get(name) ?? null;
  if (!el || !el.isConnected) {
    el = document.querySelector<HTMLElement>(`[data-stage="${name}"]`);
    cache.set(name, el);
  }
  return el;
}

const view = new THREE.Vector3();

/**
 * Places `group` facing the camera, `distance` units in front of it, centred
 * on the stage rect and scaled so a `contentW` × `contentH` box (local units)
 * fits inside `fill` of the rect. Independent of where the camera travels.
 */
export function fitToStage(
  name: string,
  group: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  size: { width: number; height: number },
  contentW: number,
  contentH: number,
  { distance = 6, fill = 0.88 } = {},
): StageFit {
  const el = stageElement(name);
  if (!el) return { visible: false, opacity: 0, rect: null };
  const r = el.getBoundingClientRect();
  const visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < size.height;
  if (!visible) return { visible, opacity: 0, rect: r };

  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const worldPerPx = (2 * distance * tan) / size.height;
  const cx = r.left + r.width / 2 - size.width / 2;
  const cy = size.height / 2 - (r.top + r.height / 2);
  view.set(cx * worldPerPx, cy * worldPerPx, -distance);
  camera.updateMatrixWorld();
  group.position.copy(view.applyMatrix4(camera.matrixWorld));
  group.quaternion.copy(camera.quaternion);
  const scale = Math.min((r.width * worldPerPx * fill) / contentW, (r.height * worldPerPx * fill) / contentH);
  group.scale.setScalar(Math.max(scale, 1e-4));

  const faded = el.closest<HTMLElement>("[data-lift], [data-fade]");
  const opacity = faded ? Number(faded.style.opacity || 1) : 1;
  return { visible, opacity, rect: r };
}

const projected = new THREE.Vector3();

/**
 * Positions an HTML label over a local point of `obj`, centred on it and
 * offset by `dy` px. Hidden (display none) when it would leave the stage
 * rect, so labels can never land on copy. Widths are measured once.
 */
export function placeLabel(
  el: HTMLElement | undefined,
  obj: THREE.Object3D,
  local: THREE.Vector3,
  camera: THREE.Camera,
  size: { width: number; height: number },
  rect: DOMRect | null,
  opacity: number,
  dy = 0,
) {
  if (!el) return;
  if (!rect || opacity <= 0.01) {
    el.style.display = "none";
    return;
  }
  projected.copy(local).applyMatrix4(obj.matrixWorld).project(camera);
  const x = (projected.x * 0.5 + 0.5) * size.width;
  const y = (-projected.y * 0.5 + 0.5) * size.height + dy;
  let w = Number(el.dataset.w);
  let h = Number(el.dataset.h);
  if (!w) {
    el.style.display = "";
    w = el.offsetWidth;
    h = el.offsetHeight;
    el.dataset.w = String(w);
    el.dataset.h = String(h);
  }
  const inside = x - w / 2 >= rect.left && x + w / 2 <= rect.right && y - h / 2 >= rect.top && y + h / 2 <= rect.bottom;
  el.style.display = inside ? "" : "none";
  el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
  el.style.opacity = String(opacity);
}

/** Hides every registered label whose key starts with `prefix`. */
export function hideLabels(registry: Map<string, HTMLElement>, prefix: string) {
  for (const [key, el] of registry) if (key.startsWith(prefix)) el.style.display = "none";
}

/**
 * Visibility of a stage from its own rect: 1 once it is well on screen,
 * easing to 0 only as it leaves. Never tied to scroll progress, so a stage
 * is never empty while its section is visible.
 */
export function stageFade(fit: StageFit, size: { height: number }) {
  if (!fit.visible || !fit.rect) return 0;
  const r = fit.rect;
  const onScreen = Math.min(r.bottom, size.height) - Math.max(r.top, 0);
  return Math.min(1, Math.max(0, onScreen / Math.min(r.height, 160))) * fit.opacity;
}

/** Max copy rects passed to shaders (see MASK_GLSL). */
export const MASK_MAX = 8;

/** Uniforms shared by every material that fades behind copy. */
export const maskUniforms = {
  uMask: { value: Array.from({ length: MASK_MAX }, () => new THREE.Vector4()) },
  uMaskCount: { value: 0 },
  /** Viewport in CSS px (gl_FragCoord is divided by uDpr). */
  uViewport: { value: new THREE.Vector2(1, 1) },
  uDpr: { value: 1 },
};

/** GLSL: 1 in the open, `floor` anywhere inside a copy rect; the soft edge lies entirely outside it (56px). */
export const MASK_GLSL = /* glsl */ `
  uniform vec4 uMask[${MASK_MAX}];
  uniform int uMaskCount;
  uniform vec2 uViewport;
  uniform float uDpr;
  float copyMask(float floorValue) {
    vec2 p = vec2(gl_FragCoord.x / uDpr, uViewport.y - gl_FragCoord.y / uDpr);
    float inside = 0.0;
    for (int i = 0; i < ${MASK_MAX}; i++) {
      if (i >= uMaskCount) break;
      vec4 r = uMask[i];
      vec2 d = max(r.xy - p, p - r.zw);
      float dist = max(d.x, d.y);
      inside = max(inside, 1.0 - smoothstep(0.0, 56.0, dist));
    }
    return mix(1.0, floorValue, inside);
  }
`;

const tracked = new Set<HTMLElement>();
let observer: IntersectionObserver | null = null;
let observed = new WeakSet<HTMLElement>();
let lastScan = 0;

/**
 * Updates the copy-mask uniforms from on-screen `[data-copy]` elements.
 * Elements are discovered every second (chapters mount lazily) and only
 * the ones an IntersectionObserver reports on screen are measured.
 */
export function updateCopyMask(size: { width: number; height: number }, dpr: number, now: number) {
  maskUniforms.uViewport.value.set(size.width, size.height);
  maskUniforms.uDpr.value = dpr;
  if (typeof IntersectionObserver === "undefined") return;
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) tracked.add(el);
        else tracked.delete(el);
      }
    });
    observed = new WeakSet();
  }
  if (now - lastScan > 1000) {
    lastScan = now;
    document.querySelectorAll<HTMLElement>("[data-copy]").forEach((el) => {
      if (observed.has(el)) return;
      observed.add(el);
      observer!.observe(el);
    });
    for (const el of tracked) if (!el.isConnected) tracked.delete(el);
  }
  let n = 0;
  for (const el of tracked) {
    if (n >= MASK_MAX) break;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > size.height || r.width === 0) continue;
    maskUniforms.uMask.value[n].set(r.left, r.top, r.right, r.bottom);
    n += 1;
  }
  maskUniforms.uMaskCount.value = n;
}

export function disposeCopyMask() {
  observer?.disconnect();
  observer = null;
  tracked.clear();
  lastScan = 0;
}
