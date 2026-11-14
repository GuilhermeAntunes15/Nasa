# NASA data sources

Scope: see the [Implemented / Conceptual table in the README](../README.md#implemented--conceptual-not-implemented). RotaTerra integrates exactly one NASA data product: the NASA POWER Daily API.

## NASA POWER Daily API (integrated)

| Item | Value in RotaTerra |
|---|---|
| Product | NASA POWER (Prediction Of Worldwide Energy Resources), Daily temporal API, single point |
| Endpoint | `GET https://power.larc.nasa.gov/api/temporal/daily/point` |
| Query (built by `buildPowerUrl` in `src/lib/power.ts`) | `parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR`, `community=AG`, `longitude`, `latitude` (rounded to 2 decimals), `start=20150101`, `end=20251231`, `format=JSON`, `time-standard=LST` |
| Period | 2015-01-01 to 2025-12-31 (4018 days), local solar time (LST) |
| Community | AG (agroclimatology) |
| API version observed | `v2.10.3` (`header.api.version` of the stored snapshot) |
| Upstream sources reported | `["MERRA2", "POWER"]` (`header.sources`); the dataset title is "NASA/POWER Source Native Resolution Daily Data" |
| Fill value | `-999` (`header.fill_value`; the parser uses the header value and falls back to −999) |
| Response format | GeoJSON `Feature`; `geometry.coordinates = [lon, lat, elevation]`; values in `properties.parameter.<PARAM>.<YYYYMMDD>` |
| Docs | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ |

### Parameters

| Parameter | Long name (from the API) | Units (from the API) | Used for |
|---|---|---|---|
| `T2M` | Temperature at 2 Meters | C | Monthly means for the temperature-compatibility indicator; climate charts |
| `T2M_MAX` | Temperature at 2 Meters Maximum | C | Hargreaves–Samani ETo; climate charts |
| `T2M_MIN` | Temperature at 2 Meters Minimum | C | Hargreaves–Samani ETo; climate charts |
| `PRECTOTCORR` | Precipitation Corrected | mm/day | Daily soil-water balance; rainfall charts |

`PRECTOTCORR` is described in the app as "bias-corrected precipitation provided by POWER". The source of the bias correction was not reviewed for this MVP.

POWER values are gridded estimates derived mainly from the MERRA-2 reanalysis, which assimilates satellite and ground observations. The app describes the grid as "roughly 50 km" and never presents values as measurements at the farm. The exact native resolution was not checked against POWER documentation for this MVP.

### Missing and invalid data

Handled in `parsePowerResponse` (`src/lib/power.ts`) and `src/lib/climate.ts`:

- Values equal to the fill value, or outside a plausibility range (−90 to 60 °C for temperatures, 0 to 2000 mm/day for precipitation), become `null` and are counted per parameter in `provenance.missingDays` (shown in the provenance card).
- A missing parameter, a non-numeric value, an empty series, date keys that are not contiguous or that differ between parameters, or a payload without `properties.parameter` raise `PowerParseError`; the route then answers `UPSTREAM_INVALID` (or serves the snapshot for the Sorriso point).
- An agricultural season (15 Sep–14 Sep) with any missing day in any of the four parameters is excluded from the rotation model and listed as excluded in "Why this result?". With fewer than 5 complete seasons, no rotation results are shown ("Not enough complete seasons").
- Monthly rainfall is only totalled when every day of the month is valid; monthly temperature means use the valid days. Annual rainfall is only shown for complete years.

The stored Sorriso snapshot has 0 missing or out-of-range days in all four parameters (checked by `power.test.ts`).

### Caching and request policy

- Client: one in-memory promise per rounded point (`src/components/use-climate.ts`); a failed request is removed so "Try again" retries.
- HTTP: live answers carry `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`; errors and snapshot answers carry `no-store`.
- Server: the upstream `fetch` asks the Next.js Data Cache for `revalidate: 86400` (one day).
- Timeout: 25 seconds per upstream request.
- POWER publishes no official rate limit for this API; repeated requests for the same location may be blocked. RotaTerra has no rate limiting of its own (see [LIMITATIONS_AND_FUTURE_WORK](LIMITATIONS_AND_FUTURE_WORK.md)).

### Snapshot (`data/power-snapshot.json`)

- Content: `{ retrievedAt, requestUrl, response }`, where `response` is the raw, unmodified NASA POWER JSON for Sorriso, Mato Grosso (−12.55, −55.72; elevation 370.59 m reported by POWER). Size about 265 KB.
- `requestUrl` must equal `buildPowerUrl(-12.55, -55.72)`; a unit test checks this.
- `retrievedAt` is taken from the upstream `Date` header. The file in the repository at the time of writing has `retrievedAt = 2026-11-14T02:26:46.000Z` (API v2.10.3). Re-running `npm run snapshot:power` replaces it; the date shown in the app and in the acknowledgment always comes from the file.
- It is served only when the live request fails and only for that exact point, with `mode: "snapshot"` and a visible banner. It is also used by the unit tests as real-data fixtures (4018 days; PRECTOTCORR on 2025-12-31 = 0.04 mm; T2M on 2015-01-01 = 25.48 °C).

### Acknowledgment

Shown in every provenance card, built by `powerAcknowledgment` from the API version and retrieval date of the data on screen:

> The data was obtained from National Aeronautics and Space Administration (NASA) Langley Research Center's Prediction Of Worldwide Energy Resources (POWER) project funded through the NASA Earth Science Division. The data was obtained from the POWER Project's Daily `<version>` version on `<YYYY/MM/DD>`.

Wording from https://power.larc.nasa.gov/docs/referencing/.

## Not integrated

The official list of data resources for the 2026 challenge was **not read**: the challenge page did not open during planning. Please check the challenge page and compare its resource list with this document. None of the following is integrated in RotaTerra:

| Resource | Status |
|---|---|
| GPM IMERG (satellite precipitation) | Not integrated. Possible future replacement or cross-check for `PRECTOTCORR`. |
| SMAP (satellite soil moisture) | Not integrated. The app explains on the Science page why it has no soil-moisture control; SMAP is future work. |
| Any other resource listed by the challenge | Not integrated and not reviewed. |

No climate projections (for example CMIP6) are used. Hypothetical scenarios only rescale rainfall and shift temperatures of the historical POWER series.
