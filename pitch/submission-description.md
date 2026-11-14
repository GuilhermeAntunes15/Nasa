# RotaTerra - submission descriptions

The exact fields of the 2026 submission form were **not verified** (TO VERIFY ON THE OFFICIAL SITE). Adapt these texts to the real field names and limits. Replace placeholders before submitting.

- Repository: `<REPO URL>`
- Live demo: `<DEPLOY URL>`

## Title
RotaTerra: Smarter crop rotations. Stronger farms.

## Short version (about 50 words)
RotaTerra is an exploratory web app that uses eleven years of daily NASA POWER rainfall and temperature to compare three crop rotations for one soybean farm in Mato Grosso, Brazil. It runs a transparent FAO-56 water balance, scores five indicators, tests hypothetical scenarios, and explains every number. Not a yield or weather forecast.

## Long version (about 250 words)
Farmers choose what to plant next without knowing the weather. NASA data describes climate patterns, but turning it into a comparison of crop rotations is hard to do and hard to check.

RotaTerra is an exploratory decision-support web app for soybean farms in the Brazilian Cerrado. For a point chosen on a map, it retrieves daily rainfall and temperature from the NASA POWER Daily API (2015-2025, 4,018 days; gridded MERRA-2-based estimates of roughly 50 km, not measurements at the farm). The farmer adds soil texture, drainage, current sequence, irrigation and priority.

In the browser, a documented FAO-56 model estimates reference evapotranspiration (Hargreaves-Samani), applies crop coefficients and runs a daily soil-water balance for ten seasons. Three rotations are compared: the current soybean-maize sequence, a soil-cover option with ruzigrass, and a two-year diversified rotation. Five indicators and a weighted exploratory index are shown. For the default farm in Sorriso, Mato Grosso, the index is 82, 91 and 91. A Scenario Lab rescales rainfall (-30% to +20%) or shifts temperature, so a -20% rainfall test raises the current system's water-demand exposure from 6.7% to 9.5%.

"Why this result?" traces every number to its formula, input and source, and every input is labelled as NASA data, farmer-provided, published crop data, model-derived or hypothetical scenario. 53 unit tests cover the model.

Limits: no field validation, no climate projections, no yield or profit estimates; Mato Grosso calendar only. The project was built with AI agents under human direction; no generative AI runs in the product. Independent project, not endorsed by NASA. Data: NASA POWER.
