"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import media from "@/data/media.generated.json";
import { chapterProgress, chapterVisibility, labelRegistry, useJourney } from "@/store/journey";
import { screenToWorld } from "./screen";

const ACCENT = new THREE.Color("#3be3f5");
const CHAPTER = 4;
const VIDEO = "/work/esports-ocr.mp4";
const GIF = "/work/esports-ocr.gif";

/** Kill-feed rows in panel-local units (panel spans -0.5…0.5 on both axes). */
const FEED = [
  { u: 0.2, v: 0.36 },
  { u: 0.2, v: 0.26 },
  { u: 0.2, v: 0.16 },
];
const BOX = { w: 0.44, h: 0.075 };

const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);
const backOut = (x: number) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);

/** Muted, looping, inline video as a live texture for the panel. */
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

/** Dark game-frame grid used until the real recording is added. */
function makeGridTexture() {
  const W = 640;
  const H = 360;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const bg = ctx.createRadialGradient(W * 0.35, H * 0.7, 10, W * 0.5, H * 0.5, W * 0.7);
  bg.addColorStop(0, "#14202b");
  bg.addColorStop(1, "#070b10");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(59,227,245,0.08)";
  for (let x = 0; x <= W; x += 32) ctx.strokeRect(x, 0, 0, H);
  for (let y = 0; y <= H; y += 32) ctx.strokeRect(0, y, W, 0);
  ctx.fillStyle = "#101a24";
  ctx.fillRect(W * 0.12, H * 0.62, W * 0.22, H * 0.2);
  ctx.fillRect(W * 0.46, H * 0.68, W * 0.14, H * 0.12);
  // Kill-feed rows where the bounding boxes land.
  for (const { u, v } of FEED) {
    const x = (0.5 + u - BOX.w / 2) * W;
    const y = (0.5 - v - BOX.h / 2) * H;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x, y, BOX.w * W, BOX.h * H);
    ctx.fillStyle = "rgba(230,240,245,0.55)";
    ctx.fillRect(x + 8, y + 7, BOX.w * W * 0.34, 6);
    ctx.fillRect(x + BOX.w * W * 0.58, y + 7, BOX.w * W * 0.34, 6);
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function rectOutline() {
  const g = new THREE.BufferGeometry();
  const p = [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, -0.5, 0];
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  return g;
}

const center = new THREE.Vector3();
const left = new THREE.Vector3();
const right = new THREE.Vector3();
const start = new THREE.Vector3();
const target = new THREE.Vector3();
const normal = new THREE.Vector3();
const proj = new THREE.Vector3();

/**
 * Chapter 04 "Holographic scan": a glass game frame in the right column, a scan
 * beam, bounding boxes snapping onto the kill feed and name tags flying into
 * the HTML result table. Scrubbed by scroll and fully reversible.
 */
export function OcrScene() {
  const root = useRef<THREE.Group>(null);
  const panel = useRef<THREE.Group>(null);
  const face = useRef<THREE.Mesh>(null);
  const frame = useRef<THREE.LineSegments>(null);
  const beam = useRef<THREE.Mesh>(null);
  const boxes = useRef<(THREE.LineSegments | null)[]>([]);
  const tags = useRef<(THREE.Mesh | null)[]>([]);

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
    return {
      texture,
      video: recording?.video ?? null,
      plane: new THREE.PlaneGeometry(1, 1),
      outline: rectOutline(),
      tagGeo: new THREE.PlaneGeometry(1, 1),
      faceMat: new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, toneMapped: false }),
      frameMat: new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, toneMapped: false }),
      beamMat: new THREE.MeshBasicMaterial({
        color: new THREE.Color("#bff8ff").multiplyScalar(2.4),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      // One material per box and tag: each fades on its own schedule.
      boxMats: FEED.map(
        () => new THREE.LineBasicMaterial({ color: new THREE.Color("#3be3f5").multiplyScalar(1.8), transparent: true, opacity: 0, toneMapped: false }),
      ),
      tagMats: FEED.map(
        () => new THREE.MeshBasicMaterial({ color: new THREE.Color("#3be3f5").multiplyScalar(1.4), transparent: true, opacity: 0, toneMapped: false }),
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
      [assets.plane, assets.outline, assets.tagGeo].forEach((g) => g.dispose());
      [assets.faceMat, assets.frameMat, assets.beamMat, ...assets.boxMats, ...assets.tagMats].forEach((m) => m.dispose());
    },
    [assets],
  );

  useFrame((state) => {
    const { t } = useJourney.getState();
    const g = root.current;
    const pg = panel.current;
    if (!g || !pg) return;
    const vis = chapterVisibility(t, CHAPTER, 0.1, 0.18);
    const stage = document.querySelector<HTMLElement>("[data-ocr-stage]");
    g.visible = vis > 0 && stage !== null;
    if (!g.visible || !stage) {
      FEED.forEach((_, i) => {
        const el = labelRegistry.get(`ocr-tag-${i}`);
        if (el) el.style.display = "none";
      });
      return;
    }
    const p = chapterProgress(t, CHAPTER);
    const { camera, size, pointer } = state;

    // Fit the panel to the empty right-column slot.
    const r = stage.getBoundingClientRect();
    screenToWorld(r.left + r.width / 2, r.top + r.height / 2, size, camera, center);
    screenToWorld(r.left, r.top + r.height / 2, size, camera, left);
    screenToWorld(r.right, r.top + r.height / 2, size, camera, right);
    const width = left.distanceTo(right) * 0.9;
    const exit = smooth(0.82, 1, p);
    pg.position.set(center.x + exit * 0.8, center.y + exit * 0.3, -exit * 1.6);
    pg.rotation.set(0.1 - pointer.y * 0.05, -0.26 + pointer.x * 0.08, 0.02);
    pg.scale.set(width, width * (9 / 16), 1);
    pg.updateMatrixWorld();

    if (face.current) (face.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * vis;
    if (frame.current) (frame.current.material as THREE.LineBasicMaterial).opacity = 0.85 * vis;

    // Scan beam sweeps top → bottom.
    const sweep = smooth(0.08, 0.42, p);
    if (beam.current) {
      beam.current.position.y = 0.5 - sweep;
      beam.current.visible = p > 0.06 && p < 0.46;
      (beam.current.material as THREE.MeshBasicMaterial).opacity = vis;
    }

    // Bounding boxes snap on with a small overshoot.
    boxes.current.forEach((box, i) => {
      if (!box) return;
      const a = THREE.MathUtils.clamp((p - (0.24 + i * 0.06)) / 0.04, 0, 1);
      box.scale.set(BOX.w * (1.3 - 0.3 * backOut(a)), BOX.h * (1.3 - 0.3 * backOut(a)), 1);
      box.visible = a > 0;
      (box.material as THREE.LineBasicMaterial).opacity = a * vis;
    });

    // Name tags lift off the panel and fly into the HTML table rows.
    const rows = document.querySelectorAll<HTMLElement>("[data-ocr-row]");
    normal.set(0, 0, 1).transformDirection(pg.matrixWorld);
    tags.current.forEach((tag, i) => {
      if (!tag) return;
      const lift = smooth(0.46 + i * 0.05, 0.52 + i * 0.05, p);
      const fly = smooth(0.52 + i * 0.05, 0.68 + i * 0.05, p);
      start.set(FEED[i].u, FEED[i].v, 0);
      pg.localToWorld(start);
      start.addScaledVector(normal, 0.55 * lift);
      const row = rows[i]?.getBoundingClientRect();
      if (row) screenToWorld(row.left + 60, row.top + row.height / 2, size, camera, target);
      else target.copy(start);
      tag.position.lerpVectors(start, target, fly);
      tag.position.y += Math.sin(Math.PI * fly) * 0.35;
      tag.scale.set(width * 0.16, width * 0.035, 1);
      tag.quaternion.copy(pg.quaternion).slerp(camera.quaternion, fly);
      const shown = lift > 0 ? (1 - smooth(0.88, 1, fly)) * vis : 0;
      tag.visible = shown > 0.01;
      (tag.material as THREE.MeshBasicMaterial).opacity = shown;

      const el = labelRegistry.get(`ocr-tag-${i}`);
      if (!el) return;
      proj.copy(tag.position).project(camera);
      el.style.display = shown > 0.01 ? "" : "none";
      el.style.opacity = String(shown);
      el.style.transform = `translate3d(${((proj.x * 0.5 + 0.5) * size.width).toFixed(1)}px, ${((-proj.y * 0.5 + 0.5) * size.height).toFixed(1)}px, 0) translate(-50%, -50%)`;
    });
  });

  return (
    <group ref={root} visible={false}>
      <group ref={panel}>
        <mesh ref={face} geometry={assets.plane} material={assets.faceMat} />
        <lineSegments ref={frame} geometry={assets.outline} material={assets.frameMat} />
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
      {FEED.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            tags.current[i] = el;
          }}
          geometry={assets.tagGeo}
          material={assets.tagMats[i]}
        />
      ))}
    </group>
  );
}
