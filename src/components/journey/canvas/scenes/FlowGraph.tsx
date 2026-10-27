"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { chapterProgress, labelRegistry, useJourney } from "@/store/journey";
import { CYAN, HOT } from "../neural/NetworkMesh";
import { fitToStage, hideLabels, placeLabel, stageFade } from "../stage";

export const DANGER = new THREE.Color("#f26b6b");

export interface FlowNode {
  id: string;
  pos: [number, number];
  /** Chapter progress at which the node activates (glow + ring). */
  on: number;
  /** Turns red on activation (critical finding). */
  alert?: boolean;
  /** Bigger hub node. */
  hub?: boolean;
}

export interface FlowEdge {
  a: number;
  b: number;
  /** Progress window over which the signal travels a → b. */
  from: number;
  to: number;
  /** 0 plain, 1 waveform packet, 2 continuous voice waveform, 3 red pulse. */
  kind?: 0 | 1 | 2 | 3;
}

export interface FlowGraphProps {
  chapter: number;
  stage: string;
  /** Label registry prefix; labels are keyed `${prefix}${node.id}`. */
  prefix: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  content: { w: number; h: number };
  /** Small "agents" that walk this node path over [from, to] (QA chapter). */
  agents?: { path: number[]; from: number; to: number; count: number };
}

const edgeVert = /* glsl */ `
  attribute vec3 aA;
  attribute vec3 aB;
  attribute vec2 aWindow;
  attribute float aKind;
  uniform float uP;
  uniform float uTime;
  uniform float uWidth;
  varying float vT;
  varying float vSide;
  varying float vLit;
  varying float vKind;
  varying float vHead;
  void main() {
    float t = position.x;
    vec3 p = mix(aA, aB, t);
    vec2 dir = normalize((aB - aA).xy + 1e-5);
    vec2 n = vec2(-dir.y, dir.x);
    float lit = clamp((uP - aWindow.x) / max(1e-4, aWindow.y - aWindow.x), 0.0, 1.0);
    float off = 0.0;
    if (aKind > 0.5 && aKind < 1.5) {
      // A waveform packet riding the signal front.
      float e = (t - lit) * 7.0;
      float env = exp(-e * e) * step(0.001, lit) * (1.0 - step(0.999, lit));
      off = sin(t * 70.0 - uTime * 9.0) * 0.07 * env;
    } else if (aKind > 1.5 && aKind < 2.5) {
      // Voice: a continuous, amplitude-modulated waveform once the branch is live.
      off = sin(t * 95.0 - uTime * 14.0) * 0.055 * (0.55 + 0.45 * sin(uTime * 3.1 + t * 9.0)) * step(0.001, lit) * step(t, lit);
    }
    p.xy += n * (position.y * uWidth + off);
    vT = t;
    vSide = position.y;
    vLit = lit;
    vKind = aKind;
    // Squared by hand: pow() with a negative base is undefined in GLSL.
    float h = (t - lit) * 12.0;
    vHead = exp(-h * h) * step(0.001, lit) * (1.0 - step(0.999, lit));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const edgeFrag = /* glsl */ `
  uniform vec3 uCyan;
  uniform vec3 uHot;
  uniform vec3 uDanger;
  uniform float uAlpha;
  varying float vT;
  varying float vSide;
  varying float vLit;
  varying float vKind;
  varying float vHead;
  void main() {
    vec3 tint = vKind > 2.5 ? uDanger : uCyan;
    float done = step(vT, vLit);
    // Idle edges are clearly drawn; the signal brightens them.
    float a = (0.28 + 0.5 * done + 1.2 * vHead) * (1.0 - vSide * vSide) * uAlpha;
    vec3 color = tint * (0.5 + 0.8 * done) + uHot * vHead * 1.4;
    gl_FragColor = vec4(color * a, a);
  }
`;
const nodeVert = /* glsl */ `
  attribute float aOn;
  attribute float aAlert;
  attribute float aRing;
  uniform float uP;
  varying float vOn;
  varying float vAge;
  varying float vAlert;
  varying vec2 vLocal;
  varying float vRing;
  void main() {
    vOn = smoothstep(aOn - 0.01, aOn + 0.02, uP);
    vAge = max(0.0, uP - aOn);
    vAlert = aAlert;
    vRing = aRing;
    vLocal = position.xy;
    // Rings expand after activation; discs stay put.
    float s = aRing > 0.5 ? 1.0 + vAge * 22.0 : 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position * s, 1.0);
  }
`;
const nodeFrag = /* glsl */ `
  uniform vec3 uCyan;
  uniform vec3 uHot;
  uniform vec3 uDanger;
  uniform float uAlpha;
  varying float vOn;
  varying float vAge;
  varying float vAlert;
  varying vec2 vLocal;
  varying float vRing;
  void main() {
    float d = length(vLocal);
    vec3 tint = vAlert > 0.5 && vOn > 0.5 ? uDanger : uCyan;
    if (vRing > 0.5) {
      float ring = smoothstep(0.42, 0.47, d) * (1.0 - smoothstep(0.47, 0.5, d));
      float a = ring * vOn * (1.0 - smoothstep(0.0, 0.08, vAge)) * uAlpha;
      gl_FragColor = vec4(tint * 1.6 * a, a);
      return;
    }
    if (d > 0.5) discard;
    float core = 1.0 - smoothstep(0.0, 0.5, d);
    float rim = smoothstep(0.36, 0.48, d) * (1.0 - smoothstep(0.48, 0.5, d));
    float a = (0.25 * rim + vOn * core) * uAlpha + rim * 0.5 * uAlpha;
    vec3 color = tint * (0.4 + 1.1 * vOn * core) + uHot * pow(core, 3.0) * vOn * 0.9;
    gl_FragColor = vec4(color * a, a);
  }
`;

const local = new THREE.Vector3();

/**
 * A small signal graph fitted to a stage: edges are ribbons whose lit
 * front, waveform and pulse are computed in the shader from the chapter's
 * progress; nodes glow and throw a ring when the signal reaches them.
 * Used by chapters 05 (QA graph) and 06 (automation chain).
 */
export function FlowGraph({ chapter, stage, prefix, nodes, edges, content, agents }: FlowGraphProps) {
  const outer = useRef<THREE.Group>(null);
  const group = useRef<THREE.Group>(null);
  const edgeMesh = useRef<THREE.Mesh>(null);
  const nodeMesh = useRef<THREE.InstancedMesh>(null);
  const agentMesh = useRef<THREE.InstancedMesh>(null);

  const built = useMemo(() => {
    const uniforms = {
      uP: { value: 0 },
      uTime: { value: 0 },
      uWidth: { value: 0.014 },
      uAlpha: { value: 0 },
      uCyan: { value: CYAN },
      uHot: { value: HOT },
      uDanger: { value: DANGER },
    };
    // Edges: one instanced ribbon with 24 segments so waveforms bend smoothly.
    const SEG = 24;
    const ribbon = new THREE.InstancedBufferGeometry();
    const pos: number[] = [];
    const index: number[] = [];
    for (let s = 0; s <= SEG; s += 1) {
      pos.push(s / SEG, -1, 0, s / SEG, 1, 0);
      if (s < SEG) index.push(s * 2, s * 2 + 1, s * 2 + 2, s * 2 + 2, s * 2 + 1, s * 2 + 3);
    }
    ribbon.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    ribbon.setIndex(index);
    const at = (i: number) => [nodes[i].pos[0], nodes[i].pos[1], 0];
    ribbon.setAttribute("aA", new THREE.InstancedBufferAttribute(Float32Array.from(edges.flatMap((e) => at(e.a))), 3));
    ribbon.setAttribute("aB", new THREE.InstancedBufferAttribute(Float32Array.from(edges.flatMap((e) => at(e.b))), 3));
    ribbon.setAttribute("aWindow", new THREE.InstancedBufferAttribute(Float32Array.from(edges.flatMap((e) => [e.from, e.to])), 2));
    ribbon.setAttribute("aKind", new THREE.InstancedBufferAttribute(Float32Array.from(edges.map((e) => e.kind ?? 0)), 1));
    ribbon.instanceCount = edges.length;
    const edgeMat = new THREE.ShaderMaterial({
      vertexShader: edgeVert,
      fragmentShader: edgeFrag,
      uniforms,
      transparent: true,
      depthWrite: false,
      // The ribbon's winding is clockwise; draw both faces rather than rely on it.
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      toneMapped: false,
    });
    // Nodes: a disc and a ring per node, in one instanced mesh.
    const quad = new THREE.PlaneGeometry(1, 1);
    const n = nodes.length;
    quad.setAttribute("aOn", new THREE.InstancedBufferAttribute(Float32Array.from([...nodes, ...nodes].map((x) => x.on)), 1));
    quad.setAttribute("aAlert", new THREE.InstancedBufferAttribute(Float32Array.from([...nodes, ...nodes].map((x) => (x.alert ? 1 : 0))), 1));
    quad.setAttribute("aRing", new THREE.InstancedBufferAttribute(Float32Array.from([...nodes, ...nodes].map((_, i) => (i >= n ? 1 : 0))), 1));
    const nodeMat = new THREE.ShaderMaterial({
      vertexShader: nodeVert,
      fragmentShader: nodeFrag,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      toneMapped: false,
    });
    const agentGeo = new THREE.CircleGeometry(0.045, 16);
    const agentMat = new THREE.MeshBasicMaterial({ color: HOT.clone().multiplyScalar(1.8), transparent: true, opacity: 0, toneMapped: false });
    return { ribbon, edgeMat, quad, nodeMat, agentGeo, agentMat, uniforms };
  }, [nodes, edges]);

  useEffect(() => {
    const mesh = nodeMesh.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    [...nodes, ...nodes].forEach((node, i) => {
      const s = node.hub ? 0.3 : 0.2;
      mesh.setMatrixAt(i, m.makeScale(s, s, 1).setPosition(node.pos[0], node.pos[1], 0.01));
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [nodes]);

  useEffect(
    () => () => {
      [built.ribbon, built.quad, built.agentGeo].forEach((g) => g.dispose());
      [built.edgeMat, built.nodeMat, built.agentMat].forEach((m) => m.dispose());
    },
    [built],
  );

  const agentMatrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame(({ camera, size, clock }) => {
    const o = outer.current;
    const g = group.current;
    if (!o || !g) return;
    const { t } = useJourney.getState();
    const fit = fitToStage(stage, o, camera as THREE.PerspectiveCamera, size, content.w, content.h);
    const vis = stageFade(fit, size);
    o.visible = vis > 0;
    if (!o.visible) return hideLabels(labelRegistry, prefix);
    const p = chapterProgress(t, chapter);
    g.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.1;
    g.updateMatrixWorld();
    // Uniforms are shared by edge and node materials, reached through the edge mesh.
    const mat = edgeMesh.current?.material as THREE.ShaderMaterial | undefined;
    if (mat) {
      mat.uniforms.uP.value = p;
      mat.uniforms.uTime.value = clock.elapsedTime;
      mat.uniforms.uAlpha.value = vis;
    }

    if (agents && agentMesh.current) {
      const am = agentMesh.current;
      const legs = agents.path.length - 1;
      for (let k = 0; k < agents.count; k += 1) {
        // Agents walk the same tour, staggered; each leg is one edge.
        const u = THREE.MathUtils.clamp((p - agents.from) / (agents.to - agents.from) - k * 0.06, 0, 1) * legs;
        const leg = Math.min(legs - 1, Math.floor(u));
        const f = u - leg;
        const a = nodes[agents.path[leg]].pos;
        const b = nodes[agents.path[leg + 1]].pos;
        agentMatrix.makeTranslation(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 0.03);
        am.setMatrixAt(k, agentMatrix);
      }
      am.instanceMatrix.needsUpdate = true;
      const walking = p > agents.from && p < agents.to + 0.05;
      (am.material as THREE.MeshBasicMaterial).opacity = walking ? vis : 0;
    }

    nodes.forEach((node) =>
      placeLabel(
        labelRegistry.get(`${prefix}${node.id}`),
        g,
        local.set(node.pos[0], node.pos[1], 0),
        camera,
        size,
        fit.rect,
        vis * (0.55 + 0.45 * THREE.MathUtils.smoothstep(p, node.on - 0.02, node.on + 0.02)),
        node.hub ? 24 : 20,
      ),
    );
  });

  return (
    <group ref={outer} visible={false}>
      <group ref={group} position={[0, 0, 0]}>
        <mesh ref={edgeMesh} geometry={built.ribbon} material={built.edgeMat} frustumCulled={false} />
        <instancedMesh ref={nodeMesh} args={[built.quad, built.nodeMat, nodes.length * 2]} frustumCulled={false} />
        {agents ? <instancedMesh ref={agentMesh} args={[built.agentGeo, built.agentMat, agents.count]} frustumCulled={false} /> : null}
      </group>
    </group>
  );
}
