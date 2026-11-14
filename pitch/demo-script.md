# RotaTerra - live demo script (about 50 s inside the pitch; extended version about 2.5 min)

Replace `<DEPLOY URL>` with the real deployment (not created yet). Locally: `npm run dev` -> `http://localhost:3000`. Numbers come from `docs/DEMO_WALKTHROUGH.md`; a live request returns the same series unless NASA POWER has revised its data. Re-check the on-screen numbers once on the final deployment.

## Before going on stage
1. Open these tabs in order (all use the default farm; query keys are `lat, lon, seq, soil, drain, irr, prio, dp, dt`):
   - A: `<DEPLOY URL>/explore?lat=-12.55&lon=-55.72&seq=soy-maize&soil=clayey&drain=well&irr=0&prio=water&dp=0&dt=0`
   - B: `<DEPLOY URL>/simulator?lat=-12.55&lon=-55.72&seq=soy-maize&soil=clayey&drain=well&irr=0&prio=water&dp=0&dt=0`
   - C: `<DEPLOY URL>/scenarios?lat=-12.55&lon=-55.72&seq=soy-maize&soil=clayey&drain=well&irr=0&prio=water&dp=-20&dt=0` (already at -20%; use the "Historical baseline" preset first if you want to show the move live)
2. Load tab B once so the data is cached. Check the provenance card says "Live".
3. Browser zoom 110-125%, notifications off, full-screen. Keep `deck/index.html#5` open as the fallback.
4. Rehearse with the network off once, so you know the fallback.

## Pitch version (slide 5, about 50 s)
| Time | Action | Say | On screen (expected) |
|---|---|---|---|
| 0:00 | Switch to tab B (`/simulator`). | "This is Sorriso, Mato Grosso, with real NASA data. Source, dates and request are on the screen." | Three cards: Current / Alternative A - Soil cover & water / Alternative B - Diversification. Provenance card: NASA POWER Daily API, v2.10.3, 2015-01-01 to 2025-12-31, 0 missing days. |
| 0:12 | Point at the three index values. | "Same field, three rotations. The exploratory index is eighty-two, ninety-one and ninety-one." | Index 82 / 91 / 91. A and B both carry "Highest index for your priority (exploratory)" (they tie after rounding). |
| 0:22 | Open tab C (`/scenarios`); if starting from baseline, click **-20% rainfall (demo)**. | "Now a hypothetical scenario: twenty percent less rain." | Banner "These are hypothetical scenarios, not weather forecasts." Sliders show -20% and 0 C. |
| 0:30 | Point at the Current card sentence. | "Water-demand exposure goes from six point seven to nine point five percent. The index moves about one and a half points. Small, but traceable." | "Under -20% rainfall, the relative water-demand exposure of Current rises from 6.7% of cash-crop water demand to 9.5%..." Index 82 -> 81 (-1.5). |
| 0:42 | Point at Alternative A's water row. | "Alternative A has the same water result as Current. That is by design: the model does not simulate residue." | A: 6.7% -> 9.5%; index 91 -> 89. B: 6.2% -> 8.9%; index 91 -> 90. |

## Extended version (2-3 min, for a booth or Q&A)
1. **`/` Landing.** "Eleven years of daily NASA POWER data, three rotations, transparent rules. Exploratory, not a forecast." Click **Explore Your Farm**.
2. **`/explore`.** Click **Load NASA climate data**. Expected: mean annual rainfall **1300 mm/yr** over 11 complete years; mean air temperature **26.3 C**. Show the provenance card and the acknowledgment. Say: "From NASA" and "From you" are kept separate. Click **View climate charts**.
3. **`/climate`.** Four charts, each with a data table. Annual rainfall runs from 645 mm (2015) to 1,903 mm (2018). Read the window lines: soybean window median **640 mm**, driest season 2020/21 with **415 mm**; second-crop window median **581 mm**, driest 2015/16 with **261 mm**. "Historical data only. No projections."
4. **`/simulator`.** Walk the table (expected values):

   | Indicator | Current | A | B |
   |---|---|---|---|
   | Temperature compatibility | 1.00 | 0.99 | 1.00 |
   | Water-demand exposure | 6.7% | 6.7% | 6.2% |
   | Soil cover (days) | 204 (0.56) | 301 (0.82) | 253 (0.69) |
   | Crop diversity | 2 species (0.58) | 3 (0.88) | 4 (1.00) |
   | Deficit sensitivity | 0.12 | 0.12 | 0.09 |
   | Exploratory index | 82 | 91 | 91 |

5. **"Why this result?" on Alternative B.** Exact index 91.26 (A 90.60, Current 82.38); weights line; inputs labelled NASA POWER / Farmer-provided / Published / Model; lowest-scoring season (water-demand exposure 39.0% in 2015/16, year 2).
6. **`/scenarios`.** Click **-20% rainfall (demo)**: exposure 6.7% -> 9.5% (Current, A) and 6.2% -> 8.9% (B); deficit sensitivity 0.12 -> 0.15 (Current, A) and 0.09 -> 0.11 (B); index 82 -> 81, 91 -> 89, 91 -> 90.
7. **`/summary`.** Printable page: provenance, farm information, rotations, trade-offs, sensitivity, sources, limitations. Click **Print / Save as PDF**.
8. **`/science`.** Every formula, parameter and assumption. Close.

## Plan B - network failure
- **NASA POWER unreachable, default point (Sorriso -12.55/-55.72):** the app serves the stored real NASA POWER snapshot, and shows a banner reading "Live NASA POWER service unavailable. Showing a NASA POWER snapshot retrieved on <date>..." with the provenance mode "Saved snapshot (live service unavailable)". Say it out loud: "The live service is not answering, so the app shows its saved real NASA response for this same point. The numbers are the same." Continue the script unchanged.
- **Any other location:** there is no snapshot; the app shows an error. Do not demo other points on stage unless data is cached; use only the default point.
- **Map tiles fail:** type latitude/longitude into the fields instead; the rest works.
- **App or wifi fully down:** go to `deck/index.html#5` (real outputs and a real screenshot). Say "this is a screenshot of the app from our tests", not "live".
- **Deployed site unavailable:** run locally (`npm run dev`; works with the stored snapshot only if NASA POWER is also unavailable).

## Things not to do on stage
- Do not click Summary -> print on stage (browser dialogs eat time).
- Do not move the sliders to extremes and over-interpret; the app is not a forecast.
- Do not claim an optimal rotation, yield change or water saved.
