import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Grid, Html, Line, OrbitControls } from "@react-three/drei";
import { Stage } from "@/components/three/Stage";
import { BlockInstances } from "@/components/three/BlockInstances";
import { blockDims, blockTop, COLOURS, type PlacedBlock } from "@/data/bioxar";
import { restingY, snap, snapAgainst } from "@/lib/twin/placement";
import { decorRestY, decorSpec, type DecorItem } from "@/lib/twin/decor";
import { useTwin } from "@/lib/twin/store";
import { DecorPiece } from "./Decor";
import { WalkControls } from "./WalkControls";

function Rig() {
  const view = useTwin((s) => s.view);
  const room = useTwin((s) => s.room);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null;
  useEffect(() => {
    if (view === "walk") return;
    const aspect = (camera as THREE.PerspectiveCamera).aspect || 1;
    const d = Math.max(room.d, room.w / Math.min(aspect, 1.4)) * (aspect < 1 ? 1.1 : 1);
    if (view === "top") camera.position.set(0, d * 1.55, 0.001);
    else camera.position.set(d * 0.62, d * 0.6, d * 0.78);
    camera.lookAt(0, 0, 0);
    if (controls?.target) { controls.target.set(0, 0, 0); controls.update(); }
  }, [view, room.w, room.d, camera, controls]);
  if (view === "walk") return <WalkControls />;
  return <OrbitControls makeDefault enableRotate={view === "3d"} maxPolarAngle={1.45} minDistance={2.5} maxDistance={30} />;
}

function Selection({ b }: { b: PlacedBlock }) {
  const { fx, fz, h } = blockDims(b.orientation);
  const name = COLOURS.find((c) => c.id === b.colour)!.name;
  return <Outline x={b.x} y={b.y} z={b.z} rotY={b.rotY} w={fx} d={fz} h={h} label={`${b.id} · ${name}`} />;
}

function DecorSelection({ d }: { d: DecorItem }) {
  const s = decorSpec(d.kind);
  return <Outline x={d.x} y={d.y} z={d.z} rotY={d.rotY} w={s.w} d={s.d} h={s.h} label={s.name} />;
}

function Outline({ x, y, z, rotY, w, d, h, label }: { x: number; y: number; z: number; rotY: number; w: number; d: number; h: number; label: string }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.04, h + 0.04, d + 0.04)), [w, d, h]);
  return (
    <group position={[x, y + h / 2, z]} rotation={[0, (rotY * Math.PI) / 180, 0]}>
      <lineSegments geometry={geo}><lineBasicMaterial color="#6f7d3c" /></lineSegments>
      <Html position={[0, h / 2 + 0.2, 0]} center zIndexRange={[20, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded-full bg-card px-3 py-1 font-label text-xs text-foreground shadow">{label}</div>
      </Html>
    </group>
  );
}

type Hover = { x: number; z: number; fine?: { x: number; z: number } };

export default function TwinScene({ className }: { className?: string }) {
  const { blocks, decor, room, mode, tool, addKind, colour, orientation, ghostRot, selectedId, view } = useTwin();
  const set = useTwin((s) => s.set);
  const addBlock = useTwin((s) => s.addBlock);
  const addDecor = useTwin((s) => s.addDecor);
  const [hover, setHover] = useState<Hover | null>(null);
  const walk = view === "walk";
  const adding = mode === "play" && tool === "add" && !walk;
  const addingBlock = adding && addKind === "block";

  const ghost = useMemo<PlacedBlock | null>(() => {
    if (!addingBlock || !hover) return null;
    const g: PlacedBlock = { id: "ghost", x: hover.x, y: 0, z: hover.z, rotY: ghostRot, orientation, colour, ...(orientation === "side" ? { seat: true } : {}) };
    return { ...g, y: restingY(g, blocks) };
  }, [addingBlock, hover, ghostRot, orientation, colour, blocks]);

  const decorGhost = useMemo<DecorItem | null>(() => {
    if (!adding || addKind === "block" || !hover?.fine) return null;
    const { x, z } = hover.fine;
    return { id: "ghost", kind: addKind, x, z, y: decorRestY(x, z, blocks), rotY: ghostRot };
  }, [adding, addKind, hover, ghostRot, blocks]);

  const selected = blocks.find((b) => b.id === selectedId);
  const selectedDecor = decor.find((d) => d.id === selectedId);
  const isClick = (e: { delta: number }) => e.delta < 6 && !walk;
  const place = () => {
    if (ghost) { const { id: _id, ...rest } = ghost; addBlock(rest); }
    else if (decorGhost) addDecor({ kind: decorGhost.kind, x: decorGhost.x, z: decorGhost.z, rotY: decorGhost.rotY });
  };
  const fine = (p: THREE.Vector3) => ({ x: snap(p.x, 0.05), z: snap(p.z, 0.05) });

  const outline = useMemo(() => {
    const w = room.w / 2, d = room.d / 2;
    return [[-w, 0.002, -d], [w, 0.002, -d], [w, 0.002, d], [-w, 0.002, d], [-w, 0.002, -d]] as [number, number, number][];
  }, [room]);

  return (
    <Stage className={className} camera={{ position: [6, 5.5, 7], fov: 40 }} target={[0, 0, 0]}>
      <Rig />
      <mesh rotation-x={-Math.PI / 2} receiveShadow
        onPointerMove={(e) => { if (adding) { e.stopPropagation(); setHover({ x: snap(e.point.x), z: snap(e.point.z), fine: fine(e.point) }); } }}
        onPointerOut={() => setHover(null)}
        onClick={(e) => { if (!isClick(e)) return; if (adding) place(); else set({ selectedId: null }); }}>
        <planeGeometry args={[room.w, room.d]} />
        <meshStandardMaterial color="#dcd5c9" roughness={1} />
      </mesh>
      <Grid position={[0, 0.001, 0]} args={[room.w, room.d]} cellSize={0.5} cellThickness={0.6} cellColor="#c4bcae" sectionSize={1} sectionThickness={1} sectionColor="#b0a796" fadeDistance={60} />
      <Line points={outline} color="#6b6458" lineWidth={2} />
      <BlockInstances blocks={blocks}
        onPointerMove={adding ? (b, e) => {
          const f = fine(e.point);
          const snapped = snapAgainst(b, e.point, { rotY: ghostRot, orientation });
          if (snapped) return setHover({ ...snapped, fine: f });
          const top = Math.abs(e.point.y - blockTop(b)) < 0.03;
          setHover({ ...(top ? { x: b.x, z: b.z } : { x: snap(e.point.x), z: snap(e.point.z) }), fine: f });
        } : undefined}
        onClick={(b, e) => { if (!isClick(e)) return; if (adding) place(); else set({ selectedId: b.id }); }} />
      {decor.map((d) => (
        <DecorPiece key={d.id} item={d} onClick={(e) => { e.stopPropagation(); if (!isClick(e)) return; if (adding) place(); else set({ selectedId: d.id }); }} />
      ))}
      {ghost && <BlockInstances blocks={[ghost]} ghost castShadow={false} />}
      {decorGhost && <DecorPiece item={decorGhost} ghost />}
      {selected && !adding && !walk && <Selection b={selected} />}
      {selectedDecor && !adding && !walk && <DecorSelection d={selectedDecor} />}
    </Stage>
  );
}
