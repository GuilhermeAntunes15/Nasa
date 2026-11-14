# RotaTerra - sources

Status key. **Cited in project docs** = the citation (author, year, title, URL/DOI) appears in `docs/METHODOLOGY.md` / `src/lib/crops.ts` and was used by the project's agents during research. **Not independently re-checked** = in this pitch task, the URLs and page-level values were not re-opened. No source below was verified by a human against the original publication (see `docs/AI_USAGE.md` human review checklist, still empty).

## NASA data and acknowledgment
| Source | Used for | Status |
|---|---|---|
| NASA POWER Daily API, https://power.larc.nasa.gov/docs/services/api/temporal/daily/ | The only NASA dataset integrated: T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, community AG, 2015-01-01 to 2025-12-31. API v2.10.3, upstream sources MERRA2 and POWER (read from the real response header stored in `data/power-snapshot.json`). | Response and header inspected in the project (snapshot, tests). Docs URL cited in project docs. |
| NASA POWER referencing guidance, https://power.larc.nasa.gov/docs/referencing/ | Acknowledgment wording shown in every provenance card. | Cited in project docs; wording implemented in `powerAcknowledgment`. |

## Scientific methods and crop parameters
| Source | Used for | Status |
|---|---|---|
| Allen, R.G., Pereira, L.S., Raes, D. & Smith, M. (1998). Crop evapotranspiration. FAO Irrigation and Drainage Paper 56. https://www.fao.org/4/x0490e/x0490e00.htm | Ra, Hargreaves-Samani ETo (eq. 52), Kc curves, soil-water balance, Ks (eqs. 82-85), Tables 11, 12, 19, 22 | Cited in project docs; equations checked by 53 unit tests against independently computed values. Tables not re-checked here. |
| Smith, M. & Steduto, P. (2012). Yield response to water: the original FAO water production function. FAO Paper 66, ch. 2. https://www.fao.org/4/i2800e/i2800e02.pdf | Seasonal Ky values (from FAO-33) | Cited in project docs. Not re-checked here. |
| Doorenbos, J. & Kassam, A.H. (1979). Yield response to water. FAO Paper 33 | Ky (as reproduced in FAO-66) | Cited as reproduced in FAO-66; original not consulted. |
| FAO ECOCROP data sheets: 1150 (soybean), 2175 (maize), 48747 (sorghum), 8418 (pearl millet), 543 (ruzigrass); https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=<id> | Temperature, pH and drainage ranges | Cited in project docs. Not re-checked here. |
| Ramirez-Villegas, J., Jarvis, A. & Laderach, P. (2013). Agricultural and Forest Meteorology 170, 67-78. https://doi.org/10.1016/j.agrformet.2011.09.005 | EcoCrop approach adapted for the temperature indicator | Cited in project docs. Not re-checked here. |

## Mato Grosso calendar and practice
| Source | Used for | Status |
|---|---|---|
| CNA (2026). Soybean calendar in Mato Grosso keeps the sanitary break from June to September for 2026. https://cnabrasil.org.br/noticias/calendario-da-soja-em-mt-mantem-vazio-sanitario-de-junho-a-setembro-para-2026 | Soybean sowing window 7 Sep 2026 - 7 Jan 2027 | Cited in project docs. Not re-checked here. |
| Borghi, E., Magalhaes, P.C. & Pereira Filho, I.A. (2023). Ecophysiology of second-crop maize for high yield. Embrapa Documentos 273. | Second-crop sowing window | Cited in project docs (URL in METHODOLOGY). Not re-checked here. |
| Broch, D.L. & Ceccon, G. (2008). Second-crop maize production with crop-livestock integration. Embrapa. | Santa Fe system (maize + ruzigrass) | Cited in project docs (URL in METHODOLOGY). Not re-checked here. |

## Map
- OpenFreeMap, https://openfreemap.org/; (c) OpenMapTiles; (c) OpenStreetMap contributors. Shown in the app footer and map caption.

## Facts used in the pitch and where they come from
- All RotaTerra numbers (82/91/91, 6.7% -> 9.5%, 1300 mm, 26.3 C, 645 mm, 1,903 mm, 640/415 mm, 581/261 mm): outputs of the app; `docs/DEMO_WALKTHROUGH.md`.
- "About 50 km": wording used in the app; **not checked** against POWER documentation (the project's own docs flag this).

## NOT verified (do not cite as fact in the pitch)
- The official 2026 challenge page and its list of recommended data resources (not read during planning).
- Native resolution of POWER precipitation and the details of the PRECTOTCORR bias correction.
- Any statement about agricultural impact, yield, or farmers' needs beyond the general framing; no field data, interviews or published statistics are cited in the pitch. (Slide 1 uses only the app's own rainfall numbers.)
- Statements about previous Space Apps winners (none made).
