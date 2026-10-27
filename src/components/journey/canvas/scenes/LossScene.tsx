"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DESCENT_RANGE, WAYPOINTS, descentPath, loss } from "@/data/descent";
import { chapterProgress, labelRegistry, useJourney } from "@/store/journey";
import { CYAN, HOT, VIOLET } from "../neural/NetworkMesh";
import { fitToStage, hideLabels, placeLabel, stageFade } from "../stage";

const CHAPTER = 9;
const CONTENT = { w: 3.9, h: 2.9 };
const SIZE = 3.2;
const HEIGHT = 0.42;
const lift = (l: number) => l * HEIGHT;

const surfVert = /* glsl */ `
  varying float vH;
  varying vec3 vNormal;
  void main() {
    vH = position.y;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const surfFrag = /* glsl */ `
  uniform vec3 uLow;
  uniform vec3 uHigh;
  uniform float uAlpha;
  varying float vH;
  varying vec3 vNormal;
  void main() {
    float k = clamp((vH - 0.1) / 0.9, 0.0, 1.0);
    float light = 0.35 + 0.65 * max(dot(normalize(vNormal), normalize(vec3(0.3, 1.0, 0.5))), 0.0);
    vec3 color = mix(uLow, uHigh, k) * (0.06 + 0.2 * light);
    gl_FragColor = vec4(color * uAlpha, 0.85 * uAlpha);
  }
`;

const local = new THREE.Vector3();

/**
 * Chapter 09: a loss surface (soft shading + wireframe) and a glowing ball
 * that descends it along a real gradient-descent path as you scroll. Each
 * role is a waypoint on the way down; labels stay inside the stage.
 */
export function LossScene() {
  const outer = useRef<THREE.Group>(null);
  const group = useRef<THREE.Group>(null);
  const surface = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.LineSegments>(null);
  const trail = useRef<THREE.Line>(null);
  const ball = useRef<THREE.Mesh>(null);
  const marks = useRef<THREE.InstancedMesh>(null);

  const built = useMemo(() => {
    const plane = new THREE.PlaneGeometry(SIZE, SIZE, 56, 56);
    plane.rotateX(-Math.PI / 2);
    const pos = plane.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i += 1) pos.setY(i, lift(loss(pos.getX(i), pos.getZ(i))));
    plane.computeVertexNormals();
    const path = descentPath().map(([x, z, l]) => new THREE.Vector3(x, lift(l) + 0.04, z));
    // Arc-length lookup so the ball moves at an even pace along the path.
    const lengths = [0];
    for (let i = 1; i < path.length; i += 1) lengths.push(lengths[i - 1] + path[i].distanceTo(path[i - 1]));
    const total = lengths[lengths.length - 1];
    const at = (u: number, out: THREE.Vector3) => {
      const d = u * total;
      let i = 1;
      while (i < lengths.length - 1 && lengths[i] < d) i += 1;
      const k = (d - lengths[i - 1]) / Math.max(1e-6, lengths[i] - lengths[i - 1]);
      return { point: out.lerpVectors(path[i - 1], path[i], Math.min(1, k)), index: i };
    };
    const trailGeo = new THREE.BufferGeometry().setFromPoints(path);
    const trailMat = new THREE.LineBasicMaterial({ color: HOT.clone().multiplyScalar(1.6), transparent: true, opacity: 0, toneMapped: false });
    return {
      trailLine: new THREE.Line(trailGeo, trailMat),
      trailMat,
      plane,
      // A coarser grid for the wireframe, so the lines read as lines, not a fill.
      wireGeo: (() => {
        const coarse = new THREE.PlaneGeometry(SIZE, SIZE, 24, 24);
        coarse.rotateX(-Math.PI / 2);
        const cp = coarse.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < cp.count; i += 1) cp.setY(i, lift(loss(cp.getX(i), cp.getZ(i))) + 0.004);
        const w = new THREE.WireframeGeometry(coarse);
        coarse.dispose();
        return w;
      })(),
      trailGeo,
      at,
      waypoints: WAYPOINTS.map((w) => at(w.at, new THREE.Vector3()).point.clone()),
      surfMat: new THREE.ShaderMaterial({
        vertexShader: surfVert,
        fragmentShader: surfFrag,
        uniforms: { uLow: { value: CYAN }, uHigh: { value: VIOLET }, uAlpha: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
      wireMat: new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0, toneMapped: false }),
      ballGeo: new THREE.SphereGeometry(0.07, 20, 14),
      ballMat: new THREE.MeshBasicMaterial({ color: HOT.clone().multiplyScalar(2.4), transparent: true, opacity: 0, toneMapped: false }),
      markGeo: new THREE.SphereGeometry(0.035, 12, 8),
      markMat: new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(1.4), transparent: true, opacity: 0, toneMapped: false }),
    };
  }, []);

  useEffect(() => {
    const m = new THREE.Matrix4();
    built.waypoints.forEach((p, i) => marks.current?.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
    if (marks.current) marks.current.instanceMatrix.needsUpdate = true;
  }, [built]);

  useEffect(
    () => () => {
      [built.plane, built.wireGeo, built.trailGeo, built.ballGeo, built.markGeo].forEach((g) => g.dispose());
      [built.surfMat, built.wireMat, built.trailMat, built.ballMat, built.markMat].forEach((m) => m.dispose());
    },
    [built],
  );

  useFrame(({ camera, size, clock }) => {
    const o = outer.current;
    const g = group.current;
    if (!o || !g) return;
    const fit = fitToStage("loss", o, camera as THREE.PerspectiveCamera, size, CONTENT.w, CONTENT.h);
    const vis = stageFade(fit, size);
    o.visible = vis > 0;
    if (!o.visible) return hideLabels(labelRegistry, "loss-");
    const p = chapterProgress(useJourney.getState().t, CHAPTER);
    const u = THREE.MathUtils.clamp((p - DESCENT_RANGE[0]) / (DESCENT_RANGE[1] - DESCENT_RANGE[0]), 0, 1);
    g.rotation.set(0.55, -0.6 + Math.sin(clock.elapsedTime * 0.12) * 0.12, 0);
    g.updateMatrixWorld();

    // Materials are reached through refs: they are mutated every frame.
    if (surface.current) (surface.current.material as THREE.ShaderMaterial).uniforms.uAlpha.value = vis;
    if (wire.current) (wire.current.material as THREE.LineBasicMaterial).opacity = 0.32 * vis;
    if (marks.current) (marks.current.material as THREE.MeshBasicMaterial).opacity = vis;
    const { point, index } = built.at(u, local);
    if (ball.current) {
      ball.current.position.copy(point);
      (ball.current.material as THREE.MeshBasicMaterial).opacity = vis;
    }
    if (trail.current) {
      trail.current.geometry.setDrawRange(0, index + 1);
      (trail.current.material as THREE.LineBasicMaterial).opacity = 0.9 * vis;
    }
    built.waypoints.forEach((wp, i) =>
      placeLabel(labelRegistry.get(`loss-${i}`), g, wp, camera, size, fit.rect, vis * (u >= WAYPOINTS[i].at - 0.001 ? 1 : 0.45), -16),
    );
  });

  return (
    <group ref={outer} visible={false}>
      <group ref={group}>
        <mesh ref={surface} geometry={built.plane} material={built.surfMat} />
        <lineSegments ref={wire} geometry={built.wireGeo} material={built.wireMat} />
        <primitive object={built.trailLine} ref={trail} />
        <instancedMesh ref={marks} args={[built.markGeo, built.markMat, WAYPOINTS.length]} />
        <mesh ref={ball} geometry={built.ballGeo} material={built.ballMat} />
      </group>
    </group>
  );
}
