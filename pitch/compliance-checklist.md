# RotaTerra - compliance checklist (NASA Space Apps Challenge 2026)

Only rules known from the project brief are marked as known. Everything else is **TO VERIFY ON THE OFFICIAL SITE**. Do not rely on this file as the rules; read the official pages.

## Known (from the project brief)
| Item | Status | Action |
|---|---|---|
| Event dates: 14-15 Nov 2026 | Known | - |
| Implementation may start only from 14 Nov 2026, 09:00 local time | Known rule. **Risk:** work on this project started on the night of 13 Nov, a decision by the user. | The user must assess the risk and **confirm with the organisers** (local event team) before submitting. Do not hide it. Consider stating the true timeline in the submission if asked. |
| Submission deadline: 15 Nov 2026, 23:59 local time | Known | Submit early; keep a copy of the confirmation. |
| AI use must be disclosed | Known | `ai-disclosure.md`; also in `docs/AI_USAGE.md`, the deck (slide 7) and the submission text. Complete the human review checklist before claiming human review. |
| Use of NASA name and marks | Known (rule exists) | No NASA or Space Apps logos anywhere; "not endorsed by or affiliated with NASA" in README, app footer, deck slide 7. "Data: NASA POWER" credits only the data source. Do not imply NASA endorsement or an award. |
| NASA POWER acknowledgment | Known | Shown on every provenance card with API version and retrieval date; also in README. Re-check the acknowledgment wording at https://power.larc.nasa.gov/docs/referencing/. |
| Assets: rights and attribution | Own policy | Deck uses only real app screenshots and own HTML/CSS. Map: OpenFreeMap / OpenMapTiles / OpenStreetMap attribution is visible in the app (and appears inside screenshots). Fonts via Google Fonts (open licence). No stock photos, no AI images. |

## TO VERIFY ON THE OFFICIAL SITE
- [ ] Exact 2026 project submission form fields and character limits.
- [ ] Required video: whether one is needed, maximum duration, format, hosting (YouTube link or file).
- [ ] Limit on slides or whether slides are submitted at all.
- [ ] Official judging criteria and their weights.
- [ ] Official list of recommended data resources for "Field Shift: Adapting Farms with NASA Data", and whether using only NASA POWER is acceptable.
- [ ] Rules on open-source licence and whether the repository must be public.
- [ ] Team size, registration and eligibility rules; whether the submission must be made on the event's platform by a specific team member.
- [ ] Rules on pre-existing code or work before the event window (see the 13 Nov start above).
- [ ] Whether a local-event pitch format (live demo, time limit) applies.
- [ ] Exact wording required for AI disclosure.
- [ ] Rules for use of NASA names, the Space Apps name and logos in submissions and videos.

## Before submitting
- [ ] Deploy the app; replace `<DEPLOY URL>` in `deck/index.html`, all pitch files, README and docs.
- [ ] Re-run `npm test`, `npm run lint`, `npm run build` on the final code.
- [ ] Re-check numbers on the deployed app against `docs/DEMO_WALKTHROUGH.md`.
- [ ] Complete the human review checklist in `docs/AI_USAGE.md`.
