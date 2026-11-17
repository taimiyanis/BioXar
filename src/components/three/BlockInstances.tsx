import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { blockDims, colourHex, type PlacedBlock } from "@/data/bioxar";
import { getBlockGeometry, getSpeckleTexture, loadRealBlockGeometry } from "./blockGeometry";

const tmp = new THREE.Object3D();
const col = new THREE.Color();

/** The real product shape once its file has loaded; the drawn shape until then (or if loading fails). */
function useBlockGeometry() {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry>(() => getBlockGeometry());
  useEffect(() => {
    let live = true;
    loadRealBlockGeometry().then((g) => { if (live) setGeometry(g); }, () => {});
    return () => { live = false; };
  }, []);
  return geometry;
}

/** Draws any number of blocks as one instanced mesh. */
type Handler = ((block: PlacedBlock, e: any) => void) | undefined;
export function BlockInstances({ blocks, castShadow = true, onPointerDown, onPointerMove, onClick, ghost = false }: { blocks: PlacedBlock[]; castShadow?: boolean; onPointerDown?: Handler; onPointerMove?: Handler; onClick?: Handler; ghost?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useBlockGeometry();
  const material = useMemo(() => new THREE.MeshStandardMaterial({ map: getSpeckleTexture(), bumpMap: getSpeckleTexture(), bumpScale: 1.2, roughness: 0.95, metalness: 0, ...(ghost ? { transparent: true, opacity: 0.45, depthWrite: false } : {}) }), [ghost]);
  const capacity = Math.max(blocks.length, 1);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    blocks.forEach((b, i) => {
      const { h } = blockDims(b.orientation);
      tmp.position.set(b.x, b.y + h / 2, b.z);
      tmp.rotation.set(0, (b.rotY * Math.PI) / 180, b.orientation === "side" ? Math.PI / 2 : 0, "YXZ");
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
      mesh.setColorAt(i, col.set(colourHex(b.colour)).offsetHSL(0, 0, ((i * 37) % 11 - 5) * 0.004));
    });
    mesh.count = blocks.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [blocks, geometry]);

  return (
    <instancedMesh
      key={capacity > 64 ? Math.ceil(capacity / 64) : 1}
      ref={ref}
      args={[geometry, material, Math.max(64, Math.ceil(capacity / 64) * 64)]}
      castShadow={castShadow}
      receiveShadow
      {...(ghost ? { raycast: () => null } : {})}
      {...wrap("onPointerDown", onPointerDown, blocks)}
      {...wrap("onPointerMove", onPointerMove, blocks)}
      {...wrap("onClick", onClick, blocks)}
    />
  );
}

function wrap(name: string, fn: Handler, blocks: PlacedBlock[]) {
  if (!fn) return {};
  return { [name]: (e: any) => { e.stopPropagation(); const b = blocks[e.instanceId ?? -1]; if (b) fn(b, e); } };
}
