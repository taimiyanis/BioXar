// Ported from the team's CO2 calculator (Calculation module, src/lib/carbon.test.ts).
import { describe, expect, it } from "vitest";
import { CARBON_DEFAULTS, ROOM_SETS, calculateCarbon, carMonths, carTime, roomSetBlocks } from "./bioxar";

describe("carbon", () => {
  it("one block of 7 kg at 85 kg/m3 is ~82.4 L", () => {
    expect(calculateCarbon(1).volumePerBlockL).toBeCloseTo(82.35, 1);
  });
  it("0.412 kg CO2 per kg -> 2.884 kg per block", () => {
    expect(calculateCarbon(1).co2AvoidedKg).toBeCloseTo(2.884, 3);
  });
  it("100 blocks -> 288.4 kg = 0.2884 certificates", () => {
    expect(calculateCarbon(100).certificates).toBeCloseTo(0.2884, 4);
  });
  it("one block: 4.2 kg biochar from 16.8 kg crop waste, 347 blocks per certificate, about 0.37 EUR, 24 km", () => {
    const r = calculateCarbon(1);
    expect(r.biochar).toBeCloseTo(4.2, 5);
    expect(r.cropWaste).toBeCloseTo(16.8, 5);
    expect(r.blocksPerCertificate).toBe(347);
    expect(r.value).toBeCloseTo(0.375, 3);
    expect(r.carKm).toBeCloseTo(24.03, 2);
  });
  it("editing an assumption changes the result", () => {
    expect(calculateCarbon(10, { ...CARBON_DEFAULTS, massKg: 10 }).co2AvoidedKg).toBeCloseTo(41.2, 5);
  });
  it("zero yield or density does not divide by zero", () => {
    const r = calculateCarbon(5, { ...CARBON_DEFAULTS, pyrolysisYield: 0, densityKgM3: 0, carKgPerKm: 0 });
    expect([r.cropWaste, r.volumePerBlockL, r.carKm]).toEqual([0, 0, 0]);
  });
});

describe("car analogy", () => {
  it("average car (0.12 kg/km, 12,000 km/yr) emits 120 kg per month", () => {
    expect(carMonths(120)).toBeCloseTo(1, 5);
  });
  it("one block (2.884 kg) equals about 0.024 months of driving", () => {
    expect(carMonths(2.884)).toBeCloseTo(0.024, 3);
  });
  it("carTime reads in days, months and years", () => {
    expect(carTime(2.884)).toBe("1 day");
    expect(carTime(288.4)).toBe("2.4 months");
    expect(carTime(1440)).toBe("1.0 years");
  });
});

describe("rooms", () => {
  it("living room = sofa 20 + 2 armchairs 6 + side shelf 2 = 34 blocks", () => {
    expect(roomSetBlocks(ROOM_SETS[0]!)).toBe(34);
  });
});
