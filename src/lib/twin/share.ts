import { COLOURS, passportId, type PlacedBlock } from "@/data/bioxar";
import { DECOR, decorRestY, type DecorItem } from "./decor";
import type { Room } from "./placement";

/** Compact, URL-safe encoding of a design: room, blocks and (when there are any) objects. */
export function encodeDesign(blocks: PlacedBlock[], room: Room, decor: DecorItem[] = []) {
  const rows = blocks.map((b) => [b.x, b.y, b.z, b.rotY, b.orientation === "side" ? 1 : 0, COLOURS.findIndex((c) => c.id === b.colour), b.seat ? 1 : 0]);
  const objects = decor.map((d) => [DECOR.findIndex((k) => k.id === d.kind), d.x, d.z, d.rotY]);
  return btoa(JSON.stringify({ r: [room.w, room.d], b: rows, ...(objects.length ? { o: objects } : {}) })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeDesign(s: string): { blocks: PlacedBlock[]; room: Room; decor: DecorItem[] } | null {
  try {
    const json = JSON.parse(atob(s.replace(/-/g, "+").replace(/_/g, "/")));
    const blocks: PlacedBlock[] = (json.b as number[][]).map(([x, y, z, rotY, o, c, seat], i) => ({
      id: passportId(i + 1), x: x!, y: y!, z: z!, rotY: rotY!, orientation: o ? "side" : "standing", colour: COLOURS[c!]?.id ?? "sage", ...(seat ? { seat: true } : {}),
    }));
    const decor: DecorItem[] = ((json.o ?? []) as number[][]).flatMap(([k, x, z, rotY], i) => {
      const kind = DECOR[k!]?.id;
      return kind ? [{ id: `d${i + 1}`, kind, x: x!, z: z!, rotY: rotY!, y: decorRestY(x!, z!, blocks) }] : [];
    });
    return { blocks, room: { w: Number(json.r[0]), d: Number(json.r[1]) }, decor };
  } catch {
    return null;
  }
}
