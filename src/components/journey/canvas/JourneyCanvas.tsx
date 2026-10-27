"use client";

import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";
import { heroTraining } from "@/components/journey/training/protocol";
import { pointer, useJourney, type Tier } from "@/store/journey";
import { EmbeddingCloud } from "./neural/EmbeddingCloud";
import { HeroNet } from "./neural/HeroNet";
import { NeuralField } from "./neural/NeuralField";
import { AttentionScene } from "./scenes/AttentionScene";
import { ConvScene } from "./scenes/ConvScene";
import { FlowGraph } from "./scenes/FlowGraph";
import { LossScene } from "./scenes/LossScene";
import { OutputNeuron } from "./scenes/OutputNeuron";
import { AUTO_EDGES, AUTO_NODES, QA_AGENTS, QA_EDGES, QA_NODES } from "@/data/flows";
import { disposeCopyMask, updateCopyMask } from "./stage";

interface JourneyCanvasProps {
  mobile: boolean;
  /** Reduced motion: one static frame, no scroll-driven camera. */
  still: boolean;
}

interface CameraKey {
  t: number;
  pos: [number, number, number];
  look: [number, number, number];
}

/**
 * Camera path through the field (centred at z −6, input layer at x −8,
 * output at x +8). Hero: close on the input layers, pulling back to reveal
 * the whole network; then it travels along the layers with the wavefront.
 */
const KEYS: CameraKey[] = [
  { t: 1.0, pos: [-5.4, 0.5, 3.6], look: [-4.6, 0, -6] },
  { t: 1.95, pos: [0, 1.1, 9], look: [0, 0, -6] },
  { t: 2.6, pos: [3.6, 2.4, 7.2], look: [0.5, 0, -6] },
  { t: 3.2, pos: [-4.5, 0.6, 3], look: [-2, 0, -6] },
  { t: 11.0, pos: [4.5, -0.6, 3], look: [7, 0, -6] },
  { t: 11.9, pos: [7, 0, 4.5], look: [8, 0, -6] },
];
/** Narrow screens see less width: stand further back. */
const MOBILE_PULLBACK = 5;

const keyPos = new THREE.Vector3();
const keyLook = new THREE.Vector3();
const look = new THREE.Vector3();
const a = new THREE.Vector3();
const b = new THREE.Vector3();

function sampleCamera(t: number, mobile: boolean) {
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i += 1;
  const k0 = KEYS[i];
  const k1 = KEYS[i + 1];
  const k = THREE.MathUtils.smoothstep(t, k0.t, k1.t);
  keyPos.lerpVectors(a.fromArray(k0.pos), b.fromArray(k1.pos), k);
  keyLook.lerpVectors(a.fromArray(k0.look), b.fromArray(k1.look), k);
  if (mobile) keyPos.z += MOBILE_PULLBACK;
}

/** Camera: scroll keyframes, pointer parallax, slow idle drift. */
function CameraRig({ mobile, still }: JourneyCanvasProps) {
  useFrame((state, dt) => {
    const { t } = useJourney.getState();
    const { camera, clock } = state;
    sampleCamera(still ? 2.6 : t, mobile);
    const time = clock.elapsedTime;
    const drift = still ? 0 : 1;
    keyPos.x += Math.sin(time * 0.11) * 0.25 * drift + (still || mobile ? 0 : pointer.x * 0.3);
    keyPos.y += Math.cos(time * 0.09) * 0.18 * drift + (still || mobile ? 0 : pointer.y * 0.2);
    if (still) {
      camera.position.copy(keyPos);
      look.copy(keyLook);
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, keyPos.x, 3, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, keyPos.y, 3, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, keyPos.z, 3, dt);
      look.x = THREE.MathUtils.damp(look.x, keyLook.x, 3, dt);
      look.y = THREE.MathUtils.damp(look.y, keyLook.y, 3, dt);
      look.z = THREE.MathUtils.damp(look.z, keyLook.z, 3, dt);
    }
    camera.lookAt(look);
  });
  return null;
}

/** Feeds on-screen copy rects to the shaders so the field fades behind text. */
function MaskSync() {
  useEffect(() => disposeCopyMask, []);
  useFrame(({ size, viewport }) => updateCopyMask(size, viewport.dpr, performance.now()));
  return null;
}

/**
 * Reduced motion renders on demand: one frame per scroll or resize (so
 * stage-fitted visuals follow their columns) and when training finishes.
 */
function StillInvalidator() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    // Copy masks are found asynchronously (IntersectionObserver + a 1 s scan),
    // so render a few trailing frames after each change, not just one.
    let trailing: ReturnType<typeof setTimeout>[] = [];
    const onChange = () => {
      invalidate();
      trailing.forEach(clearTimeout);
      trailing = [150, 450, 1200].map((ms) => setTimeout(() => invalidate(), ms));
    };
    onChange();
    let seen = heroTraining.version;
    const poll = setInterval(() => {
      if (heroTraining.version !== seen) {
        seen = heroTraining.version;
        invalidate();
      }
    }, 250);
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    return () => {
      clearInterval(poll);
      trailing.forEach(clearTimeout);
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, [invalidate]);
  return null;
}

/**
 * Mounts a chapter scene only once its stage has come within about a
 * viewport of the screen, then keeps it. Spreads three.js setup and shader
 * compiles across the scroll instead of all at load.
 */
function WhenNear({ stage, children }: { stage: string; children: ReactNode }) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near) return;
    let io: IntersectionObserver | null = null;
    // Stages can mount after the canvas (chapters remount for 3D): look again until found.
    const find = () => {
      const el = document.querySelector(`[data-stage="${stage}"]`);
      if (!el) return false;
      io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
      io.observe(el);
      return true;
    };
    const retry = find() ? undefined : setInterval(() => find() && clearInterval(retry), 500);
    return () => {
      clearInterval(retry);
      io?.disconnect();
    };
  }, [stage, near]);
  return near ? <>{children}</> : null;
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

const LOWER: Record<Tier, Tier> = { high: "medium", medium: "low", low: "low" };

/** One fixed full-screen scene behind all HTML for the whole journey. */
export default function JourneyCanvas({ mobile, still }: JourneyCanvasProps) {
  const [hidden, setHidden] = useState(false);
  const tier = useJourney((s) => s.tier);

  // Phones start one tier down; the monitor only ever steps down from there.
  useEffect(() => {
    if (mobile) useJourney.getState().setTier("medium");
  }, [mobile]);

  // Exposed for QA (DevTools / automated checks): which tier is active.
  useEffect(() => {
    document.documentElement.dataset.gpuTier = tier;
  }, [tier]);

  // Pause rendering while the tab is in the background.
  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // The canvas sits behind the page, so track the pointer on window.
  useEffect(() => {
    if (still) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.active = true;
    };
    const onLeave = () => (pointer.active = false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      pointer.active = false;
    };
  }, [still]);

  const stepDown = () => {
    const { tier: current, setTier } = useJourney.getState();
    setTier(LOWER[current]);
  };

  return (
    <Canvas
      className="!fixed inset-0"
      dpr={[1, mobile ? 1.25 : 1.5]}
      frameloop={hidden ? "never" : still ? "demand" : "always"}
      camera={{ position: [0, 0, 8], fov: 40, near: 0.1, far: 120 }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      aria-hidden
      tabIndex={-1}
    >
      <color attach="background" args={["#07090d"]} />
      <PerformanceMonitor onDecline={stepDown} flipflops={2} onFallback={() => useJourney.getState().setTier("low")} />
      <AdaptiveDpr pixelated={false} />
      <CameraRig mobile={mobile} still={still} />
      {still ? <StillInvalidator /> : null}
      <MaskSync />
      <NeuralField tier={tier} still={still} />
      <HeroNet still={still} />
      {still ? null : (
        <WhenNear stage="embeddings">
          <EmbeddingCloud tier={tier} />
        </WhenNear>
      )}
      {/* Phones on the low tier get the SVG attention view instead. */}
      {still || (mobile && tier === "low") ? null : (
        <WhenNear stage="attention">
          <AttentionScene />
        </WhenNear>
      )}
      {still ? null : (
        <WhenNear stage="ocr">
          <ConvScene />
        </WhenNear>
      )}
      {still ? null : (
        <WhenNear stage="loss">
          <LossScene />
        </WhenNear>
      )}
      {still ? null : (
        <WhenNear stage="output">
          <OutputNeuron />
        </WhenNear>
      )}
      {still ? null : (
        <WhenNear stage="qa">
          <FlowGraph chapter={5} stage="qa" prefix="qa-" nodes={QA_NODES} edges={QA_EDGES} agents={QA_AGENTS} content={{ w: 7.4, h: 2.5 }} />
        </WhenNear>
      )}
      {still ? null : (
        <WhenNear stage="automation">
          <FlowGraph chapter={6} stage="automation" prefix="auto-" nodes={AUTO_NODES} edges={AUTO_EDGES} content={{ w: 5.8, h: 2.1 }} />
        </WhenNear>
      )}
      {/* Desktop-only scenes; phones and reduced motion get the CSS versions. */}
      {tier === "low" || still ? null : <Effects mobile={mobile} />}
    </Canvas>
  );
}
