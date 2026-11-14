import type { Metadata } from "next";
import { DataLegend } from "@/components/data-badge";
import { DEFICIT_NOTE, INDICATOR_SHORT, LIMITATIONS, PRIORITY_LABELS } from "@/components/why-dialog";
import { CITATIONS, CROPS } from "@/lib/crops";
import { POWER_END, POWER_PARAMS, POWER_REFERENCE, POWER_START } from "@/lib/power";
import { MIN_SEASONS, MODEL_ASSUMPTIONS, WEIGHTS } from "@/lib/simulate";
import { PRECIP_RANGE, TEMP_RANGE } from "@/lib/state";
import type { IndicatorId, Priority } from "@/lib/types";

export const metadata: Metadata = { title: "The science — RotaTerra" };

const section = "flex max-w-5xl flex-col gap-4 border-t pt-8 text-base leading-relaxed";
const h2 = "text-3xl font-medium";
const h3 = "text-lg font-semibold";
const formula = "overflow-x-auto rounded-lg border bg-muted px-4 py-3 font-mono text-sm";
const range = (r: [number, number]) => `${r[0]}–${r[1]}`;
const isoDate = (yyyymmdd: string) => `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6)}`;

const PARAM_INFO: Record<(typeof POWER_PARAMS)[number], string> = {
  T2M: "Air temperature at 2 m, daily mean (°C)",
  T2M_MAX: "Air temperature at 2 m, daily maximum (°C)",
  T2M_MIN: "Air temperature at 2 m, daily minimum (°C)",
  PRECTOTCORR: "Bias-corrected precipitation provided by POWER (mm/day)",
};

export default function SciencePage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-medium md:text-5xl">The science behind RotaTerra</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Every number in RotaTerra comes from a deterministic, documented rule. This page lists the data, the
          formulas, the parameters and the assumptions, and what the model cannot tell you.
        </p>
      </header>

      <section aria-labelledby="sci-data" className={section}>
        <h2 id="sci-data" className={h2}>
          1. NASA data products and variables
        </h2>
        <p>
          RotaTerra uses the NASA POWER Daily API (community AG) for a single point. POWER provides gridded daily
          estimates derived mainly from the MERRA-2 reanalysis, which assimilates satellite and ground observations;
          the grid is roughly 50 km, so values describe the surrounding area, not a measurement at the farm. Period:{" "}
          {isoDate(POWER_START)} to {isoDate(POWER_END)}, local solar time.
        </p>
        <ul className="list-disc pl-6">
          {POWER_PARAMS.map((p) => (
            <li key={p}>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{p}</code>: {PARAM_INFO[p]}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">{POWER_REFERENCE}</p>
        <p className="text-sm">
          No climate projections are used. Hypothetical scenarios only rescale or shift the historical series.
        </p>
      </section>

      <section aria-labelledby="sci-calc" className={section}>
        <h2 id="sci-calc" className={h2}>
          2. Calculations
        </h2>
        <h3 className={h3}>Seasons</h3>
        <p>
          Agricultural seasons run from 15 Sep to 14 Sep (2015/16 to 2024/25). A season with any missing day in T2M,
          T2M_MAX, T2M_MIN or PRECTOTCORR is excluded and listed; at least {MIN_SEASONS} complete seasons are needed.
          Each season is simulated independently.
        </p>
        <h3 className={h3}>Hypothetical scenario</h3>
        <pre className={formula}>
          {`P' = P × (1 + ΔP / 100)    ΔP from ${PRECIP_RANGE.min}% to +${PRECIP_RANGE.max}%, step ${PRECIP_RANGE.step}%
T' = T + ΔT                ΔT from ${TEMP_RANGE.min} °C to +${TEMP_RANGE.max} °C, step ${TEMP_RANGE.step} °C (T2M, Tmax, Tmin)`}
        </pre>
        <h3 className={h3}>Extraterrestrial radiation (FAO-56 eqs. 21–25)</h3>
        <pre className={formula}>
          {`Ra = (24·60/π) · Gsc · dr · [ωs·sin φ·sin δ + cos φ·cos δ·sin ωs]   (MJ m⁻² d⁻¹)
Gsc = 0.0820   dr = 1 + 0.033·cos(2πJ/365)   δ = 0.409·sin(2πJ/365 − 1.39)   ωs = arccos(−tan φ·tan δ)`}
        </pre>
        <h3 className={h3}>Reference evapotranspiration, Hargreaves–Samani (FAO-56 eq. 52)</h3>
        <pre className={formula}>{`ETo = 0.0023 · (Tmean + 17.8) · √(Tmax − Tmin) · 0.408 · Ra   (mm/day)`}</pre>
        <h3 className={h3}>Crop water demand (FAO-56 eq. 66)</h3>
        <p>
          Kc moves from Kc ini through a linear development stage to Kc mid, holds during mid-season and moves
          linearly to Kc end. Ruzigrass uses a constant Kc. ETc = Kc × ETo; days without an active crop have ETc = 0.
        </p>
        <h3 className={h3}>Daily soil-water balance (FAO-56 eqs. 82–85)</h3>
        <pre className={formula}>
          {`TAW = 1000 · (θFC − θWP) · Zr        RAW = p · TAW
Ks  = 1 if Dr ≤ RAW, else (TAW − Dr) / (TAW − RAW)
ETa = Ks · ETc
Dr(i) = min(TAW, max(0, Dr(i−1) − P(i) − I(i) + ETa(i)))   surplus = deep percolation`}
        </pre>
        <p>
          With irrigation available, a cash-crop day with Dr above RAW receives I = Dr (refill to field capacity) and
          Ks = 1.
        </p>
        <h3 className={h3}>Indicators (score 0–1, higher is more favourable)</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Seasonal climate compatibility (temperature)</strong>: ECOCROP suitability of the monthly mean T2M
            on each active crop day (0 outside the absolute range, 1 inside the optimal range, linear in between),
            averaged over active days.
          </li>
          <li>
            <strong>Relative water-demand exposure</strong> (cash crops): Σ(ETc − ETa) / ΣETc; with irrigation,
            ΣI / ΣETc (irrigation-water dependency). Score = 1 − min(1, share).
          </li>
          <li>
            <strong>Soil cover potential</strong>: days with a living canopy beyond the initial stage plus ruzigrass
            days, divided by the season length.
          </li>
          <li>
            <strong>Crop diversity</strong>: 0.5 × min(species, 4)/4 + 0.5 × functional groups/3.
          </li>
          <li>
            <strong>Sensitivity to rainfall deficits</strong>: D = Ky × (1 − ΣETa/ΣETc) per cash crop; score = 1 −
            min(1, largest D). This is a {DEFICIT_NOTE}.
          </li>
        </ul>
        <p>
          Each indicator is the median over the usable seasons (mean over template years for the two-year rotation).
          Practical flags (drainage, pH, desiccation timing, sowing date) are listed but not scored.
        </p>
        <h3 className={h3}>Exploratory index</h3>
        <pre className={formula}>{`Index = 100 · Σ weight(i) · score(i)`}</pre>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="mb-1 text-left font-medium">Indicator weights per main priority</caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="px-2 py-1">Priority</th>
                {(Object.keys(INDICATOR_SHORT) as IndicatorId[]).map((id) => (
                  <th key={id} scope="col" className="px-2 py-1">
                    {INDICATOR_SHORT[id]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(WEIGHTS) as Priority[]).map((p) => (
                <tr key={p} className="border-b">
                  <th scope="row" className="px-2 py-1 font-normal">
                    {PRIORITY_LABELS[p]}
                  </th>
                  {(Object.keys(INDICATOR_SHORT) as IndicatorId[]).map((id) => (
                    <td key={id} className="px-2 py-1">
                      {WEIGHTS[p][id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="sci-params" className={section}>
        <h2 id="sci-params" className={h2}>
          3. How crop parameters shape the results
        </h2>
        <p>
          Kc sets how much water a crop demands relative to ETo. The depletion fraction p sets how much stored water a
          crop can use before stress starts. Ky sets how strongly a water shortfall raises the deficit-sensitivity
          index. ECOCROP temperature and pH ranges drive the temperature compatibility score and the pH flags. Stage
          lengths decide how long a crop demands water and how many days count as soil cover.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="mb-1 text-left font-medium">Crop parameters used by the model</caption>
            <thead>
              <tr className="border-b">
                {["Crop", "Role", "Stages (days)", "Kc ini / mid / end", "p", "Ky", "T optimal / absolute (°C)", "pH optimal / absolute"].map(
                  (c) => (
                    <th key={c} scope="col" className="px-2 py-1">
                      {c}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {Object.values(CROPS).map((c) => (
                <tr key={c.id} className="border-b">
                  <th scope="row" className="px-2 py-1 font-normal">
                    {c.name} (<em>{c.scientificName}</em>)
                  </th>
                  <td className="px-2 py-1">{c.role}</td>
                  <td className="px-2 py-1">{c.stageDays ? c.stageDays.join(" / ") : "by calendar"}</td>
                  <td className="px-2 py-1">
                    {"constant" in c.kc ? `${c.kc.constant} (constant)` : `${c.kc.ini} / ${c.kc.mid} / ${c.kc.end}`}
                  </td>
                  <td className="px-2 py-1">{c.p}</td>
                  <td className="px-2 py-1">{c.ky ?? "—"}</td>
                  <td className="px-2 py-1">
                    {range(c.tempOptC)} / {range(c.tempAbsC)}
                  </td>
                  <td className="px-2 py-1">
                    {range(c.phOpt)} / {range(c.phAbs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="sci-assumptions" className={section}>
        <h2 id="sci-assumptions" className={h2}>
          4. Assumptions
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          {MODEL_ASSUMPTIONS.map((a) => (
            <li key={a}>{a}</li>
          ))}
          {Object.values(CROPS).flatMap((c) =>
            c.assumptions.map((a) => (
              <li key={`${c.id}-${a}`}>
                {c.name}: {a}
              </li>
            )),
          )}
        </ul>
      </section>

      <section aria-labelledby="sci-not" className={section}>
        <h2 id="sci-not" className={h2}>
          5. What RotaTerra does not determine
        </h2>
        <p>
          RotaTerra does not predict yield or profit, does not estimate water savings, does not give a probability of
          success, does not assess pests, diseases or nematodes, and does not identify an optimal sowing date. The
          exploratory index ranks rotations only under the stated rules and weights.
        </p>
        <h3 className={h3}>Limitations</h3>
        <ul className="list-disc space-y-1 pl-6">
          {LIMITATIONS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sci-local" className={section}>
        <h2 id="sci-local" className={h2}>
          6. Why local agronomic validation is needed
        </h2>
        <p>
          The crop parameters come from international FAO tables and ECOCROP ranges, the calendars follow Mato Grosso
          sowing windows and the climate data describe a ~50 km grid cell. Real fields differ in soil depth, organic
          matter, residue, cultivar, management and pest pressure. Any change of rotation should be discussed with a
          local agronomist and tested on the farm before adoption.
        </p>
      </section>

      <section aria-labelledby="sci-legend" className={section}>
        <h2 id="sci-legend" className={h2}>
          7. Data categories
        </h2>
        <DataLegend />
      </section>

      <section aria-labelledby="sci-moisture" className={section}>
        <h2 id="sci-moisture" className={h2}>
          8. Why there is no soil-moisture slider
        </h2>
        <p>
          Soil water storage already comes from the soil texture you choose (total available water) and from the
          daily balance driven by NASA POWER rainfall. A separate soil-moisture control would double-count it.
          Satellite soil moisture (for example SMAP) is listed as future work and is not integrated in this MVP.
        </p>
      </section>

      <section aria-labelledby="sci-sources" className={section}>
        <h2 id="sci-sources" className={h2}>
          Sources
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          {Object.values(CITATIONS).map((c) => (
            <li key={c.id}>
              {c.full}{" "}
              {c.url && (
                <a href={c.url} className="font-medium text-forest underline underline-offset-4" rel="noreferrer" target="_blank">
                  Link
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium">Data: NASA POWER</p>
      </section>
    </>
  );
}
