export type PowerParam = "T2M" | "T2M_MAX" | "T2M_MIN" | "PRECTOTCORR";

export interface ClimateDaily {
  start: string;
  t2m: (number | null)[];
  t2mMax: (number | null)[];
  t2mMin: (number | null)[];
  precip: (number | null)[];
}

export interface Provenance {
  source: "NASA POWER Daily API";
  requestUrl: string;
  apiVersion: string | null;
  upstreamSources: string[];
  community: "AG";
  latitude: number;
  longitude: number;
  elevationM: number | null;
  startDate: string;
  endDate: string;
  timeStandard: string;
  parameters: { id: PowerParam; units: string; longName: string }[];
  retrievedAt: string;
  mode: "live" | "snapshot";
  missingDays: Record<PowerParam, number>;
  acknowledgment: string;
}

export interface ClimateResponse {
  provenance: Provenance;
  daily: ClimateDaily;
}

export interface ApiError {
  error: {
    code: "INVALID_COORDINATES" | "UPSTREAM_TIMEOUT" | "UPSTREAM_UNAVAILABLE" | "UPSTREAM_INVALID";
    message: string;
  };
}

export interface MonthlyClimate {
  year: number;
  month: number;
  precipMm: number | null;
  t2mMean: number | null;
  tmaxMean: number | null;
  tminMean: number | null;
  tmaxHighest: number | null;
  tminLowest: number | null;
  validDays: number;
  totalDays: number;
}

export interface MonthlyNormal {
  month: number;
  precipMeanMm: number | null;
  precipMinMm: number | null;
  precipMaxMm: number | null;
  t2mMean: number | null;
  tmaxMean: number | null;
  tminMean: number | null;
  tmaxHighest: number | null;
  tminLowest: number | null;
  yearsUsed: number;
}

export interface AnnualPrecip {
  year: number;
  precipMm: number | null;
}

export type SoilTexture = "sandy" | "loamy" | "clayey";
export type Drainage = "well" | "moderate" | "poor";
export type Priority = "water" | "soil" | "resilience";
export type CurrentSequenceId = "soy-maize" | "soy-sorghum" | "soy-millet" | "soy-fallow";

export interface FarmProfile {
  lat: number;
  lon: number;
  currentSequence: CurrentSequenceId;
  soilTexture: SoilTexture;
  drainage: Drainage;
  soilPh: number | null;
  irrigation: boolean;
  priority: Priority;
}

export interface Scenario {
  precipChangePct: number;
  tempDeltaC: number;
}

export type DataCategory = "nasa" | "farmer" | "published" | "model" | "scenario";

export interface Citation {
  id: string;
  short: string;
  full: string;
  url?: string;
}

export type CropId = "soybean" | "maize" | "sorghum" | "pearl-millet" | "ruzigrass";

export interface Crop {
  id: CropId;
  name: string;
  scientificName: string;
  family: "Fabaceae" | "Poaceae";
  functionalGroup: "grain-legume" | "grain-cereal" | "cover-grass";
  role: "cash" | "cover";
  stageDays: [number, number, number, number] | null;
  kc: { ini: number; mid: number; end: number } | { constant: number };
  p: number;
  ky: number | null;
  tempOptC: [number, number];
  tempAbsC: [number, number];
  phOpt: [number, number];
  phAbs: [number, number];
  poorDrainageTolerated: boolean | null;
  citations: string[];
  assumptions: string[];
}

export interface CropSlot {
  cropId: CropId;
  sow: { month: number; day: number };
  end?: { month: number; day: number };
  note?: string;
}

export type RotationId = "current" | "alt-a" | "alt-b";

export interface Rotation {
  id: RotationId;
  name: string;
  intent: string;
  years: CropSlot[][];
}

export type IndicatorId = "thermal" | "water" | "cover" | "diversity" | "deficit";

export interface IndicatorResult {
  id: IndicatorId;
  label: string;
  value: number;
  unit: string;
  score: number;
  rule: string;
  inputs: { label: string; value: string; category: DataCategory }[];
  worstSeason?: { season: string; value: number };
}

export interface CropSeasonResult {
  cropId: CropId;
  templateYear: number;
  season: string;
  etcMm: number;
  etaMm: number;
  irrigationMm: number;
  deficitSensitivity: number | null;
  thermalSuitability: number;
  coverDays: number;
}

export interface Flag {
  cropId?: CropId;
  severity: "info" | "caution";
  message: string;
  citationId?: string;
}

export interface RotationResult {
  rotation: Rotation;
  indicators: IndicatorResult[];
  composite: number;
  weights: Record<IndicatorId, number>;
  flags: Flag[];
  crops: CropSeasonResult[];
  seasonsUsed: string[];
  seasonsExcluded: string[];
}
