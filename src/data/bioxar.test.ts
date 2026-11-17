import { describe, expect, it } from "vitest";
import { BLOCK, LAYOUTS, PIECES, KITS, blocksCollide, carTime, computeStats, getLayout, isSupported, statsForCount, fmtKg, fmtKm, passportId, type PlacedBlock } from "./bioxar";

describe("BioXar data", () => {
  it("block weighs 7 kg and costs 200 EUR", () => {
    expect(BLOCK.weightKg).toBe(7);
    expect(BLOCK.priceEur).toBe(200);
  });
  it("composition: biochar 4.2 kg (60%), binder 2.8 kg (40%); 2.884 kg CO2e and 16.8 kg crop waste per block", () => {
    expect(BLOCK.composition).toEqual({ biocharKg: 4.2, biocharPct: 60, binderKg: 2.8, binderPct: 40 });
    expect(BLOCK.carbonKgPerBlock).toBe(2.884);
    expect(BLOCK.cropWasteKgPerBlock).toBe(16.8);
  });
  it("listening circle: 18 blocks, 16 seats, about 52 kg CO2e, about 430 km", () => {
    const s = computeStats(getLayout("listening-circle").build());
    expect(s.count).toBe(18);
    expect(s.seats).toBe(16);
    expect(s.carbonKg).toBe(51.9);
    expect(fmtKg(s.carbonKg)).toBe("52");
    expect(fmtKm(s.carKm)).toBe("430");
    expect(carTime(51.912)).toBe("13 days");
    expect(s.cropWasteKg).toBe(302.4);
    expect(s.weightKg).toBe(126);
    expect(s.priceEur).toBe(3600);
    expect(s.perColour).toEqual({ sage: 0, charcoal: 2, cream: 0, terracotta: 16 });
  });
  it.each([["talk-panel", 24, 20], ["dj-stage", 12, 0], ["bar-counter", 10, 0], ["shelving-wall", 20, 0]] as const)("%s has %i blocks and %i seats", (id, n, seats) => {
    const s = computeStats(getLayout(id).build());
    expect(s.count).toBe(n);
    expect(s.seats).toBe(seats);
  });
  it("carbon tiles: 20, 50, 100 blocks give 57.7, 144.2, 288.4 kg", () => {
    expect([20, 50, 100].map((n) => statsForCount(n).carbonKg)).toEqual([57.7, 144.2, 288.4]);
  });
  it("kits: starter 4,000 EUR, expansion 1,000 EUR", () => {
    expect(statsForCount(KITS[0].blocks!).priceEur).toBe(4000);
    expect(statsForCount(KITS[1].blocks!).priceEur).toBe(1000);
  });
  it("passport IDs are 4 digits", () => expect(passportId(42)).toBe("#0042"));

  const check = (name: string, blocks: PlacedBlock[]) => {
    blocks.forEach((a, i) => {
      expect(isSupported(a, blocks), `${name} ${a.id} floats`).toBe(true);
      blocks.slice(i + 1).forEach((b) => expect(blocksCollide(a, b), `${name} ${a.id} hits ${b.id}`).toBe(false));
    });
  };
  it("every layout is physically coherent", () => LAYOUTS.forEach((l) => check(l.name, l.build())));
  it("every piece is physically coherent", () => PIECES.forEach((p) => check(p.name, p.build().map((s, i) => ({ ...s, id: String(i) })))));
  it("pieces have the right block counts", () => {
    expect(Object.fromEntries(PIECES.map((p) => [p.id, p.build().length]))).toEqual({ stool: 1, "side-table": 1, bench: 3, "low-table": 4, "bar-table": 8, "lounge-corner": 7, plinth: 2, "reception-desk": 6 });
  });
});
