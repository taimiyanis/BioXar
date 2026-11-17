import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BLOCK, colourHex } from "@/data/bioxar";
import { getSpeckleTexture } from "./blockGeometry";
export function MaterialParticles({ spread = true }: { spread?: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const progress = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () =>
      Array.from({ length: 180 }, (_, i) => {
        const bio = i < Math.round((180 * BLOCK.composition.biocharPct) / 100);
        const j = bio ? i : i - Math.round((180 * BLOCK.composition.biocharPct) / 100);
        return {
          bio,
          x: (bio ? -0.48 : 0.48) + Math.sin(j * 2.4) * (0.12 + (j % 7) * 0.015),
          z: Math.cos(j * 2.4) * (0.12 + (j % 5) * 0.02),
          y: 0.025 + Math.floor(j / 25) * 0.026,
          sx: Math.sin(i * 2.4) * 0.23,
          sy: 0.05 + ((i % 19) / 19) * 0.5,
          sz: Math.cos(i * 2.4) * 0.2,
        };
      }),
    [],
  );
  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const target = spread ? 1 : 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    progress.current = reduced
      ? target
      : THREE.MathUtils.damp(progress.current, target, 3, Math.min(delta, 0.05));
    data.forEach((p, i) => {
      dummy.position.set(
        THREE.MathUtils.lerp(p.sx, p.x, progress.current),
        THREE.MathUtils.lerp(p.sy, p.y, progress.current),
        THREE.MathUtils.lerp(p.sz, p.z, progress.current),
      );
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, new THREE.Color(colourHex(p.bio ? "charcoal" : "cream")));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, data.length]} frustumCulled={false}>
      <icosahedronGeometry args={[0.026, 0]} />
      <meshStandardMaterial map={getSpeckleTexture()} roughness={1} />
    </instancedMesh>
  );
}
