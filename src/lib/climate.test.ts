import { describe, expect, it } from "vitest";
import snapshot from "../../data/power-snapshot.json";
import {
  agriculturalSeasons,
  applyScenario,
  toAnnualPrecip,
  toMonthly,
  toMonthlyNormals,
  windowTotals,
} from "./climate";
import { parsePowerResponse } from "./power";
import type { ClimateDaily } from "./types";

const constant = (start: string, days: number, precip: number, t = 25): ClimateDaily => ({
  start,
  t2m: Array(days).fill(t),
  t2mMax: Array(days).fill(t + 5),
  t2mMin: Array(days).fill(t - 5),
  precip: Array(days).fill(precip),
});

describe("toMonthly", () => {
  it("sums a complete month of precipitation", () => {
    const [jan] = toMonthly(constant("2020-01-01", 31, 2));
    expect(jan).toMatchObject({ year: 2020, month: 1, precipMm: 62, t2mMean: 25, validDays: 31, totalDays: 31 });
  });

  it("returns null precipitation when one day is missing and averages only valid temperatures", () => {
    const daily = constant("2020-01-01", 31, 2);
    daily.precip[10] = null;
    daily.t2m[0] = null;
    daily.t2m[1] = 40;
    const [jan] = toMonthly(daily);
    expect(jan.precipMm).toBeNull();
    expect(jan.t2mMean).toBeCloseTo((40 + 25 * 29) / 30, 10);
    expect(jan.validDays).toBe(29);
    expect(jan.tmaxHighest).toBe(30);
  });
});

describe("normals and annual totals", () => {
  const daily = constant("2019-01-01", 365 + 366, 1);
  it("aggregates monthly normals over years", () => {
    const normals = toMonthlyNormals(toMonthly(daily));
    expect(normals).toHaveLength(12);
    expect(normals[1]).toMatchObject({ month: 2, precipMinMm: 28, precipMaxMm: 29, precipMeanMm: 28.5, yearsUsed: 2 });
  });

  it("only totals complete years", () => {
    expect(toAnnualPrecip(daily)).toEqual([
      { year: 2019, precipMm: 365 },
      { year: 2020, precipMm: 366 },
    ]);
    expect(toAnnualPrecip(constant("2019-01-01", 400, 1))[1]).toEqual({ year: 2020, precipMm: null });
  });
});

describe("applyScenario", () => {
  it("scales rain, shifts temperatures and keeps nulls", () => {
    const daily = constant("2020-01-01", 2, 10);
    daily.precip[1] = null;
    const out = applyScenario(daily, { precipChangePct: -20, tempDeltaC: 1.5 });
    expect(out.precip).toEqual([8, null]);
    expect(out.t2m).toEqual([26.5, 26.5]);
    expect(out.t2mMax).toEqual([31.5, 31.5]);
    expect(out.t2mMin).toEqual([21.5, 21.5]);
  });
});

describe("agriculturalSeasons", () => {
  it("finds the 10 complete seasons in the snapshot", () => {
    const { daily } = parsePowerResponse(snapshot.response, {
      requestUrl: snapshot.requestUrl,
      retrievedAt: snapshot.retrievedAt,
      mode: "snapshot",
    });
    const seasons = agriculturalSeasons(daily);
    expect(seasons.map((s) => s.label)).toEqual([
      "2015/16", "2016/17", "2017/18", "2018/19", "2019/20", "2020/21", "2021/22", "2022/23", "2023/24", "2024/25",
    ]);
    expect(seasons.every((s) => s.complete)).toBe(true);
    expect(seasons[0]).toMatchObject({ startIndex: 257, length: 366 });
    expect(seasons[1].length).toBe(365);
  });

  it("marks seasons with a missing day as incomplete", () => {
    const daily = constant("2015-01-01", 4018, 1);
    daily.t2mMax[300] = null;
    const seasons = agriculturalSeasons(daily);
    expect(seasons[0].complete).toBe(false);
    expect(seasons.filter((s) => s.complete)).toHaveLength(9);
  });
});

describe("windowTotals", () => {
  it("sums rain inside a window that crosses the new year", () => {
    const totals = windowTotals(constant("2015-01-01", 4018, 1), { month: 10, day: 1 }, { month: 1, day: 23 });
    expect(totals[0]).toEqual({ season: "2015/16", precipMm: 115 });
  });
});
