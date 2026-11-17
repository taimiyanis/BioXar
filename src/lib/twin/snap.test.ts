import { describe, expect, it } from "vitest";
import type { PlacedBlock } from "@/data/bioxar";
import { restingY, snapAgainst } from "./placement";

const blk = (o: PlacedBlock["orientation"] = "standing", rotY = 0, x = 0, z = 0): PlacedBlock => ({ id: "#0001", x, y: 0, z, rotY, orientation: o, colour: "sage" });
const standing = { rotY: 0, orientation: "standing" as const };
const side = { rotY: 0, orientation: "side" as const };

describe("snapping against a block", () => {
  it("sits flush against the right side, centred", () => {
    expect(snapAgainst(blk(), { x: 0.25, y: 0.3, z: 0 }, standing)).toEqual({ x: 0.5, z: 0 });
  });
  it("sits flush against the front, centred", () => {
    expect(snapAgainst(blk(), { x: 0, y: 0.3, z: 0.25 }, standing)).toEqual({ x: 0, z: 0.5 });
  });
  it("a side block next to a standing one lines up with either end or the centre", () => {
    // Aiming at the right face of a standing block: side block is 60 cm along x, 50 along z.
    expect(snapAgainst(blk(), { x: 0.25, y: 0.3, z: -0.2 }, side)).toEqual({ x: 0.55, z: 0 });
    // Standing block next to the long face of a side block: 3 spots along its 60 cm.
    expect(snapAgainst(blk("side"), { x: -0.25, y: 0.2, z: 0.25 }, standing)).toEqual({ x: -0.05, z: 0.5 });
    expect(snapAgainst(blk("side"), { x: 0, y: 0.2, z: 0.25 }, standing)).toEqual({ x: 0, z: 0.5 });
    expect(snapAgainst(blk("side"), { x: 0.25, y: 0.2, z: 0.25 }, standing)).toEqual({ x: 0.05, z: 0.5 });
  });
  it("on top, picks an edge or the centre on each axis", () => {
    const base = blk("side"); // top at 50 cm, 60 x 50 footprint
    expect(snapAgainst(base, { x: 0, y: 0.5, z: 0 }, standing)).toEqual({ x: 0, z: 0 });
    expect(snapAgainst(base, { x: -0.28, y: 0.5, z: 0 }, standing)).toEqual({ x: -0.05, z: 0 });
    expect(snapAgainst(base, { x: 0.28, y: 0.5, z: 0.2 }, standing)).toEqual({ x: 0.05, z: 0 });
  });
  it("works for blocks turned 90 degrees", () => {
    expect(snapAgainst(blk("side", 90), { x: 0.25, y: 0.2, z: 0 }, standing)).toEqual({ x: 0.5, z: 0 });
  });
  it("does not snap to blocks at a free angle", () => {
    expect(snapAgainst(blk("side", 22.5), { x: 0.3, y: 0.2, z: 0 }, standing)).toBeNull();
  });
  it("a block placed beside another still rests on the floor", () => {
    const base = blk();
    const at = snapAgainst(base, { x: 0.25, y: 0.3, z: 0 }, standing)!;
    expect(restingY({ ...blk(), id: "g", ...at }, [base])).toBe(0);
  });
});
