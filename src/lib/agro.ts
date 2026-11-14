import type { Crop, SoilTexture } from "./types";

const GSC = 0.082;

export function extraterrestrialRadiation(latDeg: number, dayOfYear: number) {
  const phi = (latDeg * Math.PI) / 180;
  const angle = (2 * Math.PI * dayOfYear) / 365;
  const dr = 1 + 0.033 * Math.cos(angle);
  const delta = 0.409 * Math.sin(angle - 1.39);
  const ws = Math.acos(Math.min(1, Math.max(-1, -Math.tan(phi) * Math.tan(delta))));
  return (
    ((24 * 60) / Math.PI) *
    GSC *
    dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws))
  );
}

export function hargreavesEto(tmax: number, tmin: number, ra: number) {
  const tmean = (tmax + tmin) / 2;
  return Math.max(0, 0.0023 * (tmean + 17.8) * Math.sqrt(Math.max(0, tmax - tmin)) * 0.408 * ra);
}

export function kcOnDay(crop: Pick<Crop, "kc" | "stageDays">, day: number) {
  const { kc, stageDays } = crop;
  if ("constant" in kc) return kc.constant;
  if (!stageDays) return kc.mid;
  const [ini, dev, mid, late] = stageDays;
  if (day < ini) return kc.ini;
  if (day < ini + dev) return kc.ini + ((day - ini) / dev) * (kc.mid - kc.ini);
  if (day < ini + dev + mid) return kc.mid;
  return kc.mid + (Math.min(day - ini - dev - mid, late) / late) * (kc.end - kc.mid);
}

export const ROOT_DEPTH_M = 1.0;
export const AVAILABLE_WATER_FRACTION: Record<SoilTexture, number> = { sandy: 0.08, loamy: 0.155, clayey: 0.16 };

export const tawMm = (texture: SoilTexture) => 1000 * AVAILABLE_WATER_FRACTION[texture] * ROOT_DEPTH_M;

export function waterBalanceDay(
  drStart: number,
  day: { precipMm: number; etcMm: number; depletionFraction: number; tawMm: number; irrigate: boolean },
) {
  const { precipMm, etcMm, depletionFraction, tawMm: taw, irrigate } = day;
  const raw = depletionFraction * taw;
  const irrigationMm = irrigate && drStart > raw ? drStart : 0;
  const ks =
    irrigationMm > 0 || drStart <= raw ? 1 : Math.min(1, Math.max(0, (taw - drStart) / (taw - raw)));
  const etaMm = ks * etcMm;
  const x = drStart - precipMm - irrigationMm + etaMm;
  return { drEnd: Math.min(taw, Math.max(0, x)), ks, etaMm, irrigationMm, dpMm: Math.max(0, -x) };
}

export function ecocropSuitability(crop: Pick<Crop, "tempOptC" | "tempAbsC">, tempC: number) {
  const [absMin, absMax] = crop.tempAbsC;
  const [optMin, optMax] = crop.tempOptC;
  if (tempC <= absMin || tempC >= absMax) return 0;
  if (tempC >= optMin && tempC <= optMax) return 1;
  return tempC < optMin ? (tempC - absMin) / (optMin - absMin) : (absMax - tempC) / (absMax - optMax);
}
