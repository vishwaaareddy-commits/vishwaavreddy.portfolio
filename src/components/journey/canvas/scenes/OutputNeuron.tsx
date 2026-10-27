"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { chapterProgress, useJourney } from "@/store/journey";
import { CYAN, HOT } from "../neural/NetworkMesh";
import { fitToStage, stageFade } from "../stage";

const CHAPTER = 11;

/**
 * Chapter 11: the single output neuron the background network converges
 * onto, fitted to the contact stage. It ignites as the convergence lands
 * and pulses while the next-token choice is made.
 */
export function OutputNeuron() {
  const outer = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  const built = useMemo(
    () => ({
      sphere: new THREE.SphereGeometry(0.22, 32, 20),
      ring: new THREE.RingGeometry(0.34, 0.36, 64),
      coreMat: new THREE.MeshBasicMaterial({ color: HOT.clone().multiplyScalar(2.2), transparent: true, opacity: 0, toneMapped: false }),
      haloMat: new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(1.6), transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false }),
    }),
    [],
  );
  useEffect(
    () => () => {
      [built.sphere, built.ring].forEach((g) => g.dispose());
      [built.coreMat, built.haloMat].forEach((m) => m.dispose());
    },
    [built],
  );

  useFrame(({ camera, size, clock }) => {
    const o = outer.current;
    if (!o) return;
    const fit = fitToStage("output", o, camera as THREE.PerspectiveCamera, size, 1, 1);
    const vis = stageFade(fit, size);
    o.visible = vis > 0;
    if (!o.visible) return;
    const p = chapterProgress(useJourney.getState().t, CHAPTER);
    // Idle: a dim output neuron already waits in the stage; it ignites as the network lands.
    const lit = 0.25 + 0.75 * THREE.MathUtils.smoothstep(p, 0.45, 0.65);
    const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.06 * lit;
    if (core.current) {
      core.current.scale.setScalar(pulse);
      (core.current.material as THREE.MeshBasicMaterial).opacity = vis * lit;
    }
    if (halo.current) {
      halo.current.scale.setScalar(1 + ((clock.elapsedTime * 0.6) % 1) * 0.8);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = vis * lit * (1 - ((clock.elapsedTime * 0.6) % 1));
    }
  });

  return (
    <group ref={outer} visible={false}>
      <mesh ref={core} geometry={built.sphere} material={built.coreMat} />
      <mesh ref={halo} geometry={built.ring} material={built.haloMat} />
    </group>
  );
}
