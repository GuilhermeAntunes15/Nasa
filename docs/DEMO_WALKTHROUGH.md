# Demo walkthrough (2–3 minutes)

Scope: see the [Implemented / Conceptual table in the README](../README.md#implemented--conceptual-not-implemented).

Default farm: Sorriso, Mato Grosso (−12.55, −55.72), soybean → second-crop maize, clayey soil, well drained, no pH, rain-fed, main priority "Water conservation". All numbers below were produced by the app's own model (`compareRotations` in `src/lib/simulate.ts`) on the stored NASA POWER snapshot for this point (API v2.10.3). A live request returns the same series unless NASA POWER has revised its data.

Start with `npm run dev` (or the deployed URL) and open `/`.

## Script

**0:00 — Landing (`/`).** "The future of farming starts with better decisions." RotaTerra compares crop rotations for one field using eleven years of daily NASA POWER data. It is exploratory decision support, not a yield or weather forecast. Click **Explore Your Farm**.

**0:15 — Explore (`/explore`).** The map and the fields show the default point. Click **Load NASA climate data**. The "From NASA POWER" panel shows a mean annual rainfall of **1300 mm/yr** over 11 complete years and a mean air temperature of **26.3 °C**. Point out the provenance card: NASA POWER Daily API, community AG, API v2.10.3, sources MERRA2 and POWER, 0 missing days, the request URL and the acknowledgment. "From you" is the farmer's information, labelled separately. Click **View climate charts**.

**0:40 — Climate (`/climate`).** Four charts and a 3D month-by-year rainfall view, each with a data table. Annual rainfall ranges from 645 mm (2015) to 1903 mm (2018). The crop-window sentences read:
- "Soybean window (1 Oct–23 Jan): median rainfall 640 mm over 10 seasons; driest season 2020/21 with 415 mm."
- "Second-crop window (1 Feb–5 Jun): median rainfall 581 mm over 10 seasons; driest season 2015/16 with 261 mm."

Say: historical data only, no climate projections.

**1:00 — Rotations (`/simulator`).** Three cards for the same field:

| Indicator | Current | Alternative A — Soil cover & water | Alternative B — Diversification |
|---|---|---|---|
| Temperature compatibility | 1.00 | 0.99 | 1.00 |
| Water-demand exposure | 6.7% (score 0.93) | 6.7% (0.93) | 6.2% (0.94) |
| Soil cover | 204 days (0.56) | 301 days (0.82) | 253 days (0.69) |
| Crop diversity | 2 species (0.58) | 3 species (0.88) | 4 species (1.00) |
| Deficit sensitivity | 0.12 (score 0.88) | 0.12 (0.88) | 0.09 (0.91) |
| Exploratory index | 82 | 91 | 91 |

A and B tie at 91 when rounded, so both carry "Highest index for your priority (exploratory)". Point out the trade-off: A gains soil cover and diversity but has the same water values as Current, because each season restarts from an empty root zone and residue is not modelled.

**1:30 — Why this result?** Open the dialog on Alternative B. Show the exact index (100 × Σ weight × score = 91.26, vs 90.60 for A and 82.38 for Current), the weights line, the rule of each indicator, inputs labelled NASA POWER / Farmer-provided / Published / Model, the lowest-scoring season (water exposure 39.0% in 2015/16, year 2) and the per-crop, per-season table.

**1:55 — Scenario Lab (`/scenarios`).** "These are hypothetical scenarios, not weather forecasts." Click **−20% rainfall (demo)**. All rotations are recalculated:

| | Current | Alternative A | Alternative B |
|---|---|---|---|
| Index, baseline → −20% | 82 → 81 | 91 → 89 | 91 → 90 |
| Water-demand exposure | 6.7% → 9.5% | 6.7% → 9.5% | 6.2% → 8.9% |
| Deficit sensitivity | 0.12 → 0.15 | 0.12 → 0.15 | 0.09 → 0.11 |

The sentence on the Current card: "Under −20% rainfall, the relative water-demand exposure of Current rises from 6.7% of cash-crop water demand to 9.5% of cash-crop water demand."

**2:20 — Summary (`/summary`).** One printable page: location and provenance, climate tables, farm information, the three rotations, trade-offs vs Current, the −20% sensitivity, sources and limitations. Click **Print / Save as PDF**.

**2:40 — Close.** Open `/science` briefly: every formula, parameter and assumption, plus what RotaTerra does not determine. Data: NASA POWER.

## Reference numbers

Default farm, historical baseline (indicator scores, 0–1):

| Rotation | Temperature | Water | Cover | Diversity | Deficit | Index (exact) |
|---|---|---|---|---|---|---|
| Current | 1.000 | 0.933 | 0.559 | 0.583 | 0.879 | 82.38 |
| Alternative A | 0.991 | 0.933 | 0.825 | 0.875 | 0.879 | 90.60 |
| Alternative B | 0.995 | 0.938 | 0.692 | 1.000 | 0.906 | 91.26 |

With −20% rainfall the exact indices are 80.92, 89.14 and 89.90.
