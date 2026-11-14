"use client";

import { CheckIcon } from "lucide-react";
import { useMemo } from "react";
import { ClimateGate, NotEnoughSeasons, RegionGuard } from "@/components/climate-status";
import { ProvenanceCard } from "@/components/provenance-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { scenarioLabel, signed } from "@/components/scenario-controls";
import { COMPOSITE_LABEL, DEFICIT_NOTE, formatValue, WeightsLine, WhyDialog } from "@/components/why-dialog";
import { CITATIONS } from "@/lib/crops";
import { compareRotations } from "@/lib/simulate";
import type { ClimateResponse, FarmProfile, IndicatorId, RotationResult, Scenario } from "@/lib/types";

export const TOP_LABEL = "Highest index for your priority (exploratory)";
export const TIE_NOTE = "Indices that round to the same whole number are shown as tied.";

export function tradeOff(delta: number) {
  // Compare the delta as displayed (2 decimals, same as signed()) so the word never contradicts the number.
  const shown = Number(delta.toFixed(2));
  return shown >= 0.02 ? "better" : shown <= -0.02 ? "worse" : "similar";
}

export function versusCurrent(id: IndicatorId, delta: number) {
  const word = tradeOff(delta);
  const text =
    id === "water"
      ? { better: "Lower than Current", worse: "Higher than Current", similar: "Similar to Current" }[word]
      : { better: "Better than Current", worse: "Worse than Current", similar: "Similar to Current" }[word];
  return `${text} (score ${signed(delta)})`;
}

export function topRotations(results: RotationResult[]) {
  const top = Math.max(...results.map((r) => Math.round(r.composite)));
  return new Set(results.filter((r) => Math.round(r.composite) === top).map((r) => r.rotation.id));
}

function RotationCard({
  result,
  current,
  farm,
  isTop,
}: {
  result: RotationResult;
  current: RotationResult;
  farm: FarmProfile;
  isTop: boolean;
}) {
  const isCurrent = result.rotation.id === "current";
  return (
    <article aria-labelledby={`${result.rotation.id}-title`} className={`panel flex flex-col gap-4 ${isTop ? "ring-2 ring-forest" : ""}`}>
      <header className="flex flex-col gap-1">
        <h2 id={`${result.rotation.id}-title`} className="text-lg font-semibold">
          {result.rotation.name}
        </h2>
        <p className="text-sm text-muted-foreground">{result.rotation.intent}</p>
      </header>

      <table className="w-full text-left text-sm">
        <caption className="sr-only">Indicators for {result.rotation.name}</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-1 pr-2 font-medium">Indicator</th>
            <th scope="col" className="py-1 pr-2 font-medium">Value</th>
            <th scope="col" className="py-1 font-medium">Score (0–1)</th>
          </tr>
        </thead>
        <tbody>
          {result.indicators.map((ind, i) => (
            <tr key={ind.id} className="border-b align-top last:border-0">
              <th scope="row" className="py-1 pr-2 font-normal">
                {ind.label}
                {ind.id === "deficit" && <span className="block text-xs text-muted-foreground">{DEFICIT_NOTE}</span>}
                {!isCurrent && (
                  <span className="block text-xs text-muted-foreground">
                    {versusCurrent(ind.id, ind.score - current.indicators[i].score)}
                  </span>
                )}
              </th>
              <td className="py-1 pr-2">{formatValue(ind)}</td>
              <td className="py-1">
                {ind.score.toFixed(2)}
                <span aria-hidden="true" className="mt-1 block h-1.5 w-16 overflow-hidden rounded-full bg-muted outline outline-1 outline-border">
                  <span className="block h-full bg-forest" style={{ width: `${Math.round(ind.score * 100)}%` }} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-1 border-t pt-3">
        <p>
          Exploratory index: <strong className="font-heading text-3xl font-medium">{Math.round(result.composite)}</strong> / 100
        </p>
        <p className="text-xs text-muted-foreground">{COMPOSITE_LABEL}</p>
        <WeightsLine weights={result.weights} priority={farm.priority} />
        {isTop && (
          <p className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-forest px-3 py-1 text-sm font-medium text-white">
            <CheckIcon aria-hidden="true" className="size-3.5" />
            {TOP_LABEL}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1 border-t pt-3">
        <h3 className="text-sm font-semibold">Limitations and flags</h3>
        <ul className="flex flex-col gap-2 text-sm">
          {result.flags.map((flag) => (
            <li key={flag.message}>
              <strong>{flag.severity === "caution" ? "Caution: " : "Note: "}</strong>
              {flag.message}
              {flag.citationId && CITATIONS[flag.citationId] && (
                <>
                  {" "}
                  <a
                    href={CITATIONS[flag.citationId].url}
                    className="font-medium text-forest underline underline-offset-4"
                    rel="noreferrer"
                    target="_blank"
                  >
                    {CITATIONS[flag.citationId].short}
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        <WhyDialog result={result} priority={farm.priority} />
      </div>
    </article>
  );
}

function Results({ data, farm, scenario }: { data: ClimateResponse; farm: FarmProfile; scenario: Scenario }) {
  const results = useMemo(() => compareRotations(data.daily, farm, scenario), [data, farm, scenario]);
  if (!results) return <NotEnoughSeasons />;
  const top = topRotations(results);
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Based on {results[0].seasonsUsed.length} complete agricultural seasons ({results[0].seasonsUsed[0]} to{" "}
        {results[0].seasonsUsed.at(-1)}).
      </p>
      {top.size > 1 && <p className="text-sm text-muted-foreground">{TIE_NOTE}</p>}
      <div className="grid gap-6 lg:grid-cols-3">
        {results.map((r) => (
          <RotationCard key={r.rotation.id} result={r} current={results[0]} farm={farm} isTop={top.has(r.rotation.id)} />
        ))}
      </div>
      <ProvenanceCard provenance={data.provenance} />
    </>
  );
}

export function RotationComparison({ farm, scenario }: { farm: FarmProfile; scenario: Scenario }) {
  const label = scenarioLabel(scenario);
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-medium md:text-5xl">Compare rotations</h1>
        <p className="text-muted-foreground">
          Three rotations for the same field, scored on five indicators. Open &ldquo;Why this result?&rdquo; to see
          every rule, input and source.
        </p>
      </header>
      {label && (
        <Alert>
          <AlertDescription>
            Hypothetical scenario applied: {label}. These are hypothetical scenarios, not weather forecasts.
          </AlertDescription>
        </Alert>
      )}
      <RegionGuard farm={farm} scenario={scenario}>
        <ClimateGate lat={farm.lat} lon={farm.lon}>
          {(data) => <Results data={data} farm={farm} scenario={scenario} />}
        </ClimateGate>
      </RegionGuard>
    </>
  );
}
