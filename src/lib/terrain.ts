import type { MonthlyClimate } from "./types";

export interface TerrainCell {
  year: number;
  month: number;
  precipMm: number | null;
}

export interface TerrainGrid {
  years: number[];
  cells: TerrainCell[];
  maxMm: number;
  wettest: TerrainCell | null;
  gaps: number;
}

export interface TerrainView {
  yaw: number;
  pitch: number;
}

export type FaceKind = "top" | "side-x" | "side-y" | "gap";

export interface TerrainFace {
  cell: number;
  kind: FaceKind;
  points: string;
  fill: string | null;
}

export interface TerrainScene {
  floor: string;
  faces: TerrainFace[];
  monthTicks: { month: number; x: number; y: number }[];
  yearTicks: { year: number; x: number; y: number }[];
}

type Point3 = readonly [number, number, number];

export const DEFAULT_VIEW: TerrainView = { yaw: 30, pitch: 35 };
export const YAW_RANGE = { min: -180, max: 175, step: 5 };
export const PITCH_RANGE = { min: 10, max: 80, step: 5 };
export const RAIN_STOPS = ["#f5f4ed", "#a8c9b3", "#5ea8d1", "#081b2c"] as const;
export const FONT = 0.85;
// max anchor = hypot(hypot(7.1, 5), 2.5) = 9.04 ≤ R − 1; + half the width of "2015" ≈ 1.02 ⇒ ≤ 10.1 < R
export const VIEW_RADIUS = 11;

const HEIGHT = 5;
const HALF = 0.4;
const MONTH_TICK_Y = 6.3;
const YEAR_TICK_X = 7.1;
// sin/cos at multiples of 90° leave float residue (Math.sin(Math.PI) = 1.2e-16).
const EPS = 1e-9;
const RAD = Math.PI / 180;

export function terrainGrid(monthly: readonly Pick<MonthlyClimate, "year" | "month" | "precipMm">[]): TerrainGrid {
  if (!monthly.length) return { years: [], cells: [], maxMm: 0, wettest: null, gaps: 0 };
  const first = Math.min(...monthly.map((m) => m.year));
  const last = Math.max(...monthly.map((m) => m.year));
  const years = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const cells: TerrainCell[] = years.flatMap((year) =>
    Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1, precipMm: null })),
  );
  for (const m of monthly) cells[(m.year - first) * 12 + m.month - 1].precipMm = m.precipMm;
  const values = cells.flatMap((c) => (c.precipMm === null ? [] : [c.precipMm]));
  const maxMm = values.length ? Math.max(...values) : 0;
  return {
    years,
    cells,
    maxMm,
    wettest: maxMm > 0 ? (cells.find((c) => c.precipMm === maxMm) ?? null) : null,
    gaps: cells.length - values.length,
  };
}

export function clampView(v: TerrainView): TerrainView {
  return {
    yaw: ((((v.yaw + 180) % 360) + 360) % 360) - 180,
    pitch: Math.min(PITCH_RANGE.max, Math.max(PITCH_RANGE.min, v.pitch)),
  };
}

export function project(p: Point3, view: TerrainView) {
  const t = view.yaw * RAD;
  const f = view.pitch * RAD;
  const [x, y, z] = p;
  const v = x * Math.sin(t) + y * Math.cos(t);
  return { x: x * Math.cos(t) - y * Math.sin(t), y: -(v * Math.sin(f) + z * Math.cos(f)), v };
}

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

export function rainColor(t: number, shade = 0): string {
  const k = Number.isNaN(t) ? 0 : Math.min(1, Math.max(0, t)) * 3;
  const i = Math.min(2, Math.floor(k));
  const a = hex(RAIN_STOPS[i]);
  const b = hex(RAIN_STOPS[i + 1]);
  const navy = hex(RAIN_STOPS[3]);
  return `#${a
    .map((ch, j) => {
      const mixed = ch + (b[j] - ch) * (k - i);
      return Math.round(mixed + (navy[j] - mixed) * shade)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

export function terrainScene(grid: TerrainGrid, view: TerrainView): TerrainScene {
  const s = Math.sin(view.yaw * RAD);
  const c = Math.cos(view.yaw * RAD);
  const nY = grid.years.length;
  const centre = (i: number) => [(i % 12) - 5.5, (nY - 1) / 2 - Math.floor(i / 12)] as const;
  const at = (x: number, y: number, z: number) => project([x, y, z - HEIGHT / 2], view);
  const poly = (corners: Point3[]) =>
    corners
      .map(([x, y, z]) => {
        const p = at(x, y, z);
        return `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
      })
      .join(" ");

  const order = grid.cells
    .map((_, i) => i)
    .sort((a, b) => {
      const [ax, ay] = centre(a);
      const [bx, by] = centre(b);
      return bx * s + by * c - (ax * s + ay * c);
    });

  const faces: TerrainFace[] = [];
  for (const i of order) {
    const [cx, cy] = centre(i);
    const x0 = cx - HALF;
    const x1 = cx + HALF;
    const y0 = cy - HALF;
    const y1 = cy + HALF;
    const mm = grid.cells[i].precipMm;
    if (mm === null) {
      faces.push({ cell: i, kind: "gap", fill: null, points: poly([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]]) });
      continue;
    }
    const t = grid.maxMm > 0 ? mm / grid.maxMm : 0;
    const h = t * HEIGHT;
    if (h > 0) {
      if (Math.abs(s) > EPS) {
        const x = s < -EPS ? x1 : x0;
        faces.push({ cell: i, kind: "side-x", fill: rainColor(t, 0.15), points: poly([[x, y0, 0], [x, y1, 0], [x, y1, h], [x, y0, h]]) });
      }
      if (Math.abs(c) > EPS) {
        const y = c < -EPS ? y1 : y0;
        faces.push({ cell: i, kind: "side-y", fill: rainColor(t, 0.3), points: poly([[x0, y, 0], [x1, y, 0], [x1, y, h], [x0, y, h]]) });
      }
    }
    faces.push({ cell: i, kind: "top", fill: rainColor(t), points: poly([[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]]) });
  }

  const fx = 6;
  const fy = nY / 2;
  const tickY = c < -EPS ? MONTH_TICK_Y : -MONTH_TICK_Y;
  const tickX = s < -EPS ? YEAR_TICK_X : -YEAR_TICK_X;
  return {
    floor: poly([[-fx, -fy, 0], [fx, -fy, 0], [fx, fy, 0], [-fx, fy, 0]]),
    faces,
    monthTicks: Array.from({ length: 12 }, (_, i) => {
      const p = at(i - 5.5, tickY, 0);
      return { month: i + 1, x: p.x, y: p.y };
    }),
    yearTicks: grid.years.map((year, r) => {
      const p = at(tickX, (nY - 1) / 2 - r, 0);
      return { year, x: p.x, y: p.y };
    }),
  };
}
