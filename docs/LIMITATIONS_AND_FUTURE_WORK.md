# Limitations and future work

Scope: see the [Implemented / Conceptual table in the README](../README.md#implemented--conceptual-not-implemented). Formulas: [METHODOLOGY](METHODOLOGY.md).

RotaTerra is exploratory decision support. It does not predict yield or profit, does not estimate water savings, does not give a probability of success, does not assess pests, diseases or nematodes and does not identify an optimal sowing date. The model has not been validated in the field.

## Scientific limitations

- **Hargreaves–Samani ETo** uses only temperature and extraterrestrial radiation. It ignores humidity, wind and cloudiness, so ETo in humid or windy periods can differ from Penman–Monteith.
- **Fixed rooting depth** Zr = 1.0 m for every crop and every day; roots do not grow through the season.
- **Runoff and capillary rise are zero**, and bare-soil evaporation is not modelled (ETc = 0 without an active crop). All rain above the root-zone capacity goes to deep percolation.
- **Fixed stage lengths and Kc**: Kc is not adjusted for local climate (FAO-56 eq. 62) or wetting frequency (Kc ini uses the FAO-56 crop-group value); heat does not shorten the cycle; p is not adjusted for daily ETc.
- **ECOCROP temperature ranges** are broad and are applied to calendar-month mean T2M. In Mato Grosso the temperature indicator discriminates little: for the default Sorriso farm it is 1.00 for Current, 0.99 for Alternative A and 0.995 for Alternative B (the small differences come from ruzigrass in June–September).
- **Ky as an index**: the seasonal FAO-33 Ky form is used as a sensitivity index, not as a yield forecast.
- **Reanalysis data**: NASA POWER values are gridded estimates (roughly 50 km) based mainly on MERRA-2, not measurements at the farm.
- **Ten seasons only** (2015/16–2024/25); medians over 10 values are sensitive to single seasons.
- **Mato Grosso calendar**: soybean 1 Oct, second crop 1 Feb, ruzigrass until 10 Sep. Elsewhere in Brazil results are illustrative; outside Brazil rotations are not computed.
- **Proxies**: ruzigrass Kc 0.95 and p 0.60 come from the FAO-56 grazing-pasture rows; the soybean cycle is the FAO-56 "Central USA" profile scaled to 115 days.
- **Soil water in tropical soils**: TAW uses FAO-56 Table 19 midpoints (clayey 160 mm). FAO-56 values may overstate the water available in highly weathered tropical soils (Oxisols).
- **Season reset on 15 Sep**: every season starts with an empty root zone (Dr = TAW) and nothing carries over. Cover crops therefore cannot leave water or residue for the next soybean in this model, which is why Alternative A has exactly the same water-exposure and deficit values as Current for the default farm (6.7% and 0.12).
- **Soybean starts on an empty profile**: soybean sown on 1 Oct depends on rain between 15 Sep and its early stages to refill the root zone. This likely raises its deficit index in seasons with a late rainfall onset; the effect was not isolated in this MVP.
- **Crop residue (mulch)** is not quantified; soil cover counts living canopy days only.
- **Not modelled**: pests, diseases, nematodes, weeds, nutrients, markets, prices, CO₂ effects, cultivar differences and management operations.
- **Irrigation** is a refill-to-field-capacity rule on cash-crop days; its dependency value is not comparable with the rain-fed exposure value.
- **Weights and diversity caps** are design choices of this MVP, shown with every index.
- **No field validation**: local agronomic validation is required before any change of rotation.

## Technical limitations

- `/api/power` has no rate limiting of its own; NASA POWER may block repeated requests for the same point.
- The stored snapshot covers only the default Sorriso point; other points fail with an error message when NASA POWER is unavailable.
- The Next.js Data Cache was observed to work for the upstream `fetch` only in a local run; it was not checked on Vercel. Browser/CDN caching and the client promise cache do not depend on it.
- The period 2015-01-01 to 2025-12-31 is fixed in code (`POWER_START`, `POWER_END`).
- The map needs network access to OpenFreeMap tiles; if it fails, the latitude and longitude fields still work. The MapLibre worker is a copy in `public/` that must be refreshed when MapLibre is upgraded.
- State lives only in the URL; there are no accounts or saved farms.
- "Print / Save as PDF" relies on the browser's print dialog.
- The repository has unit tests for `src/lib` only; there are no automated end-to-end browser tests.
- The interface is in English only.

## Future work

- NASA GPM IMERG precipitation as an alternative or cross-check to POWER `PRECTOTCORR`.
- NASA SMAP soil moisture to initialise or check the soil-water balance.
- FAO-56 Penman–Monteith ETo with POWER humidity, wind and radiation parameters.
- FAO-56 mulch rules and residue effects; soil-water carry-over between seasons.
- Editable soybean sowing date inside the Mato Grosso window, shifting the whole calendar.
- Outline of the POWER grid cell on the map.
- More crops (for example cotton, crotalaria) and a free rotation builder.
- Comparison of several locations; reverse geocoding.
- Climate projections (for example CMIP6) clearly separated from the historical record.
- Calendars and parameters for other regions, validated with local partners.
- Field validation with local agronomists and farm records.
- End-to-end browser tests.
