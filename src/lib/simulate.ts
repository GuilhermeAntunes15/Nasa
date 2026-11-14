import { ecocropSuitability, extraterrestrialRadiation, hargreavesEto, kcOnDay, tawMm, waterBalanceDay } from "./agro";
import {
  agriculturalSeasons,
  applyScenario,
  DAY_MS,
  dayOfYear,
  parseIsoDate,
  seasonDate,
  toMonthly,
  type AgriculturalSeason,
} from "./climate";
import { ALT_A, ALT_B, CROPS, currentRotation } from "./crops";
import type {
  ClimateDaily,
  Crop,
  CropSeasonResult,
  FarmProfile,
  Flag,
  IndicatorId,
  IndicatorResult,
  Priority,
  Rotation,
  RotationResult,
  Scenario,
} from "./types";

export const WEIGHTS: Record<Priority, Record<IndicatorId, number>> = {
  water: { thermal: 0.15, water: 0.35, cover: 0.15, diversity: 0.15, deficit: 0.2 },
  soil: { thermal: 0.15, water: 0.15, cover: 0.35, diversity: 0.2, deficit: 0.15 },
  resilience: { thermal: 0.25, water: 0.15, cover: 0.15, diversity: 0.15, deficit: 0.3 },
};

export const MIN_SEASONS = 5;
export const DIVERSITY_CAPS = { species: 4, groups: 3 };

export const MT_BOX = { lat: [-18.1, -7.3], lon: [-61.7, -50.2] };
export const BRAZIL_BOX = { lat: [-34, 6], lon: [-74, -34] };

export function locationRegion(lat: number, lon: number): "mato-grosso" | "brazil" | "outside" {
  const inside = (box: typeof MT_BOX) =>
    lat >= box.lat[0] && lat <= box.lat[1] && lon >= box.lon[0] && lon <= box.lon[1];
  return inside(MT_BOX) ? "mato-grosso" : inside(BRAZIL_BOX) ? "brazil" : "outside";
}

export const MODEL_ASSUMPTIONS = [
  "Each agricultural season (15 Sep–14 Sep) is simulated independently; the root zone starts empty (depletion = TAW) on every 15 Sep, with no carry-over between seasons.",
  "Rooting depth Zr is fixed at 1.0 m for every crop.",
  "TAW uses the midpoint of the FAO-56 Table 19 (θFC − θWP) range: sandy 0.08, loamy 0.155, clayey 0.16 m³/m³ (80, 155 and 160 mm).",
  "Runoff, capillary rise and bare-soil evaporation are set to zero; days without an active crop have ETc = 0.",
  "The depletion fraction p is not adjusted for daily ETc (FAO-56 Table 22 footnote).",
  "Calendar: soybean sown 1 Oct (inside the Mato Grosso 7 Sep–7 Jan window); second crop sown 1 Feb; ruzigrass active until 10 Sep.",
  "Irrigation (if selected) refills the root zone to field capacity on cash-crop days when depletion exceeds RAW.",
  "Crop diversity caps: 4 species and 3 functional groups reach the maximum score.",
  "Indicator weights per priority are design choices of this MVP, shown with every composite index.",
  "Region boxes: Mato Grosso lat −18.1 to −7.3, lon −61.7 to −50.2; Brazil lat −34 to 6, lon −74 to −34.",
];

const SCORE_RULE_SUFFIX = "Indicator = median over the usable seasons (mean over template years for multi-year rotations).";

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const meanOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const fmt = (x: number, digits = 0) => x.toFixed(digits);

interface SeasonPoint {
  templateYear: number;
  season: string;
  value: number;
  score: number;
}

interface Prepared {
  daily: ClimateDaily;
  start: number;
  eto: number[];
  monthlyT2m: (number | null)[];
  seasons: AgriculturalSeason[];
}

function prepare(daily: ClimateDaily, farm: FarmProfile, scenario: Scenario): Prepared {
  const scen = applyScenario(daily, scenario);
  const start = parseIsoDate(scen.start);
  const monthlyMean = new Map(toMonthly(scen).map((m) => [m.year * 100 + m.month, m.t2mMean]));
  const eto: number[] = [];
  const monthlyT2m: (number | null)[] = [];
  scen.t2m.forEach((_, i) => {
    const ms = start + i * DAY_MS;
    const d = new Date(ms);
    const tmax = scen.t2mMax[i];
    const tmin = scen.t2mMin[i];
    eto.push(
      tmax === null || tmin === null ? 0 : hargreavesEto(tmax, tmin, extraterrestrialRadiation(farm.lat, dayOfYear(ms))),
    );
    monthlyT2m.push(monthlyMean.get(d.getUTCFullYear() * 100 + d.getUTCMonth() + 1) ?? null);
  });
  return { daily: scen, start, eto, monthlyT2m, seasons: agriculturalSeasons(scen) };
}

interface SlotWindow {
  crop: Crop;
  from: number;
  to: number;
}

function slotWindows(rotationYear: Rotation["years"][number], season: AgriculturalSeason, start: number): SlotWindow[] {
  return rotationYear.map((slot) => {
    const crop = CROPS[slot.cropId];
    const from = (seasonDate(season.startYear, slot.sow) - start) / DAY_MS - season.startIndex;
    const to = crop.stageDays
      ? from + crop.stageDays.reduce((a, b) => a + b, 0) - 1
      : (seasonDate(season.startYear, slot.end ?? { month: 9, day: 14 }) - start) / DAY_MS - season.startIndex;
    return { crop, from, to };
  });
}

function activeSlot(windows: SlotWindow[], day: number) {
  const covering = windows.filter((w) => day >= w.from && day <= w.to);
  return covering.find((w) => w.crop.role === "cash") ?? covering.find((w) => w.crop.role === "cover") ?? null;
}

function simulateSeason(
  prepared: Prepared,
  windows: SlotWindow[],
  season: AgriculturalSeason,
  farm: FarmProfile,
  templateYear: number,
) {
  const taw = tawMm(farm.soilTexture);
  const acc = new Map(windows.map((w) => [w, { etc: 0, eta: 0, irr: 0, thermal: 0, activeDays: 0, coverDays: 0 }]));
  let dr = taw;
  let thermalSum = 0;
  let thermalDays = 0;
  for (let d = 0; d < season.length; d++) {
    const i = season.startIndex + d;
    const slot = activeSlot(windows, d);
    const crop = slot?.crop;
    const etc = slot && crop ? kcOnDay(crop, d - slot.from) * prepared.eto[i] : 0;
    const step = waterBalanceDay(dr, {
      precipMm: prepared.daily.precip[i] ?? 0,
      etcMm: etc,
      depletionFraction: crop ? crop.p : 1,
      tawMm: taw,
      irrigate: farm.irrigation && crop?.role === "cash",
    });
    dr = step.drEnd;
    if (!slot || !crop) continue;
    const a = acc.get(slot)!;
    const suitability = ecocropSuitability(crop, prepared.monthlyT2m[i] ?? NaN);
    a.etc += etc;
    a.eta += step.etaMm;
    a.irr += step.irrigationMm;
    a.thermal += suitability;
    a.activeDays++;
    if (!crop.stageDays || d - slot.from >= crop.stageDays[0]) a.coverDays++;
    thermalSum += suitability;
    thermalDays++;
  }

  const crops: CropSeasonResult[] = windows.map((w) => {
    const a = acc.get(w)!;
    return {
      cropId: w.crop.id,
      templateYear,
      season: season.label,
      etcMm: a.etc,
      etaMm: a.eta,
      irrigationMm: a.irr,
      deficitSensitivity:
        w.crop.role === "cash" && w.crop.ky !== null && a.etc > 0 ? w.crop.ky * (1 - a.eta / a.etc) : null,
      thermalSuitability: a.activeDays ? a.thermal / a.activeDays : 0,
      coverDays: a.coverDays,
    };
  });

  const cash = crops.filter((c) => CROPS[c.cropId].role === "cash");
  const cashEtc = cash.reduce((s, c) => s + c.etcMm, 0);
  const cashEta = cash.reduce((s, c) => s + c.etaMm, 0);
  const cashIrr = cash.reduce((s, c) => s + c.irrigationMm, 0);
  const waterShare = cashEtc > 0 ? (farm.irrigation ? cashIrr : cashEtc - cashEta) / cashEtc : 0;
  const maxDeficit = Math.max(0, ...crops.map((c) => c.deficitSensitivity ?? 0));
  const coverDays = crops.reduce((s, c) => s + c.coverDays, 0);
  const thermal = thermalDays ? thermalSum / thermalDays : 0;
  const point = (value: number, score: number): SeasonPoint => ({ templateYear, season: season.label, value, score });

  return {
    crops,
    cashEtc,
    coverEta: crops.filter((c) => CROPS[c.cropId].role === "cover").reduce((s, c) => s + c.etaMm, 0),
    points: {
      thermal: point(thermal, thermal),
      water: point(waterShare * 100, 1 - Math.min(1, waterShare)),
      cover: point(coverDays, coverDays / season.length),
      deficit: point(maxDeficit, 1 - Math.min(1, maxDeficit)),
    },
  };
}

function aggregate(points: SeasonPoint[], years: number) {
  const byYear = Array.from({ length: years }, (_, y) => points.filter((p) => p.templateYear === y));
  const worst = points.reduce((w, p) => (p.score < w.score ? p : w));
  return {
    value: meanOf(byYear.map((ps) => median(ps.map((p) => p.value)))),
    score: meanOf(byYear.map((ps) => median(ps.map((p) => p.score)))),
    worstSeason: {
      season: years > 1 ? `${worst.season} (year ${worst.templateYear + 1})` : worst.season,
      value: worst.value,
    },
  };
}

export function diversityScore(rotation: Rotation) {
  const crops = [...new Set(rotation.years.flat().map((s) => s.cropId))].map((id) => CROPS[id]);
  const species = crops.length;
  const groups = new Set(crops.map((c) => c.functionalGroup)).size;
  return {
    species,
    groups,
    score:
      0.5 * (Math.min(species, DIVERSITY_CAPS.species) / DIVERSITY_CAPS.species) +
      0.5 * (Math.min(groups, DIVERSITY_CAPS.groups) / DIVERSITY_CAPS.groups),
  };
}

function rotationFlags(rotation: Rotation, farm: FarmProfile): Flag[] {
  const slots = rotation.years.flat();
  const crops = [...new Set(slots.map((s) => s.cropId))].map((id) => CROPS[id]);
  const ecocropId = (c: Crop) => c.citations.find((id) => id.startsWith("ecocrop-"));
  const flags: Flag[] = [];
  for (const c of crops) {
    if (farm.drainage === "poor" && c.poorDrainageTolerated === false) {
      flags.push({ cropId: c.id, severity: "caution", message: `ECOCROP lists ${c.name.toLowerCase()} as not tolerant of poorly drained soils.`, citationId: ecocropId(c) });
    }
    if (farm.drainage === "poor" && c.poorDrainageTolerated === null) {
      flags.push({ cropId: c.id, severity: "info", message: `No ECOCROP drainage data for ${c.name.toLowerCase()}.`, citationId: ecocropId(c) });
    }
    if (farm.soilPh !== null) {
      const ph = farm.soilPh;
      if (ph < c.phAbs[0] || ph > c.phAbs[1]) {
        flags.push({ cropId: c.id, severity: "caution", message: `Soil pH ${ph} is outside the ECOCROP absolute range for ${c.name.toLowerCase()} (${c.phAbs[0]}–${c.phAbs[1]}).`, citationId: ecocropId(c) });
      } else if (ph < c.phOpt[0] || ph > c.phOpt[1]) {
        flags.push({ cropId: c.id, severity: "info", message: `Soil pH ${ph} is outside the ECOCROP optimal range for ${c.name.toLowerCase()} (${c.phOpt[0]}–${c.phOpt[1]}).`, citationId: ecocropId(c) });
      }
    }
  }
  if (crops.some((c) => c.id === "ruzigrass")) {
    flags.push({ cropId: "ruzigrass", severity: "info", message: "Ruzigrass must be desiccated in time before soybean sowing.", citationId: "broch-ceccon-2008" });
  }
  if (slots.some((s) => s.sow.month === 2 && s.sow.day === 1)) {
    flags.push({ severity: "info", message: "Second crop sown on 1 Feb; later sowing raises water risk (Embrapa).", citationId: "embrapa-second-crop-maize" });
  }
  flags.push(
    { severity: "info", message: "Pests, nematodes, markets and CO₂ effects are not modelled." },
    { severity: "info", message: "Heat does not shorten the crop cycle in this model: stage lengths are fixed." },
  );
  return flags;
}

export function simulateRotation(
  rotation: Rotation,
  daily: ClimateDaily,
  farm: FarmProfile,
  scenario: Scenario,
): RotationResult {
  const prepared = prepare(daily, farm, scenario);
  const used = prepared.seasons.filter((s) => s.complete);
  const crops: CropSeasonResult[] = [];
  const points: Record<"thermal" | "water" | "cover" | "deficit", SeasonPoint[]> = { thermal: [], water: [], cover: [], deficit: [] };
  const cashEtc: number[] = [];
  const coverEta: number[] = [];
  const hasCover = rotation.years.flat().some((s) => CROPS[s.cropId].role === "cover");

  rotation.years.forEach((year, y) => {
    for (const season of used) {
      const r = simulateSeason(prepared, slotWindows(year, season, prepared.start), season, farm, y);
      crops.push(...r.crops);
      cashEtc.push(r.cashEtc);
      coverEta.push(r.coverEta);
      for (const k of Object.keys(points) as (keyof typeof points)[]) points[k].push(r.points[k]);
    }
  });

  const years = rotation.years.length;
  const agg = {
    thermal: aggregate(points.thermal, years),
    water: aggregate(points.water, years),
    cover: aggregate(points.cover, years),
    deficit: aggregate(points.deficit, years),
  };
  const diversity = diversityScore(rotation);
  const weights = WEIGHTS[farm.priority];
  const scenarioInputs =
    scenario.precipChangePct !== 0 || scenario.tempDeltaC !== 0
      ? [{ label: "Scenario", value: `${scenario.precipChangePct > 0 ? "+" : ""}${scenario.precipChangePct}% rainfall, ${scenario.tempDeltaC > 0 ? "+" : ""}${scenario.tempDeltaC} °C`, category: "scenario" as const }]
      : [];
  const climateInput = { label: "Daily climate 2015–2025", value: "NASA POWER (T2M, T2M_MAX, T2M_MIN, PRECTOTCORR)", category: "nasa" as const };

  const indicators: IndicatorResult[] = [
    {
      id: "thermal",
      label: "Seasonal climate compatibility (temperature)",
      value: agg.thermal.value,
      unit: "index (0–1)",
      score: agg.thermal.score,
      rule: `For each day with an active crop, that crop's FAO ECOCROP temperature ranges are applied to the calendar-month mean T2M: 0 outside the absolute range, 1 inside the optimal range, linear in between. Season value = mean over active crop days. Adapted from the FAO EcoCrop approach; day-weighted mean, not the original EcoCrop model. ${SCORE_RULE_SUFFIX}`,
      inputs: [climateInput, { label: "Temperature ranges", value: "FAO ECOCROP data sheets", category: "published" }, ...scenarioInputs],
      worstSeason: agg.thermal.worstSeason,
    },
    {
      id: "water",
      label: farm.irrigation ? "Irrigation-water dependency" : "Relative water-demand exposure",
      value: agg.water.value,
      unit: "% of cash-crop water demand",
      score: agg.water.score,
      rule: `${
        farm.irrigation
          ? "Irrigation applied on cash-crop days as a share of their water demand, ΣI / ΣETc, refilling the root zone to field capacity whenever depletion exceeds the readily available water. Not comparable with the rain-fed value; refill-to-field-capacity rule."
          : "Share of cash-crop water demand not met by rain and stored soil water, Σ(ETc − ETa) / ΣETc over cash-crop days."
      } Daily FAO-56 soil-water balance with Hargreaves–Samani ETo. Score = 1 − min(1, share); lower exposure scores higher. Cover crops grow after the cash crops; each season restarts from an empty root zone, so their water use does not affect the next soybean in this model. ${SCORE_RULE_SUFFIX}`,
      inputs: [
        climateInput,
        { label: "Soil texture", value: farm.soilTexture, category: "farmer" },
        { label: "Irrigation", value: farm.irrigation ? "yes" : "no", category: "farmer" },
        { label: "Total available water (TAW)", value: `${fmt(tawMm(farm.soilTexture))} mm`, category: "model" },
        { label: "Cash-crop water demand ΣETc (median)", value: `${fmt(median(cashEtc))} mm/season`, category: "model" },
        ...(hasCover
          ? [{ label: "Cover-crop water use ΣETa (median, not scored)", value: `${fmt(median(coverEta))} mm/season`, category: "model" as const }]
          : []),
        { label: "Kc, p", value: "FAO-56 Tables 12 and 22", category: "published" as const },
        ...scenarioInputs,
      ],
      worstSeason: agg.water.worstSeason,
    },
    {
      id: "cover",
      label: "Soil cover potential",
      value: agg.cover.value,
      unit: "days/season",
      score: agg.cover.score,
      rule: `Days with a living canopy beyond the initial stage of each staged crop, plus every active ruzigrass day, divided by the season length (365 or 366 days). Crop residue (mulch) is not quantified. ${SCORE_RULE_SUFFIX}`,
      inputs: [
        { label: "Stage lengths", value: "FAO-56 Table 11 (see crop assumptions)", category: "published" },
        { label: "Calendar", value: "Soybean 1 Oct, second crop 1 Feb, ruzigrass until 10 Sep", category: "model" },
      ],
      worstSeason: agg.cover.worstSeason,
    },
    {
      id: "diversity",
      label: "Crop diversity",
      value: diversity.species,
      unit: "species",
      score: diversity.score,
      rule: `0.5 × min(species, ${DIVERSITY_CAPS.species})/${DIVERSITY_CAPS.species} + 0.5 × functional groups/${DIVERSITY_CAPS.groups} (grain legume, grain cereal, cover grass), counted over all years of the rotation. The caps are design choices: ${DIVERSITY_CAPS.species} species and ${DIVERSITY_CAPS.groups} groups reach the maximum.`,
      inputs: [
        { label: "Species", value: String(diversity.species), category: "model" },
        { label: "Functional groups", value: String(diversity.groups), category: "model" },
      ],
    },
    {
      id: "deficit",
      label: "Sensitivity to rainfall deficits",
      value: agg.deficit.value,
      unit: "index (0–1)",
      score: agg.deficit.score,
      rule: `Deficit-sensitivity score (FAO-33 water-production form), not a yield forecast: D = Ky × (1 − ΣETa/ΣETc) for each cash crop with a published Ky; season value = largest D; score = 1 − min(1, D). D is a dimensionless index. ${SCORE_RULE_SUFFIX}`,
      inputs: [
        climateInput,
        { label: "Ky (seasonal)", value: "FAO-66 Table 1 (FAO-33 values)", category: "published" },
        { label: "Soil texture", value: farm.soilTexture, category: "farmer" },
        ...scenarioInputs,
      ],
      worstSeason: agg.deficit.worstSeason,
    },
  ];

  return {
    rotation,
    indicators,
    composite: 100 * indicators.reduce((s, ind) => s + weights[ind.id] * ind.score, 0),
    weights,
    flags: rotationFlags(rotation, farm),
    crops,
    seasonsUsed: used.map((s) => s.label),
    seasonsExcluded: prepared.seasons.filter((s) => !s.complete).map((s) => s.label),
  };
}

export function compareRotations(daily: ClimateDaily, farm: FarmProfile, scenario: Scenario): RotationResult[] | null {
  if (agriculturalSeasons(daily).filter((s) => s.complete).length < MIN_SEASONS) return null;
  return [currentRotation(farm.currentSequence), ALT_A, ALT_B].map((r) => simulateRotation(r, daily, farm, scenario));
}

export function diffResults(base: RotationResult[], scen: RotationResult[]) {
  return base.map((b) => {
    const s = scen.find((r) => r.rotation.id === b.rotation.id)!;
    return {
      rotationId: b.rotation.id,
      composite: { base: b.composite, scenario: s.composite, delta: s.composite - b.composite },
      indicators: b.indicators.map((ind) => {
        const other = s.indicators.find((x) => x.id === ind.id)!;
        return {
          id: ind.id,
          base: ind.score,
          scenario: other.score,
          delta: other.score - ind.score,
          valueBase: ind.value,
          valueScenario: other.value,
        };
      }),
    };
  });
}
