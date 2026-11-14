# RotaTerra - 30-second video: script and storyboard

Total length: 30 s maximum. Narration: 67 words (about 2.3 words per second; leave small pauses at the cuts). All screens below exist in the app. Record at 1920x1080 on the default farm (Sorriso, -12.55 / -55.72) with live data loaded; use the stored snapshot only if the live call fails, and say nothing that implies it was live.
Required formats or duration limits for the 2026 submission video: **TO VERIFY ON THE OFFICIAL SITE**.

Style: navy #081B2C and cream #F5F4ED title cards, Fraunces/IBM Plex Sans text, sky #5EA8D1 highlight rings. No music with unclear licence; no stock footage; no AI-generated imagery; no NASA or Space Apps logo.

| Time | Scene | Visual | Capture | Narration (English) | On-screen text |
|---|---|---|---|---|---|
| 0-5 s | 1. The problem | Climate page, "Annual rainfall" chart; slow zoom into the tallest bar (2018) and the shortest (2015). | Screen recording of `/climate`, or a still from `docs/screenshots/climate-desktop.png` with a slow pan. | "One farm. Some years bring six hundred millimeters of rain. Others bring almost two thousand." (15 words) | "645 mm in 2015. 1,903 mm in 2018." |
| 5-10 s | 2. NASA data as the base | Explore page: click "Load NASA climate data"; provenance card appears (endpoint, 2015-2025, MERRA2). | Screen recording of `/explore` (about 4 s of action), then highlight ring on "NASA POWER Daily API" and "2015-01-01 to 2025-12-31". | "NASA POWER gives eleven years of daily rain and temperature for any point on Earth." (15 words) | "NASA POWER data, 2015-2025. Estimate of the area (~50 km), not measured at the farm." |
| 10-20 s | 3. The real platform | Rotations page: three cards; slow scroll over indicators; then open "Why this result?" on Alternative B for 2 s. | Screen recording of `/simulator` then the dialog. | "RotaTerra runs a documented water balance for three rotations, and shows the reason behind every number." (17 words) | "3 rotations. 5 indicators. Every number traceable." Caption: "Exploratory index, not a yield forecast." |
| 20-26 s | 4. Comparison and scenario | Scenario Lab: click "-20% rainfall (demo)"; numbers update (Current exposure 6.7% -> 9.5%; index 82 -> 81). | Screen recording of `/scenarios`, highlight the sentence on the Current card. | "Then test a hypothetical scenario, like twenty percent less rain, and see what changes." (14 words) | "Hypothetical scenario - not a forecast." "6.7% -> 9.5% water-demand exposure (Current)." |
| 26-30 s | 5. Impact and identity | Navy end card with the RotaTerra name and tagline; small line of credits. | Animation (typography only). | "RotaTerra. Explore what to plant next." (6 words) | "RotaTerra - Smarter crop rotations. Stronger farms." / "Data: NASA POWER. Independent project, not endorsed by NASA." |

Narration total: 15 + 15 + 17 + 14 + 6 = 67 words (about 28 s at a clear pace; the last 2 s are the end card).

## Recording checklist
- Use the URLs from `demo-script.md` so the farm and scenario are exactly as described.
- Hide the browser chrome; keep the cursor visible and slow. Cut dead time while data loads (live call can take several seconds).
- Do not show any chart or screen that is not in the app. No yield, profit or "water saved" captions.
- Scene 5 must not suggest NASA endorsement.
- Voice: a human recording or a text-to-speech voice with a clear international accent; if a synthetic voice is used, disclose it in `ai-disclosure.md` (not decided yet).
