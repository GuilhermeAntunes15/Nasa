import { describe, expect, it } from "vitest";
import { DEFAULT_FARM, DEFAULT_SCENARIO, hasInvalidLocation, parseState, serializeState } from "./state";

describe("parseState", () => {
  it("returns defaults for empty params", () => {
    expect(parseState({})).toEqual({ farm: DEFAULT_FARM, scenario: DEFAULT_SCENARIO });
  });

  it("falls back to the default location for invalid coordinates", () => {
    expect(parseState({ lat: "abc", lon: "-50" }).farm).toMatchObject({ lat: -12.55, lon: -55.72 });
    expect(parseState({ lat: "95", lon: "-50" }).farm).toMatchObject({ lat: -12.55, lon: -55.72 });
  });

  it("clamps and snaps scenario values", () => {
    expect(parseState({ dp: "-45", dt: "9" }).scenario).toEqual({ precipChangePct: -30, tempDeltaC: 4 });
    expect(parseState({ dp: "-17", dt: "1.3" }).scenario).toEqual({ precipChangePct: -15, tempDeltaC: 1.5 });
    expect(parseState({ dp: "x", dt: "" }).scenario).toEqual(DEFAULT_SCENARIO);
  });

  it("validates enums and pH", () => {
    const { farm } = parseState(new URLSearchParams("seq=bad&soil=sandy&drain=poor&prio=soil&ph=11&irr=1"));
    expect(farm).toMatchObject({ currentSequence: "soy-maize", soilTexture: "sandy", drainage: "poor", priority: "soil", soilPh: null, irrigation: true });
    expect(parseState({ ph: "5.25" }).farm.soilPh).toBe(5.3);
    expect(parseState({ ph: ["6", "7"] }).farm.soilPh).toBe(6);
  });
});

describe("hasInvalidLocation", () => {
  it("flags only links whose coordinates were present but rejected", () => {
    expect(hasInvalidLocation({})).toBe(false);
    expect(hasInvalidLocation(new URLSearchParams("lat=-15.6&lon=-56.1"))).toBe(false);
    expect(hasInvalidLocation({ lat: "abc", lon: "-50" })).toBe(true);
    expect(hasInvalidLocation(new URLSearchParams("lat=0x10&lon=1"))).toBe(true);
    expect(hasInvalidLocation({ lat: "-15.6" })).toBe(true);
  });
});

describe("serializeState", () => {
  it("round-trips through parseState", () => {
    const farm = { ...DEFAULT_FARM, lat: -15.6, lon: -56.1, currentSequence: "soy-millet" as const, soilPh: 5.8, irrigation: true };
    const scenario = { precipChangePct: -20, tempDeltaC: 1.5 };
    expect(parseState(new URLSearchParams(serializeState(farm, scenario)))).toEqual({ farm, scenario });
  });
});
