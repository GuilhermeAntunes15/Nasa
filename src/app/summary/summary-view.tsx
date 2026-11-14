"use client";

import { useMemo } from "react";
import { climateSeries, climateTables, DataTable, windowSentences } from "@/components/climate-tables";
import { ClimateGate, NotEnoughSeasons, RegionGuard } from "@/components/climate-status";
import { DataBadge } from "@/components/data-badge";
import { DRAINAGE_LABELS, SOIL_LABELS } from "@/components/farm-form";
import { ProvenanceCard } from "@/components/provenance-card";
import { topRotations, TOP_LABEL, tradeOff } from "@/components/rotation-comparison";
import { DEMO_SCENARIO, FORECAST_DISCLAIMER, scenarioLabel, scenarioSentence, signed } from "@/components/scenario-controls";
import { Button } from "@/components/ui/button";
import { COMPOSITE_LABEL, INDICATOR_SHORT, LIMITATIONS, PRIORITY_LABELS, WeightsLine } from "@/components/why-dialog";
import { CITATIONS, CURRENT_SEQUENCES } from "@/lib/crops";
import { compareRotations, DIVERSITY_CAPS, locationRegion } from "@/lib/simulate";
import { DEFAULT_SCENARIO } from "@/lib/state";
import type { ClimateResponse, FarmProfile, Scenario } from "@/lib/types";

const section = "flex flex-col gap-4 border-t pt-8 print:border-black print:pt-4";
const h2 = "text-2xl font-medium";

function Report({ data, farm, scenario }: { data: ClimateResponse; farm: FarmProfile; scenario: Scenario }) {
  const test = scenarioLabel(scenario) ? scenario : DEMO_SCENARIO;
  const base = useMemo(() => compareRotations(data.daily, farm, DEFAULT_SCENARIO), [data, farm]);
  const scen = useMemo(() => compareRotations(data.daily, farm, test), [data, farm, test]);
  const series = useMemo(() => climateSeries(data.daily), [data]);
  const tables = climateTables(series);
  const showSeasons = locationRegion(farm.lat, farm.lon) !== "outside";

  return (
    <>
      <section aria-labelledby="s-location" className={section}>
        <h2 id="s-location" className={h2}>
          1. Location and data provenance
        </h2>
        <p>
          Selected point: {farm.lat}, {farm.lon}.
        </p>
        <ProvenanceCard provenance={data.provenance} />
      </section>

      <section aria-labelledby="s-climate" className={section}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="s-climate" className={h2}>
            2. Climate evidence, 2015–2025
          </h2>
          <DataBadge category="nasa" />
        </div>
        <p className="text-sm">Historical data (NASA POWER). No climate projections are used.</p>
        <DataTable {...tables.annual} />
        <DataTable {...tables.monthlyPrecip} />
        <DataTable {...tables.temperature} />
        {showSeasons && (
          <>
            <DataTable {...tables.seasons} />
            <ul className="list-disc pl-6 text-sm">
              {windowSentences(series.seasons).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="s-farm" className={section}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="s-farm" className={h2}>
            3. Farm information
          </h2>
          <DataBadge category="farmer" />
        </div>
        <dl className="panel grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[14rem_1fr]">
          <dt className="font-medium">Current crop sequence</dt>
          <dd>{CURRENT_SEQUENCES[farm.currentSequence].label}</dd>
          <dt className="font-medium">Soil texture</dt>
          <dd>{SOIL_LABELS[farm.soilTexture]}</dd>
          <dt className="font-medium">Drainage</dt>
          <dd>{DRAINAGE_LABELS[farm.drainage]}</dd>
          <dt className="font-medium">Soil pH</dt>
          <dd>{farm.soilPh ?? "Not provided"}</dd>
          <dt className="font-medium">Irrigation</dt>
          <dd>{farm.irrigation ? "Irrigation available" : "Rain-fed (no irrigation)"}</dd>
          <dt className="font-medium">Main priority</dt>
          <dd>{PRIORITY_LABELS[farm.priority]}</dd>
        </dl>
      </section>

      {!base || !scen ? (
        <NotEnoughSeasons />
      ) : (
        <>
          <section aria-labelledby="s-rotations" className={section}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="s-rotations" className={h2}>
                4. Rotations compared
              </h2>
              <DataBadge category="model" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Indicator scores (0–1) and exploratory index per rotation</caption>
                <thead>
                  <tr className="border-b">
                    <th scope="col" className="px-2 py-1 font-medium">Rotation</th>
                    {base[0].indicators.map((ind) => (
                      <th key={ind.id} scope="col" className="px-2 py-1 font-medium">
                        {ind.label}
                      </th>
                    ))}
                    <th scope="col" className="px-2 py-1 font-medium">Exploratory index (0–100)</th>
                  </tr>
                </thead>
                <tbody>
                  {base.map((r) => (
                    <tr key={r.rotation.id} className="border-b">
                      <th scope="row" className="px-2 py-1 font-normal">
                        {r.rotation.name}
                        {topRotations(base).has(r.rotation.id) && (
                          <span className="block text-xs font-medium">{TOP_LABEL}</span>
                        )}
                      </th>
                      {r.indicators.map((ind) => (
                        <td key={ind.id} className="px-2 py-1">
                          {ind.score.toFixed(2)}
                        </td>
                      ))}
                      <td className="px-2 py-1">{Math.round(r.composite)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs">{COMPOSITE_LABEL}.</p>
            <WeightsLine weights={base[0].weights} priority={farm.priority} />
            <p className="text-xs">
              Crop diversity caps: {DIVERSITY_CAPS.species} species and {DIVERSITY_CAPS.groups} functional groups
              reach the maximum score. Sensitivity to rainfall deficits is a deficit-sensitivity score (FAO-33
              water-production form), not a yield forecast.
            </p>
          </section>

          <section aria-labelledby="s-tradeoffs" className={section}>
            <h2 id="s-tradeoffs" className={h2}>
              5. Trade-offs compared with Current
            </h2>
            <p className="text-sm">
              &ldquo;Better&rdquo; means a score at least 0.02 higher than Current, &ldquo;worse&rdquo; at least 0.02
              lower; anything else is &ldquo;similar&rdquo;.
            </p>
            <DataTable
              caption="Score difference against the Current rotation"
              columns={["Indicator", ...base.slice(1).map((r) => r.rotation.name)]}
              rows={base[0].indicators.map((ind, i) => [
                ind.label,
                ...base.slice(1).map((r) => {
                  const delta = r.indicators[i].score - ind.score;
                  return `${tradeOff(delta)} (${signed(delta)})`;
                }),
              ])}
            />
          </section>

          <section aria-labelledby="s-scenario" className={section}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="s-scenario" className={h2}>
                6. Scenario sensitivity: {scenarioLabel(test)}
              </h2>
              <DataBadge category="scenario" />
            </div>
            <p className="text-sm font-medium">{FORECAST_DISCLAIMER}</p>
            <ul className="list-disc pl-6 text-sm">
              {base.map((b, k) => (
                <li key={b.rotation.id}>{scenarioSentence(b, scen[k], test)}</li>
              ))}
            </ul>
            <DataTable
              caption="Exploratory index (0–100) and indicator score changes, baseline vs scenario"
              columns={["Rotation", "Baseline", "Scenario", ...Object.values(INDICATOR_SHORT).map((s) => `Δ ${s}`)]}
              rows={base.map((b, k) => [
                b.rotation.name,
                b.composite.toFixed(0),
                scen[k].composite.toFixed(0),
                ...b.indicators.map((ind, i) => signed(scen[k].indicators[i].score - ind.score)),
              ])}
            />
          </section>
        </>
      )}

      <section aria-labelledby="s-sources" className={section}>
        <h2 id="s-sources" className={h2}>
          7. Sources
        </h2>
        <p className="text-sm">
          NASA POWER request: <span className="break-all">{data.provenance.requestUrl}</span> (retrieved{" "}
          {data.provenance.retrievedAt}).
        </p>
        <p className="text-sm">{data.provenance.acknowledgment}</p>
        <ul className="list-disc pl-6 text-sm">
          {Object.values(CITATIONS).map((c) => (
            <li key={c.id}>
              {c.full} {c.url && <span className="break-all">{c.url}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="s-limits" className={section}>
        <h2 id="s-limits" className={h2}>
          8. Limitations
        </h2>
        <ul className="list-disc pl-6 text-sm">
          {LIMITATIONS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function SummaryView({ farm, scenario }: { farm: FarmProfile; scenario: Scenario }) {
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 print:block">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-medium md:text-5xl">Farm summary</h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            Exploratory decision support based on NASA POWER data, your farm information and published crop
            parameters. Data: NASA POWER.
          </p>
        </div>
        <Button size="lg" onClick={() => window.print()} className="h-11 px-5 text-base print:hidden">
          Print / Save as PDF
        </Button>
      </header>
      <RegionGuard farm={farm} scenario={scenario}>
        <ClimateGate lat={farm.lat} lon={farm.lon}>
          {(data) => <Report data={data} farm={farm} scenario={scenario} />}
        </ClimateGate>
      </RegionGuard>
    </>
  );
}
