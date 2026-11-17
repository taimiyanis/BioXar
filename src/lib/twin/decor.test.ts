import { describe, expect, it } from "vitest";
import { computeStats, type PlacedBlock } from "@/data/bioxar";
import { decorRestY } from "./decor";
import { decodeDesign, encodeDesign } from "./share";
import { useTwin } from "./store";

const block = (x = 0, o: PlacedBlock["orientation"] = "side"): PlacedBlock => ({ id: "#0001", x, y: 0, z: 0, rotY: 0, orientation: o, colour: "sage" });

describe("objects for scale", () => {
  it("rest on the floor, or on top of the block under them", () => {
    expect(decorRestY(2, 2, [block()])).toBe(0);
    expect(decorRestY(0.1, 0, [block()])).toBe(0.5);
    expect(decorRestY(0, 0, [block(0, "standing")])).toBe(0.6);
  });
  it("travel in the share link", () => {
    const out = decodeDesign(encodeDesign([block()], { w: 6, d: 5 }, [{ id: "d1", kind: "plant", x: 0, y: 0.5, z: 0, rotY: 90 }]))!;
    expect(out.decor).toEqual([{ id: "d1", kind: "plant", x: 0, y: 0.5, z: 0, rotY: 90 }]);
  });
  it("old share links without objects still open", () => {
    const old = btoa(JSON.stringify({ r: [6, 5], b: [[0, 0, 0, 0, 1, 0, 1]] }));
    expect(decodeDesign(old)!.decor).toEqual([]);
  });
  it("are never counted, drop when the block under them goes, and undo with the blocks", () => {
    const t = useTwin.getState();
    t.clear();
    t.addBlock({ x: 0, y: 0, z: 0, rotY: 0, orientation: "side", colour: "sage", seat: true });
    useTwin.getState().addDecor({ kind: "pillow", x: 0, z: 0, rotY: 0 });
    let s = useTwin.getState();
    expect(s.decor[0]!.y).toBe(0.5);
    expect(computeStats(s.blocks).count).toBe(1);
    s.set({ selectedId: s.blocks[0]!.id });
    useTwin.getState().deleteSelected();
    expect(useTwin.getState().decor[0]!.y).toBe(0);
    useTwin.getState().undo();
    s = useTwin.getState();
    expect(s.blocks).toHaveLength(1);
    expect(s.decor[0]!.y).toBe(0.5);
    useTwin.getState().clear();
    expect(useTwin.getState().decor).toEqual([]);
  });
});
