import type React from "react";
import { Html, OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Stage } from "@/components/three/Stage";
import { BlockInstances } from "@/components/three/BlockInstances";
import { BLOCK, LAB_PASSPORT, type ColourId, type PlacedBlock } from "@/data/bioxar";
import { MaterialParticles } from "@/components/three/MaterialParticles";

function Label({ position, title, text }: { position: [number, number, number]; title: string; text: string }) {
  return (
    <Html position={position} center zIndexRange={[10, 0]}>
      <div className="w-48 rounded-lg border border-border bg-card px-3 py-2 text-card-foreground">
        <p className="font-label text-sm text-primary">{title}</p>
        <p className="text-sm">{text}</p>
      </div>
    </Html>
  );
}

function Shell({ stage, children }: { stage: number; children: React.ReactNode }) {
  const shell = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = shell.current;
    if (!g) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ty = stage === 0 ? 0 : 0.75;
    g.position.y = reduced ? ty : THREE.MathUtils.damp(g.position.y, ty, 4, Math.min(dt, 0.05));
    const ts = stage === 1 ? 0.7 : 1;
    g.scale.setScalar(reduced ? ts : THREE.MathUtils.damp(g.scale.x, ts, 4, Math.min(dt, 0.05)));
  });
  return <group ref={shell}>{children}</group>;
}

/** stage 0 whole, 1 exploded (shell lifted, material below), 2 raw materials only. */
export default function LabScene({ colour, stage }: { colour: ColourId; stage: number }) {
  const blocks = useMemo<PlacedBlock[]>(
    () => [{ id: LAB_PASSPORT, x: 0, y: 0, z: 0, rotY: 0, orientation: "standing", colour }],
    [colour],
  );
  const W = BLOCK.sizeCm.w / 100, H = BLOCK.sizeCm.h / 100;
  return (
    <Stage className="h-[420px] sm:h-[520px]" camera={{ position: [1.7, 1.4, 2.4], fov: 38 }} target={[0, 0.35, 0]}>
      <OrbitControls makeDefault minDistance={1} maxDistance={5} maxPolarAngle={Math.PI / 2} target={[0, 0.35, 0]} />
      {stage < 2 && (
        <Shell stage={stage}>
          <BlockInstances blocks={blocks} ghost={stage === 1} />
        </Shell>
      )}
      {stage > 0 && <MaterialParticles />}
      {stage === 0 && (
        <>
          <Label key="core" position={[-W / 2 - 0.45, H * 0.2, 0.3]} title="One piece" text={`${BLOCK.sizeCm.w} × ${BLOCK.sizeCm.d} × ${BLOCK.sizeCm.h} cm. Hollow core ${BLOCK.holeCm.w} × ${BLOCK.holeCm.h} cm: a handle, a shelf, a lighter block.`} />
        </>
      )}
      {stage === 1 && <Label position={[0.7, 0.95, 0]} title="Shell" text={`${BLOCK.weightKg} kg. Same material all the way through.`} />}
      {stage > 0 && (
        <>
          <Label position={[-0.8, 0.15, 0.2]} title={`Biochar ${BLOCK.composition.biocharPct}%`} text={`${BLOCK.composition.biocharKg} kg. Crop residues heated with little oxygen. Holds the carbon.`} />
          <Label position={[0.8, 0.15, -0.2]} title={`Binder ${BLOCK.composition.binderPct}%`} text={`${BLOCK.composition.binderKg} kg. Kraft lignin, a plant-based binder from wood pulping.`} />
        </>
      )}
    </Stage>
  );
}
