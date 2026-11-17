import { describe, expect, it } from "vitest";
import { getLayout, type PlacedBlock } from "@/data/bioxar";
import { outsideRoom, placePiece, restingY, settle } from "./placement";
import { decodeDesign, encodeDesign } from "./share";
import { PIECES } from "@/data/bioxar";

const b = (id: string, x: number, y: number, o: PlacedBlock["orientation"] = "standing"): PlacedBlock => ({ id, x, y, z: 0, rotY: 0, orientation: o, colour: "sage" });

describe("twin placement", () => {
  it("stacks a standing block on top of another at 60 cm", () => {
    expect(restingY(b("g", 0, 0), [b("#0001", 0, 0)])).toBe(0.6);
  });
  it("a side block on top lands at 50 cm", () => {
    expect(restingY(b("g", 0, 0), [b("#0001", 0, 0, "side")])).toBe(0.5);
  });
  it("blocks drop when the one below is removed", () => {
    expect(settle([b("#0002", 0, 0.6)])[0]!.y).toBe(0);
  });
  it("every default scenario fits the 10 x 9 m room", () => {
    for (const id of ["listening-circle", "talk-panel", "dj-stage", "bar-counter", "shelving-wall"] as const)
      expect(getLayout(id).build().filter((x) => outsideRoom(x, { w: 10, d: 9 }))).toHaveLength(0);
  });
  it("flags a block past the wall", () => {
    expect(outsideRoom(b("x", 4.9, 0), { w: 10, d: 9 })).toBe(true);
  });
  it("adds a piece on free floor without overlap", () => {
    const blocks = getLayout("listening-circle").build();
    const added = placePiece(PIECES.find((p) => p.id === "bench")!.build(), blocks, { w: 10, d: 9 });
    expect(added).toHaveLength(3);
    expect(added[0]!.id).toBe("#0019");
  });
  it("share link round-trips a design", () => {
    const blocks = getLayout("talk-panel").build();
    const out = decodeDesign(encodeDesign(blocks, { w: 12, d: 8 }))!;
    expect(out.blocks).toEqual(blocks);
    expect(out.room).toEqual({ w: 12, d: 8 });
  });
});
