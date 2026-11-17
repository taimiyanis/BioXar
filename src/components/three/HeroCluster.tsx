import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { M, type PlacedBlock } from "@/data/bioxar";
import { BlockInstances } from "./BlockInstances";
import { Stage } from "./Stage";

function Cluster() {
  const g = useRef<Group>(null);
  const blocks = useMemo<PlacedBlock[]>(() => [
    { id: "#0001", x: -0.3, y: 0, z: 0.05, rotY: 0, orientation: "side", colour: "terracotta" },
    { id: "#0002", x: 0.32, y: 0, z: -0.1, rotY: 0, orientation: "standing", colour: "charcoal" },
    { id: "#0003", x: -0.3, y: M.w, z: 0.05, rotY: 0, orientation: "standing", colour: "sage" },
    { id: "#0004", x: 0.25, y: 0, z: 0.55, rotY: 90, orientation: "standing", colour: "cream" },
  ], []);
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += Math.min(dt, 0.05) * 0.25; });
  return <group ref={g} position={[0, 0, -0.15]}><BlockInstances blocks={blocks} /></group>;
}

export default function HeroCluster({ className }: { className?: string | undefined }) {
  return (
    <Stage className={className} camera={{ position: [2.6, 1.9, 3.2], fov: 30 }} target={[0, 0.5, 0]}>
      <Cluster />
    </Stage>
  );
}
