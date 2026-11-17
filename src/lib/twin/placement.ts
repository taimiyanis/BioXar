import { blockDims, blockTop, footprintsOverlap, passportId, type PlacedBlock } from "@/data/bioxar";

export interface Room { w: number; d: number }
export const SNAP = 0.25;
export const snap = (v: number, s = SNAP) => Math.round(v / s) * s;
const r3 = (v: number) => Math.round(v * 1000) / 1000;

/** Height a block lands at: on the floor or on the highest block under its footprint. */
export function restingY(c: PlacedBlock, blocks: PlacedBlock[]) {
  const probe = { ...c, y: 0 };
  let y = 0;
  for (const b of blocks) if (b.id !== c.id && footprintsOverlap(probe, b)) y = Math.max(y, blockTop(b));
  return r3(y);
}

/** Drops every block onto whatever is under it, lowest first. */
export function settle(blocks: PlacedBlock[]) {
  const order = blocks.map((b, i) => ({ b, i })).sort((p, q) => p.b.y - q.b.y);
  const done: PlacedBlock[] = [];
  const out = [...blocks];
  for (const { b, i } of order) {
    const nb = { ...b, y: restingY(b, done) };
    done.push(nb);
    out[i] = nb;
  }
  return out;
}

export function halfExtents(b: Pick<PlacedBlock, "rotY" | "orientation">) {
  const { fx, fz } = blockDims(b.orientation);
  const t = (b.rotY * Math.PI) / 180, c = Math.abs(Math.cos(t)), s = Math.abs(Math.sin(t));
  return { ex: (c * fx + s * fz) / 2, ez: (s * fx + c * fz) / 2 };
}

const square = (deg: number) => Math.abs(((deg % 90) + 90) % 90) < 0.5 || Math.abs(((deg % 90) + 90) % 90) > 89.5;

/**
 * Where a new block goes when you aim at a block (snapping from the 3D build space).
 * On top: each axis picks the first, middle or last third of the top face, so the new block lines up
 * with one edge, the centre or the other edge. On a side: the new block sits flush against that face,
 * and the aimed third of the face picks the alignment along it. Height still comes from restingY.
 * Returns null for blocks turned at a free angle (scenarios like the listening circle): no snapping there.
 */
export function snapAgainst(hit: PlacedBlock, p: { x: number; y: number; z: number }, ghost: Pick<PlacedBlock, "rotY" | "orientation">): { x: number; z: number } | null {
  if (!square(hit.rotY) || !square(ghost.rotY)) return null;
  const h = halfExtents(hit), g = halfExtents(ghost);
  const third = (centre: number, half: number, gHalf: number, aim: number) => {
    const t = (aim - (centre - half)) / (2 * half);
    if (t < 1 / 3) return centre - half + gHalf;
    if (t > 2 / 3) return centre + half - gHalf;
    return centre;
  };
  if (Math.abs(p.y - blockTop(hit)) < 0.03) return { x: r3(third(hit.x, h.ex, g.ex, p.x)), z: r3(third(hit.z, h.ez, g.ez, p.z)) };
  const dx = (p.x - hit.x) / h.ex, dz = (p.z - hit.z) / h.ez;
  if (Math.abs(dx) >= Math.abs(dz)) return { x: r3(hit.x + Math.sign(dx || 1) * (h.ex + g.ex)), z: r3(third(hit.z, h.ez, g.ez, p.z)) };
  return { x: r3(third(hit.x, h.ex, g.ex, p.x)), z: r3(hit.z + Math.sign(dz || 1) * (h.ez + g.ez)) };
}

export function outsideRoom(b: PlacedBlock, room: Room) {
  const { ex, ez } = halfExtents(b);
  const e = 0.005;
  return Math.abs(b.x) + ex > room.w / 2 + e || Math.abs(b.z) + ez > room.d / 2 + e;
}

export function nextId(blocks: PlacedBlock[]) {
  const max = blocks.reduce((m, b) => Math.max(m, Number(b.id.slice(1)) || 0), 0);
  return passportId(max + 1);
}

/** Finds a free floor spot for a piece, spiralling out from the room centre. */
export function placePiece(specs: Omit<PlacedBlock, "id">[], blocks: PlacedBlock[], room: Room): PlacedBlock[] {
  let n = Number(nextId(blocks).slice(1));
  const withIds = (dx: number, dz: number) => specs.map((s) => ({ ...s, x: r3(s.x + dx), z: r3(s.z + dz), id: passportId(n++) }));
  for (let ring = 0; ring < 12; ring++) {
    for (let i = -ring; i <= ring; i++) for (let j = -ring; j <= ring; j++) {
      if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
      n = Number(nextId(blocks).slice(1));
      const cand = withIds(i * 0.5, j * 0.5);
      const free = cand.every((c) => !outsideRoom(c, room) && !blocks.some((b) => footprintsOverlap({ ...c, y: 0 }, b, -0.3)));
      if (free) return cand;
    }
  }
  n = Number(nextId(blocks).slice(1));
  return withIds(0, 0);
}
