"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ClimateGate, NotEnoughSeasons, RegionGuard } from "@/components/climate-status";
import { DataBadge } from "@/components/data-badge";
import { ProvenanceCard } from "@/components/provenance-card";
import { Button } from "@/components/ui/button";
import { formatValue, WeightsLine } from "@/components/why-dialog";
import { compareRotations, diffResults, locationRegion } from "@/lib/simulate";
import { DEFAULT_SCENARIO, PRECIP_RANGE, serializeState, TEMP_RANGE } from "@/lib/state";
import type { ClimateResponse, FarmProfile, RotationResult, Scenario } from "@/lib/types";

export const FORECAST_DISCLAIMER = "These are hypothetical scenarios, not weather forecasts.";
export const DEMO_SCENARIO: Scenario = { precipChangePct: -20, tempDeltaC: 0 };

const sign = (x: number) => (x > 0 ? "+" : x < 0 ? "−" : "");
const precipText = (pct: number) => `${sign(pct)}${Math.abs(pct)}%`;
const tempText = (dt: number) => `${sign(dt)}${Math.abs(dt)} °C`;
export const signed = (x: number, digits = 2) => {
  const rounded = Number(x.toFixed(digits));
  return `${sign(rounded)}${Math.abs(rounded).toFixed(digits)}`;
};

export function scenarioLabel(s: Scenario) {
  const parts = [
    s.precipChangePct !== 0 && `${precipText(s.precipChangePct)} rainfall`,
    s.tempDeltaC !== 0 && `${tempText(s.tempDeltaC)} temperature`,
  ].filter(Boolean);
  return parts.join(" and ");
}

export function scenarioSentence(base: RotationResult, scen: RotationResult, scenario: Scenario) {
  const label = scenarioLabel(scenario);
  const name = base.rotation.name;
  if (!label) return `${name}: historical baseline. Move a slider to test a hypothetical scenario.`;
  const changes = base.indicators.map((ind, i) => ({ ind, other: scen.indicators[i] }));
  const largest = changes.reduce((a, b) =>
    Math.abs(b.other.score - b.ind.score) > Math.abs(a.other.score - a.ind.score) ? b : a,
  );
  if (Math.abs(largest.other.score - largest.ind.score) < 0.005) {
    return `Under ${label}, every indicator score of ${name} stays within 0.005 of the baseline.`;
  }
  const noun = largest.ind.id === "deficit" ? "deficit-sensitivity index" : largest.ind.label.toLowerCase();
  const from = formatValue(largest.ind);
  const to = formatValue(largest.other);
  if (from === to) {
    return `Under ${label}, the ${noun} of ${name} stays at ${from}, while its score moves from ${largest.ind.score.toFixed(2)} to ${largest.other.score.toFixed(2)}.`;
  }
  const verb = largest.other.value > largest.ind.value ? "rises" : "falls";
  return `Under ${label}, the ${noun} of ${name} ${verb} from ${from} to ${to}.`;
}

function ScenarioResults({ data, farm, scenario }: { data: ClimateResponse; farm: FarmProfile; scenario: Scenario }) {
  const base = useMemo(() => compareRotations(data.daily, farm, DEFAULT_SCENARIO), [data, farm]);
  const scen = useMemo(() => compareRotations(data.daily, farm, scenario), [data, farm, scenario]);
  if (!base || !scen) return <NotEnoughSeasons />;
  const diff = diffResults(base, scen);
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        {base.map((b, k) => (
          <article key={b.rotation.id} aria-labelledby={`${b.rotation.id}-scen`} className="panel flex flex-col gap-3">
            <h2 id={`${b.rotation.id}-scen`} className="text-lg font-semibold">
              {b.rotation.name}
            </h2>
            <p className="rounded-lg bg-muted p-3 text-sm">{scenarioSentence(b, scen[k], scenario)}</p>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Baseline and scenario scores for {b.rotation.name}</caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="py-1 pr-2 font-medium">Indicator</th>
                  <th scope="col" className="py-1 pr-2 font-medium">Baseline</th>
                  <th scope="col" className="py-1 pr-2 font-medium">Scenario</th>
                  <th scope="col" className="py-1 font-medium">Δ</th>
                </tr>
              </thead>
              <tbody>
                {diff[k].indicators.map((d, i) => (
                  <tr key={d.id} className="border-b align-top">
                    <th scope="row" className="py-1 pr-2 font-normal">
                      {b.indicators[i].label}
                    </th>
                    <td className="py-1 pr-2">{d.base.toFixed(2)}</td>
                    <td className="py-1 pr-2">{d.scenario.toFixed(2)}</td>
                    <td className="py-1">{signed(d.delta, 2)}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="py-1 pr-2 font-medium">
                    Exploratory index (0–100)
                  </th>
                  <td className="py-1 pr-2">{diff[k].composite.base.toFixed(0)}</td>
                  <td className="py-1 pr-2">{diff[k].composite.scenario.toFixed(0)}</td>
                  <td className="py-1">{signed(diff[k].composite.delta, 1)}</td>
                </tr>
              </tbody>
            </table>
            <WeightsLine weights={b.weights} priority={farm.priority} />
          </article>
        ))}
      </div>
      <ProvenanceCard provenance={data.provenance} />
    </>
  );
}

export function ScenarioControls({ farm, scenario: initial }: { farm: FarmProfile; scenario: Scenario }) {
  const [scenario, setScenario] = useState(initial);
  const deferred = useDeferredValue(scenario);
  const outside = locationRegion(farm.lat, farm.lon) === "outside";

  const update = (next: Scenario) => {
    setScenario(next);
    window.history.replaceState(null, "", `?${serializeState(farm, next)}`);
  };

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-medium md:text-5xl">Scenario Lab</h1>
        <p className="inline-flex w-fit items-center gap-2 rounded-lg border border-dashed border-navy bg-white px-3 py-1.5 font-medium">{FORECAST_DISCLAIMER}</p>
        <p className="text-sm text-muted-foreground">
          Rainfall is scaled and temperature is shifted on every day of the 2015–2025 NASA POWER series, then all
          three rotations are recalculated.
        </p>
      </header>

      <section aria-labelledby="controls-title" className="panel flex flex-col gap-5 border-t-4 border-t-navy">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="controls-title" className="font-heading text-xl font-medium">
            Scenario
          </h2>
          <DataBadge category="scenario" />
        </div>
        {outside && (
          <p className="text-sm text-muted-foreground">
            Scenario controls are disabled because rotation comparisons are not available for this location.
          </p>
        )}
        <fieldset disabled={outside} className="flex min-w-0 flex-col gap-5 disabled:opacity-50">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="dp" className="text-sm font-medium">
                Rainfall change
              </label>
              <input
                id="dp"
                type="range"
                className="h-2 w-full cursor-pointer accent-forest disabled:cursor-not-allowed"
                min={PRECIP_RANGE.min}
                max={PRECIP_RANGE.max}
                step={PRECIP_RANGE.step}
                value={scenario.precipChangePct}
                aria-valuetext={precipText(scenario.precipChangePct)}
                onChange={(e) => update({ ...scenario, precipChangePct: Number(e.target.value) })}
              />
              <output htmlFor="dp" className="font-heading text-3xl">{precipText(scenario.precipChangePct)}</output>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="dt" className="text-sm font-medium">
                Temperature change
              </label>
              <input
                id="dt"
                type="range"
                className="h-2 w-full cursor-pointer accent-forest disabled:cursor-not-allowed"
                min={TEMP_RANGE.min}
                max={TEMP_RANGE.max}
                step={TEMP_RANGE.step}
                value={scenario.tempDeltaC}
                aria-valuetext={tempText(scenario.tempDeltaC)}
                onChange={(e) => update({ ...scenario, tempDeltaC: Number(e.target.value) })}
              />
              <output htmlFor="dt" className="font-heading text-3xl">{tempText(scenario.tempDeltaC)}</output>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => update(DEFAULT_SCENARIO)}>
              Historical baseline
            </Button>
            <Button variant="outline" onClick={() => update(DEMO_SCENARIO)}>
              −20% rainfall (demo)
            </Button>
          </div>
        </fieldset>
      </section>

      <RegionGuard farm={farm} scenario={scenario}>
        <ClimateGate lat={farm.lat} lon={farm.lon}>
          {(data) => <ScenarioResults data={data} farm={farm} scenario={deferred} />}
        </ClimateGate>
      </RegionGuard>
    </>
  );
}
