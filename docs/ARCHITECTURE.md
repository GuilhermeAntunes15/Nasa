# Architecture

Scope (what is and is not implemented): see the [Implemented / Conceptual table in the README](../README.md#implemented--conceptual-not-implemented).

RotaTerra is a single Next.js 16 (App Router) application written in TypeScript. There is no database and no separate backend: one route handler proxies NASA POWER, and the whole model runs in the browser.

## Data flow

```
Browser (client components)
  │  useClimate(lat, lon)
  │  [cache 1] module-level Map<"lat,lon", Promise>  (rejected promises are removed, so "Try again" refetches)
  ▼
GET /api/power?lat=..&lon=..            src/app/api/power/route.ts (Next.js route handler)
  │  parseCoordinates → invalid → 400 INVALID_COORDINATES (Cache-Control: no-store)
  │  buildPowerUrl(lat, lon)             fixed host, numbers only (no user-controlled URL)
  │  fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(25000) })   [cache 3] Next.js Data Cache
  ▼
NASA POWER Daily API  https://power.larc.nasa.gov/api/temporal/daily/point
  │
  ├─ 2xx and parsable → parsePowerResponse → 200 { provenance (mode "live"), daily }
  │                     Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800   [cache 2] browser / CDN
  │
  └─ any failure (network error, 25 s timeout, non-2xx, unreadable JSON, parse error)
        ├─ request URL identical to data/power-snapshot.json requestUrl (Sorriso, -12.55, -55.72)
        │     → 200 { provenance (mode "snapshot", retrievedAt of the snapshot), daily }, Cache-Control: no-store
        └─ any other point → 504 UPSTREAM_TIMEOUT | 502 UPSTREAM_UNAVAILABLE | 502 UPSTREAM_INVALID (no-store, generic message)

Browser: compareRotations / climate aggregation (src/lib, pure functions) → charts, tables, dialogs
```

Coordinates are rounded to 2 decimals before the request, so nearby clicks share one cache entry. The snapshot is never served for a different point. When it is served, every data page shows "Live NASA POWER service unavailable. Showing a NASA POWER snapshot retrieved on <date> for this location."

In a local production run during development, a repeated request for the same point returned in about 30 ms, which indicates that the Data Cache applies even though the `fetch` also passes an `AbortSignal`. This was not re-checked on Vercel; caches 1 and 2 do not depend on it.

## Modules in `src/lib`

All files are framework-free TypeScript with relative imports and a `*.test.ts` file next to them (except `types.ts`, `crops.ts`, `utils.ts`).

| Module | Responsibility |
|---|---|
| `types.ts` | Shared types: `ClimateDaily`, `Provenance`, `FarmProfile`, `Scenario`, `Crop`, `Rotation`, `IndicatorResult`, `RotationResult`, `DataCategory`, API error codes. |
| `power.ts` | `parseCoordinates` (validation + rounding), `buildPowerUrl` (fixed host and date range), `parsePowerResponse` (hand-written type guards, fill and out-of-range values → `null`, contiguity check, throws `PowerParseError`), `powerAcknowledgment`. |
| `climate.ts` | UTC date helpers, `toMonthly`, `toMonthlyNormals`, `toAnnualPrecip`, `applyScenario`, `agriculturalSeasons` (15 Sep–14 Sep), `seasonDate`, `windowTotals`. |
| `agro.ts` | FAO-56 primitives: `extraterrestrialRadiation`, `hargreavesEto`, `kcOnDay`, `tawMm`, `waterBalanceDay`; `ecocropSuitability`. |
| `crops.ts` | `CITATIONS`, `CROPS` catalogue (every number with citations and assumptions), `CURRENT_SEQUENCES`, `ALT_A`, `ALT_B`, `currentRotation`. |
| `simulate.ts` | `WEIGHTS`, region boxes and `locationRegion`, `MODEL_ASSUMPTIONS`, per-season simulation, aggregation, `diversityScore`, flags, `simulateRotation`, `compareRotations`, `diffResults`. |
| `terrain.ts` | 3D rainfall view geometry: `terrainGrid` (year × month grid, gaps kept as `null`), `clampView`, orthographic `project`, `rainColor`, `terrainScene` (visible faces in painter's order, axis ticks). |
| `state.ts` | `DEFAULT_FARM`, `DEFAULT_SCENARIO`, slider ranges, `parseState` (clamping and enum fallbacks), `serializeState`. |
| `utils.ts` | `cn` class-name helper from shadcn/ui. |

## Components (`src/components`)

| File | Role |
|---|---|
| `use-climate.ts` | Client hook: promise cache per rounded point, `idle / loading / error / data` states, `retry`. |
| `climate-status.tsx` | `ClimateGate` (loading skeleton, error with "Try again", snapshot banner), `RegionGuard`, `NotEnoughSeasons`. |
| `farm-form.tsx`, `farm-map.tsx` | Explore screen: map, coordinate fields, farm profile form, NASA summary. |
| `climate-charts.tsx` | Climate screen: four Recharts charts and the 3D rainfall view. The only module that imports Recharts. |
| `rain-terrain.tsx` | 3D month-by-year rainfall view in plain SVG; no Recharts. |
| `climate-tables.tsx` | Chart series, data tables and window sentences without Recharts; used by the climate screen and by `/summary`, so the summary bundle does not load Recharts. |
| `rotation-comparison.tsx` | Rotations screen: three cards, trade-off wording vs Current, "highest index" label. |
| `why-dialog.tsx` | "Why this result?" dialog, shared labels, limitations list. |
| `scenario-controls.tsx` | Scenario Lab: native range inputs, presets, baseline vs scenario tables, template sentences. |
| `data-badge.tsx` | The five data categories (single constant) and the legend. |
| `provenance-card.tsx` | NASA POWER provenance and acknowledgment. |
| `site-nav.tsx` | Navigation that carries the current query string; Sheet menu on mobile. |

## State in the URL

Each `page.tsx` is a server component that awaits `searchParams`, calls `parseState` and passes `farm` and `scenario` to a client view. Client edits (form fields, map click, sliders, presets) update local React state and call `window.history.replaceState` with `serializeState`, so there is no navigation or server round-trip. `SiteNav` reads the query string (`useSearchParams`, wrapped in `<Suspense>`) and appends it to every link, so the farm and scenario travel between screens and a URL can be shared or bookmarked.

Keys: `lat`, `lon`, `seq`, `soil`, `drain`, `ph`, `irr`, `prio`, `dp`, `dt`. Invalid values fall back to defaults (Sorriso, MT: −12.55, −55.72; soybean → second-crop maize; clayey; well drained; no pH; rain-fed; water priority; no scenario). Scenario values are clamped and snapped to the slider steps.

## Why the simulation runs in the client

- The browser already holds the data the model needs (4018 days × 4 variables) once `/api/power` answers.
- The model is a set of pure, deterministic functions; the same code is unit-tested in Vitest and used by the UI.
- Sliders and form changes recompute immediately, without a request per change.
- The API response is just the data, so it can be cached by the browser and CDN independently of farm settings.
- No server compute or storage is needed beyond the proxy.

## Lean decisions

| Decision | Reason |
|---|---|
| No database | Nothing needs to persist; state lives in the URL. |
| No Python / Pandas | Aggregation is a few hundred lines of TypeScript; the snapshot script is plain Node. |
| No zod | One untrusted payload (NASA POWER) validated by hand-written type guards in `parsePowerResponse`. |
| No state library | URL + local component state cover every screen. |
| No PDF library | "Print / Save as PDF" calls `window.print()` with an `@media print` stylesheet. |
| Snapshot as a JSON import | The route handler imports `data/power-snapshot.json`; it is bundled with the function and needs no file-system access. |
| MapLibre loaded with `import()` inside `useEffect` | Keeps the map out of server rendering and out of other pages. The worker is served from `public/maplibre-gl-worker.mjs` (`setWorkerUrl`) because the bundled worker URL does not survive bundling; recopy it from `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs` when upgrading MapLibre. |
| Recharts isolated in `climate-charts.tsx` | Tables and series live in `climate-tables.tsx`, so `/summary` (tables only) does not load Recharts. |
| 3D rainfall view in plain SVG (orthographic projection + painter's order), no WebGL/three.js | One grid point has 132 monthly values; about 400 polygons need no 3D engine, print as vectors and add no dependency. |
| Cache Components and React Compiler off | Not needed; keeps the App Router behaviour predictable. |
| No Vitest config | `vitest run src` with defaults is enough for pure TypeScript modules. |

## Stack

Next.js 16.4.6, React 19.3, TypeScript 5.9, Tailwind CSS 4.3, shadcn/ui (Base UI), MapLibre GL 6.18.0, Recharts 3.10.1, Lucide icons, Vitest 5.1.0. Exact versions are pinned in `package.json`.
