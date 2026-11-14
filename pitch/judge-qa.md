# RotaTerra - judge Q&A (technical, concise, consistent with what was built)

Rules for answering: say what exists, say what does not, never claim validation, yield, profit or water savings. Default farm: Sorriso, MT (-12.55, -55.72), soybean -> second-crop maize, clayey, rain-fed, priority "Water conservation". Numbers: index 82 / 91 / 91 (exact 82.38 / 90.60 / 91.26); at -20% rainfall 81 / 89 / 90; water-demand exposure Current and A 6.7% -> 9.5%, B 6.2% -> 8.9%; deficit index Current and A 0.12 -> 0.15, B 0.09 -> 0.11.

---

## The 10 core questions

**1. Why does this project need NASA data?**
A farmer cannot easily get a consistent, open, long daily record of rainfall and temperature for any point. NASA POWER gives 11 years (2015-2025, 4,018 days) of daily rain and temperature anywhere, built on the MERRA-2 reanalysis. RotaTerra needs daily values because the soil-water balance runs day by day over ten seasons; monthly averages would hide the dry spells that matter. We use one NASA product, NASA POWER; we do not claim more.

**2. What makes RotaTerra different from agricultural weather dashboards?**
A weather dashboard shows the climate. RotaTerra uses the climate to compare three crop rotations on the same field, with five indicators and an exploratory index, and then lets you stress them with hypothetical scenarios. Every number opens into "Why this result?" with its rule, input, source and data type. We do not claim it is better than any specific product; the difference is the question it answers: what to plant next, not what the weather was.

**3. How is the comparison calculated?**
For each of 10 agricultural seasons (15 Sep to 14 Sep) the model: (a) estimates reference evapotranspiration with Hargreaves-Samani (FAO-56) from daily max/min temperature and latitude; (b) applies FAO-56 crop coefficients by growth stage to get crop water demand; (c) runs a daily soil-water balance (soil texture sets available water; a stress coefficient reduces use when the soil dries). From that it scores five indicators: temperature compatibility (EcoCrop ranges), water-demand exposure, soil cover days, crop diversity, and sensitivity to rainfall deficits (FAO-33 Ky form, an index, not a yield forecast). The exploratory index is 100 x the weighted sum of the five scores, with weights set by the farmer's priority and always shown. All of it is deterministic and runs in the browser.

**4. How do you validate the proposed crop rotation strategies?**
We have not validated them in the field, and the app says so. What we did: the equations are implemented from FAO publications and 53 unit tests check them against independently computed values and run on real NASA data; crop parameters are cited. What is still needed: review by agronomists, comparison with farm records, and local calibration, for example with Embrapa. Until then the output is a transparent exploratory comparison, not a recommendation.

**5. What limitations does NASA POWER data have at farm scale?**
It is a gridded estimate of roughly 50 km, based mainly on a reanalysis, so it describes the surrounding area, not the field. Local rain events and microclimates can differ. We show this on every screen and never label the values as farm measurements. The precipitation field is POWER's bias-corrected product; we did not review how the correction is made. A future cross-check with GPM IMERG precipitation would help.

**6. Are these climate forecasts or hypothetical scenarios?**
Hypothetical scenarios. The Scenario Lab rescales the historical rainfall (-30% to +20%) and shifts temperature (-2 to +4 C) in the 2015-2025 record, then recalculates everything. There are no climate projections and no weather forecasts. The screen says: "These are hypothetical scenarios, not weather forecasts."

**7. What is the real impact for farmers?**
We have no measured impact: no pilots, no farmer interviews, no yield or water results. What exists is a working tool that makes the link between NASA data and a rotation decision visible and checkable. The potential value is planning conversations, understanding water trade-offs and access to Earth science; we label that as potential, not demonstrated.

**8. How could the platform scale?**
Technically the model is pure functions in the browser and the NASA POWER API works for any point on Earth, so computation scales cheaply; the app already caches at three levels. The hard part is agronomic, not technical: each region needs its own calendar, crops and parameters, validated with local experts. Today full results are limited to Mato Grosso; elsewhere in Brazil results are marked illustrative; outside Brazil no rotation results are shown. Scaling plan: more regions with local partners, more crops, then more NASA datasets.

**9. What would you improve with more development time?**
In order: validation with agronomists and farm records; Penman-Monteith evapotranspiration using more POWER parameters; soil-water carry-over and residue (mulch) effects between seasons; an editable sowing date; NASA SMAP soil moisture and GPM IMERG precipitation; more crops and a free rotation builder; end-to-end browser tests.

**10. How was artificial intelligence used in the project?**
The project was built with AI agents (Claude Code) working in a pipeline of planning, critique, coding, design and QA, under human direction. The agents wrote the code, tests, design and documentation. No AI-generated data or images are used; the climate data are real NASA POWER responses. There is no generative AI in the running product: every explanation is a deterministic template filled with computed numbers. Full disclosure in `ai-disclosure.md`.

---

## Harder questions

**11. Alternative A ties Current on water. Why?**
By design of this MVP, and we state it. Each season restarts on 15 Sep with an empty root zone, and crop residue (mulch) is not modelled, so ruzigrass cannot leave water for the next soybean. Water exposure (6.7%) and deficit index (0.12) are therefore identical for Current and A. A gains on soil cover (301 vs 204 days) and diversity (3 vs 2 species) only. Carry-over and residue are the first model improvements.

**12. Why does -20% rainfall change the index by only about 1.5 points?**
Because the index mixes five indicators and only two respond to rain: water-demand exposure (weight 0.35 for this priority) falls about 0.03 in score and deficit sensitivity (weight 0.20) about 0.02-0.03. Temperature, soil cover and diversity do not change. Also, the model counts only the unmet share of cash-crop water demand, which goes from 6.7% to 9.5%. We present it as traceable and measurable, not dramatic. We have not tested how it behaves against real yield loss.

**13. Why Hargreaves-Samani instead of Penman-Monteith?**
Hargreaves-Samani needs only daily maximum and minimum temperature plus latitude, which keeps the MVP to four POWER variables and a fully transparent calculation. It is a FAO-56 method, but it ignores humidity, wind and cloudiness, so it can differ from Penman-Monteith in humid or windy periods. Penman-Monteith with more POWER parameters is on the roadmap; we did not test the difference.

**14. Is the composite index validated?**
No. It is an exploratory, transparent index: weights (e.g. water 0.35 for the water priority) and the diversity caps are design choices of this MVP, shown with every result. It supports comparing the three rotations for one farm and is not a probability or a score of success. We would test it with agronomists before suggesting any use in decisions.

**15. What about regions outside Mato Grosso?**
The calendar (soybean 1 Oct, second crop 1 Feb) is for Mato Grosso. Elsewhere in Brazil the app shows a persistent banner that results are illustrative. Outside Brazil it gives no rotation results, only the Climate page, which works anywhere. Other regions need their own calendars and crop data validated with local partners.

**16. Why not use SMAP soil moisture or GPM IMERG?**
Not integrated in this MVP; we used one product well instead of several superficially, and listed them as next steps. SMAP could initialise or check the soil-water balance; IMERG could cross-check rainfall. We also did not review the official 2026 challenge resource list, and say so in our documents.

**17. The weights look arbitrary. Why those?**
They are design choices: three priority profiles (water, soil, resilience) that sum to 1, shown with the index so users can see exactly how the number is made. We make no claim that they are optimal. Changing the priority changes the weights and the index; the five scores underneath stay visible.

**18. If the data are about 50 km wide, why show a map click at farm scale?**
The click chooses the grid cell and the latitude used for the radiation calculation. The app states the area scale on the data panel. The farm information (soil, drainage, sequence) is entered by the farmer and kept separate from NASA data.
