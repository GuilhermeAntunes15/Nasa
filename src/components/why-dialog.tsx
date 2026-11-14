import { DataBadge, DataLegend } from "@/components/data-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CITATIONS, CROPS } from "@/lib/crops";
import { DIVERSITY_CAPS, MODEL_ASSUMPTIONS } from "@/lib/simulate";
import type { IndicatorId, IndicatorResult, Priority, RotationResult } from "@/lib/types";

export const PRIORITY_LABELS: Record<Priority, string> = {
  water: "Water conservation",
  soil: "Soil protection",
  resilience: "Climate resilience",
};

export const INDICATOR_SHORT: Record<IndicatorId, string> = {
  thermal: "temperature",
  water: "water",
  cover: "cover",
  diversity: "diversity",
  deficit: "deficit",
};

export const COMPOSITE_LABEL =
  "Transparent exploratory decision-support index — not a validated agricultural prediction";

export const DEFICIT_NOTE = "deficit-sensitivity score (FAO-33 water-production form), not a yield forecast";

export const LIMITATIONS = [
  "Hargreaves–Samani reference evapotranspiration uses only temperature and extraterrestrial radiation; it ignores humidity, wind and cloudiness.",
  "Rooting depth is fixed at 1.0 m; runoff, capillary rise and bare-soil evaporation are set to zero.",
  "Crop coefficients are not adjusted for local climate (FAO-56 eq. 62), stage lengths are fixed and heat does not shorten the cycle.",
  "ECOCROP temperature ranges are broad and are applied to monthly mean temperatures.",
  "Seasonal Ky is used as a sensitivity index, not as a yield forecast.",
  "NASA POWER data are gridded reanalysis estimates (roughly 50 km), not measurements at the farm.",
  "Only 10 agricultural seasons (2015/16–2024/25) are available.",
  "Crop calendars follow Mato Grosso sowing windows; ruzigrass Kc and p are proxies.",
  "FAO-56 soil-water values may overstate the water available in highly weathered tropical soils (Oxisols).",
  "Crop residue (mulch) is not quantified, and each season restarts from an empty root zone, so cover crops cannot help the next season in this model.",
  "Pests, diseases, nematodes, markets and CO₂ effects are not modelled.",
  "The model has not been validated in the field; local agronomic validation is required.",
];

export function formatValue(ind: Pick<IndicatorResult, "id" | "value" | "unit">) {
  const digits = ind.id === "water" ? 1 : ind.id === "cover" || ind.id === "diversity" ? 0 : 2;
  const value = ind.value.toFixed(digits);
  return ind.unit.startsWith("%") ? `${value}${ind.unit}` : `${value} ${ind.unit}`;
}

export function WeightsLine({ weights, priority }: { weights: RotationResult["weights"]; priority: Priority }) {
  return (
    <p className="text-xs text-muted-foreground">
      Weights for {PRIORITY_LABELS[priority]}:{" "}
      {(Object.keys(INDICATOR_SHORT) as IndicatorId[]).map((id) => `${INDICATOR_SHORT[id]} ${weights[id]}`).join(" · ")}
    </p>
  );
}

const cell = "px-2 py-1";

export function WhyDialog({ result, priority }: { result: RotationResult; priority: Priority }) {
  const cropIds = [...new Set(result.rotation.years.flat().map((s) => s.cropId))];
  const citationIds = [
    ...new Set([
      ...cropIds.flatMap((id) => CROPS[id].citations),
      ...result.flags.flatMap((f) => (f.citationId ? [f.citationId] : [])),
    ]),
  ].filter((id) => CITATIONS[id]);
  const multiYear = result.rotation.years.length > 1;

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Why this result?</DialogTrigger>
      <DialogContent className="max-h-[90vh] grid-cols-1 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Why this result? {result.rotation.name}</DialogTitle>
          <DialogDescription>
            Every indicator below is recalculated from NASA POWER data, your farm information and published crop
            parameters. Seasons used: {result.seasonsUsed.join(", ") || "none"}.
            {result.seasonsExcluded.length > 0 &&
              ` Excluded (incomplete data): ${result.seasonsExcluded.join(", ")}.`}
          </DialogDescription>
        </DialogHeader>

        <section aria-label="Data categories" className="flex flex-col gap-2">
          <h3 className="font-semibold">Data categories</h3>
          <DataLegend />
        </section>

        {result.indicators.map((ind) => (
          <section key={ind.id} className="flex flex-col gap-2 border-t pt-3">
            <h3 className="font-semibold">{ind.label}</h3>
            {ind.id === "deficit" && <p className="text-xs">Shown as a {DEFICIT_NOTE}.</p>}
            <p>
              Value: {formatValue(ind)} · Score: {ind.score.toFixed(3)}
              {ind.worstSeason &&
                ` · Lowest-scoring season: ${ind.worstSeason.season} (${formatValue({ ...ind, value: ind.worstSeason.value })})`}
            </p>
            <p className="text-muted-foreground">{ind.rule}</p>
            <ul className="flex flex-col gap-1">
              {ind.inputs.map((input) => (
                <li key={input.label} className="flex flex-wrap items-center gap-2">
                  <DataBadge category={input.category} />
                  <span>
                    {input.label}: {input.value}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="flex flex-col gap-2 border-t pt-3">
          <h3 className="font-semibold">Exploratory index</h3>
          <p>
            {COMPOSITE_LABEL}. Index = 100 × Σ weight × score = {result.composite.toFixed(2)}.
          </p>
          <WeightsLine weights={result.weights} priority={priority} />
          <p className="text-xs">
            Crop diversity caps are design choices: {DIVERSITY_CAPS.species} species and {DIVERSITY_CAPS.groups}{" "}
            functional groups reach the maximum score.
          </p>
        </section>

        <section className="flex flex-col gap-2 border-t pt-3">
          <h3 className="font-semibold">Per crop and season</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Model results per crop and season</caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className={cell}>Season</th>
                  {multiYear && <th scope="col" className={cell}>Year</th>}
                  <th scope="col" className={cell}>Crop</th>
                  <th scope="col" className={cell}>ETc (mm)</th>
                  <th scope="col" className={cell}>ETa (mm)</th>
                  <th scope="col" className={cell}>Irrigation (mm)</th>
                  <th scope="col" className={cell}>Deficit index D</th>
                  <th scope="col" className={cell}>Temperature compatibility</th>
                  <th scope="col" className={cell}>Cover days</th>
                </tr>
              </thead>
              <tbody>
                {result.crops.map((c) => (
                  <tr key={`${c.templateYear}-${c.season}-${c.cropId}`} className="border-b last:border-0">
                    <th scope="row" className={`${cell} font-normal`}>{c.season}</th>
                    {multiYear && <td className={cell}>{c.templateYear + 1}</td>}
                    <td className={cell}>{CROPS[c.cropId].name}</td>
                    <td className={cell}>{c.etcMm.toFixed(0)}</td>
                    <td className={cell}>{c.etaMm.toFixed(0)}</td>
                    <td className={cell}>{c.irrigationMm.toFixed(0)}</td>
                    <td className={cell}>{c.deficitSensitivity === null ? "—" : c.deficitSensitivity.toFixed(2)}</td>
                    <td className={cell}>{c.thermalSuitability.toFixed(2)}</td>
                    <td className={cell}>{c.coverDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-2 border-t pt-3">
          <h3 className="font-semibold">Model assumptions</h3>
          <ul className="list-disc pl-5">
            {MODEL_ASSUMPTIONS.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <h3 className="font-semibold">Crop assumptions</h3>
          <ul className="list-disc pl-5">
            {cropIds.flatMap((id) =>
              CROPS[id].assumptions.map((a) => (
                <li key={`${id}-${a}`}>
                  {CROPS[id].name}: {a}
                </li>
              )),
            )}
          </ul>
          <h3 className="font-semibold">Limitations</h3>
          <ul className="list-disc pl-5">
            {LIMITATIONS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-2 border-t pt-3">
          <h3 className="font-semibold">Sources</h3>
          <ul className="list-disc pl-5">
            {citationIds.map((id) => (
              <li key={id}>
                {CITATIONS[id].full}{" "}
                {CITATIONS[id].url && (
                  <a href={CITATIONS[id].url} className="font-medium text-forest underline underline-offset-4" rel="noreferrer" target="_blank">
                    Link
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}
