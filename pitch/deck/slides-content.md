# RotaTerra - slide content, speaker notes and sources

Deck file: `index.html` (7 slides, zero dependencies except Google Fonts; arrows/space/swipe/dots to navigate; `#5` opens slide 5). Screenshots in `assets/` are real captures from `docs/screenshots/` of the RotaTerra app. Palette: navy #081B2C, green #176B57, sage #A8C9B3, cream #F5F4ED, sky #5EA8D1. Fonts: Fraunces (display), IBM Plex Sans (body).

Reference numbers (default farm: Sorriso, MT, -12.55 / -55.72; soybean -> second-crop maize; clayey; well drained; rain-fed; priority "Water conservation"). Source for all: `docs/DEMO_WALKTHROUGH.md` "Reference numbers" and the app's own output on NASA POWER v2.10.3.

---

## Slide 1 - Farming in an Unpredictable Climate
- **On-slide text:** kicker "RotaTerra - NASA Space Apps Challenge 2026 - Field Shift"; "645 mm annual rain, 2015 -> 1,903 mm annual rain, 2018"; "Same farm, Sorriso, Mato Grosso. What follows the soybean changes how exposed that farm is to the next dry spell."
- **Visual:** real crop of the "Annual rainfall" chart (`assets/climate-desktop.png`).
- **Sources:** 645 mm (2015) and 1,903 mm (2018): `docs/DEMO_WALKTHROUGH.md` (Climate step), NASA POWER PRECTOTCORR at -12.55/-55.72. Chart: app Climate page screenshot. Landing wording on the Cerrado: app landing page ("a late start of the rains or a dry spell after February...").
- **Notes (about 25 s):** Open with the human problem. "One farm, two years: 645 millimeters of rain, then 1,903." A farmer decides what to plant next before knowing the weather. The rotation changes exposure to that variability. Do not mention technology yet.

## Slide 2 - NASA Sees the Patterns. Farmers Need the Answers.
- **On-slide text:** "4,018 days of daily rainfall and temperature, 2015-2025, from NASA POWER (built on the MERRA-2 reanalysis)"; "Honest scale: grid of roughly 50 km. An estimate for the area around the farm, not a measurement on it."; chips T2M, T2M_MAX, T2M_MIN, PRECTOTCORR; "The gap is not data. It is the step from data to a decision."
- **Visual:** real crop of the provenance card (`assets/simulator-desktop.png`): endpoint, grid point, period, retrieval date, acknowledgment.
- **Sources:** `docs/NASA_DATA_SOURCES.md` (4018 days; parameters; MERRA2 + POWER sources; v2.10.3). "~50 km" is the wording used by the app; the exact native resolution was NOT checked against POWER documentation (see `sources.md`).
- **Notes (about 30 s):** Explain reanalysis in one sentence: a model that combines satellite and ground observations into a consistent record. Say clearly it is not measured at the farm. The point of the slide: data exists and is open; the missing piece is a transparent way to use it for a decision.
- **Screenshot caveat:** the captured "Mode" row reads "Live request"; the current code labels it "Live NASA POWER response (may be served from a cache...)". Re-capture before final if you want the exact current label.

## Slide 3 - Introducing RotaTerra
- **On-slide text:** five steps: Select a farm / Understand climate conditions / Compare rotations / Test scenarios / Explore a decision ("Why this result?" shows every rule and source). Caption: "Rotations screen, default farm. Exploratory decision support, not a yield or weather forecast."
- **Visual:** real crop of the Rotations screen, three cards with indicators and exploratory index (`assets/simulator-desktop.png`).
- **Sources:** README "Implemented" table; every step maps to an existing screen (Explore, Climate, Rotations, Scenario Lab, "Why this result?" dialog).
- **Notes (about 15 s):** Walk the five steps in one breath, then "let me show you" (or go on to slide 4 if the live demo comes at slide 5).

## Slide 4 - From Earth Observations to Farming Decisions
- **On-slide text:** diagram of five nodes: NASA Earth Observations -> Climate Indicators -> Farm and Crop Data -> Rotation Comparison -> Decision Insights, each with a plain-language line and a data-type chip; legend with the five product categories (NASA POWER data, Farmer-provided, Published crop data, Model-derived indicator, Hypothetical scenario).
- **Visual:** HTML/CSS diagram made for the deck (no external asset).
- **Sources:** `docs/METHODOLOGY.md` M3 (Hargreaves-Samani ETo), M5 (FAO-56 water balance), M6 (five indicators), M7 (index), "Data categories" (`src/components/data-badge.tsx`). "10 seasons, 3 rotations, 5 indicators": METHODOLOGY M0 and Rotations.
- **Notes (about 25 s):** Say "evapotranspiration" once and define it: how much water the air pulls from a crop. Emphasise that every number carries one of five labels, so a judge can always tell observation from assumption from model result. Order of the flow is conceptual; node 3 (farm and crop data) enters the model alongside the climate indicators.

## Slide 5 - One Farm. Three Strategies. Different Futures.
- **On-slide text:** chips (Sorriso, MT; NASA POWER 2015-2025; soybean -> maize, clayey, rain-fed; priority water; scenario -20% rainfall). Table:

| | Current | A: Soil cover | B: Diversified |
|---|---|---|---|
| Index, baseline | 82 | 91 | 91 |
| Index at -20% rain | 81 | 89 | 90 |
| Water-demand exposure, baseline -> -20% | 6.7 -> 9.5% | 6.7 -> 9.5% | 6.2 -> 8.9% |
| Soil cover (days/season) | 204 | 301 | 253 |

  Note: "A ties Current on water by design: each season restarts from an empty root zone and crop residue is not modelled. The -20% effect on the index is small (about -1.5 points), but traceable and measurable."
- **Visual:** real crop of the Scenario Lab cards at -20% (`assets/scenarios-desktop.png`).
- **Sources:** `docs/DEMO_WALKTHROUGH.md` tables (exact indices 82.38 / 90.60 / 91.26 baseline; 80.92 / 89.14 / 89.90 at -20%; A and B tie at 91 after rounding). Soil cover 253 days for B = the app's rounding of 252.5. Index change -1.5 / -1.5 / -1.4 shown in the Scenario Lab screenshot.
- **Notes (about 50 s, LIVE DEMO here; see `../demo-script.md`):** Show the live app, not only this slide. Move the scenario to -20%, point to the sentence on the Current card, then say the honest line on A. Do not call the change dramatic. The screenshot is the fallback if the network fails.

## Slide 6 - Turning Data into Resilience
- **On-slide text:** two columns. Demonstrated today: real NASA POWER data with provenance on screen; transparent FAO-56 comparison of three rotations; scenario tests that recalculate every indicator; "Why this result?" traces numbers to sources. Potential, not yet tested (dashed): seasonal planning and climate-risk conversations; clearer water trade-offs; easier access to Earth science; a shared starting point for farmer-agronomist talks. Limits strip: reanalysis ~50 km; 10 seasons; Mato Grosso calendar; ruzigrass Kc is a proxy; no field validation; no pests/markets/CO2; relative exploratory indicators; hypothetical scenarios.
- **Visual:** typographic only; solid vs dashed border separates demonstrated from potential.
- **Sources:** `docs/LIMITATIONS_AND_FUTURE_WORK.md`, README implemented table. No impact numbers are claimed: none exist.
- **Notes (about 20 s):** "This is what we have shown. This is what we hope for and have not tested." Read the limits strip aloud in summary form.

## Slide 7 - Better Decisions Today. More Resilient Farms Tomorrow.
- **On-slide text:** closing line "NASA helps us understand our changing planet. RotaTerra helps farmers explore what to do next."; future work chips (more regions, more crops, GPM IMERG, SMAP soil moisture, Penman-Monteith, validation with agronomists / Embrapa); links `https://github.com/GuilhermeAntunes15/Nasa`, `<DEPLOY URL>` (placeholders); references; AI-use line; non-endorsement line.
- **Visual:** typographic.
- **Sources:** `docs/LIMITATIONS_AND_FUTURE_WORK.md` "Future work"; `docs/AI_USAGE.md`; README disclaimer.
- **Notes (about 15 s):** Name the next step as validation with agronomists. Finish on the closing line and stop. **Replace the placeholders before presenting.** No NASA or Space Apps logo is used.
