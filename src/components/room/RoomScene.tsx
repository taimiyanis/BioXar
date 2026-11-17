import { useMemo } from "react";
import { Stage } from "@/components/three/Stage";
import { BlockInstances } from "@/components/three/BlockInstances";
import { type PlacedBlock } from "@/data/bioxar";
export default function RoomScene({
  blocks,
  scale,
  rotation,
  floor,
}: {
  blocks: PlacedBlock[];
  scale: number;
  rotation: number;
  floor: number;
}) {
  const centre = useMemo(() => {
    if (!blocks.length) return { x: 0, z: 0 };
    return {
      x: (Math.min(...blocks.map((b) => b.x)) + Math.max(...blocks.map((b) => b.x))) / 2,
      z: (Math.min(...blocks.map((b) => b.z)) + Math.max(...blocks.map((b) => b.z))) / 2,
    };
  }, [blocks]);
  const centered = useMemo(
    () => blocks.map((b) => ({ ...b, x: b.x - centre.x, z: b.z - centre.z })),
    [blocks, centre],
  );
  return (
    <Stage
      className="h-full w-full"
      camera={{ position: [0, 3.4, 7], fov: 38 }}
      target={[0, 0.35, 0]}
      shadows={false}
      capture
    >
      <group scale={scale} rotation={[(floor * Math.PI) / 180, (rotation * Math.PI) / 180, 0]}>
        <BlockInstances blocks={centered} />
      </group>
    </Stage>
  );
}
