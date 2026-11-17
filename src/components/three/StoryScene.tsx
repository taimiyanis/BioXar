import { useFrame } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { BlockInstances } from "./BlockInstances";
import { Stage } from "./Stage";
import { MaterialParticles } from "./MaterialParticles";
import { getLayout, passportId, PIECES, type PlacedBlock } from "@/data/bioxar";
/** The four story steps: 0 Shape, 1 Material, 2 Spaces, 3 Carbon. Each object is scaled to fill the stage. */
const FRAMING = [
  { scale: 2.9, look: 0.85 },
  { scale: 1.9, look: 0.35 },
  { scale: 1.0, look: 0.55 },
  { scale: 0.62, look: 0.2 },
];
function Story({ step }: { step: number }) {
  const group = useRef<Group>(null);
  const blocks = useMemo<PlacedBlock[]>(() => {
    if (step >= 2) return getLayout(step === 2 ? "bar-counter" : "listening-circle").build();
    const specs = PIECES.find((p) => p.id === "stool")?.build() ?? [];
    return specs.map((b, i) => ({ ...b, id: passportId(i + 1), orientation: "standing" }));
  }, [step]);
  useFrame((_, dt) => {
    if (group.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      group.current.rotation.y += Math.min(dt, 0.05) * 0.16;
  });
  const f = FRAMING[step] ?? FRAMING[0]!;
  return (
    <group ref={group} scale={f.scale}>
      {step === 1 ? <MaterialParticles /> : <BlockInstances blocks={blocks} />}
    </group>
  );
}
function StoryCamera({ step }: { step: number }) {
  const camera = useThree(s => s.camera);
  const size = useThree(s => s.size);
  const look = (FRAMING[step] ?? FRAMING[0]!).look;
  const current = useRef(look);
  useFrame((_, dt) => {
    current.current += (look - current.current) * Math.min(1, dt * 4);
    // Phones: the site header covers the top of the sticky stage, so pull back and keep the object low.
    const narrow = size.width < 640;
    const y = current.current + (narrow ? 0.3 : 0);
    const distance = 5.4 * Math.max(1, size.height / size.width * .75) * (narrow ? 1.3 : 1);
    camera.position.set(distance * .55, y + distance * .44, distance * .74);
    camera.lookAt(0, y, 0);
  });
  return null;
}
export default function StoryScene({ step }: { step: number }) {
  return (
    <Stage className="h-full" transparent camera={{ position: [3, 2.4, 4], fov: 38 }} target={[0, 0.4, 0]}>
      <StoryCamera step={step} />
      <Story step={step} />
    </Stage>
  );
}
