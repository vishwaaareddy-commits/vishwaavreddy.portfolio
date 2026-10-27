"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ATTENTION_TIMELINE as TL, HEADS, PROMPT_TOKENS, headMix, span } from "@/data/attention";
import { chapterProgress, chapterVisibility, labelRegistry, useJourney } from "@/store/journey";
import { CYAN, HOT, VIOLET } from "../neural/NetworkMesh";
import { fitToStage, hideLabels, placeLabel } from "../stage";

const CHAPTER = 3;
const CONTENT = { w: 6.4, h: 4.8 };
const TOKEN_Y = -1.55;
const tokenX = (i: number) => -2.5 + i;
/** Route nodes above the token row; the output rises from the last token into the SDK. */
const ROUTE_POS: [number, number, number][] = [
  [2.5, 1.25, 0],
  [0.85, 1.75, -0.2],
  [-0.85, 1.25, 0.1],
  [-2.5, 1.75, -0.1],
];
const HEAD_COLORS = [CYAN, VIOLET, new THREE.Color("#d8f8ff")];

const arcVert = /* glsl */ `
  attribute float aHead;
  attribute float aT;
  attribute float aSide;
  attribute float aWeight;
  attribute float aPhase;
  uniform vec3 uMix;
  varying float vT;
  varying float vSide;
  varying float vAlpha;
  varying float vHead;
  varying float vPhase;
  void main() {
    float mixW = aHead < 0.5 ? uMix.x : aHead < 1.5 ? uMix.y : uMix.z;
    vAlpha = mixW * (0.25 + 0.75 * aWeight);
    vT = aT;
    vSide = aSide;
    vHead = aHead;
    vPhase = aPhase;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const arcFrag = /* glsl */ `
  uniform float uTime;
  uniform float uAlpha;
  uniform vec3 uColors[3];
  uniform vec3 uHot;
  varying float vT;
  varying float vSide;
  varying float vAlpha;
  varying float vHead;
  varying float vPhase;
  void main() {
    vec3 tint = vHead < 0.5 ? uColors[0] : vHead < 1.5 ? uColors[1] : uColors[2];
    float across = 1.0 - vSide * vSide;
    // A pulse runs key → query along every arc.
    float head = fract(uTime * 0.5 + vPhase);
    float d = (vT - head) * 10.0;
    float pulse = exp(-d * d);
    float a = vAlpha * across * uAlpha;
    vec3 color = tint * (0.55 + 0.6 * a) + uHot * pulse * 0.9;
    gl_FragColor = vec4(color * a, a * (0.7 + 0.3 * pulse));
  }
`;

/** Ribbons for every arc of every head in one geometry (one draw call). */
function buildArcs() {
  const pos: number[] = [];
  const head: number[] = [];
  const t: number[] = [];
  const side: number[] = [];
  const weight: number[] = [];
  const phase: number[] = [];
  const index: number[] = [];
  const SEG = 28;
  HEADS.forEach((h, hi) =>
    h.arcs.forEach(([from, to, w], ai) => {
      const x0 = tokenX(from);
      const x1 = tokenX(to);
      const height = 0.3 + 0.32 * (to - from);
      const width = 0.012 + 0.05 * w;
      // Each head bows slightly in depth so the three sets read as separate layers.
      const depth = (hi - 1) * 0.35;
      const base = pos.length / 3;
      for (let s = 0; s <= SEG; s += 1) {
        const u = s / SEG;
        const x = x0 + (x1 - x0) * u;
        const y = TOKEN_Y + 0.14 + Math.sin(Math.PI * u) * height;
        const z = Math.sin(Math.PI * u) * depth;
        // Normal of the arc in its plane, for the ribbon width.
        const dx = x1 - x0;
        const dy = Math.cos(Math.PI * u) * Math.PI * height;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        for (const sd of [-1, 1]) {
          pos.push(x + nx * width * sd, y + ny * width * sd, z);
          head.push(hi);
          t.push(u);
          side.push(sd);
          weight.push(w);
          phase.push((ai * 0.37 + hi * 0.21) % 1);
        }
        if (s < SEG) {
          const k = base + s * 2;
          index.push(k, k + 1, k + 2, k + 2, k + 1, k + 3);
        }
      }
    }),
  );
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aHead", new THREE.Float32BufferAttribute(head, 1));
  g.setAttribute("aT", new THREE.Float32BufferAttribute(t, 1));
  g.setAttribute("aSide", new THREE.Float32BufferAttribute(side, 1));
  g.setAttribute("aWeight", new THREE.Float32BufferAttribute(weight, 1));
  g.setAttribute("aPhase", new THREE.Float32BufferAttribute(phase, 1));
  g.setIndex(index);
  return g;
}

function link(a: THREE.Vector3, b: THREE.Vector3) {
  const dx = (b.x - a.x) * 0.5;
  return new THREE.CubicBezierCurve3(a, a.clone().add(new THREE.Vector3(dx, 0, 0)), b.clone().sub(new THREE.Vector3(dx, 0, 0)), b);
}

const scratch = new THREE.Vector3();
const local = new THREE.Vector3();
const smooth = (x: number) => THREE.MathUtils.smoothstep(x, 0, 1);

/**
 * Chapter 03 stage: the prompt's tokens in a row, illustrative attention arcs
 * for three heads (scrubbed one after another), then the output vector rises
 * into the SDK and is routed through the gateway to Gemini, and streamed
 * chunks come back. Labels are HTML kept inside the stage.
 */
export function AttentionScene() {
  const stage = useRef<THREE.Group>(null);
  const group = useRef<THREE.Group>(null);
  const arcs = useRef<THREE.Mesh>(null);
  const tokens = useRef<THREE.InstancedMesh>(null);
  const routeMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const nodes = useRef<THREE.InstancedMesh>(null);
  const packet = useRef<THREE.Mesh>(null);
  const chunks = useRef<(THREE.Mesh | null)[]>([]);

  const built = useMemo(() => {
    const route = ROUTE_POS.map((p) => new THREE.Vector3(...p));
    const start = new THREE.Vector3(tokenX(PROMPT_TOKENS.length - 1), TOKEN_Y + 0.1, 0);
    // Output vector: from the last token up into the SDK, then along the route.
    const curves = [new THREE.LineCurve3(start, route[0]), ...route.slice(0, -1).map((p, i) => link(p, route[i + 1]))];
    const path = new THREE.CurvePath<THREE.Vector3>();
    curves.forEach((c) => path.add(c));
    return {
      path,
      tubes: curves.map((c) => new THREE.TubeGeometry(c, 40, 0.02, 6, false)),
      arcGeo: buildArcs(),
      arcMat: new THREE.ShaderMaterial({
        vertexShader: arcVert,
        fragmentShader: arcFrag,
        uniforms: {
          uMix: { value: new THREE.Vector3() },
          uTime: { value: 0 },
          uAlpha: { value: 0 },
          uColors: { value: HEAD_COLORS },
          uHot: { value: HOT },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        toneMapped: false,
      }),
      dot: new THREE.SphereGeometry(0.09, 16, 12),
      node: new THREE.OctahedronGeometry(0.15, 0),
      packetGeo: new THREE.SphereGeometry(0.08, 16, 12),
      chunkGeo: new THREE.BoxGeometry(0.14, 0.045, 0.045),
      tokenMat: new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(1.3), transparent: true, opacity: 0, toneMapped: false }),
      nodeMat: new THREE.MeshBasicMaterial({ color: CYAN.clone(), transparent: true, opacity: 0, toneMapped: false }),
      routeMat: new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(1.2), transparent: true, opacity: 0, toneMapped: false }),
      glowMat: new THREE.MeshBasicMaterial({ color: HOT.clone().multiplyScalar(2.2), transparent: true, opacity: 0, toneMapped: false }),
    };
  }, []);

  useEffect(
    () => () => {
      [...built.tubes, built.arcGeo, built.dot, built.node, built.packetGeo, built.chunkGeo].forEach((g) => g.dispose());
      [built.arcMat, built.tokenMat, built.nodeMat, built.routeMat, built.glowMat].forEach((m) => m.dispose());
    },
    [built],
  );

  // Static instance layout for token dots and route nodes.
  useEffect(() => {
    const m = new THREE.Matrix4();
    PROMPT_TOKENS.forEach((_, i) => tokens.current?.setMatrixAt(i, m.makeTranslation(tokenX(i), TOKEN_Y, 0)));
    ROUTE_POS.forEach((p, i) => nodes.current?.setMatrixAt(i, m.makeTranslation(...p)));
    if (tokens.current) tokens.current.instanceMatrix.needsUpdate = true;
    if (nodes.current) nodes.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ camera, size, clock }) => {
    const outer = stage.current;
    const g = group.current;
    if (!outer || !g) return;
    const { t } = useJourney.getState();
    let vis = chapterVisibility(t, CHAPTER, 0.06, 0.12);
    const fit = vis > 0 ? fitToStage("attention", outer, camera as THREE.PerspectiveCamera, size, CONTENT.w, CONTENT.h) : null;
    vis = fit?.visible ? vis * fit.opacity : 0;
    outer.visible = vis > 0;
    if (!outer.visible || !fit) return hideLabels(labelRegistry, "att-");
    const p = chapterProgress(t, CHAPTER);
    const time = clock.elapsedTime;
    g.rotation.y = Math.sin(time * 0.2) * 0.12;
    g.updateMatrixWorld();

    // Materials are reached through refs: they are mutated every frame.
    const tokensIn = span(p, TL.tokensIn);
    if (tokens.current) (tokens.current.material as THREE.MeshBasicMaterial).opacity = vis * tokensIn;
    const mix = headMix(p);
    const arcMat = arcs.current?.material as THREE.ShaderMaterial | undefined;
    if (arcMat) {
      arcMat.uniforms.uMix.value.set(...mix);
      arcMat.uniforms.uTime.value = time;
      arcMat.uniforms.uAlpha.value = vis;
    }

    // Route grows segment by segment, then the packet travels it.
    const route = span(p, TL.route);
    const count = routeMeshes.current.length;
    routeMeshes.current.forEach((mesh, i) => {
      if (!mesh) return;
      const k = THREE.MathUtils.clamp(route * count - i, 0, 1);
      mesh.geometry.setDrawRange(0, Math.floor((mesh.geometry.index?.count ?? 0) * k));
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.9 * vis;
    });
    if (nodes.current) {
      (nodes.current.material as THREE.MeshBasicMaterial).opacity = vis * smooth(span(p, [TL.route[0] - 0.08, TL.route[0]]));
    }
    const glow = packet.current;
    if (glow) {
      const travel = span(p, [TL.route[0] + 0.02, TL.route[1]]);
      built.path.getPointAt(smooth(travel), scratch);
      glow.position.copy(scratch);
      glow.visible = travel > 0 && travel < 1;
      (glow.material as THREE.MeshBasicMaterial).opacity = vis;
    }
    const stream = span(p, TL.stream);
    chunks.current.forEach((chunk, i) => {
      if (!chunk) return;
      const back = THREE.MathUtils.clamp(stream * 1.6 - i * 0.12, 0, 1);
      // Chunks return Gemini → SDK along the route (the last part of the path).
      const u = 1 - back * (1 - 1 / built.path.curves.length);
      built.path.getPointAt(u, scratch);
      chunk.position.copy(scratch);
      chunk.visible = back > 0 && back < 1;
    });

    // Labels: tokens under their dots, route names under their nodes, the active head on top.
    const rect = fit.rect;
    PROMPT_TOKENS.forEach((_, i) =>
      placeLabel(labelRegistry.get(`att-tok-${i}`), g, local.set(tokenX(i), TOKEN_Y, 0), camera, size, rect, vis * tokensIn, 22),
    );
    const nodeShown = vis * smooth(span(p, [TL.route[0] - 0.06, TL.route[0] + 0.04]));
    ROUTE_POS.forEach((pos, i) =>
      placeLabel(labelRegistry.get(`att-node-${i}`), g, local.set(...pos), camera, size, rect, nodeShown, -22),
    );
    const active = mix.indexOf(Math.max(...mix));
    const headEl = labelRegistry.get("att-head");
    if (headEl) {
      const shown = Math.max(...mix) * vis;
      headEl.style.opacity = String(shown);
      const text = `head ${active + 1}/3 · ${HEADS[active].name}`;
      if (headEl.textContent !== text) headEl.textContent = text;
    }
  });

  return (
    <group ref={stage} visible={false}>
      <group ref={group}>
        <mesh ref={arcs} geometry={built.arcGeo} material={built.arcMat} frustumCulled={false} />
        <instancedMesh ref={tokens} args={[built.dot, built.tokenMat, PROMPT_TOKENS.length]} />
        <instancedMesh ref={nodes} args={[built.node, built.nodeMat, ROUTE_POS.length]} />
        {built.tubes.map((geo, i) => (
          <mesh
            key={i}
            ref={(m) => {
              routeMeshes.current[i] = m;
            }}
            geometry={geo}
            material={built.routeMat}
          />
        ))}
        <mesh ref={packet} geometry={built.packetGeo} material={built.glowMat} visible={false} />
        {Array.from({ length: 6 }, (_, i) => (
          <mesh
            key={i}
            ref={(m) => {
              chunks.current[i] = m;
            }}
            geometry={built.chunkGeo}
            material={built.glowMat}
            visible={false}
          />
        ))}
      </group>
    </group>
  );
}
