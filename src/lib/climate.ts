import type { AnnualPrecip, ClimateDaily, MonthlyClimate, MonthlyNormal, Scenario } from "./types";

export const DAY_MS = 86_400_000;

export const parseIsoDate = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const toIsoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const dayOfYear = (ms: number) => (ms - Date.UTC(new Date(ms).getUTCFullYear(), 0, 1)) / DAY_MS + 1;

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const valid = (xs: (number | null)[]) => xs.filter((x): x is number => x !== null);

export function toMonthly(daily: ClimateDaily): MonthlyClimate[] {
  const start = parseIsoDate(daily.start);
  const groups = new Map<string, number[]>();
  daily.precip.forEach((_, i) => {
    const key = toIsoDate(start + i * DAY_MS).slice(0, 7);
    const group = groups.get(key);
    if (group) group.push(i);
    else groups.set(key, [i]);
  });
  return [...groups].map(([key, idx]) => {
    const pick = (xs: (number | null)[]) => idx.map((i) => xs[i]);
    const precip = pick(daily.precip);
    const t2m = valid(pick(daily.t2m));
    const tmax = valid(pick(daily.t2mMax));
    const tmin = valid(pick(daily.t2mMin));
    return {
      year: +key.slice(0, 4),
      month: +key.slice(5, 7),
      precipMm: precip.every((p) => p !== null) ? valid(precip).reduce((a, b) => a + b, 0) : null,
      t2mMean: mean(t2m),
      tmaxMean: mean(tmax),
      tminMean: mean(tmin),
      tmaxHighest: tmax.length ? Math.max(...tmax) : null,
      tminLowest: tmin.length ? Math.min(...tmin) : null,
      validDays: idx.filter(
        (i) => daily.t2m[i] !== null && daily.t2mMax[i] !== null && daily.t2mMin[i] !== null && daily.precip[i] !== null,
      ).length,
      totalDays: idx.length,
    };
  });
}

export function toMonthlyNormals(monthly: MonthlyClimate[]): MonthlyNormal[] {
  return Array.from({ length: 12 }, (_, m) => {
    const rows = monthly.filter((r) => r.month === m + 1);
    const precip = valid(rows.map((r) => r.precipMm));
    const tmaxHighest = valid(rows.map((r) => r.tmaxHighest));
    const tminLowest = valid(rows.map((r) => r.tminLowest));
    return {
      month: m + 1,
      precipMeanMm: mean(precip),
      precipMinMm: precip.length ? Math.min(...precip) : null,
      precipMaxMm: precip.length ? Math.max(...precip) : null,
      t2mMean: mean(valid(rows.map((r) => r.t2mMean))),
      tmaxMean: mean(valid(rows.map((r) => r.tmaxMean))),
      tminMean: mean(valid(rows.map((r) => r.tminMean))),
      tmaxHighest: tmaxHighest.length ? Math.max(...tmaxHighest) : null,
      tminLowest: tminLowest.length ? Math.min(...tminLowest) : null,
      yearsUsed: precip.length,
    };
  });
}

export function toAnnualPrecip(daily: ClimateDaily): AnnualPrecip[] {
  const byYear = new Map<number, (number | null)[]>();
  const start = parseIsoDate(daily.start);
  daily.precip.forEach((p, i) => {
    const year = new Date(start + i * DAY_MS).getUTCFullYear();
    const ps = byYear.get(year);
    if (ps) ps.push(p);
    else byYear.set(year, [p]);
  });
  return [...byYear].map(([year, ps]) => {
    const daysInYear = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / DAY_MS;
    const complete = ps.length === daysInYear && ps.every((p) => p !== null);
    return { year, precipMm: complete ? valid(ps).reduce((a, b) => a + b, 0) : null };
  });
}

export function applyScenario(daily: ClimateDaily, scenario: Scenario): ClimateDaily {
  const factor = 1 + scenario.precipChangePct / 100;
  const shift = (xs: (number | null)[]) => xs.map((x) => (x === null ? null : x + scenario.tempDeltaC));
  return {
    start: daily.start,
    t2m: shift(daily.t2m),
    t2mMax: shift(daily.t2mMax),
    t2mMin: shift(daily.t2mMin),
    precip: daily.precip.map((p) => (p === null ? null : p * factor)),
  };
}

export interface AgriculturalSeason {
  label: string;
  startYear: number;
  startIndex: number;
  length: number;
  complete: boolean;
}

export const SEASON_START = { month: 9, day: 15 };

export function agriculturalSeasons(daily: ClimateDaily): AgriculturalSeason[] {
  const start = parseIsoDate(daily.start);
  const seasons: AgriculturalSeason[] = [];
  for (let year = new Date(start).getUTCFullYear() - 1; ; year++) {
    const from = Date.UTC(year, SEASON_START.month - 1, SEASON_START.day);
    const to = Date.UTC(year + 1, SEASON_START.month - 1, SEASON_START.day);
    const startIndex = (from - start) / DAY_MS;
    const length = (to - from) / DAY_MS;
    if (startIndex + length > daily.precip.length) break;
    if (startIndex < 0) continue;
    let complete = true;
    for (let i = startIndex; i < startIndex + length && complete; i++) {
      complete =
        daily.t2m[i] !== null && daily.t2mMax[i] !== null && daily.t2mMin[i] !== null && daily.precip[i] !== null;
    }
    seasons.push({ label: `${year}/${String(year + 1).slice(2)}`, startYear: year, startIndex, length, complete });
  }
  return seasons;
}

export function seasonDate(startYear: number, md: { month: number; day: number }) {
  const inStartYear = md.month > SEASON_START.month || (md.month === SEASON_START.month && md.day >= SEASON_START.day);
  return Date.UTC(inStartYear ? startYear : startYear + 1, md.month - 1, md.day);
}

export function windowTotals(
  daily: ClimateDaily,
  from: { month: number; day: number },
  to: { month: number; day: number },
): { season: string; precipMm: number | null }[] {
  const start = parseIsoDate(daily.start);
  return agriculturalSeasons(daily).map((s) => {
    const a = (seasonDate(s.startYear, from) - start) / DAY_MS;
    const b = (seasonDate(s.startYear, to) - start) / DAY_MS;
    const ps = daily.precip.slice(a, b + 1);
    return { season: s.label, precipMm: ps.every((p) => p !== null) ? valid(ps).reduce((x, y) => x + y, 0) : null };
  });
}
