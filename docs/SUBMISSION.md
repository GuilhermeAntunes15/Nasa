# Submission draft

The exact fields of the 2026 Space Apps project submission form were **not verified**. Check the official Project Submission Guide and adapt the sections below. Replace the placeholders before submitting.

- Repository: `https://github.com/GuilhermeAntunes15/Nasa`
- Live demo: `<DEPLOY URL>`
- Scope: see the [Implemented / Conceptual table in the README](../README.md#implemented--conceptual-not-implemented).

## Title

RotaTerra — Smarter crop rotations. Stronger farms.

## Short summary

RotaTerra is a web app that helps soybean farmers in the Brazilian Cerrado explore how three crop rotations for the same field relate to water demand, soil cover, crop diversity and sensitivity to rainfall deficits, using eleven years of daily NASA POWER data for their location and transparent, cited crop parameters. It is exploratory decision support, not a yield or weather forecast.

## Technical description

A farmer picks a point on a map (or types coordinates) and describes the field: current crop sequence, soil texture, drainage, optional soil pH, irrigation and main priority. A Next.js route handler requests daily T2M, T2M_MAX, T2M_MIN and PRECTOTCORR from the NASA POWER Daily API (community AG, 2015–2025, 4018 days), validates and parses the response, and returns it with its provenance: request URL, API version, upstream sources, missing days and the official acknowledgment. Responses are cached in the browser and at the CDN, and the upstream request opts into the Next.js data cache; if NASA POWER is unavailable, a stored real POWER response is used for the default demo point only, with a visible banner.

In the browser, a deterministic model written in TypeScript runs a daily FAO-56 soil-water balance for each of ten agricultural seasons (2015/16 to 2024/25): Hargreaves–Samani reference evapotranspiration from temperature and extraterrestrial radiation, FAO-56 crop coefficient curves, total and readily available water from soil texture, and a water-stress coefficient. Three rotations are compared: the farmer's current sequence, a soybean → maize + ruzigrass system for soil cover, and a two-year rotation with sorghum for diversification. Each receives five indicators: temperature compatibility (adapted from FAO ECOCROP ranges), relative water-demand exposure, soil cover days, crop diversity and a deficit-sensitivity score in the FAO-33 water-production form (explicitly not a yield forecast). A weighted exploratory index depends on the farmer's priority and is always shown with its weights and the five scores.

"Why this result?" exposes every rule, input, assumption, per-crop and per-season value and source; every input is labelled as NASA POWER data, farmer-provided, published crop data, model-derived or hypothetical scenario. A Scenario Lab rescales rainfall (−30% to +20%) and shifts temperature (−2 °C to +4 °C) on the historical series and recalculates everything. A printable summary collects the results, sources and limitations. The model is covered by 53 unit tests, including numerical checks of the FAO-56 equations against independently computed values and runs on the real NASA POWER data. No generative AI runs in the product, and no climate projections are used.

## NASA data used

- NASA POWER Daily API, point data, community AG: T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, 2015-01-01 to 2025-12-31 (MERRA-2-based gridded estimates). Details: [NASA_DATA_SOURCES](NASA_DATA_SOURCES.md).
- GPM IMERG and SMAP are not integrated (future work). The official challenge resource list was not reviewed; see [NASA_DATA_SOURCES](NASA_DATA_SOURCES.md#not-integrated).

## Use of AI

Claude Code AI agents under human direction planned, coded, tested, designed, reviewed and documented the project. No AI-generated data or images; no generative AI at runtime. Human review items are listed in [AI_USAGE](AI_USAGE.md) and still need to be completed by the team.

## References

- NASA POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/ — referencing: https://power.larc.nasa.gov/docs/referencing/
- Allen et al. (1998), FAO Irrigation and Drainage Paper 56: https://www.fao.org/4/x0490e/x0490e00.htm
- Smith & Steduto (2012), FAO Irrigation and Drainage Paper 66, chapter 2 (FAO-33 Ky values): https://www.fao.org/4/i2800e/i2800e02.pdf
- FAO ECOCROP: https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1150 (and ids 2175, 48747, 8418, 543)
- Ramirez-Villegas, Jarvis & Läderach (2013), Agricultural and Forest Meteorology 170, 67–78: https://doi.org/10.1016/j.agrformet.2011.09.005
- Full list: [METHODOLOGY](METHODOLOGY.md#sources)

## Links

- Repository: `https://github.com/GuilhermeAntunes15/Nasa`
- Live demo: `<DEPLOY URL>`
- Demo script: [DEMO_WALKTHROUGH](DEMO_WALKTHROUGH.md)
- Limitations: [LIMITATIONS_AND_FUTURE_WORK](LIMITATIONS_AND_FUTURE_WORK.md)

RotaTerra is an independent project and is not endorsed by NASA. Data: NASA POWER.
