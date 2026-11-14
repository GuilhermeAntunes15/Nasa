import { describe, expect, it } from "vitest";
import snapshot from "../../data/power-snapshot.json";
import { buildPowerUrl, parseCoordinates, parsePowerResponse, PowerParseError } from "./power";

const ctx = { requestUrl: "https://example.test", retrievedAt: "2026-11-14T12:00:00.000Z", mode: "live" as const };

function fixture(overrides: Record<string, Record<string, unknown>> = {}) {
  const series = (a: unknown, b: unknown, c: unknown) => ({ "20250101": a, "20250102": b, "20250103": c });
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [-55.72, -12.55, 370.59] },
    properties: {
      parameter: {
        T2M: series(25, 26, -999),
        T2M_MAX: series(30, 31, 32),
        T2M_MIN: series(20, 21, 22),
        PRECTOTCORR: series(0, 12.5, 3000),
        ...overrides,
      },
    },
    header: { api: { version: "v2.10.3", name: "POWER Daily API" }, sources: ["MERRA2", "POWER"], fill_value: -999, time_standard: "LST" },
    parameters: { T2M: { units: "C", longname: "Temperature at 2 Meters" } },
  };
}

describe("parseCoordinates", () => {
  it("rounds valid input to 2 decimals", () => {
    expect(parseCoordinates("-12.5512", "-55.7249")).toEqual({ lat: -12.55, lon: -55.72 });
    expect(parseCoordinates(0, 180)).toEqual({ lat: 0, lon: 180 });
    expect(parseCoordinates(" -12 ", "1.5")).toEqual({ lat: -12, lon: 1.5 });
  });

  it("rejects invalid input", () => {
    for (const [lat, lon] of [["abc", "0"], ["999", "0"], ["0", "-181"], ["", "0"], [null, "0"], ["Infinity", "0"], [undefined, undefined], ["0x10", "1"], ["1e1", "0"], ["+5", "0"], ["1.", "0"]]) {
      expect(parseCoordinates(lat, lon)).toBeNull();
    }
  });
});

describe("buildPowerUrl", () => {
  it("matches the URL stored with the snapshot", () => {
    expect(snapshot.requestUrl).toBe(buildPowerUrl(-12.55, -55.72));
  });

  it("only uses the fixed NASA POWER host", () => {
    expect(new URL(buildPowerUrl(10, 20)).host).toBe("power.larc.nasa.gov");
  });
});

describe("parsePowerResponse", () => {
  it("parses a 3-day fixture, nulling fill and out-of-range values", () => {
    const { daily, provenance } = parsePowerResponse(fixture(), ctx);
    expect(daily).toEqual({
      start: "2025-01-01",
      t2m: [25, 26, null],
      t2mMax: [30, 31, 32],
      t2mMin: [20, 21, 22],
      precip: [0, 12.5, null],
    });
    expect(provenance.missingDays).toEqual({ T2M: 1, T2M_MAX: 0, T2M_MIN: 0, PRECTOTCORR: 1 });
    expect(provenance).toMatchObject({
      apiVersion: "v2.10.3",
      upstreamSources: ["MERRA2", "POWER"],
      latitude: -12.55,
      longitude: -55.72,
      elevationM: 370.59,
      startDate: "2025-01-01",
      endDate: "2025-01-03",
      mode: "live",
    });
    expect(provenance.acknowledgment).toContain("Daily 2.10.3 version on 2026/11/14.");
  });

  it("throws on a missing parameter", () => {
    const json = fixture();
    delete (json.properties.parameter as Record<string, unknown>).T2M_MIN;
    expect(() => parsePowerResponse(json, ctx)).toThrow(PowerParseError);
  });

  it("throws on non-contiguous dates", () => {
    const gap = { "20250101": 1, "20250102": 1, "20250104": 1 };
    expect(() => parsePowerResponse(fixture({ T2M: gap, T2M_MAX: gap, T2M_MIN: gap, PRECTOTCORR: gap }), ctx)).toThrow(
      PowerParseError,
    );
  });

  it("throws on non-numeric values", () => {
    expect(() => parsePowerResponse(fixture({ T2M: { "20250101": 1, "20250102": "x", "20250103": 1 } }), ctx)).toThrow(
      PowerParseError,
    );
  });

  it("throws on a non-object payload", () => {
    expect(() => parsePowerResponse({ messages: ["error"] }, ctx)).toThrow(PowerParseError);
    expect(() => parsePowerResponse(null, ctx)).toThrow(PowerParseError);
  });

  it("parses the real Sorriso snapshot", () => {
    const { daily, provenance } = parsePowerResponse(snapshot.response, { ...ctx, mode: "snapshot" });
    expect(daily.start).toBe("2015-01-01");
    for (const xs of [daily.t2m, daily.t2mMax, daily.t2mMin, daily.precip]) expect(xs).toHaveLength(4018);
    expect(provenance.missingDays).toEqual({ T2M: 0, T2M_MAX: 0, T2M_MIN: 0, PRECTOTCORR: 0 });
    expect(provenance.endDate).toBe("2025-12-31");
    expect(daily.precip.at(-1)).toBe(0.04);
    expect(daily.t2m[0]).toBe(25.48);
    expect(provenance.parameters.find((p) => p.id === "PRECTOTCORR")?.units).toBe("mm/day");
  });
});
