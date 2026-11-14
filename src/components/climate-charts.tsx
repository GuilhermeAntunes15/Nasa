"use client";

import type { ReactElement } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClimateGate } from "@/components/climate-status";
import { climateSeries, climateTables, DataTable, SECOND_WINDOW, SOY_WINDOW, windowSentences } from "@/components/climate-tables";
import { DataBadge } from "@/components/data-badge";
import { ProvenanceCard } from "@/components/provenance-card";
import { RainTerrain } from "@/components/rain-terrain";
import { locationRegion } from "@/lib/simulate";
import type { ClimateDaily, FarmProfile } from "@/lib/types";

const SOURCE = "Source: NASA POWER daily data (PRECTOTCORR, T2M, T2M_MAX, T2M_MIN), 2015–2025.";

function ChartFigure({
  title,
  table,
  children,
}: {
  title: string;
  table: Parameters<typeof DataTable>[0];
  children: ReactElement;
}) {
  return (
    <figure className="panel flex min-w-0 flex-col gap-3">
      <figcaption className="flex flex-wrap items-center gap-2 font-heading text-lg font-medium">
        {title} <DataBadge category="nasa" />
      </figcaption>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={260}>
          {children}
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">{SOURCE}</p>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-forest underline-offset-4 hover:underline">Show data table</summary>
        <DataTable {...table} />
      </details>
    </figure>
  );
}

function Charts({ daily, showSeasons }: { daily: ClimateDaily; showSeasons: boolean }) {
  const series = climateSeries(daily);
  const tables = climateTables(series);
  const unit = (value: string) => ({ value, angle: -90, position: "insideLeft" as const });
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartFigure title="Annual rainfall" table={tables.annual}>
        <BarChart data={series.annual}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis label={unit("mm/yr")} />
          <Tooltip />
          <Bar dataKey="precipMm" name="Rainfall (mm/yr)" fill="var(--chart-3)" stroke="var(--chart-5)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartFigure>

      <ChartFigure title="Monthly rainfall: mean and min–max range" table={tables.monthlyPrecip}>
        <ComposedChart data={series.normals}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={unit("mm/month")} />
          <Tooltip />
          <Legend />
          <Bar dataKey="precipMeanMm" name="Mean" fill="var(--chart-2)" stroke="var(--chart-5)" radius={[3, 3, 0, 0]} />
          <Line dataKey="precipMinMm" name="Min" stroke="var(--chart-3)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          <Line dataKey="precipMaxMm" name="Max" stroke="var(--chart-5)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
        </ComposedChart>
      </ChartFigure>

      <RainTerrain daily={daily} />

      <ChartFigure title="Monthly temperature" table={tables.temperature}>
        <LineChart data={series.normals}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={unit("°C")} domain={[(min: number) => Math.floor(min - 2), (max: number) => Math.ceil(max + 2)]} />
          <Tooltip />
          <Legend />
          <Line dataKey="t2mMean" name="Mean T2M" stroke="var(--chart-5)" strokeWidth={2.5} dot={false} />
          <Line dataKey="tmaxMean" name="Mean Tmax" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
          <Line dataKey="tminMean" name="Mean Tmin" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
          <Line dataKey="tmaxHighest" name="Highest Tmax" stroke="var(--chart-4)" strokeDasharray="4 4" dot={false} />
          <Line dataKey="tminLowest" name="Lowest Tmin" stroke="var(--chart-3)" strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ChartFigure>

      {showSeasons && (
        <div className="flex flex-col gap-4">
          <ChartFigure title="Rainfall in the crop windows per season" table={tables.seasons}>
            <BarChart data={series.seasons}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="season" interval={0} angle={-35} textAnchor="end" height={50} tick={{ fontSize: 11 }} />
              <YAxis label={unit("mm")} />
              <Tooltip />
              <Legend />
              <Bar dataKey="soybean" name={SOY_WINDOW.label} fill="var(--chart-3)" stroke="var(--chart-5)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="second" name={SECOND_WINDOW.label} fill="var(--chart-2)" stroke="var(--chart-5)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartFigure>
          <ul className="list-disc pl-6 text-sm">
            {windowSentences(series.seasons).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ClimateCharts({ farm }: { farm: FarmProfile }) {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-medium md:text-5xl">Climate at your farm</h1>
        <p className="max-w-3xl text-lg">
          Historical data, 2015–2025 (NASA POWER). No climate projections are used. Hypothetical scenarios are in the
          Scenario Lab.
        </p>
        <p className="text-sm text-muted-foreground">
          Point {farm.lat}, {farm.lon}. Gridded reanalysis estimates (~50 km), not measured at your farm.
        </p>
      </header>
      <ClimateGate lat={farm.lat} lon={farm.lon}>
        {(data) => (
          <>
            <Charts daily={data.daily} showSeasons={locationRegion(farm.lat, farm.lon) !== "outside"} />
            <ProvenanceCard provenance={data.provenance} />
          </>
        )}
      </ClimateGate>
    </>
  );
}
