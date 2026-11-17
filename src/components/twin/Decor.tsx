import { useMemo } from "react";
import * as THREE from "three";
import { decorSpec, type DecorItem, type DecorKind } from "@/lib/twin/decor";

// Simple stylised objects for scale, modelled in metres and centred on the origin (from the 3D build space).
const COL = { pillow: "#e9e4d8", book1: "#8a9a6a", book2: "#c98f5a", book3: "#6f7f8f", pot: "#c4835b", leaf: "#6f9a5a", lampBase: "#8c8c88", shade: "#f1eadb", mug: "#f2f2ee" };

function M({ c, ghost, side }: { c: string; ghost: boolean; side?: THREE.Side }) {
  return ghost ? <meshBasicMaterial color={c} transparent opacity={0.45} depthWrite={false} /> : <meshStandardMaterial color={c} roughness={0.85} {...(side ? { side } : {})} />;
}

export function DecorModel({ kind, ghost = false }: { kind: DecorKind; ghost?: boolean }) {
  const { w, h, d: l } = decorSpec(kind);
  const leaves = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);
  const g = ghost;
  if (kind === "pillow")
    return (
      <mesh scale={[w / 2, h / 2, l / 2]} castShadow>
        <sphereGeometry args={[1, 24, 12]} />
        <M c={COL.pillow} ghost={g} />
      </mesh>
    );
  if (kind === "books")
    return (
      <>
        {[COL.book1, COL.book2, COL.book3].map((c, i) => (
          <mesh key={c} position={[0, -h / 2 + h / 6 + (i * h) / 3, 0]} rotation-y={(i - 1) * 0.12} castShadow>
            <boxGeometry args={[w * (0.95 - i * 0.08), h / 3 - 0.004, l * (0.95 - i * 0.05)]} />
            <M c={c} ghost={g} />
          </mesh>
        ))}
      </>
    );
  if (kind === "plant")
    return (
      <>
        <mesh position={[0, -h / 2 + 0.11, 0]} castShadow>
          <cylinderGeometry args={[w * 0.42, w * 0.32, 0.22, 24]} />
          <M c={COL.pot} ghost={g} />
        </mesh>
        {leaves.map((i) => {
          const a = (i / leaves.length) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * w * 0.15, 0.05 + (i % 3) * 0.05, Math.sin(a) * w * 0.15]} rotation={[Math.sin(a) * 0.5, -a, Math.cos(a) * 0.5]} scale={[0.05, 0.2, 0.015]} castShadow>
              <sphereGeometry args={[1, 10, 8]} />
              <M c={COL.leaf} ghost={g} />
            </mesh>
          );
        })}
      </>
    );
  if (kind === "lamp")
    return (
      <>
        <mesh position={[0, -h / 2 + 0.015, 0]} castShadow>
          <cylinderGeometry args={[w * 0.35, w * 0.4, 0.03, 24]} />
          <M c={COL.lampBase} ghost={g} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.008, 0.008, h * 0.7, 8]} />
          <M c={COL.lampBase} ghost={g} />
        </mesh>
        <mesh position={[0, h / 2 - 0.09, 0]} castShadow>
          <cylinderGeometry args={[w * 0.28, w * 0.48, 0.18, 24, 1, true]} />
          <M c={COL.shade} ghost={g} side={THREE.DoubleSide} />
        </mesh>
      </>
    );
  return (
    <>
      <mesh castShadow>
        <cylinderGeometry args={[w * 0.38, w * 0.36, h, 20]} />
        <M c={COL.mug} ghost={g} />
      </mesh>
      <mesh position={[w * 0.4, 0, 0]}>
        <torusGeometry args={[h * 0.22, 0.008, 8, 16]} />
        <M c={COL.mug} ghost={g} />
      </mesh>
    </>
  );
}

/** One object in the room, plus an invisible box used for clicking it. */
export function DecorPiece({ item, ghost = false, onClick }: { item: DecorItem; ghost?: boolean; onClick?: (e: any) => void }) {
  const { w, h, d } = decorSpec(item.kind);
  return (
    <group position={[item.x, item.y + h / 2, item.z]} rotation-y={(item.rotY * Math.PI) / 180}>
      <group raycast={() => null}>
        <DecorModel kind={item.kind} ghost={ghost} />
      </group>
      {!ghost && (
        <mesh {...(onClick ? { onClick } : {})}>
          <boxGeometry args={[w, h, d]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  );
}
