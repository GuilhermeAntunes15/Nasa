import { describe, expect, it } from "vitest";
import {
  ecocropSuitability,
  extraterrestrialRadiation,
  hargreavesEto,
  kcOnDay,
  tawMm,
  waterBalanceDay,
} from "./agro";
import { CROPS } from "./crops";

describe("extraterrestrialRadiation", () => {
  it("matches the value recalculated from FAO-56 eqs. 21–25 (20°S, 3 September)", () => {
    expect(Math.abs(extraterrestrialRadiation(-20, 246) - 32.19)).toBeLessThanOrEqual(0.05);
  });
});

describe("hargreavesEto", () => {
  it("follows FAO-56 eq. 52", () => {
    expect(hargreavesEto(30, 20, 32.2)).toBeCloseTo(4.0897, 3);
    expect(hargreavesEto(32, 22, 32.2)).toBeCloseTo(4.2808, 3);
  });

  it("uses a zero temperature range when Tmax < Tmin", () => {
    expect(hargreavesEto(20, 25, 30)).toBe(0);
  });
});

describe("kcOnDay", () => {
  it("interpolates the soybean curve", () => {
    expect(kcOnDay(CROPS.soybean, 0)).toBe(0.4);
    expect(kcOnDay(CROPS.soybean, 30)).toBeCloseTo(0.7621, 4);
    expect(kcOnDay(CROPS.soybean, 60)).toBe(1.15);
    expect(kcOnDay(CROPS.soybean, 114)).toBeCloseTo(0.531, 4);
  });

  it("keeps ruzigrass constant", () => {
    expect(kcOnDay(CROPS.ruzigrass, 0)).toBe(0.95);
    expect(kcOnDay(CROPS.ruzigrass, 200)).toBe(0.95);
  });
});

describe("tawMm", () => {
  it("uses Table 19 midpoints and Zr = 1 m", () => {
    expect([tawMm("sandy"), tawMm("loamy"), tawMm("clayey")]).toEqual([80, 155, 160]);
  });
});

describe("waterBalanceDay", () => {
  const day = { precipMm: 0, etcMm: 5, depletionFraction: 0.5, tawMm: 100, irrigate: false };

  it("reduces ETa once depletion exceeds RAW", () => {
    let dr = 0;
    for (let i = 0; i < 10; i++) dr = waterBalanceDay(dr, day).drEnd;
    expect(dr).toBe(50);
    const d11 = waterBalanceDay(dr, day);
    expect(d11).toMatchObject({ ks: 1, drEnd: 55 });
    const d12 = waterBalanceDay(d11.drEnd, day);
    expect(d12.ks).toBeCloseTo(0.9, 10);
    expect(d12.etaMm).toBeCloseTo(4.5, 10);
    expect(d12.drEnd).toBeCloseTo(59.5, 10);
  });

  it("sends excess rain to deep percolation", () => {
    expect(waterBalanceDay(20, { ...day, precipMm: 50 })).toMatchObject({ drEnd: 0, dpMm: 25, etaMm: 5 });
  });

  it("refills the root zone when irrigating above RAW", () => {
    expect(waterBalanceDay(60, { ...day, irrigate: true })).toEqual({ drEnd: 5, ks: 1, etaMm: 5, irrigationMm: 60, dpMm: 0 });
    expect(waterBalanceDay(50, { ...day, irrigate: true })).toMatchObject({ irrigationMm: 0, drEnd: 55 });
  });

  it("stops ETa on an empty root zone", () => {
    expect(waterBalanceDay(100, day)).toMatchObject({ ks: 0, etaMm: 0, drEnd: 100 });
  });
});

describe("ecocropSuitability", () => {
  it("is linear between the absolute and optimal ranges", () => {
    const soy = CROPS.soybean;
    expect([25, 35.5, 15, 9, 38].map((t) => ecocropSuitability(soy, t))).toEqual([1, 0.5, 0.5, 0, 0]);
  });

  it("matches the 23 °C values in the plan", () => {
    expect(ecocropSuitability(CROPS["pearl-millet"], 23)).toBeCloseTo(0.8462, 4);
    expect(ecocropSuitability(CROPS.sorghum, 23)).toBe(1);
    expect(ecocropSuitability(CROPS.ruzigrass, 23)).toBeCloseTo(0.6667, 4);
  });
});
