# Methodology

Scope: see the [Implemented / Conceptual table in the README](../README.md#implemented--conceptual-not-implemented). Limitations: [LIMITATIONS_AND_FUTURE_WORK](LIMITATIONS_AND_FUTURE_WORK.md).

This document describes the model as implemented in `src/lib` (`climate.ts`, `agro.ts`, `crops.ts`, `simulate.ts`). The model is deterministic: the same data and settings always give the same numbers. Every result is labelled as a **transparent exploratory decision-support index — not a validated agricultural prediction**.

## M0. Series and seasons

- Daily NASA POWER series from 2015-01-01 to 2025-12-31 (4018 days). Dates are handled as UTC civil dates.
- Agricultural season: 15 Sep of year Y to 14 Sep of Y+1, labelled "Y/Y+1" (for example "2018/19"). The series contains 10 seasons, 2015/16 to 2024/25.
- A season with any missing day in T2M, T2M_MAX, T2M_MIN or PRECTOTCORR is excluded and listed. With fewer than 5 complete seasons no rotation results are produced.
- Each season is simulated independently: on every 15 Sep the root zone starts empty (depletion Dr = TAW) and nothing carries over between seasons.

## M1. Hypothetical scenario

Applied to every day before M2–M7, `null` values are preserved:

```
P' = P × (1 + ΔP/100)     ΔP from −30% to +20%, step 5%
T' = T + ΔT               ΔT from −2 °C to +4 °C, step 0.5 °C   (T2M, T2M_MAX and T2M_MIN)
```

Scenarios rescale or shift the historical record. They are not forecasts or climate projections.

## M2. Extraterrestrial radiation (FAO-56 eqs. 21–25)

```
Ra = (24·60/π) · Gsc · dr · [ωs·sin φ·sin δ + cos φ·cos δ·sin ωs]      MJ m⁻² day⁻¹
Gsc = 0.0820 MJ m⁻² min⁻¹
dr  = 1 + 0.033·cos(2πJ/365)
δ   = 0.409·sin(2πJ/365 − 1.39)
ωs  = arccos(−tan φ·tan δ), argument limited to [−1, 1]
```

φ is the latitude of the selected point in radians; J is the day of the year (1 = 1 Jan).

## M3. Reference evapotranspiration, Hargreaves–Samani (FAO-56 eq. 52)

```
ETo = 0.0023 · (Tmean + 17.8) · √(Tmax − Tmin) · 0.408 · Ra       mm/day,  Tmean = (Tmax + Tmin)/2
```

If Tmax < Tmin the square root is taken as 0. ETo is never negative. Penman–Monteith is not implemented.

## M4. Crop coefficient and crop water demand (FAO-56 eq. 66)

For a crop with stage lengths [Lini, Ldev, Lmid, Llate] and day index i (0 = sowing day):

```
i < Lini                       Kc = Kc_ini
Lini ≤ i < Lini+Ldev           Kc = Kc_ini + ((i − Lini)/Ldev)·(Kc_mid − Kc_ini)
… < Lini+Ldev+Lmid             Kc = Kc_mid
otherwise                      Kc = Kc_mid + (min(i − Lini − Ldev − Lmid, Llate)/Llate)·(Kc_end − Kc_mid)
ETc = Kc · ETo
```

Ruzigrass uses a constant Kc. Days without an active crop have ETc = 0 (bare-soil evaporation is not modelled).

## M5. Daily soil-water balance (FAO-56 eqs. 82–85)

```
TAW = 1000 · (θFC − θWP) · Zr           Zr = 1.0 m for every crop
RAW = p · TAW
```

| Soil texture | θFC − θWP (m³/m³, midpoint of FAO-56 Table 19) | TAW |
|---|---|---|
| Sandy | 0.08 | 80 mm |
| Loamy | 0.155 | 155 mm |
| Clayey | 0.16 | 160 mm |

Each day, with Dr the depletion at the start of the day (`waterBalanceDay` in `agro.ts`):

1. RAW = p · TAW.
2. If irrigation is available, the active crop is a cash crop and Dr > RAW: irrigation I = Dr (refill to field capacity) and Ks = 1.
3. Otherwise I = 0 and Ks = 1 if Dr ≤ RAW, else Ks = clamp((TAW − Dr)/(TAW − RAW), 0, 1) (FAO-56 eq. 84).
4. ETa = Ks · ETc.
5. x = Dr − P − I + ETa; Dr(end) = min(TAW, max(0, x)); deep percolation DP = max(0, −x).

Runoff and capillary rise are 0. On days without an active crop, ETc = 0, Ks = 1 and p is not used.

## Calendar and active crop

| Slot | Sowing | Active period |
|---|---|---|
| Soybean | 1 Oct | 115 days, to 23 Jan |
| Second-crop maize / grain sorghum | 1 Feb | 125 days, to 5 Jun (4 Jun when February has 29 days) |
| Pearl millet (cover) | 1 Feb | 105 days, to 16 May (15 May when February has 29 days) |
| Ruzigrass | Slot 1 Feb–10 Sep | Active only on days without a cash crop: 6 Jun (5 Jun) to 10 Sep |

A date (month, day) falls in year Y if it is on or after 15 Sep, otherwise in Y+1. The active crop of a day is the cash-crop slot covering that day, otherwise the cover-crop slot, otherwise fallow. Ruzigrass is established with the maize; its water use while under the maize is ignored. Soybean on 1 Oct lies inside the Mato Grosso sowing window (7 Sep–7 Jan); the second-crop date 1 Feb lies inside the period in which about 80% of Mato Grosso second-crop maize is sown (5 Jan–20 Feb, Embrapa). A unit test checks that every crop ends by 14 Sep of the following year.

## Crop catalogue (`src/lib/crops.ts`)

| Crop | Role, group | Stages (days) | Kc ini / mid / end | p | Ky | T optimal / absolute (°C) | pH optimal / absolute | Tolerates poor drainage |
|---|---|---|---|---|---|---|---|---|
| Soybean (*Glycine max*) | cash, grain legume | 16/29/49/21 = 115 | 0.40 / 1.15 / 0.50 | 0.50 | 0.85 | 20–33 / 10–38 | 5.5–6.5 / 4.5–8.4 | yes |
| Second-crop maize (*Zea mays*) | cash, grain cereal | 20/35/40/30 = 125 | 0.30 / 1.20 / 0.35 | 0.55 | 1.25 | 18–33 / 10–47 | 5–7 / 4.5–8.5 | no data |
| Second-crop grain sorghum (*Sorghum bicolor*) | cash, grain cereal | 20/35/40/30 = 125 | 0.30 / 1.05 / 0.55 | 0.55 | 0.9 | 22–35 / 8–40 | 5.5–7.5 / 5–8 | no |
| Pearl millet, cover (*Pennisetum glaucum*) | cover, cover grass | 15/25/40/25 = 105 | 0.30 / 1.00 / 0.30 | 0.55 | — | 25–35 / 12–40 | 5–6.5 / 4.5–8.3 | no |
| Ruzigrass (*Urochloa (Brachiaria) ruziziensis*) | cover, cover grass | by calendar | 0.95 constant | 0.60 | — | 25–33 / 19–40 | 5.5–6.5 / 4.5–7.5 | no |

Sources and assumptions per number:

- **Stage lengths**: FAO-56 Table 11. Soybean: "Central USA" proportions (20/35/60/25 = 140 days) scaled to 115 days (assumption). Maize: "Nigeria (humid)" row. Sorghum: 20/35/40/30; the table prints a total of 130 days while the stages add up to 125, and 125 is used. Pearl millet: millet "Pakistan" row.
- **Kc**: FAO-56 Table 12. Kc ini is the crop-group value, not adjusted for wetting frequency. Maize Kc end 0.35 is the dry-harvest end of the 0.60–0.35 range. Sorghum Kc mid 1.05 is the midpoint of 1.00–1.10. Pearl millet uses the grain-millet rows. Ruzigrass Kc 0.95 is a **proxy**: midpoint of the Kc mid range (0.85–1.05) for "Grazing pasture, rotated grazing".
- **p**: FAO-56 Table 22. Ruzigrass p 0.60 is a **proxy** from the "Grazing pasture" row. p is not adjusted for daily ETc.
- **Ky**: seasonal values from FAO-33 as reproduced in FAO-66, chapter 2, Table 1. No published seasonal Ky for millet, so no deficit sensitivity for pearl millet; ruzigrass has none either.
- **Temperature, pH and drainage**: FAO ECOCROP data sheets 1150 (soybean), 2175 (maize), 48747 (sorghum), 8418 (pearl millet), 543 (ruzigrass).

## Rotations

| Rotation | Years | Sequence |
|---|---|---|
| Current | 1 | The farmer's sequence: soybean → second-crop maize (default), → second-crop sorghum, → pearl millet (cover) or → fallow |
| Alternative A — Soil cover & water | 1 | Soybean → second-crop maize intercropped with ruzigrass, which keeps the soil covered until 10 Sep (Santa Fé system, Broch & Ceccon 2008) |
| Alternative B — Diversification | 2 | Year 1: soybean → second-crop sorghum. Year 2: soybean → second-crop maize with ruzigrass |

Each year of a rotation (template year) is simulated over every usable season.

## M6. Indicators

Each indicator has a value, a score in [0, 1] (1 = more favourable), a written rule and categorised inputs, all shown in "Why this result?".

1. **Seasonal climate compatibility (temperature)** — index 0–1. For each day with an active crop, that crop's ECOCROP temperature ranges are applied to the calendar-month mean T2M (with the scenario): 0 at or outside the absolute range, 1 inside the optimal range, linear in between. Season value = mean over active crop days. Adapted from the FAO EcoCrop approach (Ramirez-Villegas et al., 2013); a day-weighted mean, not the original EcoCrop model. Score = value.
2. **Relative water-demand exposure** — % of cash-crop water demand, cash crops only. Rain-fed: Σ(ETc − ETa)/ΣETc. With irrigation the label becomes **Irrigation-water dependency**: ΣI/ΣETc (not comparable with the rain-fed value; refill-to-field-capacity rule). Score = 1 − min(1, share); lower exposure scores higher. Cover-crop ETa is reported as a model value but not scored: cover crops grow after the cash crops and each season restarts from an empty root zone, so their water use does not affect the next soybean in this model. Differences with Current are worded "lower/higher than Current".
3. **Soil cover potential** — days/season. Days of a staged crop count from the end of its initial stage (day index ≥ Lini); every active ruzigrass day counts. Score = days / season length (365 or 366). Crop residue (mulch) is not quantified.
4. **Crop diversity** — species. Computed once over the union of all years of the rotation: `0.5 · min(species, 4)/4 + 0.5 · min(groups, 3)/3`, groups = grain legume, grain cereal, cover grass. The caps are design choices: 4 species and 3 groups reach the maximum.
5. **Sensitivity to rainfall deficits** — dimensionless index 0–1. For each cash crop with a published Ky: `D = Ky · (1 − ΣETa/ΣETc)`; season value = largest D; score = 1 − min(1, D). This is a **deficit-sensitivity score (FAO-33 water-production form), not a yield forecast**, and is never shown as a percentage. With irrigation, ETa = ETc on cash-crop days, so D = 0.

### Aggregation

- For each template year y and season s the model computes value v(y, s) and score sc(y, s).
- Indicator score = mean over template years of the median over seasons; the displayed value is aggregated the same way. With an even number of seasons the median is the mean of the two central values.
- Lowest-scoring season = the (y, s) pair with the lowest score, labelled for example "2018/19" (plus "(year 1)" or "(year 2)" for Alternative B).
- Crop diversity is not aggregated over seasons (see above).

## M7. Exploratory index

```
Index = 100 · Σ weight(i) · score(i)
```

| Main priority | Temperature | Water | Cover | Diversity | Deficit |
|---|---|---|---|---|---|
| Water conservation | 0.15 | 0.35 | 0.15 | 0.15 | 0.20 |
| Soil protection | 0.15 | 0.15 | 0.35 | 0.20 | 0.15 |
| Climate resilience | 0.25 | 0.15 | 0.15 | 0.15 | 0.30 |

Weights are design choices of this MVP and sum to 1. The index is shown as an integer on the cards and with two decimals in "Why this result?", always together with the five scores and the weights. Every rotation whose rounded index equals the highest rounded index is labelled "Highest index for your priority (exploratory)". When more than one rotation carries the label, the Rotations screen adds: "Indices that round to the same whole number are shown as tied."

Comparison wording: on the rotation cards and in the summary, a score difference against Current, rounded to 2 decimals, is "better" at ≥ +0.02, "worse" at ≤ −0.02 and "similar" otherwise. Scenario sentences name the indicator with the largest absolute score change; if every change is below 0.005 they say so.

## Region guard

- Mato Grosso box: latitude −18.1 to −7.3, longitude −61.7 to −50.2 → full results.
- Brazil box (outside Mato Grosso): latitude −34 to 6, longitude −74 to −34 → results with a persistent banner: "Crop calendars in this MVP are based on Mato Grosso (Brazil) sowing windows. Results for this location are illustrative only."
- Outside Brazil → no rotation, scenario or summary results; an explanation with a link to the Climate page, which works for any location (the crop-window chart is hidden).

## Practical flags (not scored)

- Drainage "poorly drained" and ECOCROP lists the crop as not tolerant → caution "ECOCROP lists <crop> as not tolerant of poorly drained soils." No ECOCROP drainage data → info "No ECOCROP drainage data for <crop>."
- Soil pH entered: outside the ECOCROP absolute range → caution; outside the optimal range but inside the absolute range → info.
- Rotation with ruzigrass → info "Ruzigrass must be desiccated in time before soybean sowing."
- Rotation with a 1 Feb second crop → info "Second crop sown on 1 Feb; later sowing raises water risk (Embrapa)."
- Always → "Pests, nematodes, markets and CO₂ effects are not modelled." and "Heat does not shorten the crop cycle in this model: stage lengths are fixed."

## Data categories

Every input in "Why this result?" and every section of the app carries one of five labels (`src/components/data-badge.tsx`):

| Category | Label | Meaning |
|---|---|---|
| `nasa` | NASA POWER data | Daily estimates from NASA POWER, based on the MERRA-2 reanalysis, which assimilates satellite and ground observations. Gridded (~50 km), not measured at your farm. |
| `farmer` | Farmer-provided | Information you entered about your farm. |
| `published` | Published crop data | Crop parameters from FAO publications and the FAO ECOCROP database, cited in each explanation. |
| `model` | Model-derived indicator | Calculated by the RotaTerra model from the other inputs; see the Science page for every formula. |
| `scenario` | Hypothetical scenario | A rainfall or temperature change you chose to explore. Not a weather forecast or climate projection. |

## Numerical test cases

All run with `npm test` (53 tests, files `src/lib/*.test.ts`). Synthetic fixtures are used only in tests.

| Area | Case | Expected |
|---|---|---|
| Ra | `extraterrestrialRadiation(-20, 246)` (20°S, 3 Sep) | 32.19 ± 0.05 MJ m⁻² day⁻¹ |
| ETo | `hargreavesEto(30, 20, 32.2)`; with +2 °C (32, 22) | 4.0897; 4.2808 mm/day (±0.001) |
| ETo | Tmax < Tmin (20, 25) | 0 |
| Kc | Soybean on day 0, 30, 60, 114 | 0.40, 0.7621, 1.15, 0.5310 |
| Kc | Ruzigrass on day 0 and 200 | 0.95 |
| TAW | Sandy, loamy, clayey | 80, 155, 160 mm |
| Balance | TAW 100, p 0.5, ETc 5/day, no rain, Dr0 0 | Dr 50 after 10 days; day 11 Ks 1, Dr 55; day 12 Ks 0.9, ETa 4.5, Dr 59.5 |
| Balance | Dr 20, P 50, ETc 5 | Dr 0, DP 25 |
| Balance | Irrigating, Dr 60 (> RAW 50) | I 60, Ks 1, ETa 5, Dr 5, DP 0; at Dr 50: I 0, Dr 55 |
| Balance | Dr = TAW | Ks 0, ETa 0 |
| ECOCROP | Soybean at 25, 35.5, 15, 9, 38 °C | 1, 0.5, 0.5, 0, 0 |
| ECOCROP | At 23 °C: pearl millet, sorghum, ruzigrass | 0.8462, 1, 0.6667 |
| Thermal | Constant T2M 25 °C | every crop 1; with ΔT −2 °C: pearl millet 0.8462, sorghum 1, ruzigrass 0.6667 |
| Cover | 2015/16 (366 days): Current soy-maize, Alternative A | 204 days (0.5574), 302 days (0.8251) |
| Cover | 2016/17: Current, A, B, soy-millet, soy-fallow | 204 (0.5589), 301 (0.8247), (204 + 301)/2 = 252.5 (0.6918), 189 (0.5178), 99 (0.2712) |
| Diversity | Current soy-maize, A, B | 0.5833, 0.875, 1.0 |
| Limits | No rain | exposure 100%, score 0; deficit score 0 for soy-maize and 0.15 for soy-fallow |
| Limits | 50 mm/day | exposure 0, D 0 |
| Irrigation | No rain, irrigated | D 0, label "Irrigation-water dependency", value > 0 |
| Monotonicity | Real snapshot, −20% rain | exposure and D never fall; ETa never rises |
| Monotonicity | Real snapshot, +2 °C | total ETc rises |
| Index | Weights per priority; repeated runs | sum to 1; identical results |
| Seasons | Real snapshot | 10 complete seasons; first starts at index 257 with 366 days; fewer than 5 complete seasons → no results |
| Parser | 3-day fixture; missing parameter; date gap; non-numeric value; non-object | fill and out-of-range → null with counts; `PowerParseError` otherwise |
| Parser | Real snapshot | 4018 days, 0 missing days, ends 2025-12-31, PRECTOTCORR 2025-12-31 = 0.04, T2M 2015-01-01 = 25.48, units mm/day |
| Snapshot | `snapshot.requestUrl` | equals `buildPowerUrl(-12.55, -55.72)` |
| Aggregation | 31 days × 2 mm | 62 mm; one missing day → null; temperature mean over valid days |
| URL state | lat "abc" or 95; ΔP −45; ΔT 9; pH 5.25 | default location; −30; 4; 5.3 |

Results of the full model on the real Sorriso data are in [DEMO_WALKTHROUGH](DEMO_WALKTHROUGH.md#reference-numbers).

## Sources

- Allen, R.G., Pereira, L.S., Raes, D. & Smith, M. (1998). Crop evapotranspiration — Guidelines for computing crop water requirements. FAO Irrigation and Drainage Paper 56. https://www.fao.org/4/x0490e/x0490e00.htm
- Smith, M. & Steduto, P. (2012). Yield response to water: the original FAO water production function. In FAO Irrigation and Drainage Paper 66, chapter 2 (Table 1: seasonal Ky from FAO-33). https://www.fao.org/4/i2800e/i2800e02.pdf
- Doorenbos, J. & Kassam, A.H. (1979). Yield response to water. FAO Irrigation and Drainage Paper 33 (values as reproduced in FAO-66).
- FAO ECOCROP data sheets: [1150 Glycine max](https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1150), [2175 Zea mays](https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=2175), [48747 Sorghum bicolor](https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=48747), [8418 Pennisetum glaucum](https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=8418), [543 Brachiaria ruziziensis](https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=543).
- Ramirez-Villegas, J., Jarvis, A. & Läderach, P. (2013). Empirical approaches for assessing impacts of climate change on agriculture: The EcoCrop model and a case study with grain sorghum. Agricultural and Forest Meteorology 170, 67–78. https://doi.org/10.1016/j.agrformet.2011.09.005
- CNA (2026). Soybean calendar in Mato Grosso keeps the sanitary break from June to September for 2026 (in Portuguese). Sedec/Indea-MT: sanitary break 8 Jun–6 Sep 2026; soybean sowing 7 Sep 2026–7 Jan 2027. https://cnabrasil.org.br/noticias/calendario-da-soja-em-mt-mantem-vazio-sanitario-de-junho-a-setembro-para-2026
- Borghi, E., Magalhães, P.C. & Pereira Filho, I.A. (2023). Ecophysiology of second-crop maize for high yield (in Portuguese). Documentos 273, Embrapa Milho e Sorgo (Embrapa Maize and Sorghum). https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1156268/1/Ecofisiologia-do-milho-segunda-safra-para-alta-produtividade.pdf
- Broch, D.L. & Ceccon, G. (2008). Second-crop maize production with crop-livestock integration (in Portuguese). Embrapa Infoteca. https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/242418/1/Producao-de-milho-safrinha-com-integracao-lavoura-e-pecuaria.pdf
- NASA POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/ — referencing: https://power.larc.nasa.gov/docs/referencing/
