# AI usage

Scope of the product: see the [Implemented / Conceptual table in the README](../README.md#implemented--conceptual-not-implemented).

The NASA Space Apps Challenge allows AI tools as long as teams state where and how they were used. This document does that.

## Tools

- **Claude Code** (Anthropic), used as a set of AI agents under human direction in a fixed pipeline:
  - **Planner agent**: researched the event rules, the NASA POWER API, FAO-56, FAO-66/FAO-33, ECOCROP and Mato Grosso crop calendars, and wrote the technical plan.
  - **Plan-critic agent**: reviewed the plan against the sources, recomputed the expected test values and added amendments (for example independent seasons, the aggregation rule, region guard and wording rules).
  - **Coder agent**: scaffolded the project and wrote the TypeScript model, the API route, the snapshot script, the unit tests, the screens' logic and this documentation.
  - **Design agent**: wrote the visual layer (colour tokens, layout, responsive navigation, landing illustration in SVG/CSS, print styles) and took the screenshots in `docs/screenshots/` with Playwright.
  - **QA agent**: runs lint, tests and build, checks acceptance criteria and scans for unsupported claims and non-English content.

## What AI did

- Planning and source research (results recorded in the plan, with unverified items marked as such).
- All application code, unit tests and the model formulas' implementation.
- Visual design and screenshots.
- Code review and QA checks.
- The documentation in this repository, including the submission text draft.

## What AI did not do

- **No AI-generated data.** All climate data are real NASA POWER responses retrieved from `power.larc.nasa.gov` (live or the stored snapshot). Synthetic series exist only inside unit tests.
- **No AI-generated images.** The landing illustration is hand-coded SVG; the screenshots are captures of the running app.
- **No NASA or Space Apps logos** are used anywhere.
- **No generative AI at runtime.** The app calls no AI service. Every explanation ("Why this result?", scenario sentences, summary text) is a deterministic template filled with numbers computed by the model.

## Human review

To be completed by the team: human review items.

- [ ] Event rules, submission requirements and timing checked on the official Space Apps site.
- [ ] Official challenge resource list compared with [NASA_DATA_SOURCES](NASA_DATA_SOURCES.md).
- [ ] Crop parameters and citations in [METHODOLOGY](METHODOLOGY.md) checked against the FAO and ECOCROP sources.
- [ ] Model results reviewed for agronomic plausibility (ideally with an agronomist).
- [ ] Application tested by a person on desktop and mobile.
- [ ] Documentation and submission text read and approved.
- [ ] Names of the people who did each review added here.
