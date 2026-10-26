"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { chapterProgress, chapterVisibility, labelRegistry, useJourney } from "@/store/journey";
import { fitToStage } from "./stage";

const ACCENT = new THREE.Color("#3be3f5");
const CHAPTER = 3;

/** Node layout (local units); the whole diagram is fitted into the chapter's stage column. */
const NODES: Record<string, [number, number, number]> = {
  "mb-app": [-0.55, -2.35, 0.3],
  "mb-sdk": [0, 0, 0],
  "mb-gateway": [1.5, 0.8, -0.4],
  "mb-openrouter": [2.7, -0.3, 0.2],
  "mb-gemini": [3.8, 0.55, -0.2],
  "mb-chat": [0.5, 1.95, 0.5],
  "mb-models": [1.1, -1.75, 0.4],
  "mb-usage": [-0.4, -2.1, -0.4],
  "mb-credits": [-0.4, 1.95, -0.5],
};
const CHAIN = ["mb-app", "mb-sdk", "mb-gateway", "mb-openrouter", "mb-gemini"];
/** Bounding box of the diagram plus room for labels under the nodes. */
const CENTER = new THREE.Vector3(1.625, -0.25, 0);
const CONTENT = { w: 5.2, h: 5 };
const RESOURCES = ["mb-chat", "mb-models", "mb-usage", "mb-credits"];

function link(a: THREE.Vector3, b: THREE.Vector3) {
  const dx = (b.x - a.x) * 0.5;
  return new THREE.CubicBezierCurve3(
    a,
    a.clone().add(new THREE.Vector3(dx, 0, 0)),
    b.clone().sub(new THREE.Vector3(dx, 0, 0)),
    b,
  );
}

const scratch = new THREE.Vector3();
const world = new THREE.Vector3();
const smooth = (x: number) => THREE.MathUtils.smoothstep(x, 0, 1);

/**
 * Chapter 03: the gateway diagram. Tubes grow with scroll, a request packet
 * travels to the model and streamed chunks return. Fitted to the empty
 * stage column beside the copy; a label that would leave the stage is hidden.
 */
export function ModelBridgeScene({ mobile }: { mobile: boolean }) {
  const stage = useRef<THREE.Group>(null);
  const group = useRef<THREE.Group>(null);
  const labelWidths = useRef(new Map<string, number>());
  const packet = useRef<THREE.Mesh>(null);
  const chunks = useRef<(THREE.Mesh | null)[]>([]);
  // Meshes whose geometry draw range and material opacity change every frame.
  const chainMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const fanMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const nodeMesh = useRef<THREE.Mesh | null>(null);

  const built = useMemo(() => {
    const at = (id: string) => new THREE.Vector3(...NODES[id]);
    const chainCurves = CHAIN.slice(0, -1).map((id, i) => link(at(id), at(CHAIN[i + 1])));
    const path = new THREE.CurvePath<THREE.Vector3>();
    chainCurves.forEach((c) => path.add(c));
    const tube = (curve: THREE.Curve<THREE.Vector3>, r: number) => new THREE.TubeGeometry(curve, 48, r, 6, false);
    return {
      path,
      chain: chainCurves.map((c) => tube(c, 0.018)),
      fan: RESOURCES.map((id) => tube(link(at("mb-sdk"), at(id)), 0.009)),
      node: new THREE.OctahedronGeometry(0.12, 0),
      hub: new THREE.OctahedronGeometry(0.26, 0),
      packet: new THREE.SphereGeometry(0.07, 16, 16),
      chunk: new THREE.BoxGeometry(0.12, 0.04, 0.04),
      chainMat: new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, toneMapped: false }),
      fanMat: new THREE.MeshBasicMaterial({ color: "#5b8fa0", transparent: true, opacity: 0, toneMapped: false }),
      nodeMat: new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, toneMapped: false }),
      glowMat: new THREE.MeshBasicMaterial({
        color: new THREE.Color("#bff8ff").multiplyScalar(2.2),
        transparent: true,
        opacity: 0,
        toneMapped: false,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      [...built.chain, ...built.fan, built.node, built.hub, built.packet, built.chunk].forEach((g) => g.dispose());
      [built.chainMat, built.fanMat, built.nodeMat, built.glowMat].forEach((m) => m.dispose());
    },
    [built],
  );

  useFrame((state) => {
    const { t } = useJourney.getState();
    const g = group.current;
    const outer = stage.current;
    if (!g || !outer) return;
    const { camera, size } = state;
    // Exactly 0 outside chapter 03; exits over the last 18% of the pin.
    let vis = chapterVisibility(t, CHAPTER, 0.08, 0.18);
    const fit =
      vis > 0 ? fitToStage("modelbridge", outer, camera as THREE.PerspectiveCamera, size, CONTENT.w, CONTENT.h) : null;
    vis = fit?.visible ? vis * fit.opacity : 0;
    g.visible = vis > 0;
    if (!g.visible) {
      for (const id of Object.keys(NODES)) {
        const el = labelRegistry.get(id);
        if (el) el.style.display = "none";
      }
      return;
    }
    const p = chapterProgress(t, CHAPTER);

    // Tubes draw on from the SDK outward.
    const grow = smooth(THREE.MathUtils.clamp(p / 0.28, 0, 1));
    const fanGrow = smooth(THREE.MathUtils.clamp((p - 0.08) / 0.3, 0, 1));
    const count = chainMeshes.current.length;
    chainMeshes.current.forEach((mesh, i) => {
      if (!mesh) return;
      const local = THREE.MathUtils.clamp(grow * count - i, 0, 1);
      mesh.geometry.setDrawRange(0, Math.floor((mesh.geometry.index?.count ?? 0) * local));
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.85 * vis;
    });
    fanMeshes.current.forEach((mesh) => {
      if (!mesh) return;
      mesh.geometry.setDrawRange(0, Math.floor((mesh.geometry.index?.count ?? 0) * fanGrow));
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.6 * vis;
    });
    if (nodeMesh.current) (nodeMesh.current.material as THREE.MeshBasicMaterial).opacity = vis;

    // Request travels out over p 0.28–0.6; streamed chunks return over 0.6–0.92.
    const out = THREE.MathUtils.clamp((p - 0.28) / 0.32, 0, 1);
    if (packet.current) {
      built.path.getPointAt(out, scratch);
      packet.current.position.copy(scratch);
      packet.current.visible = vis > 0.01 && out > 0 && out < 1;
    }
    if (packet.current) (packet.current.material as THREE.MeshBasicMaterial).opacity = vis;
    chunks.current.forEach((chunk, i) => {
      if (!chunk) return;
      const back = THREE.MathUtils.clamp((p - 0.6 - i * 0.045) / 0.22, 0, 1);
      built.path.getPointAt(1 - back, scratch);
      chunk.position.copy(scratch);
      chunk.visible = vis > 0.01 && back > 0 && back < 1;
    });

    // Project node positions to place the HTML labels, kept inside the stage.
    const rect = fit!.rect!;
    g.updateMatrixWorld();
    for (const [id, local] of Object.entries(NODES)) {
      const el = labelRegistry.get(id);
      if (!el) continue;
      world.set(...local);
      g.localToWorld(world);
      world.project(camera);
      // Small screens label only the main chain; the fan stays unlabeled.
      const crowded = mobile && (id === "mb-app" || RESOURCES.includes(id));
      const shown = crowded ? 0 : id === "mb-sdk" || RESOURCES.includes(id) ? fanGrow : grow;
      const x = (world.x * 0.5 + 0.5) * size.width;
      const y = (-world.y * 0.5 + 0.5) * size.height;
      let w = labelWidths.current.get(id);
      if (w === undefined || w === 0) {
        el.style.display = "";
        w = el.offsetWidth;
        labelWidths.current.set(id, w);
      }
      const inside = x - w / 2 >= rect.left && x + w / 2 <= rect.right && y >= rect.top && y + 36 <= rect.bottom;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, 16px)`;
      el.style.display = inside ? "" : "none";
      el.style.opacity = String(vis * shown);
    }
  });

  return (
    <group ref={stage}>
      <group ref={group} position={[-CENTER.x, -CENTER.y, 0]}>
        {built.chain.map((geo, i) => (
          <mesh
            key={`c${i}`}
            ref={(m) => {
              chainMeshes.current[i] = m;
            }}
            geometry={geo}
            material={built.chainMat}
          />
        ))}
        {built.fan.map((geo, i) => (
          <mesh
            key={`f${i}`}
            ref={(m) => {
              fanMeshes.current[i] = m;
            }}
            geometry={geo}
            material={built.fanMat}
          />
        ))}
        {Object.entries(NODES).map(([id, p], i) => (
          <mesh
            key={id}
            ref={i === 0 ? nodeMesh : undefined}
            position={p}
            geometry={id === "mb-sdk" ? built.hub : built.node}
            material={built.nodeMat}
          />
        ))}
        <mesh ref={packet} geometry={built.packet} material={built.glowMat} visible={false} />
        {Array.from({ length: 5 }, (_, i) => (
          <mesh
            key={`k${i}`}
            ref={(m) => {
              chunks.current[i] = m;
            }}
            geometry={built.chunk}
            material={built.glowMat}
            visible={false}
          />
        ))}
      </group>
    </group>
  );
}
