"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { DataTable, MONTHS, num } from "@/components/climate-tables";
import { DataBadge } from "@/components/data-badge";
import { Button } from "@/components/ui/button";
import { toMonthly } from "@/lib/climate";
import {
  clampView,
  DEFAULT_VIEW,
  FONT,
  PITCH_RANGE,
  RAIN_STOPS,
  terrainGrid,
  terrainScene,
  VIEW_RADIUS,
  YAW_RANGE,
  type TerrainCell,
} from "@/lib/terrain";
import type { ClimateDaily } from "@/lib/types";

const BOX = `${-VIEW_RADIUS} ${-VIEW_RADIUS} ${2 * VIEW_RADIUS} ${2 * VIEW_RADIUS}`;
const HINT = "Drag to rotate and tilt, or use the sliders. Hover or tap a column to read its value.";
// ponytail: fixed tick subset (Jan/Apr/Jul/Oct, odd years); an axis is hidden when its labels would overlap.
const TICK_MONTHS = [1, 4, 7, 10];

const monthName = (c: TerrainCell) => `${MONTHS[c.month - 1]} ${c.year}`;

const readable = (a?: { x: number; y: number }, b?: { x: number; y: number }) =>
  !!a && !!b && (Math.abs(a.x - b.x) >= 2.2 || Math.abs(a.y - b.y) >= 0.9);

export function RainTerrain({ daily }: { daily: ClimateDaily }) {
  const [view, setView] = useState(DEFAULT_VIEW);
  const [active, setActive] = useState<number | null>(null);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const grid = useMemo(() => terrainGrid(toMonthly(daily)), [daily]);
  const scene = useMemo(() => terrainScene(grid, view), [grid, view]);

  const first = grid.years[0];
  const last = grid.years[grid.years.length - 1];
  const maxMm = Math.round(grid.maxMm);
  const label = [
    `3D column chart of monthly rainfall at this NASA POWER grid point, arranged by month and year, ${first}–${last}: ${grid.years.length} years by 12 months, 0 to ${maxMm} mm/month.`,
    grid.wettest && `Wettest month: ${monthName(grid.wettest)}, ${maxMm} mm.`,
    grid.gaps > 0 && `${grid.gaps} ${grid.gaps === 1 ? "month" : "months"} without complete data.`,
    "All values are in the table below.",
  ]
    .filter(Boolean)
    .join(" ");

  const cell = active === null ? null : grid.cells[active];
  const readout = !cell
    ? HINT
    : cell.precipMm === null
      ? `${monthName(cell)}: no data (month with missing days)`
      : `${monthName(cell)}: ${num(cell.precipMm)} mm/month`;

  const monthTicks = scene.monthTicks.filter((t) => TICK_MONTHS.includes(t.month));
  const yearTicks = scene.yearTicks.filter((t) => t.year % 2 === 1);

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, ...view };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  // ponytail: no rAF throttle; browsers deliver pointermove once per frame — add rAF if profiling shows jank
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    setView(clampView({ yaw: d.yaw + (e.clientX - d.x) * 0.5, pitch: d.pitch + (e.clientY - d.y) * 0.3 }));
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <figure className="panel flex min-w-0 flex-col gap-3 lg:col-span-2">
      <figcaption className="flex flex-wrap items-center gap-2 font-heading text-lg font-medium">
        Monthly rainfall in 3D: every month, 2015–2025 <DataBadge category="nasa" />
      </figcaption>
      <p className="text-sm text-muted-foreground">
        Each column is one calendar month of rainfall at this NASA POWER grid point, arranged by month (across) and
        year (depth), not by location. Months with missing days are shown as dashed outlines, not as zero.
      </p>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <svg
          viewBox={BOX}
          role="img"
          aria-label={label}
          className="block h-auto max-h-[460px] w-full max-w-full min-w-0 cursor-grab touch-pan-y touch-pinch-zoom select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        >
          <polygon points={scene.floor} fill="var(--muted)" />
          {scene.faces.map((f) => (
            <polygon
              key={`${f.cell}-${f.kind}`}
              points={f.points}
              fill={f.fill ?? "transparent"}
              stroke={
                f.cell === active ? "var(--color-forest)" : f.fill ? "rgb(8 27 44 / 0.25)" : "var(--muted-foreground)"
              }
              strokeWidth={f.cell === active ? 2.5 : f.fill ? 0.75 : 1}
              strokeDasharray={f.fill ? undefined : "3 2"}
              vectorEffect="non-scaling-stroke"
              onPointerEnter={() => setActive(f.cell)}
            />
          ))}
          <g
            pointerEvents="none"
            fontSize={FONT}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--muted-foreground)"
          >
            {readable(monthTicks[0], monthTicks[1]) &&
              monthTicks.map((t) => (
                <text key={t.month} x={t.x} y={t.y}>
                  {MONTHS[t.month - 1]}
                </text>
              ))}
            {readable(yearTicks[0], yearTicks[1]) &&
              yearTicks.map((t) => (
                <text key={t.year} x={t.x} y={t.y}>
                  {t.year}
                </text>
              ))}
          </g>
        </svg>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 flex-col gap-4 print:hidden">
            <div className="flex flex-col gap-1">
              <label htmlFor="terrain-yaw" className="text-sm font-medium">
                Rotate
              </label>
              <input
                id="terrain-yaw"
                type="range"
                className="h-2 w-full cursor-pointer accent-forest"
                min={YAW_RANGE.min}
                max={YAW_RANGE.max}
                step={YAW_RANGE.step}
                value={view.yaw}
                aria-valuetext={`${Math.round(view.yaw)}°`}
                onChange={(e) => setView({ ...view, yaw: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="terrain-pitch" className="text-sm font-medium">
                Tilt
              </label>
              <input
                id="terrain-pitch"
                type="range"
                className="h-2 w-full cursor-pointer accent-forest"
                min={PITCH_RANGE.min}
                max={PITCH_RANGE.max}
                step={PITCH_RANGE.step}
                value={view.pitch}
                aria-valuetext={`${Math.round(view.pitch)}°`}
                onChange={(e) => setView({ ...view, pitch: Number(e.target.value) })}
              />
            </div>
            <Button variant="outline" className="w-fit" onClick={() => setView(DEFAULT_VIEW)}>
              Reset view
            </Button>
            <p className="min-h-10 text-sm">{readout}</p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <p>Column height and colour: monthly rainfall (mm/month)</p>
            <svg aria-hidden="true" viewBox="0 0 100 8" preserveAspectRatio="none" className="block h-3 w-full">
              <defs>
                <linearGradient id="rain-legend">
                  {RAIN_STOPS.map((color, i) => (
                    <stop key={color} offset={i / 3} stopColor={color} />
                  ))}
                </linearGradient>
              </defs>
              <rect width="100" height="8" fill="url(#rain-legend)" stroke="rgb(8 27 44 / 0.25)" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{maxMm} mm/month</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0">
                <rect
                  x="1"
                  y="1"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="var(--muted-foreground)"
                  strokeDasharray="3 2"
                />
              </svg>
              No data
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Source: NASA POWER daily data (PRECTOTCORR), summed per calendar month, 2015–2025. Gridded reanalysis estimates
        (~50 km), not measured at your farm.
      </p>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-forest underline-offset-4 hover:underline">
          Show data table
        </summary>
        <DataTable
          caption="Monthly rainfall by year, 2015–2025 (mm/month; — = month with missing days)"
          columns={["Year", ...MONTHS]}
          rows={grid.years.map((year, r) => [year, ...grid.cells.slice(r * 12, r * 12 + 12).map((c) => num(c.precipMm))])}
        />
      </details>
    </figure>
  );
}
