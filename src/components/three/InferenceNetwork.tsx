"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { NetworkNode } from "@/types/content";
import {
  activeEdges,
  activeRoutes,
  edgeKey,
  networkEdges,
  networkNodes,
  networkStages,
  nodeById,
  routes,
} from "./graph";

const ACCENT = new THREE.Color("#3be3f5");
const SLATE = new THREE.Color("#3d4b5c");
const FOV = 38;
/** World-space width the camera always fits, with room for labels. */
const REQUIRED_WIDTH = 10.8;
const PARTICLES_PER_ROUTE = 3;
const PULSE_POOL = 10;
const STAGE_Y = 2.85;

/** Places a DOM label at canvas-pixel coordinates. */
export type PlaceLabel = (id: string, x: number, y: number) => void;

export interface InferenceNetworkProps {
  activeId: string | null;
  /** Increments on every selection; launches a pulse even when re-selecting. */
  selectionTick: number;
  running: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  placeLabel: PlaceLabel;
  onReady: () => void;
  onContextLost: () => void;
}

// Scratch objects reused every frame to avoid allocations.
const scratch = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const camGoal = new THREE.Vector3();

const toVec = (p: [number, number, number]) => new THREE.Vector3(...p);
const damp = THREE.MathUtils.damp;

function edgeCurve(fromId: string, toId: string) {
  const a = toVec(nodeById[fromId].position);
  const b = toVec(nodeById[toId].position);
  const dx = (b.x - a.x) * 0.5;
  return new THREE.CubicBezierCurve3(
    a,
    a.clone().add(new THREE.Vector3(dx, 0, 0)),
    b.clone().sub(new THREE.Vector3(dx, 0, 0)),
    b,
  );
}

const routePaths = routes.map((route) => {
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < route.length - 1; i += 1) path.add(edgeCurve(route[i], route[i + 1]));
  return path;
});

function makeGlowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(170,244,252,0.7)");
  g.addColorStop(0.5, "rgba(59,227,245,0.18)");
  g.addColorStop(1, "rgba(59,227,245,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ---------------------------------------------------------------- atmosphere */

function Atmosphere() {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = 520;
    const positions = new Float32Array(count * 3);
    // Deterministic spread so every visit looks the same.
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (rand() - 0.5) * 22;
      positions[i * 3 + 1] = (rand() - 0.5) * 11;
      positions[i * 3 + 2] = -7 + rand() * 9;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const grid = useMemo(() => {
    const helper = new THREE.GridHelper(44, 44, "#1f4a55", "#132630");
    const material = helper.material as THREE.LineBasicMaterial;
    material.transparent = true;
    material.opacity = 0.32;
    material.depthWrite = false;
    helper.position.set(0, -3.3, -2);
    return helper;
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
    },
    [geometry, grid],
  );

  useFrame((_, dt) => {
    if (points.current) points.current.rotation.y += dt * 0.012;
  });

  return (
    <>
      <points ref={points} geometry={geometry}>
        <pointsMaterial
          size={0.035}
          color="#86dfeb"
          transparent
          opacity={0.38}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <primitive object={grid} />
    </>
  );
}

/* --------------------------------------------------------------------- edges */

function Edges({ activeId }: { activeId: string | null }) {
  const lit = useMemo(() => activeEdges(activeId), [activeId]);
  const tubes = useMemo(
    () =>
      networkEdges.map(([a, b]) => ({
        key: edgeKey(a, b),
        geometry: new THREE.TubeGeometry(edgeCurve(a, b), 72, 0.012, 6, false),
      })),
    [],
  );
  const materials = useRef<Record<string, THREE.MeshBasicMaterial | null>>({});

  useEffect(() => () => tubes.forEach((t) => t.geometry.dispose()), [tubes]);

  // Ease colour and opacity so selection changes never flash.
  useFrame((_, dt) => {
    for (const { key } of tubes) {
      const m = materials.current[key];
      if (!m) continue;
      const on = lit.has(key);
      const target = activeId === null ? 0.36 : on ? 0.95 : 0.1;
      m.opacity = damp(m.opacity, target, 6, dt);
      m.color.lerp(on ? ACCENT : SLATE, 1 - Math.exp(-6 * dt));
    }
  });

  return (
    <group>
      {tubes.map(({ key, geometry }) => (
        <mesh key={key} geometry={geometry}>
          <meshBasicMaterial
            ref={(m) => {
              materials.current[key] = m;
            }}
            color={SLATE}
            transparent
            opacity={0.36}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* --------------------------------------------------------------------- nodes */

function NodeMaterial() {
  return (
    <meshStandardMaterial
      color="#0d1620"
      emissive={ACCENT}
      emissiveIntensity={0.3}
      metalness={0.55}
      roughness={0.32}
      flatShading
    />
  );
}

function NodeShape({ kind }: { kind: NetworkNode["kind"] }) {
  switch (kind) {
    case "input":
      return (
        <mesh>
          <octahedronGeometry args={[0.24, 0]} />
          <NodeMaterial />
        </mesh>
      );
    case "hub":
      return (
        <mesh>
          <icosahedronGeometry args={[0.36, 1]} />
          <NodeMaterial />
        </mesh>
      );
    case "sdk":
      return (
        <mesh>
          <dodecahedronGeometry args={[0.24, 0]} />
          <NodeMaterial />
        </mesh>
      );
    case "vision":
      return (
        <mesh>
          <icosahedronGeometry args={[0.22, 2]} />
          <NodeMaterial />
        </mesh>
      );
    case "automation":
      return (
        <mesh>
          <torusGeometry args={[0.2, 0.07, 10, 28]} />
          <NodeMaterial />
        </mesh>
      );
    case "data":
      return (
        <group>
          {[-0.14, 0, 0.14].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.09, 24]} />
              <NodeMaterial />
            </mesh>
          ))}
        </group>
      );
    case "output":
      return (
        <mesh>
          <boxGeometry args={[0.36, 0.36, 0.36]} />
          <NodeMaterial />
        </mesh>
      );
  }
}

type NodeState = "idle" | "active" | "related" | "dim";

interface GraphNodeProps {
  node: NetworkNode;
  state: NodeState;
  texture: THREE.Texture;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

function GraphNode({ node, state, texture, onHover, onSelect }: GraphNodeProps) {
  const body = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Sprite>(null);
  const isHub = node.kind === "hub";
  const phase = node.position[0] * 1.7;

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    const g = body.current;
    if (g) {
      const scale = state === "active" ? 1.35 : state === "dim" ? 0.85 : 1;
      g.scale.setScalar(damp(g.scale.x, scale, 7, dt));
      g.rotation.y += dt * (isHub ? 0.18 : 0.32);
      g.rotation.x += dt * 0.11;
      g.position.y = Math.sin(t * 0.8 + phase) * 0.05;
      const intensity = state === "active" ? 1.5 : state === "related" ? 0.75 : state === "dim" ? 0.12 : 0.35;
      g.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
          obj.material.emissiveIntensity = damp(obj.material.emissiveIntensity, intensity, 6, dt);
        }
      });
    }
    if (rings.current) {
      rings.current.rotation.z += dt * 0.25;
      rings.current.rotation.x = Math.PI / 2.3 + Math.sin(t * 0.4) * 0.08;
    }
    const h = halo.current;
    if (h) {
      const glow = state === "active" ? 0.95 : state === "related" ? 0.45 : state === "dim" ? 0.06 : isHub ? 0.4 : 0.2;
      const m = h.material as THREE.SpriteMaterial;
      m.opacity = damp(m.opacity, glow, 6, dt);
      const size = (isHub ? 2.1 : 1.4) * (state === "active" ? 1.25 : 1);
      h.scale.setScalar(damp(h.scale.x, size, 6, dt));
    }
  });

  return (
    <group position={node.position}>
      <sprite ref={halo} scale={1.4}>
        <spriteMaterial
          map={texture}
          color={ACCENT}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <group ref={body}>
        <NodeShape kind={node.kind} />
      </group>
      {isHub ? (
        <group ref={rings}>
          <mesh>
            <torusGeometry args={[0.62, 0.008, 8, 120]} />
            <meshBasicMaterial color={ACCENT} transparent opacity={0.55} toneMapped={false} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2.6, 0]}>
            <torusGeometry args={[0.82, 0.006, 8, 120]} />
            <meshBasicMaterial color="#8fb7ff" transparent opacity={0.28} toneMapped={false} />
          </mesh>
        </group>
      ) : null}
      {/* Generous invisible hit area so small nodes are easy to point at. */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
      >
        <sphereGeometry args={[isHub ? 0.75 : 0.5, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------------------------- particles */

interface Traveller {
  route: number;
  u: number;
  delay: number;
}

const initialFlow = (): Traveller[] =>
  routes.flatMap((_, r) =>
    Array.from({ length: PARTICLES_PER_ROUTE }, (_, k) => ({
      route: r,
      u: (r * 0.21 + k / PARTICLES_PER_ROUTE) % 1,
      delay: 0,
    })),
  );

function RequestFlow({
  activeId,
  selectionTick,
  texture,
}: {
  activeId: string | null;
  selectionTick: number;
  texture: THREE.Texture;
}) {
  const live = useMemo(() => new Set(activeRoutes(activeId)), [activeId]);
  const flow = useRef<Traveller[]>(initialFlow());
  const pulses = useRef<Traveller[]>([]);
  const flowSprites = useRef<(THREE.Sprite | null)[]>([]);
  const pulseSprites = useRef<(THREE.Sprite | null)[]>([]);
  const flowCount = routes.length * PARTICLES_PER_ROUTE;

  // Each selection sends a bright data pulse along the routes it lights.
  useEffect(() => {
    if (selectionTick === 0) return;
    const lit = activeRoutes(activeId);
    const burst = activeId === "request" ? 2 : 1;
    const next: Traveller[] = [];
    lit.forEach((route, i) => {
      for (let b = 0; b < burst; b += 1) next.push({ route, u: 0, delay: i * 0.12 + b * 0.45 });
    });
    pulses.current = next.slice(0, PULSE_POOL);
    // Only a new selection launches pulses; hovering must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionTick]);

  useFrame((_, dt) => {
    const idle = live.size === 0;
    flow.current.forEach((p, i) => {
      const sprite = flowSprites.current[i];
      if (!sprite) return;
      const on = live.has(p.route);
      p.u = (p.u + dt * (on ? 0.16 : 0.075)) % 1;
      routePaths[p.route].getPointAt(p.u, scratch);
      sprite.position.copy(scratch);
      const edgeFade = Math.min(1, p.u * 10, (1 - p.u) * 10);
      const m = sprite.material as THREE.SpriteMaterial;
      m.opacity = damp(m.opacity, (idle ? 0.75 : on ? 1 : 0.12) * edgeFade, 8, dt);
      sprite.scale.setScalar(damp(sprite.scale.x, on ? 0.36 : 0.26, 6, dt));
    });

    for (let i = 0; i < PULSE_POOL; i += 1) {
      const sprite = pulseSprites.current[i];
      if (!sprite) continue;
      const m = sprite.material as THREE.SpriteMaterial;
      const p = pulses.current[i];
      if (!p || p.u >= 1) {
        m.opacity = 0;
        continue;
      }
      if (p.delay > 0) {
        p.delay -= dt;
        m.opacity = 0;
        continue;
      }
      p.u = Math.min(1, p.u + dt * 0.42);
      routePaths[p.route].getPointAt(p.u, scratch);
      sprite.position.copy(scratch);
      m.opacity = Math.min(1, (1 - p.u) * 4, p.u * 12);
    }
  });

  const sprite = (key: string, scale: number, store: typeof flowSprites, i: number) => (
    <sprite
      key={key}
      scale={scale}
      ref={(el) => {
        store.current[i] = el;
      }}
    >
      <spriteMaterial
        map={texture}
        color={ACCENT}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </sprite>
  );

  return (
    <group>
      {Array.from({ length: flowCount }, (_, i) => sprite(`f${i}`, 0.26, flowSprites, i))}
      {Array.from({ length: PULSE_POOL }, (_, i) => sprite(`p${i}`, 0.7, pulseSprites, i))}
    </group>
  );
}

/* --------------------------------------------------------------------- scene */

type SceneProps = Omit<InferenceNetworkProps, "running" | "onContextLost">;

function Scene({ activeId, selectionTick, onHover, onSelect, placeLabel, onReady }: SceneProps) {
  const root = useRef<THREE.Group>(null);
  const fittedAspect = useRef(0);
  const ready = useRef(false);
  const look = useRef(new THREE.Vector3());
  const texture = useMemo(() => makeGlowTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);

  const related = useMemo(() => {
    const set = new Set<string>();
    for (const r of activeRoutes(activeId)) routes[r].forEach((id) => set.add(id));
    return set;
  }, [activeId]);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const { camera, size, pointer, clock } = state;
    const t = clock.getElapsedTime();

    // Fit the graph's width whenever the canvas aspect ratio changes.
    const aspect = size.width / Math.max(size.height, 1);
    const fitHeight = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const baseZ = Math.max(10.5, REQUIRED_WIDTH / (fitHeight * aspect));
    if (aspect !== fittedAspect.current && camera instanceof THREE.PerspectiveCamera) {
      camera.updateProjectionMatrix();
      fittedAspect.current = aspect;
    }

    // Camera rig: idle drift, pointer parallax and a gentle lean toward the selection.
    const focus = activeId ? nodeById[activeId].position : null;
    lookTarget.set(focus ? focus[0] * 0.22 : 0, focus ? focus[1] * 0.18 : 0, 0);
    camGoal.set(
      Math.sin(t * 0.11) * 0.35 + pointer.x * 0.7 + lookTarget.x * 0.8,
      0.55 + Math.cos(t * 0.13) * 0.15 + pointer.y * 0.4 + lookTarget.y * 0.5,
      baseZ - (focus ? 0.6 : 0),
    );
    camera.position.x = damp(camera.position.x, camGoal.x, 2.2, dt);
    camera.position.y = damp(camera.position.y, camGoal.y, 2.2, dt);
    camera.position.z = damp(camera.position.z, camGoal.z, 2.2, dt);
    look.current.lerp(lookTarget, 1 - Math.exp(-2.2 * dt));
    camera.lookAt(look.current);

    // Project nodes and stage annotations to place the DOM labels.
    g.updateMatrixWorld();
    for (const node of networkNodes) {
      scratch.set(...node.position);
      g.localToWorld(scratch);
      scratch.project(camera);
      placeLabel(node.id, (scratch.x * 0.5 + 0.5) * size.width, (-scratch.y * 0.5 + 0.5) * size.height);
    }
    for (const stage of networkStages) {
      scratch.set(stage.x, STAGE_Y, 0);
      g.localToWorld(scratch);
      scratch.project(camera);
      placeLabel(stage.id, (scratch.x * 0.5 + 0.5) * size.width, (-scratch.y * 0.5 + 0.5) * size.height);
    }

    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <>
      <fog attach="fog" args={["#07090d", 9, 24]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#8fb7ff", "#07090d", 0.5]} />
      <pointLight position={[-4, 3.5, 5]} intensity={40} color="#3be3f5" />
      <pointLight position={[5, -2, 4]} intensity={18} color="#9fc2ff" />
      <Atmosphere />
      <group ref={root} position={[0.15, 0, 0]}>
        <Edges activeId={activeId} />
        {networkNodes.map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            state={
              activeId === null
                ? "idle"
                : node.id === activeId
                  ? "active"
                  : related.has(node.id)
                    ? "related"
                    : "dim"
            }
            texture={texture}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}
        <RequestFlow activeId={activeId} selectionTick={selectionTick} texture={texture} />
      </group>
    </>
  );
}

function InferenceNetwork({ running, onContextLost, ...sceneProps }: InferenceNetworkProps) {
  return (
    <Canvas
      className="!absolute inset-0"
      style={{ background: "transparent" }}
      dpr={[1, 1.75]}
      frameloop={running ? "always" : "never"}
      camera={{ position: [0, 0.55, 11], fov: FOV, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            onContextLost();
          },
          { once: true },
        );
      }}
      onPointerMissed={() => sceneProps.onHover(null)}
      aria-hidden
      tabIndex={-1}
    >
      <Scene {...sceneProps} />
    </Canvas>
  );
}

/** Memoised so parent re-renders never remount the canvas. */
export default memo(InferenceNetwork);
