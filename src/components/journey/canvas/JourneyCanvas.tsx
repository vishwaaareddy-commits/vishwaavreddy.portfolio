"use client";

import { AdaptiveDpr, PerformanceMonitor, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { chapterVisibility, useJourney } from "@/store/journey";
import { Core } from "./Core";
import { FinaleScene } from "./FinaleScene";
import { ModelBridgeScene } from "./ModelBridgeScene";
import { OcrScene } from "./OcrScene";

interface JourneyCanvasProps {
  mobile: boolean;
  /** Reduced motion: one static frame, no scroll-driven camera. */
  still: boolean;
}

const look = new THREE.Vector3();

/** Camera: hero push toward the Core, pointer parallax, gentle idle drift. */
function CameraRig({ mobile, still }: JourneyCanvasProps) {
  useFrame((state, dt) => {
    const { t } = useJourney.getState();
    const { camera, pointer, clock } = state;
    const baseZ = mobile ? 10.5 : 8;
    // Push in during the hero (t 1→1.9), ease back out for the work intro.
    // Push in through the hero, ease back out as it ends.
    const push = still ? 0 : Math.min(1, chapterVisibility(t, 1, 0.6, 0.25) * 1.2);
    const drift = still ? 0 : Math.sin(clock.elapsedTime * 0.12) * 0.15;
    const px = still || mobile ? 0 : pointer.x * 0.35;
    const py = still || mobile ? 0 : pointer.y * 0.22;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, px + drift, 3, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, py, 3, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, baseZ - push * 1.6, 3, dt);
    look.set(0, 0, 0);
    camera.lookAt(look);
  });
  return null;
}

/** Bloom on emissive parts only (luminance threshold), grain and vignette; CA on desktop. */
function Effects({ mobile }: { mobile: boolean }) {
  const offset = useMemo(() => new THREE.Vector2(0.0012, 0.0012), []);
  if (mobile) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.62} luminanceSmoothing={0.2} intensity={0.7} mipmapBlur />
        <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.62} luminanceSmoothing={0.2} intensity={0.7} mipmapBlur />
      <ChromaticAberration offset={offset} radialModulation modulationOffset={0.35} />
      <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
      <Vignette offset={0.25} darkness={0.7} />
    </EffectComposer>
  );
}

/** One fixed full-screen scene behind all HTML for the whole journey. */
export default function JourneyCanvas({ mobile, still }: JourneyCanvasProps) {
  const [degraded, setDegraded] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Pause rendering while the tab is in the background.
  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <Canvas
      className="!fixed inset-0"
      dpr={[1, mobile ? 1.25 : 1.5]}
      frameloop={hidden ? "never" : still ? "demand" : "always"}
      camera={{ position: [0, 0, mobile ? 10.5 : 8], fov: 40, near: 0.1, far: 120 }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      aria-hidden
      tabIndex={-1}
    >
      <color attach="background" args={["#07090d"]} />
      <PerformanceMonitor onDecline={() => setDegraded(true)} flipflops={2} onFallback={() => setDegraded(true)} />
      <AdaptiveDpr pixelated={false} />
      <CameraRig mobile={mobile} still={still} />
      <Stars radius={70} depth={45} count={mobile ? 500 : 1400} factor={4.5} saturation={0} fade speed={still ? 0 : 0.5} />
      <Core mobile={mobile} still={still} />
      {still ? null : <ModelBridgeScene mobile={mobile} anchor={mobile ? [-0.55, 2.75, 0] : [0.5, 0, 0]} />}
      {/* Desktop-only scenes; phones and reduced motion get the CSS versions. */}
      {still || mobile ? null : <OcrScene />}
      {still || mobile ? null : <FinaleScene />}
      {degraded || still ? null : <Effects mobile={mobile} />}
    </Canvas>
  );
}
