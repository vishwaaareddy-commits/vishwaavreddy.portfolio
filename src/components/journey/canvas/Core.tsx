"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useJourney } from "@/store/journey";
import { DESKTOP_KEYS, MOBILE_KEYS, TEXT_HEAVY, finaleAnchor, sampleCore, type CorePose } from "./keyframes";
import { screenToWorld } from "./screen";

const ACCENT = new THREE.Color("#3be3f5");

// Fresnel shell: dark faceted body whose rim glows cyan; brightens on ignition.
const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uDeep;
  uniform float uIgnite;
  uniform float uAlpha;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
    float facet = 0.3 + 0.7 * max(dot(vNormal, normalize(vec3(0.4, 0.8, 0.6))), 0.0);
    // Dark glassy body; the glow lives on the rim, not across every facet.
    vec3 color = uDeep * facet + uColor * pow(fresnel, 1.6) * (0.25 + 1.1 * uIgnite);
    gl_FragColor = vec4(color, (0.28 + 0.6 * fresnel) * uAlpha);
  }
`;

const pos = new THREE.Vector3();
const travel = new THREE.Vector3();
const edge = new THREE.Vector3();
const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/**
 * Chapters 04–11: the Core keeps travelling in the empty right margin between
 * the content column (.shell) and the frame, zig-zagging with scroll. Where
 * there is no margin (tablet, phone) it rides dim in the corner instead.
 */
function travelPose(
  t: number,
  size: { width: number; height: number },
  camera: THREE.Camera,
  out: THREE.Vector3,
): CorePose {
  const W = size.width;
  const H = size.height;
  const frameRight = W - (W >= 768 ? 18 : 10);
  const padRight = W >= 1536 ? 32 : W >= 768 ? 40 : 24;
  const shell = Math.min(W, 1280);
  const shellRight = (W - shell) / 2 + shell - padRight;
  const margin = frameRight - shellRight;
  const chapter = Math.min(11, Math.max(4, Math.floor(t)));
  const local = Math.min(1, Math.max(0, t - chapter));
  const y = H * (0.3 + 0.42 * (chapter % 2 === 0 ? local : 1 - local));

  if (margin >= 84) {
    const x = shellRight + margin / 2;
    screenToWorld(x, y, size, camera, out);
    screenToWorld(shellRight, y, size, camera, edge);
    // Keep the crystal (radius 1 at scale 1) inside 80% of the margin.
    const fit = (out.distanceTo(edge) * 0.8) / 1;
    const heavy = TEXT_HEAVY.has(chapter);
    return { scale: Math.min(heavy ? 0.3 : 0.38, fit), alpha: heavy ? 0.5 : 0.8 };
  }
  screenToWorld(W - 44, H * 0.86, size, camera, out);
  return { scale: 0.16, alpha: 0.12 };
}

/** The persistent Core: a faceted crystal with an emissive heart. */
export function Core({ mobile, still }: { mobile: boolean; still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const heart = useRef<THREE.Mesh>(null);
  const shellMesh = useRef<THREE.Mesh>(null);
  const edgeLines = useRef<THREE.LineSegments>(null);
  const ignite = useRef(0);

  const { shell, edges, heartGeo, shellMat, edgeMat, heartMat } = useMemo(() => {
    // Icosahedron detail 0 is non-indexed, so vertex normals come out flat: crisp facets.
    const shellGeo = new THREE.IcosahedronGeometry(1, 0);
    shellGeo.computeVertexNormals();
    return {
      shell: shellGeo,
      edges: new THREE.EdgesGeometry(shellGeo),
      heartGeo: new THREE.IcosahedronGeometry(0.3, 1),
      shellMat: new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColor: { value: ACCENT.clone() },
          uDeep: { value: new THREE.Color("#0a161d") },
          uIgnite: { value: 0 },
          uAlpha: { value: 1 },
        },
      }),
      edgeMat: new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.2, toneMapped: false }),
      heartMat: new THREE.MeshBasicMaterial({ color: ACCENT.clone(), transparent: true, toneMapped: false }),
    };
  }, []);

  useEffect(
    () => () => {
      [shell, edges, heartGeo].forEach((g) => g.dispose());
      [shellMat, edgeMat, heartMat].forEach((m) => m.dispose());
    },
    [shell, edges, heartGeo, shellMat, edgeMat, heartMat],
  );

  useFrame(({ clock, size, camera }, dt) => {
    const { t, ignited, finale } = useJourney.getState();
    const g = group.current;
    if (!g) return;

    // Ignition ramps the rim, edges and heart up once the preloader finishes.
    // Still mode renders on demand, so show it fully lit from the first frame.
    ignite.current = still ? 1 : THREE.MathUtils.damp(ignite.current, ignited ? 1 : 0, 2.5, dt);
    const k = ignite.current;

    const pose = sampleCore(mobile ? MOBILE_KEYS : DESKTOP_KEYS, still ? 1 : t, pos);
    let { scale, alpha } = pose;
    let spinRate = 1;

    // After the ModelBridge network exits, the Core travels on through the margin.
    if (!still && t > 3.82) {
      const tp = travelPose(t, size, camera, travel);
      const k = THREE.MathUtils.smoothstep(t, 3.82, 3.99);
      pos.lerp(travel, k);
      scale = THREE.MathUtils.lerp(scale, tp.scale, k);
      alpha = THREE.MathUtils.lerp(alpha, tp.alpha, k);
    }

    // Contact finale: the Core returns above the heading, spins up, then bursts.
    if (!still && finaleAnchor.active && finale > 0) {
      const arrive = smooth(0, 0.35, finale);
      pos.lerp(finaleAnchor.above, arrive);
      // Returns big for the finale.
      scale = THREE.MathUtils.lerp(scale, 0.8, arrive);
      alpha = THREE.MathUtils.lerp(alpha, 1, arrive);
      spinRate = 1 + 9 * smooth(0.2, 0.45, finale);
      const burst = smooth(0.42, 0.52, finale);
      scale *= 1 - burst;
      alpha *= 1 - burst;
    }

    // Materials are reached through refs: they are mutated every frame.
    const shell = shellMesh.current?.material as THREE.ShaderMaterial | undefined;
    if (shell) {
      shell.uniforms.uIgnite.value = k;
      shell.uniforms.uAlpha.value = alpha;
    }
    const edge = edgeLines.current?.material as THREE.LineBasicMaterial | undefined;
    if (edge) edge.opacity = (0.15 + 0.5 * k) * alpha;
    const pulse = still ? 1 : 1 + Math.sin(clock.elapsedTime * 1.6) * 0.06;
    const glow = heart.current?.material as THREE.MeshBasicMaterial | undefined;
    if (glow) {
      glow.color.copy(ACCENT).multiplyScalar(0.2 + 1.35 * k * pulse);
      glow.opacity = alpha;
    }

    g.visible = alpha > 0.005;
    g.position.lerp(pos, still ? 1 : 1 - Math.exp(-6 * dt));
    g.scale.setScalar(still ? scale : THREE.MathUtils.damp(g.scale.x, scale, 6, dt));

    if (!still && spin.current) {
      spin.current.rotation.y += dt * 0.22 * spinRate;
      spin.current.rotation.x += dt * 0.08 * spinRate;
    }
    if (!still && heart.current) heart.current.rotation.y -= dt * 0.6;
  });

  return (
    <group ref={group}>
      <group ref={spin} rotation={[0.4, 0.3, 0]}>
        <mesh ref={shellMesh} geometry={shell} material={shellMat} />
        <lineSegments ref={edgeLines} geometry={edges} material={edgeMat} />
        <mesh ref={heart} geometry={heartGeo} material={heartMat} />
      </group>
    </group>
  );
}
