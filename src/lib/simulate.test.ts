import { describe, expect, it } from "vitest";
import snapshot from "../../data/power-snapshot.json";
import { DAY_MS, seasonDate } from "./climate";
import { ALT_A, ALT_B, CROPS, CURRENT_SEQUENCES, currentRotation } from "./crops";
import { parsePowerResponse } from "./power";
import { compareRotations, diffResults, diversityScore, locationRegion, simulateRotation, WEIGHTS } from "./simulate";
import { DEFAULT_FARM, DEFAULT_SCENARIO } from "./state";
import type { ClimateDaily, CurrentSequenceId, IndicatorId, RotationResult } from "./types";

const DAYS = 4018;
const synthetic = (precip: number, t = 25): ClimateDaily => ({
  start: "2015-01-01",
  t2m: Array(DAYS).fill(t),
  t2mMax: Array(DAYS).fill(t + 5),
  t2mMin: Array(DAYS).fill(t - 5),
  precip: Array(DAYS).fill(precip),
});
const real = parsePowerResponse(snapshot.response, {
  requestUrl: snapshot.requestUrl,
  retrievedAt: snapshot.retrievedAt,
  mode: "snapshot",
}).daily;

const indicator = (r: RotationResult, id: IndicatorId) => r.indicators.find((i) => i.id === id)!;
const coverDays = (r: RotationResult, season: string) =>
  r.crops.filter((c) => c.season === season).reduce((s, c) => s + c.coverDays, 0);
const current = (seq: CurrentSequenceId) => currentRotation(seq);

describe("calendar", () => {
  it("ends every staged crop by 14 Sep of the following year", () => {
    for (const rotation of [...Object.keys(CURRENT_SEQUENCES).map((id) => current(id as CurrentSequenceId)), ALT_A, ALT_B]) {
      for (const slot of rotation.years.flat()) {
        for (let y = 2015; y <= 2024; y++) {
          const crop = CROPS[slot.cropId];
          const sow = seasonDate(y, slot.sow);
          const end = crop.stageDays
            ? sow + (crop.stageDays.reduce((a, b) => a + b, 0) - 1) * DAY_MS
            : seasonDate(y, slot.end!);
          expect(end).toBeLessThanOrEqual(Date.UTC(y + 1, 8, 14));
          expect(sow).toBeGreaterThanOrEqual(Date.UTC(y, 8, 15));
        }
      }
    }
  });
});

describe("soil cover", () => {
  const daily = synthetic(5);
  const run = (r: typeof ALT_A) => simulateRotation(r, daily, DEFAULT_FARM, DEFAULT_SCENARIO);

  it("counts canopy days per season", () => {
    const cur = run(current("soy-maize"));
    const a = run(ALT_A);
    expect(coverDays(cur, "2015/16")).toBe(204);
    expect(coverDays(a, "2015/16")).toBe(302);
    expect(coverDays(cur, "2016/17")).toBe(204);
    expect(coverDays(a, "2016/17")).toBe(301);
    expect(coverDays(run(current("soy-millet")), "2016/17")).toBe(189);
    expect(coverDays(run(current("soy-fallow")), "2016/17")).toBe(99);
  });

  it("scores days over the season length", () => {
    const score = (r: RotationResult, season: string) => coverDays(r, season) / (season === "2015/16" ? 366 : 365);
    expect(score(run(current("soy-maize")), "2015/16")).toBeCloseTo(0.5574, 4);
    expect(score(run(ALT_A), "2015/16")).toBeCloseTo(0.8251, 4);
    expect(score(run(current("soy-maize")), "2016/17")).toBeCloseTo(0.5589, 4);
    expect(score(run(ALT_A), "2016/17")).toBeCloseTo(0.8247, 4);
    expect(score(run(current("soy-millet")), "2016/17")).toBeCloseTo(0.5178, 4);
    expect(score(run(current("soy-fallow")), "2016/17")).toBeCloseTo(0.2712, 4);
    const b = run(ALT_B).crops.filter((c) => c.season === "2016/17").reduce((s, c) => s + c.coverDays, 0) / 2;
    expect(b / 365).toBeCloseTo(0.6918, 4);
  });
});

describe("crop diversity", () => {
  it("uses the union of species and groups over all years", () => {
    expect(diversityScore(current("soy-maize")).score).toBeCloseTo(0.5833, 4);
    expect(diversityScore(ALT_A).score).toBeCloseTo(0.875, 4);
    expect(diversityScore(ALT_B).score).toBe(1);
  });
});

describe("thermal compatibility", () => {
  it("is 1 for every crop at 25 °C", () => {
    for (const r of compareRotations(synthetic(5), { ...DEFAULT_FARM, currentSequence: "soy-millet" }, DEFAULT_SCENARIO)!) {
      expect(r.crops.every((c) => c.thermalSuitability === 1)).toBe(true);
    }
  });

  it("drops for heat-loving crops when the scenario cools to 23 °C", () => {
    const scenario = { precipChangePct: 0, tempDeltaC: -2 };
    const suit = (r: RotationResult, id: string) => r.crops.find((c) => c.cropId === id)!.thermalSuitability;
    const millet = simulateRotation(current("soy-millet"), synthetic(5), DEFAULT_FARM, scenario);
    const b = simulateRotation(ALT_B, synthetic(5), DEFAULT_FARM, scenario);
    expect(suit(millet, "pearl-millet")).toBeCloseTo(0.8462, 4);
    expect(suit(b, "sorghum")).toBe(1);
    expect(suit(b, "ruzigrass")).toBeCloseTo(0.6667, 4);
  });
});

describe("water limits", () => {
  it("gives full exposure and maximum deficit sensitivity with no rain", () => {
    const dry = synthetic(0);
    const soyMaize = simulateRotation(current("soy-maize"), dry, DEFAULT_FARM, DEFAULT_SCENARIO);
    const soyFallow = simulateRotation(current("soy-fallow"), dry, DEFAULT_FARM, DEFAULT_SCENARIO);
    expect(indicator(soyMaize, "water").value).toBeCloseTo(100, 10);
    expect(indicator(soyMaize, "water").score).toBeCloseTo(0, 10);
    expect(indicator(soyMaize, "deficit").score).toBeCloseTo(0, 10);
    expect(indicator(soyFallow, "deficit").score).toBeCloseTo(0.15, 10);
  });

  it("gives zero exposure and zero deficit with 50 mm/day", () => {
    const wet = simulateRotation(ALT_B, synthetic(50), DEFAULT_FARM, DEFAULT_SCENARIO);
    expect(indicator(wet, "water").value).toBe(0);
    expect(indicator(wet, "deficit").value).toBe(0);
  });

  it("irrigation removes the deficit and reports irrigation dependency", () => {
    const irrigated = simulateRotation(current("soy-maize"), synthetic(0), { ...DEFAULT_FARM, irrigation: true }, DEFAULT_SCENARIO);
    expect(indicator(irrigated, "deficit").value).toBe(0);
    expect(indicator(irrigated, "water").label).toBe("Irrigation-water dependency");
    expect(indicator(irrigated, "water").value).toBeGreaterThan(0);
  });
});

describe("real NASA POWER snapshot (Sorriso, MT)", () => {
  const base = compareRotations(real, DEFAULT_FARM, DEFAULT_SCENARIO)!;
  const drier = compareRotations(real, DEFAULT_FARM, { precipChangePct: -20, tempDeltaC: 0 })!;

  it("simulates 10 seasons for 3 rotations with finite results", () => {
    expect(base.map((r) => r.rotation.id)).toEqual(["current", "alt-a", "alt-b"]);
    for (const r of base) {
      expect(r.seasonsUsed).toHaveLength(10);
      expect(r.indicators).toHaveLength(5);
      for (const ind of r.indicators) {
        expect(Number.isFinite(ind.value)).toBe(true);
        expect(ind.score).toBeGreaterThanOrEqual(0);
        expect(ind.score).toBeLessThanOrEqual(1);
      }
      expect(Number.isFinite(r.composite)).toBe(true);
    }
  });

  it("less rain never lowers exposure or deficit sensitivity", () => {
    diffResults(base, drier).forEach((d) => {
      for (const id of ["water", "deficit"] as const) {
        const ind = d.indicators.find((i) => i.id === id)!;
        expect(ind.valueScenario).toBeGreaterThanOrEqual(ind.valueBase);
      }
    });
    for (let i = 0; i < base.length; i++) {
      base[i].crops.forEach((c, k) => expect(drier[i].crops[k].etaMm).toBeLessThanOrEqual(c.etaMm + 1e-9));
    }
  });

  it("warming raises crop water demand", () => {
    const warmer = compareRotations(real, DEFAULT_FARM, { precipChangePct: 0, tempDeltaC: 2 })!;
    const etc = (rs: RotationResult[]) => rs[0].crops.reduce((s, c) => s + c.etcMm, 0);
    expect(etc(warmer)).toBeGreaterThan(etc(base));
  });

  it("is deterministic", () => {
    expect(compareRotations(real, DEFAULT_FARM, DEFAULT_SCENARIO)!.map((r) => r.composite)).toEqual(base.map((r) => r.composite));
  });

  it("returns null with fewer than 5 complete seasons", () => {
    const gappy = { ...real, t2m: real.t2m.map((t, i) => (i % 300 === 0 ? null : t)) };
    expect(compareRotations(gappy, DEFAULT_FARM, DEFAULT_SCENARIO)).toBeNull();
  });
});

describe("weights, flags and region", () => {
  it("weights sum to 1 for every priority", () => {
    for (const w of Object.values(WEIGHTS)) expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it("flags poor drainage and pH from farmer input", () => {
    const r = simulateRotation(ALT_B, synthetic(5), { ...DEFAULT_FARM, drainage: "poor", soilPh: 4.8 }, DEFAULT_SCENARIO);
    const messages = r.flags.map((f) => f.message);
    expect(messages).toContain("ECOCROP lists second-crop grain sorghum as not tolerant of poorly drained soils.");
    expect(messages).toContain("No ECOCROP drainage data for second-crop maize.");
    expect(r.flags.find((f) => f.cropId === "sorghum" && f.message.includes("pH"))?.severity).toBe("caution");
    expect(r.flags.find((f) => f.cropId === "soybean" && f.message.includes("pH"))?.severity).toBe("info");
    expect(r.flags.some((f) => f.cropId === "soybean" && f.message.includes("drained"))).toBe(false);
  });

  it("classifies locations", () => {
    expect(locationRegion(-12.55, -55.72)).toBe("mato-grosso");
    expect(locationRegion(-23.5, -46.6)).toBe("brazil");
    expect(locationRegion(40, -100)).toBe("outside");
  });
});
