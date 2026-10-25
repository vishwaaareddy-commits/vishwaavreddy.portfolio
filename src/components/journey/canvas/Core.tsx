"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useJourney } from "@/store/journey";
import { DESKTOP_KEYS, MOBILE_KEYS, sampleCore } from "./keyframes";

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
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
    float facet = 0.3 + 0.7 * max(dot(vNormal, normalize(vec3(0.4, 0.8, 0.6))), 0.0);
    // Dark glassy body; the glow lives on the rim, not across every facet.
    vec3 color = uDeep * facet + uColor * pow(fresnel, 1.6) * (0.25 + 1.1 * uIgnite);
    gl_FragColor = vec4(color, 0.28 + 0.6 * fresnel);
  }
`;

const pos = new THREE.Vector3();

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
        },
      }),
      edgeMat: new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.2, toneMapped: false }),
      heartMat: new THREE.MeshBasicMaterial({ color: ACCENT.clone(), toneMapped: false }),
    };
  }, []);

  useEffect(
    () => () => {
      [shell, edges, heartGeo].forEach((g) => g.dispose());
      [shellMat, edgeMat, heartMat].forEach((m) => m.dispose());
    },
    [shell, edges, heartGeo, shellMat, edgeMat, heartMat],
  );

  useFrame(({ clock }, dt) => {
    const { t, ignited } = useJourney.getState();
    const g = group.current;
    if (!g) return;

    // Ignition ramps the rim, edges and heart up once the preloader finishes.
    // Still mode renders on demand, so show it fully lit from the first frame.
    ignite.current = still ? 1 : THREE.MathUtils.damp(ignite.current, ignited ? 1 : 0, 2.5, dt);
    const k = ignite.current;
    // Materials are reached through refs: they are mutated every frame.
    const shell = shellMesh.current?.material as THREE.ShaderMaterial | undefined;
    if (shell) shell.uniforms.uIgnite.value = k;
    const edge = edgeLines.current?.material as THREE.LineBasicMaterial | undefined;
    if (edge) edge.opacity = 0.15 + 0.5 * k;
    const pulse = still ? 1 : 1 + Math.sin(clock.elapsedTime * 1.6) * 0.06;
    const glow = heart.current?.material as THREE.MeshBasicMaterial | undefined;
    glow?.color.copy(ACCENT).multiplyScalar(0.2 + 1.35 * k * pulse);

    const scale = sampleCore(mobile ? MOBILE_KEYS : DESKTOP_KEYS, still ? 1 : t, pos);
    g.position.lerp(pos, still ? 1 : 1 - Math.exp(-6 * dt));
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, scale, 6, dt));

    if (!still && spin.current) {
      spin.current.rotation.y += dt * 0.22;
      spin.current.rotation.x += dt * 0.08;
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
