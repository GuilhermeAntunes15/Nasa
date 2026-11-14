import { DAY_MS, toIsoDate } from "./climate";
import type { ClimateDaily, ClimateResponse, PowerParam, Provenance } from "./types";

export const POWER_PARAMS: PowerParam[] = ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR"];
export const POWER_START = "20150101";
export const POWER_END = "20251231";

export const POWER_REFERENCE =
  "The data was obtained from National Aeronautics and Space Administration (NASA) Langley Research Center's Prediction Of Worldwide Energy Resources (POWER) project funded through the NASA Earth Science Division.";

export function powerAcknowledgment(apiVersion: string | null, retrievedAt: string) {
  const version = apiVersion ? apiVersion.replace(/^v/i, "") : "2.x.x";
  return `${POWER_REFERENCE} The data was obtained from the POWER Project's Daily ${version} version on ${retrievedAt.slice(0, 10).replaceAll("-", "/")}.`;
}

export class PowerParseError extends Error {
  name = "PowerParseError";
}

export function parseCoordinates(lat: unknown, lon: unknown): { lat: number; lon: number } | null {
  const toNumber = (v: unknown) =>
    typeof v === "number" ? v : typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim()) ? Number(v) : NaN;
  const la = toNumber(lat);
  const lo = toNumber(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
  const round = (x: number) => Math.round(x * 100) / 100 + 0;
  return { lat: round(la), lon: round(lo) };
}

export function buildPowerUrl(lat: number, lon: number) {
  const params = new URLSearchParams({
    parameters: POWER_PARAMS.join(","),
    community: "AG",
    longitude: String(lon),
    latitude: String(lat),
    start: POWER_START,
    end: POWER_END,
    format: "JSON",
    "time-standard": "LST",
  });
  return `https://power.larc.nasa.gov/api/temporal/daily/point?${params}`;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const VALID_RANGE: Record<PowerParam, [number, number]> = {
  T2M: [-90, 60],
  T2M_MAX: [-90, 60],
  T2M_MIN: [-90, 60],
  PRECTOTCORR: [0, 2000],
};

export function parsePowerResponse(
  json: unknown,
  ctx: { requestUrl: string; retrievedAt: string; mode: Provenance["mode"] },
): ClimateResponse {
  if (!isObject(json) || !isObject(json.properties) || !isObject(json.properties.parameter)) {
    throw new PowerParseError("Response has no properties.parameter object");
  }
  const header = isObject(json.header) ? json.header : {};
  const fill = typeof header.fill_value === "number" ? header.fill_value : -999;
  const coords = isObject(json.geometry) && Array.isArray(json.geometry.coordinates) ? json.geometry.coordinates : [];
  const [lon, lat, elevation] = coords;
  if (typeof lat !== "number" || typeof lon !== "number") throw new PowerParseError("Missing point coordinates");

  const data = json.properties.parameter;
  const series = POWER_PARAMS.map((p) => {
    const values = data[p];
    if (!isObject(values)) throw new PowerParseError(`Missing parameter ${p}`);
    return values;
  });
  const dates = Object.keys(series[0]).sort();
  if (dates.length === 0) throw new PowerParseError("Empty time series");
  if (!/^\d{8}$/.test(dates[0])) throw new PowerParseError(`Invalid date key ${dates[0]}`);
  const start = Date.UTC(+dates[0].slice(0, 4), +dates[0].slice(4, 6) - 1, +dates[0].slice(6, 8));
  dates.forEach((key, i) => {
    if (toIsoDate(start + i * DAY_MS).replaceAll("-", "") !== key) {
      throw new PowerParseError(`Dates are not contiguous at ${key}`);
    }
  });

  const missingDays = {} as Record<PowerParam, number>;
  const [t2m, t2mMax, t2mMin, precip] = POWER_PARAMS.map((p, k) => {
    const values = series[k];
    if (Object.keys(values).length !== dates.length) throw new PowerParseError(`Date keys differ for ${p}`);
    const [min, max] = VALID_RANGE[p];
    missingDays[p] = 0;
    return dates.map((date) => {
      const v = values[date];
      if (typeof v !== "number" || !Number.isFinite(v)) throw new PowerParseError(`Non-numeric ${p} on ${date}`);
      if (v === fill || v < min || v > max) {
        missingDays[p]++;
        return null;
      }
      return v;
    });
  });

  const meta = isObject(json.parameters) ? json.parameters : {};
  const api = isObject(header.api) ? header.api : {};
  const daily: ClimateDaily = { start: toIsoDate(start), t2m, t2mMax, t2mMin, precip };
  const apiVersion = typeof api.version === "string" ? api.version : null;
  return {
    daily,
    provenance: {
      source: "NASA POWER Daily API",
      requestUrl: ctx.requestUrl,
      apiVersion,
      upstreamSources: Array.isArray(header.sources) ? header.sources.filter((s): s is string => typeof s === "string") : [],
      community: "AG",
      latitude: lat,
      longitude: lon,
      elevationM: typeof elevation === "number" && elevation !== fill ? elevation : null,
      startDate: daily.start,
      endDate: toIsoDate(start + (dates.length - 1) * DAY_MS),
      timeStandard: typeof header.time_standard === "string" ? header.time_standard : "LST",
      parameters: POWER_PARAMS.map((id) => {
        const entry = meta[id];
        const m = isObject(entry) ? entry : {};
        return {
          id,
          units: typeof m.units === "string" ? m.units : "",
          longName: typeof m.longname === "string" ? m.longname : id,
        };
      }),
      retrievedAt: ctx.retrievedAt,
      mode: ctx.mode,
      missingDays,
      acknowledgment: powerAcknowledgment(apiVersion, ctx.retrievedAt),
    },
  };
}
