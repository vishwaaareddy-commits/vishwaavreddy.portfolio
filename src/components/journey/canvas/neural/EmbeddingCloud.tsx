"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { randn, rng } from "@/lib/mlp";
import { chapterProgress, chapterVisibility, labelRegistry, useJourney, type Tier } from "@/store/journey";
import { fitToStage } from "../stage";
import { CYAN, VIOLET } from "./NetworkMesh";

const CHAPTER = 2;
const CONTENT = { w: 2.8, h: 2.3 };
/** Cluster centres (local units), in the order of the chapters that follow. */
const CENTROIDS: [number, number, number][] = [
  [-0.62, 0.48, 0.1],
  [0.66, 0.5, -0.2],
  [-0.58, -0.5, -0.15],
  [0.62, -0.46, 0.22],
];
const COLORS = [CYAN, VIOLET, new THREE.Color("#d8f8ff"), new THREE.Color("#5aa8ff")];

const vert = /* glsl */ `
  attribute vec3 aCluster;
  attribute vec3 aColor;
  attribute float aSeed;
  uniform float uMorph;
  uniform float uTime;
  uniform float uPx;
  uniform float uFlash;
  varying vec3 vColor;
  varying float vBright;
  void main() {
    // Each point leaves the noise at its own moment, like t-SNE iterations.
    float m = smoothstep(aSeed * 0.5, aSeed * 0.5 + 0.5, uMorph);
    vec3 drift = 0.035 * vec3(sin(uTime * 0.7 + aSeed * 40.0), cos(uTime * 0.6 + aSeed * 23.0), sin(uTime * 0.5 + aSeed * 11.0));
    vec3 from = position + drift;
    vec3 dir = aCluster - from;
    // Curve the path sideways so points swirl in rather than slide.
    vec3 side = normalize(cross(dir + vec3(1e-4), vec3(0.0, 0.0, 1.0)));
    vec3 p = mix(from, aCluster + drift * 0.3, m) + side * sin(m * 3.14159) * 0.18 * length(dir);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // Points the tokens fly into flash as they are absorbed.
    float core = 1.0 - smoothstep(0.0, 0.6, length(position));
    vBright = 0.7 + 0.9 * m + uFlash * core * 1.5;
    vColor = mix(vec3(0.45, 0.6, 0.66), aColor, m);
    gl_PointSize = uPx * (6.0 / -mv.z) * (0.8 + 0.4 * fract(aSeed * 13.7));
  }
`;

const frag = /* glsl */ `
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vBright;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.1, d) * uAlpha;
    gl_FragColor = vec4(vColor * vBright * a, a);
  }
`;

const world = new THREE.Vector3();

/**
 * Chapter 02: ~2,000 points that start as random noise and settle into four
 * labelled clusters as the chapter scrubs. Fitted to the "embeddings" stage;
 * labels are hidden whenever they would leave it.
 */
export function EmbeddingCloud({ tier }: { tier: Tier }) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const points = useRef<THREE.Points>(null);
  const widths = useRef(new Map<string, number>());

  const { geometry, material } = useMemo(() => {
    const count = tier === "low" ? 1000 : 2000;
    const rand = rng(404);
    const noise = new Float32Array(count * 3);
    const cluster = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      // Noise: uniform inside an ellipsoid.
      const u = Math.cbrt(rand());
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      noise.set([1.25 * u * Math.sin(ph) * Math.cos(th), 1.0 * u * Math.sin(ph) * Math.sin(th), 0.7 * u * Math.cos(ph)], i * 3);
      const c = i % CENTROIDS.length;
      const [cx, cy, cz] = CENTROIDS[c];
      cluster.set([cx + randn(rand) * 0.17, cy + randn(rand) * 0.12, cz + randn(rand) * 0.14], i * 3);
      color.set([COLORS[c].r, COLORS[c].g, COLORS[c].b], i * 3);
      seed[i] = rand();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(noise, 3));
    geo.setAttribute("aCluster", new THREE.BufferAttribute(cluster, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uMorph: { value: 0 },
        uTime: { value: 0 },
        uPx: { value: 3 },
        uFlash: { value: 0 },
        uAlpha: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      toneMapped: false,
    });
    return { geometry: geo, material: mat };
  }, [tier]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ camera, size, clock, viewport }) => {
    const g = outer.current;
    if (!g) return;
    const { t } = useJourney.getState();
    let vis = chapterVisibility(t, CHAPTER, 0.06, 0.12);
    const fit = vis > 0 ? fitToStage("embeddings", g, camera as THREE.PerspectiveCamera, size, CONTENT.w, CONTENT.h) : null;
    vis = fit?.visible ? vis : 0;
    g.visible = vis > 0;
    const hideLabels = () => {
      for (let i = 0; i < CENTROIDS.length; i += 1) {
        const el = labelRegistry.get(`emb-${i}`);
        if (el) el.style.display = "none";
      }
    };
    if (!g.visible || !fit?.rect) return hideLabels();

    const p = chapterProgress(t, CHAPTER);
    const time = clock.elapsedTime;
    if (inner.current) inner.current.rotation.y = Math.sin(time * 0.18) * 0.35;
    // Reached through the ref: uniforms are mutated every frame.
    const mat = points.current?.material as THREE.ShaderMaterial | undefined;
    if (!mat) return;
    const u = mat.uniforms;
    u.uTime.value = time;
    u.uMorph.value = THREE.MathUtils.smoothstep(p, 0.42, 0.86);
    // Tokens arrive over p 0.31–0.51 (see WorkIntroChapter).
    u.uFlash.value = Math.max(0, 1 - Math.abs(p - 0.46) / 0.1);
    u.uAlpha.value = vis * (0.35 + 0.65 * THREE.MathUtils.smoothstep(p, 0.05, 0.4));
    u.uPx.value = 3.4 * viewport.dpr * (size.width < 768 ? 0.8 : 1);

    // Cluster names, centred above each centroid and kept inside the stage.
    const shown = THREE.MathUtils.smoothstep(p, 0.74, 0.86) * vis;
    const r = fit.rect;
    inner.current?.updateMatrixWorld();
    CENTROIDS.forEach((c, i) => {
      const el = labelRegistry.get(`emb-${i}`);
      if (!el || !inner.current) return;
      world.set(c[0], c[1] + 0.34, c[2]);
      inner.current.localToWorld(world);
      world.project(camera);
      const x = (world.x * 0.5 + 0.5) * size.width;
      const y = (-world.y * 0.5 + 0.5) * size.height;
      let w = widths.current.get(el.textContent ?? "");
      if (!w) {
        el.style.display = "";
        w = el.offsetWidth;
        widths.current.set(el.textContent ?? "", w);
      }
      const inside = x - w / 2 >= r.left && x + w / 2 <= r.right && y - 12 >= r.top && y + 12 <= r.bottom;
      el.style.display = inside && shown > 0.01 ? "" : "none";
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = String(shown);
    });
  });

  return (
    <group ref={outer}>
      <group ref={inner}>
        <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
      </group>
    </group>
  );
}
