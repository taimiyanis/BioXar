import { blockDims, blockTop, type PlacedBlock } from "@/data/bioxar";

// Everyday objects for scale (from the 3D build space). Not BioXar blocks: never counted in
// block count, price, weight or carbon.
export type DecorKind = "pillow" | "books" | "plant" | "lamp" | "mug";

/** Life-size footprint (w along x, d along z) and height, in metres. */
export const DECOR: { id: DecorKind; name: string; w: number; d: number; h: number }[] = [
  { id: "pillow", name: "Pillow", w: 0.45, d: 0.45, h: 0.15 },
  { id: "books", name: "Books", w: 0.25, d: 0.2, h: 0.2 },
  { id: "plant", name: "Plant", w: 0.3, d: 0.3, h: 0.6 },
  { id: "lamp", name: "Lamp", w: 0.25, d: 0.25, h: 0.5 },
  { id: "mug", name: "Mug", w: 0.1, d: 0.1, h: 0.1 },
];
export const decorSpec = (k: DecorKind) => DECOR.find((d) => d.id === k)!;

/** An object in the room. Metres. x/z = centre, y = bottom height, rotY in degrees. */
export interface DecorItem {
  id: string;
  kind: DecorKind;
  x: number;
  y: number;
  z: number;
  rotY: number;
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;

/** True when the point (x, z) is over the block's footprint. */
export function overBlock(b: PlacedBlock, x: number, z: number) {
  const { fx, fz } = blockDims(b.orientation);
  const t = (-b.rotY * Math.PI) / 180, dx = x - b.x, dz = z - b.z;
  const lx = dx * Math.cos(t) + dz * Math.sin(t), lz = -dx * Math.sin(t) + dz * Math.cos(t);
  return Math.abs(lx) <= fx / 2 + 0.001 && Math.abs(lz) <= fz / 2 + 0.001;
}

/** An object rests on the floor or on top of the highest block under its centre. */
export function decorRestY(x: number, z: number, blocks: PlacedBlock[]) {
  let y = 0;
  for (const b of blocks) if (overBlock(b, x, z)) y = Math.max(y, blockTop(b));
  return r3(y);
}

export function nextDecorId(items: DecorItem[]) {
  return `d${items.reduce((m, d) => Math.max(m, Number(d.id.slice(1)) || 0), 0) + 1}`;
}
