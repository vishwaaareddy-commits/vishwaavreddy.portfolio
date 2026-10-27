"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import * as THREE from "three";
import { MASK_GLSL, maskUniforms } from "../stage";
import type { Graph } from "./graph";

/** Palette: cyan activation, violet negative weights, white-hot peaks. */
export const CYAN = new THREE.Color("#3be3f5");
export const VIOLET = new THREE.Color("#8b6cff");
export const HOT = new THREE.Color("#f2fdff");

/** Per-network uniforms. Mask uniforms are shared objects across networks. */
function makeUniforms(count: number, opts: NetworkOptions) {
  const act = new THREE.DataTexture(new Float32Array(Math.max(1, count)), Math.max(1, count), 1, THREE.RedFormat, THREE.FloatType);
  act.needsUpdate = true;
  return {
    uAct: { value: act },
    uActCount: { value: Math.max(1, count) },
    uTime: { value: 0 },
    /** Seconds since ignition; neurons light from depth 0 → 1 over ~1s. */
    uIgnite: { value: 0 },
    /** Scroll wavefront position in depth units (0 input → 1 output). */
    uWave: { value: 0 },
    uAlpha: { value: 1 },
    /** View-space distance where fog starts and where it is total. */
    uFog: { value: new THREE.Vector2(opts.fogNear ?? 1000, opts.fogFar ?? 2000) },
    /** View distance range over which neurons right at the lens fade in (0,0 = off). */
    uNear: { value: new THREE.Vector2(...(opts.nearFade ?? [0, 0])) },
    /** Visibility left inside copy rects (1 = unmasked). */
    uMaskFloor: { value: opts.maskFloor ?? 1 },
    uRadius: { value: opts.radius ?? 0.08 },
    uWidth: { value: opts.width ?? 1.6 },
    uEdgeAlpha: { value: opts.edgeAlpha ?? 1 },
    uCyan: { value: CYAN },
    uViolet: { value: VIOLET },
    uHot: { value: HOT },
    ...maskUniforms,
  };
}

const COMMON = /* glsl */ `
  uniform sampler2D uAct;
  uniform float uActCount;
  uniform float uIgnite;
  uniform float uWave;
  float act(float index) {
    return texture2D(uAct, vec2((index + 0.5) / uActCount, 0.5)).r;
  }
  float ignite(float depth) {
    return smoothstep(depth * 0.75, depth * 0.75 + 0.25, uIgnite);
  }
  float wave(float depth) {
    float d = (depth - uWave) * 4.0;
    return exp(-d * d);
  }
`;

const FRAG_COMMON = /* glsl */ `
  uniform vec2 uFog;
  uniform vec2 uNear;
  uniform float uMaskFloor;
  uniform float uAlpha;
  ${MASK_GLSL}
  float fog(float viewZ) {
    // Far layers fade into the dark; anything right at the lens fades too.
    float near = uNear.y > 0.0 ? smoothstep(uNear.x, uNear.y, viewZ) : 1.0;
    return (1.0 - smoothstep(uFog.x, uFog.y, viewZ)) * near;
  }
`;

const neuronVert = /* glsl */ `
  attribute float aIndex;
  attribute float aDepth;
  uniform float uRadius;
  ${COMMON}
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vAct;
  varying float vIgnite;
  varying float vWave;
  varying float vViewZ;
  void main() {
    float a = act(aIndex);
    vAct = a;
    vIgnite = ignite(aDepth);
    vWave = wave(aDepth);
    float s = uRadius * (0.75 + 0.6 * abs(a) * vIgnite);
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position * s, 1.0);
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vView = normalize(-mv.xyz);
    vViewZ = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const neuronFrag = /* glsl */ `
  uniform vec3 uCyan;
  uniform vec3 uViolet;
  uniform vec3 uHot;
  ${FRAG_COMMON}
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vAct;
  varying float vIgnite;
  varying float vWave;
  varying float vViewZ;
  void main() {
    float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.0);
    float a = abs(vAct) * vIgnite;
    vec3 tint = vAct >= 0.0 ? uCyan : uViolet;
    // Dark glassy body, fresnel rim, emissive core that runs white-hot at peak.
    vec3 color = tint * (0.05 + 0.55 * fres) * (0.35 + 0.65 * vIgnite);
    color += tint * a * (0.9 + 0.8 * vWave);
    color += uHot * pow(a, 6.0) * 1.2;
    // Fade colour as well as alpha: emissive values run above 1 (HDR), so
    // alpha alone would leave hot neurons glowing through copy.
    float vis = fog(vViewZ) * copyMask(uMaskFloor) * uAlpha;
    float alpha = clamp(0.2 + 0.55 * fres + a, 0.0, 1.0) * vis;
    gl_FragColor = vec4(color * vis, alpha);
  }
`;

const edgeVert = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute float aWeight;
  attribute float aPhase;
  attribute float aSrc;
  attribute float aDst;
  attribute float aDepth;
  uniform float uWidth;
  uniform float uTime;
  uniform vec2 uViewport;
  ${COMMON}
  varying float vAlong;
  varying float vAcross;
  varying float vWeight;
  varying float vSrc;
  varying float vDst;
  varying float vGate;
  varying float vPhase;
  varying float vViewZ;
  void main() {
    vec4 a = projectionMatrix * modelViewMatrix * vec4(aStart, 1.0);
    vec4 b = projectionMatrix * modelViewMatrix * vec4(aEnd, 1.0);
    vec2 sa = a.xy / a.w;
    vec2 sb = b.xy / b.w;
    vec2 dir = (sb - sa) * uViewport;
    dir = length(dir) > 1e-4 ? normalize(dir) : vec2(1.0, 0.0);
    vec2 normal = vec2(-dir.y, dir.x);
    float t = position.x;
    vec4 clip = mix(a, b, t);
    // |w| sets the ribbon width in CSS pixels.
    float w = uWidth * (0.35 + 1.25 * abs(aWeight));
    clip.xy += normal * position.y * w / uViewport * 2.0 * clip.w;
    gl_Position = clip;
    vAlong = t;
    vAcross = position.y;
    vWeight = aWeight;
    vSrc = act(aSrc);
    vDst = act(aDst);
    vGate = ignite(aDepth) * (0.45 + 0.9 * wave(aDepth));
    vPhase = aPhase;
    vViewZ = -(modelViewMatrix * vec4(mix(aStart, aEnd, t), 1.0)).z;
  }
`;

const edgeFrag = /* glsl */ `
  uniform vec3 uCyan;
  uniform vec3 uViolet;
  uniform vec3 uHot;
  uniform float uTime;
  uniform float uEdgeAlpha;
  ${FRAG_COMMON}
  varying float vAlong;
  varying float vAcross;
  varying float vWeight;
  varying float vSrc;
  varying float vDst;
  varying float vGate;
  varying float vPhase;
  varying float vViewZ;
  void main() {
    float mag = abs(vWeight);
    vec3 tint = vWeight >= 0.0 ? uCyan : uViolet;
    // Signal carried by this edge: source activation through the weight.
    float signal = clamp(abs(vSrc) * mag, 0.0, 1.0);
    float body = (0.025 + 0.11 * mag) * (0.4 + 0.6 * vGate) + 0.14 * signal * vGate;
    // A pulse travels src → dst; its phase decides when this edge fires.
    float head = fract(uTime * 0.45 + vPhase);
    float d = (vAlong - head) * 9.0;
    float pulse = exp(-d * d) * signal * vGate;
    float across = 1.0 - vAcross * vAcross;
    vec3 color = tint * body + mix(tint, uHot, 0.6) * pulse * 2.2;
    float alpha = (body + pulse) * across * uEdgeAlpha;
    alpha *= fog(vViewZ) * copyMask(uMaskFloor) * uAlpha;
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

export interface NetworkOptions {
  radius?: number;
  /** Base ribbon width in CSS px. */
  width?: number;
  edgeAlpha?: number;
  fogNear?: number;
  fogFar?: number;
  /** Fade neurons this close to the camera (background field only). */
  nearFade?: [number, number];
  maskFloor?: number;
}

export type NetworkUniforms = ReturnType<typeof makeUniforms>;

export interface NetworkHandle {
  uniforms: NetworkUniforms;
  /** Activations by neuron index; call commitActivations() after writing. */
  activations: Float32Array;
  commitActivations: () => void;
  /** Normalised weights by edge; call commitWeights() after writing. */
  weights: Float32Array;
  commitWeights: () => void;
}

interface NetworkMeshProps extends NetworkOptions {
  graph: Graph;
  /** Initial normalised weights, one per edge. */
  initialWeights: Float32Array;
}

/**
 * Neurons (one InstancedMesh, fresnel spheres) and edges (one instanced
 * ribbon mesh) for a layered network. Animation lives in the shaders:
 * JS only writes activations (a 1-row float texture) and, when they
 * change, edge weights.
 */
export const NetworkMesh = forwardRef<NetworkHandle, NetworkMeshProps>(function NetworkMesh(
  { graph, initialWeights, ...opts },
  ref,
) {
  const built = useMemo(() => {
    const uniforms = makeUniforms(graph.count, opts);

    const sphere = new THREE.IcosahedronGeometry(1, 1);
    sphere.setAttribute("aIndex", new THREE.InstancedBufferAttribute(Float32Array.from({ length: graph.count }, (_, i) => i), 1));
    sphere.setAttribute("aDepth", new THREE.InstancedBufferAttribute(graph.depth, 1));
    const neuronMat = new THREE.ShaderMaterial({
      vertexShader: neuronVert,
      fragmentShader: neuronFrag,
      uniforms,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    const neurons = new THREE.InstancedMesh(sphere, neuronMat, graph.count);
    const m = new THREE.Matrix4();
    for (let i = 0; i < graph.count; i += 1) {
      m.makeTranslation(graph.positions[i * 3], graph.positions[i * 3 + 1], graph.positions[i * 3 + 2]);
      neurons.setMatrixAt(i, m);
    }
    neurons.frustumCulled = false;

    // Unit ribbon: x 0→1 along the edge, y −1→1 across it.
    const ribbon = new THREE.InstancedBufferGeometry();
    ribbon.setAttribute("position", new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0], 3));
    ribbon.setIndex([0, 1, 2, 2, 1, 3]);
    const E = graph.edgeCount;
    const start = new Float32Array(E * 3);
    const end = new Float32Array(E * 3);
    const depth = new Float32Array(E);
    for (let e = 0; e < E; e += 1) {
      const s = graph.edgeSrc[e];
      const d = graph.edgeDst[e];
      start.set(graph.positions.subarray(s * 3, s * 3 + 3), e * 3);
      end.set(graph.positions.subarray(d * 3, d * 3 + 3), e * 3);
      depth[e] = graph.depth[s];
    }
    const weights = Float32Array.from(initialWeights);
    const weightAttr = new THREE.InstancedBufferAttribute(weights, 1);
    weightAttr.setUsage(THREE.DynamicDrawUsage);
    ribbon.setAttribute("aStart", new THREE.InstancedBufferAttribute(start, 3));
    ribbon.setAttribute("aEnd", new THREE.InstancedBufferAttribute(end, 3));
    ribbon.setAttribute("aWeight", weightAttr);
    ribbon.setAttribute("aPhase", new THREE.InstancedBufferAttribute(graph.edgePhase, 1));
    ribbon.setAttribute("aSrc", new THREE.InstancedBufferAttribute(graph.edgeSrc, 1));
    ribbon.setAttribute("aDst", new THREE.InstancedBufferAttribute(graph.edgeDst, 1));
    ribbon.setAttribute("aDepth", new THREE.InstancedBufferAttribute(depth, 1));
    ribbon.instanceCount = E;
    const edgeMat = new THREE.ShaderMaterial({
      vertexShader: edgeVert,
      fragmentShader: edgeFrag,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      // Premultiplied additive: overlapping edges glow, never turn opaque.
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      toneMapped: false,
    });
    const edges = new THREE.Mesh(ribbon, edgeMat);
    edges.frustumCulled = false;
    edges.renderOrder = -1;

    const activations = uniforms.uAct.value.image.data as Float32Array;
    const handle: NetworkHandle = {
      uniforms,
      activations,
      commitActivations: () => {
        uniforms.uAct.value.needsUpdate = true;
      },
      weights,
      commitWeights: () => {
        weightAttr.needsUpdate = true;
      },
    };
    return { neurons, edges, handle, sphere, ribbon, neuronMat, edgeMat };
    // Options are read once; a new graph rebuilds everything.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  useImperativeHandle(ref, () => built.handle, [built]);

  useEffect(
    () => () => {
      built.sphere.dispose();
      built.ribbon.dispose();
      built.neuronMat.dispose();
      built.edgeMat.dispose();
      built.handle.uniforms.uAct.value.dispose();
      built.neurons.dispose();
    },
    [built],
  );

  return (
    <>
      <primitive object={built.edges} />
      <primitive object={built.neurons} />
    </>
  );
});
