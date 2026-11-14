import { CURRENT_SEQUENCES } from "./crops";
import { parseCoordinates } from "./power";
import type { CurrentSequenceId, Drainage, FarmProfile, Priority, Scenario, SoilTexture } from "./types";

export const DEFAULT_FARM: FarmProfile = {
  lat: -12.55,
  lon: -55.72,
  currentSequence: "soy-maize",
  soilTexture: "clayey",
  drainage: "well",
  soilPh: null,
  irrigation: false,
  priority: "water",
};

export const DEFAULT_SCENARIO: Scenario = { precipChangePct: 0, tempDeltaC: 0 };

export const PRECIP_RANGE = { min: -30, max: 20, step: 5 };
export const TEMP_RANGE = { min: -2, max: 4, step: 0.5 };
export const PH_RANGE = { min: 3, max: 10 };

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

const read = (params: Params, key: string) => {
  const v = params instanceof URLSearchParams ? params.get(key) : params[key];
  return (Array.isArray(v) ? v[0] : v) ?? null;
};

const oneOf = <T extends string>(value: string | null, options: readonly T[], fallback: T) =>
  options.includes(value as T) ? (value as T) : fallback;

const stepped = (value: string | null, range: { min: number; max: number; step: number }) => {
  const n = value === null || value.trim() === "" ? NaN : Number(value);
  if (!Number.isFinite(n)) return 0;
  const clamped = Math.min(range.max, Math.max(range.min, n));
  return Math.round(clamped / range.step) * range.step + 0;
};

export function parseState(params: Params): { farm: FarmProfile; scenario: Scenario } {
  const coords = parseCoordinates(read(params, "lat"), read(params, "lon"));
  const phRaw = read(params, "ph");
  const ph = phRaw === null || phRaw.trim() === "" ? NaN : Number(phRaw);
  return {
    farm: {
      lat: coords?.lat ?? DEFAULT_FARM.lat,
      lon: coords?.lon ?? DEFAULT_FARM.lon,
      currentSequence: oneOf(
        read(params, "seq"),
        Object.keys(CURRENT_SEQUENCES) as CurrentSequenceId[],
        DEFAULT_FARM.currentSequence,
      ),
      soilTexture: oneOf<SoilTexture>(read(params, "soil"), ["sandy", "loamy", "clayey"], DEFAULT_FARM.soilTexture),
      drainage: oneOf<Drainage>(read(params, "drain"), ["well", "moderate", "poor"], DEFAULT_FARM.drainage),
      soilPh: Number.isFinite(ph) && ph >= PH_RANGE.min && ph <= PH_RANGE.max ? Math.round(ph * 10) / 10 : null,
      irrigation: read(params, "irr") === "1",
      priority: oneOf<Priority>(read(params, "prio"), ["water", "soil", "resilience"], DEFAULT_FARM.priority),
    },
    scenario: {
      precipChangePct: stepped(read(params, "dp"), PRECIP_RANGE),
      tempDeltaC: stepped(read(params, "dt"), TEMP_RANGE),
    },
  };
}

export function hasInvalidLocation(params: Params) {
  const lat = read(params, "lat");
  const lon = read(params, "lon");
  return (lat !== null || lon !== null) && parseCoordinates(lat, lon) === null;
}

export function serializeState(farm: FarmProfile, scenario: Scenario) {
  const params = new URLSearchParams({
    lat: String(farm.lat),
    lon: String(farm.lon),
    seq: farm.currentSequence,
    soil: farm.soilTexture,
    drain: farm.drainage,
    irr: farm.irrigation ? "1" : "0",
    prio: farm.priority,
    dp: String(scenario.precipChangePct),
    dt: String(scenario.tempDeltaC),
  });
  if (farm.soilPh !== null) params.set("ph", String(farm.soilPh));
  return params.toString();
}
