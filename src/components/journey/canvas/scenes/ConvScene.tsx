"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import media from "@/data/media.generated.json";
import { chapterProgress, chapterVisibility, labelRegistry, useJourney } from "@/store/journey";
import { CYAN, HOT, VIOLET } from "../neural/NetworkMesh";
import { fitToStage, hideLabels } from "../stage";

const CHAPTER = 4;
const VIDEO = "/work/esports-ocr.mp4";
const GIF = "/work/esports-ocr.gif";
const CONTENT = { w: 4.0, h: 1.3 };

/** Kill-feed rows in input-plane units (plane spans -0.5…0.5 on both axes). */
const FEED = [
  { u: 0.2, v: 0.36 },
  { u: 0.2, v: 0.26 },
  { u: 0.2, v: 0.16 },
];
const BOX = { w: 0.44, h: 0.075 };
const INPUT = { x: -1.3, w: 1.6, h: 0.9 };
/** Conv layers: position, size and kernel. Each is pooled 2× more than the last. */
const LAYERS = [
  { x: 0.1, z: -0.1, s: 1.05 },
  { x: 0.78, z: -0.3, s: 0.9 },
  { x: 1.35, z: -0.5, s: 0.76 },
  { x: 1.82, z: -0.7, s: 0.64 },
];

/** Scroll schedule (chapter progress). */
export const OCR_TIMELINE = {
  scan: [0.06, 0.3] as const,
  layer: (k: number) => [0.25 + k * 0.08, 0.33 + k * 0.08] as const,
  box: (i: number) => [0.56 + i * 0.04, 0.6 + i * 0.04] as const,
  lift: (i: number) => [0.64 + i * 0.05, 0.68 + i * 0.05] as const,
  fly: (i: number) => [0.68 + i * 0.05, 0.8 + i * 0.05] as const,
};

const span = (p: number, [a, b]: readonly [number, number]) => THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
const smooth = (x: number) => x * x * (3 - 2 * x);
const backOut = (x: number) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);

/** Muted, looping, inline video as a live texture. */
function makeVideoTexture() {
  const video = document.createElement("video");
  video.src = VIDEO;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  void video.play().catch(() => {
    // Autoplay can be refused; the first frame still shows once loaded.
  });
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, video };
}

/** Dark game-frame stand-in used until the real recording is added. */
function makeGridTexture() {
  const W = 640;
  const H = 360;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const bg = ctx.createRadialGradient(W * 0.35, H * 0.7, 10, W * 0.5, H * 0.5, W * 0.7);
  bg.addColorStop(0, "#1b2a36");
  bg.addColorStop(1, "#070b10");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(59,227,245,0.08)";
  for (let x = 0; x <= W; x += 32) ctx.strokeRect(x, 0, 0, H);
  for (let y = 0; y <= H; y += 32) ctx.strokeRect(0, y, W, 0);
  // Terrain blocks, so the edge kernels have shapes to respond to.
  ctx.fillStyle = "#16232e";
  ctx.fillRect(W * 0.08, H * 0.6, W * 0.24, H * 0.24);
  ctx.fillRect(W * 0.42, H * 0.66, W * 0.16, H * 0.14);
  ctx.beginPath();
  ctx.arc(W * 0.3, H * 0.35, H * 0.12, 0, Math.PI * 2);
  ctx.fill();
  // Kill-feed rows where the bounding boxes land.
  for (const { u, v } of FEED) {
    const x = (0.5 + u - BOX.w / 2) * W;
    const y = (0.5 - v - BOX.h / 2) * H;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x, y, BOX.w * W, BOX.h * H);
    ctx.fillStyle = "rgba(230,240,245,0.75)";
    ctx.fillRect(x + 8, y + 7, BOX.w * W * 0.34, 6);
    ctx.fillRect(x + BOX.w * W * 0.58, y + 7, BOX.w * W * 0.34, 6);
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const mapVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
/**
 * Feature map of the input frame: pooled to a coarser grid per layer, then a
 * real 3×3 kernel on the luminance — Sobel magnitude, signed vertical edges,
 * blurred edges, and max-pooled edges. Positive → cyan, negative → violet.
 */
const mapFrag = /* glsl */ `
  uniform sampler2D uInput;
  uniform float uLayer;
  uniform float uOn;
  uniform float uAlpha;
  uniform vec3 uCyan;
  uniform vec3 uViolet;
  uniform vec3 uHot;
  varying vec2 vUv;
  float lum(vec2 uv) { return dot(texture2D(uInput, uv).rgb, vec3(0.299, 0.587, 0.114)); }
  void main() {
    vec2 grid = vec2(160.0, 90.0) / pow(2.0, uLayer);
    vec2 cell = (floor(vUv * grid) + 0.5) / grid;
    vec2 s = 1.0 / grid;
    float tl = lum(cell + s * vec2(-1.0, 1.0)), tc = lum(cell + s * vec2(0.0, 1.0)), tr = lum(cell + s * vec2(1.0, 1.0));
    float ml = lum(cell + s * vec2(-1.0, 0.0)), mc = lum(cell), mr = lum(cell + s * vec2(1.0, 0.0));
    float bl = lum(cell + s * vec2(-1.0, -1.0)), bc = lum(cell + s * vec2(0.0, -1.0)), br = lum(cell + s * vec2(1.0, -1.0));
    float gx = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl);
    float gy = (tl + 2.0 * tc + tr) - (bl + 2.0 * bc + br);
    float v;
    if (uLayer < 0.5) v = length(vec2(gx, gy)) * 3.0;
    else if (uLayer < 1.5) v = gy * 4.0;
    else if (uLayer < 2.5) v = ((tl + tc + tr + ml + mr + bl + bc + br) / 8.0 - mc) * -10.0 + length(vec2(gx, gy)) * 2.0;
    else v = max(max(abs(gx), abs(gy)), abs(mc - 0.5 * (tl + br))) * 5.0;
    float a = clamp(abs(v), 0.0, 1.0);
    vec3 tint = v >= 0.0 ? uCyan : uViolet;
    // Cells light up left → right as the layer computes.
    float reveal = smoothstep(vUv.x - 0.1, vUv.x, uOn * 1.1);
    vec3 color = vec3(0.02, 0.035, 0.05) + tint * a * 1.2 * reveal + uHot * pow(a, 4.0) * reveal;
    // Thin grid lines between cells.
    vec2 f = fract(vUv * grid);
    float line = step(f.x, 0.06) + step(f.y, 0.06);
    color += uCyan * 0.04 * line;
    gl_FragColor = vec4(color * uAlpha, uAlpha * (0.55 + 0.45 * reveal));
  }
`;

function rectOutline() {
  const g = new THREE.BufferGeometry();
  const p = [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, -0.5, 0];
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  return g;
}

const INPUT_RY = 0.28;
const LAYER_RY = -0.32;

/** Corner-to-corner lines between consecutive planes (the receptive "frustums"). */
function connectors() {
  const planes = [
    { x: INPUT.x, z: 0, w: INPUT.w, h: INPUT.h, ry: INPUT_RY },
    ...LAYERS.map((l) => ({ x: l.x, z: l.z, w: l.s * 0.9, h: l.s * 0.9 * (9 / 16), ry: LAYER_RY })),
  ];
  // A plane-local point (lx, ly) after the plane's y rotation.
  const corner = (pl: (typeof planes)[number], lx: number, ly: number) => [
    pl.x + lx * Math.cos(pl.ry),
    ly,
    pl.z - lx * Math.sin(pl.ry),
  ];
  const pts: number[] = [];
  for (let i = 0; i < planes.length - 1; i += 1) {
    const a = planes[i];
    const b = planes[i + 1];
    for (const sy of [1, -1]) pts.push(...corner(a, a.w / 2, (sy * a.h) / 2), ...corner(b, -b.w / 2, (sy * b.h) / 2));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

const v3 = new THREE.Vector3();

/**
 * Chapter 04 stage: the game frame enters as the input plane, a scan line
 * passes over it, four conv-layer planes compute feature maps from it one
 * after another, boxes snap onto the kill feed and the recognised names fly
 * out into the HTML result table.
 */
export function ConvScene() {
  const outer = useRef<THREE.Group>(null);
  const group = useRef<THREE.Group>(null);
  const input = useRef<THREE.Group>(null);
  const face = useRef<THREE.Mesh>(null);
  const frame = useRef<THREE.LineSegments>(null);
  const beam = useRef<THREE.Mesh>(null);
  const links = useRef<THREE.LineSegments>(null);
  const maps = useRef<(THREE.Mesh | null)[]>([]);
  const boxes = useRef<(THREE.LineSegments | null)[]>([]);

  const assets = useMemo(() => {
    // Prefer the recording (a GIF only ever shows its first frame as a texture).
    const recording = media.present.includes(VIDEO as never) ? makeVideoTexture() : null;
    const texture: THREE.Texture =
      recording?.texture ??
      (media.present.includes(GIF as never)
        ? new THREE.TextureLoader().load(GIF, (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
          })
        : makeGridTexture());
    const mapMat = (layer: number) =>
      new THREE.ShaderMaterial({
        vertexShader: mapVert,
        fragmentShader: mapFrag,
        uniforms: {
          uInput: { value: texture },
          uLayer: { value: layer },
          uOn: { value: 0 },
          uAlpha: { value: 0 },
          uCyan: { value: CYAN },
          uViolet: { value: VIOLET },
          uHot: { value: HOT },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
    return {
      texture,
      video: recording?.video ?? null,
      plane: new THREE.PlaneGeometry(1, 1),
      outline: rectOutline(),
      links: connectors(),
      faceMat: new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, toneMapped: false }),
      lineMat: new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0, toneMapped: false }),
      linkMat: new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0, toneMapped: false }),
      beamMat: new THREE.MeshBasicMaterial({
        color: HOT.clone().multiplyScalar(2.4),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      mapMats: LAYERS.map((_, k) => mapMat(k)),
      // One material per box: each snaps on at its own moment.
      boxMats: FEED.map(
        () => new THREE.LineBasicMaterial({ color: CYAN.clone().multiplyScalar(1.8), transparent: true, opacity: 0, toneMapped: false }),
      ),
    };
  }, []);

  useEffect(
    () => () => {
      if (assets.video) {
        assets.video.pause();
        assets.video.removeAttribute("src");
        assets.video.load();
      }
      assets.texture.dispose();
      [assets.plane, assets.outline, assets.links].forEach((g) => g.dispose());
      [assets.faceMat, assets.lineMat, assets.linkMat, assets.beamMat, ...assets.mapMats, ...assets.boxMats].forEach((m) => m.dispose());
    },
    [assets],
  );

  useFrame(({ camera, size, clock }) => {
    const o = outer.current;
    const g = group.current;
    const ip = input.current;
    if (!o || !g || !ip) return;
    const { t } = useJourney.getState();
    let vis = chapterVisibility(t, CHAPTER, 0.06, 0.12);
    const fit = vis > 0 ? fitToStage("ocr", o, camera as THREE.PerspectiveCamera, size, CONTENT.w, CONTENT.h, { fill: 0.92 }) : null;
    vis = fit?.visible ? vis * fit.opacity : 0;
    o.visible = vis > 0;
    if (!o.visible) return hideLabels(labelRegistry, "ocr-tag-");
    const p = chapterProgress(t, CHAPTER);
    g.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.06;
    g.updateMatrixWorld();

    // Materials are reached through refs: they are mutated every frame.
    if (face.current) (face.current.material as THREE.MeshBasicMaterial).opacity = 0.95 * vis;
    if (frame.current) (frame.current.material as THREE.LineBasicMaterial).opacity = 0.8 * vis;
    const scan = span(p, OCR_TIMELINE.scan);
    if (beam.current) {
      beam.current.position.y = 0.5 - scan;
      beam.current.visible = scan > 0 && scan < 1;
      (beam.current.material as THREE.MeshBasicMaterial).opacity = vis;
    }
    let lit = 0;
    maps.current.forEach((m, k) => {
      if (!m) return;
      const on = span(p, OCR_TIMELINE.layer(k));
      lit = Math.max(lit, on > 0 ? (k + on) / LAYERS.length : 0);
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      u.uOn.value = on;
      u.uAlpha.value = vis * (0.35 + 0.65 * smooth(Math.min(1, on * 2)));
    });
    if (links.current) (links.current.material as THREE.LineBasicMaterial).opacity = vis * (0.08 + 0.25 * lit);

    boxes.current.forEach((box, i) => {
      if (!box) return;
      const a = span(p, OCR_TIMELINE.box(i));
      box.scale.set(BOX.w * (1.3 - 0.3 * backOut(a)), BOX.h * (1.3 - 0.3 * backOut(a)), 1);
      box.visible = a > 0;
      (box.material as THREE.LineBasicMaterial).opacity = a * vis;
    });

    // Name tags (HTML) lift off the boxes and fly into the result table rows, in screen space.
    const rows = document.querySelectorAll<HTMLElement>("[data-ocr-row]");
    ip.updateMatrixWorld();
    FEED.forEach((f, i) => {
      const el = labelRegistry.get(`ocr-tag-${i}`);
      if (!el) return;
      const lift = span(p, OCR_TIMELINE.lift(i));
      const fly = smooth(span(p, OCR_TIMELINE.fly(i)));
      const shown = lift > 0 ? (1 - span(fly, [0.88, 1])) * vis : 0;
      if (shown <= 0.01) {
        el.style.display = "none";
        return;
      }
      v3.set(f.u, f.v, 0).applyMatrix4(ip.matrixWorld).project(camera);
      const sx = (v3.x * 0.5 + 0.5) * size.width;
      const sy = (-v3.y * 0.5 + 0.5) * size.height - 18 * lift;
      const row = rows[i]?.getBoundingClientRect();
      const tx = row ? row.left + 60 : sx;
      const ty = row ? row.top + row.height / 2 : sy;
      const x = sx + (tx - sx) * fly;
      const y = sy + (ty - sy) * fly - Math.sin(Math.PI * fly) * 40;
      el.style.display = "";
      el.style.opacity = String(shown);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    });
  });

  return (
    <group ref={outer} visible={false}>
      <group ref={group}>
        <group ref={input} position={[INPUT.x, 0, 0]} rotation={[0, INPUT_RY, 0]} scale={[INPUT.w, INPUT.h, 1]}>
          <mesh ref={face} geometry={assets.plane} material={assets.faceMat} />
          <lineSegments ref={frame} geometry={assets.outline} material={assets.lineMat} />
          <mesh ref={beam} geometry={assets.plane} material={assets.beamMat} scale={[1.04, 0.012, 1]} position={[0, 0.5, 0.01]} />
          {FEED.map((f, i) => (
            <lineSegments
              key={i}
              ref={(el) => {
                boxes.current[i] = el;
              }}
              geometry={assets.outline}
              material={assets.boxMats[i]}
              position={[f.u, f.v, 0.02]}
            />
          ))}
        </group>
        {LAYERS.map((l, k) => (
          <mesh
            key={k}
            ref={(m) => {
              maps.current[k] = m;
            }}
            geometry={assets.plane}
            material={assets.mapMats[k]}
            position={[l.x, 0, l.z]}
            rotation={[0, LAYER_RY, 0]}
            scale={[l.s * 0.9, l.s * 0.9 * (9 / 16), 1]}
          />
        ))}
        <lineSegments ref={links} geometry={assets.links} material={assets.linkMat} />
      </group>
    </group>
  );
}
