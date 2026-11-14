# RotaTerra - AI use disclosure

Aligned with `docs/AI_USAGE.md`. Exact disclosure format required by the 2026 event: **TO VERIFY ON THE OFFICIAL SITE**.

## Short statement (for forms and the last slide)
RotaTerra was built with AI agents (Claude Code, Anthropic) under human direction. The agents planned, coded, tested, designed, reviewed and documented the project. No AI-generated data or images are used, and no generative AI runs inside the product.

## Details
**Tools:** Claude Code (Anthropic), used as a pipeline of agents: planner, plan critic, coder, design and QA. The pitch package (deck, scripts, Q&A, documents) was also drafted by an AI agent from the project's documents, screenshots and numbers.

**What AI did**
- Planning and source research (unverified items marked as such in the plan).
- All application code, unit tests (53) and implementation of the model formulas.
- Visual design, the landing illustration (hand-coded SVG) and the screenshots taken with Playwright.
- Code review and QA checks.
- The repository documentation and this pitch package, including the HTML deck and the diagrams in it.

**What AI did not do**
- No AI-generated data: all climate data are real NASA POWER responses (live or the stored snapshot). Synthetic series exist only in unit tests.
- No AI-generated images: the deck uses real screenshots of the app and HTML/CSS diagrams.
- No generative AI at runtime: the app calls no AI service; all explanations are deterministic templates filled with computed numbers.
- No NASA or Space Apps logos.

**Human role:** a human directed the work, set the scope and made decisions (for example, the choice of event, challenge and timing). The human review checklist in `docs/AI_USAGE.md` (verification of event rules, citations, agronomic plausibility, device testing, approval of texts) is **not yet completed**; do not state that a human reviewed the content until it is done. Fill in names and dates there, then update this file.

**Voice for the video:** not decided. If a synthetic voice is used, add it here.
