"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useJourney } from "@/store/journey";
import { screenToWorld } from "./screen";

/** Where the finale burst starts and the ring it settles into, tracked from the contact heading. */
const finaleAnchor = {
  above: new THREE.Vector3(),
  ring: new THREE.Vector3(),
  ringRadius: 2,
  active: false,
};

const COUNT = 2000;
const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/** Deterministic per-particle burst direction, reach and ring slot. */
function makeSeeds() {
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: COUNT }, () => {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    return {
      dir: new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)),
      reach: 0.6 + rand() * 1.8,
      angle: rand() * Math.PI * 2,
      band: 0.82 + rand() * 0.36,
      lift: (rand() - 0.5) * 0.18,
    };
  });
}

const left = new THREE.Vector3();
const right = new THREE.Vector3();
const burst = new THREE.Vector3();
const ring = new THREE.Vector3();

/**
 * Chapter 11 finale: particles burst above the contact heading and settle
 * into a dim ring orbiting behind it. The ring stays below 0.2 opacity
 * while the form is on screen.
 */
export function FinaleScene() {
  const points = useRef<THREE.Points>(null);

  const { geometry, material, seeds } = useMemo(() => {
    const seeds = makeSeeds();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    return {
      geometry: geo,
      seeds,
      material: new THREE.PointsMaterial({
        color: new THREE.Color("#3be3f5").multiplyScalar(1.6),
        size: 0.03,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      finaleAnchor.active = false;
    },
    [geometry, material],
  );

  useFrame((state) => {
    const pts = points.current;
    if (!pts) return;
    const { finale } = useJourney.getState();
    const { camera, size, clock } = state;
    const heading = document.getElementById("contact-title");
    if (!heading) {
      finaleAnchor.active = false;
      pts.visible = false;
      return;
    }

    // Track the heading on screen: the burst starts above it, the ring orbits it.
    const r = heading.getBoundingClientRect();
    const midY = r.top + r.height / 2;
    screenToWorld(r.left, midY, size, camera, left);
    screenToWorld(r.right, midY, size, camera, right);
    finaleAnchor.ring.copy(left).add(right).multiplyScalar(0.5);
    screenToWorld(r.left + r.width / 2, r.top - Math.min(170, size.height * 0.2), size, camera, finaleAnchor.above);
    finaleAnchor.ringRadius = left.distanceTo(right) * 0.42;
    finaleAnchor.active = true;

    const shown = smooth(0.42, 0.5, finale);
    pts.visible = shown > 0;
    if (!pts.visible) return;

    const spread = smooth(0.44, 0.7, finale);
    const settle = smooth(0.62, 0.96, finale);
    const time = clock.elapsedTime;
    const R = finaleAnchor.ringRadius;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i += 1) {
      const s = seeds[i];
      burst.copy(finaleAnchor.above).addScaledVector(s.dir, s.reach * spread);
      const a = s.angle + time * 0.12;
      ring.set(
        finaleAnchor.ring.x + Math.cos(a) * R * s.band,
        finaleAnchor.ring.y + Math.sin(a) * R * 0.3 * s.band + s.lift,
        finaleAnchor.ring.z - 0.6 + Math.sin(a) * 0.5,
      );
      burst.lerp(ring, settle);
      attr.setXYZ(i, burst.x, burst.y, burst.z);
    }
    attr.needsUpdate = true;

    // Bright while bursting, dim once settled; capped while the form is visible.
    const form = document.querySelector<HTMLElement>("#contact form");
    const formVisible = form ? form.getBoundingClientRect().top < size.height : false;
    let opacity = THREE.MathUtils.lerp(0.7, 0.16, settle) * shown;
    if (formVisible) opacity = Math.min(opacity, 0.18);
    (pts.material as THREE.PointsMaterial).opacity = opacity;
  });

  return <points ref={points} geometry={geometry} material={material} visible={false} frustumCulled={false} />;
}
