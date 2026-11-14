import { mkdir, writeFile } from "node:fs/promises";

// Must stay identical to buildPowerUrl(-12.55, -55.72) in src/lib/power.ts (checked by power.test.ts).
const params = new URLSearchParams({
  parameters: "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR",
  community: "AG",
  longitude: "-55.72",
  latitude: "-12.55",
  start: "20150101",
  end: "20251231",
  format: "JSON",
  "time-standard": "LST",
});
const requestUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?${params}`;

const res = await fetch(requestUrl, { signal: AbortSignal.timeout(60000) });
if (!res.ok) {
  console.error(`NASA POWER responded ${res.status}; snapshot not written.`);
  process.exit(1);
}
const response = await res.json();
if (!response?.properties?.parameter?.PRECTOTCORR) {
  console.error("Unexpected NASA POWER payload; snapshot not written.");
  process.exit(1);
}

const date = res.headers.get("date");
const retrievedAt = (date ? new Date(date) : new Date()).toISOString();
await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../data/power-snapshot.json", import.meta.url),
  JSON.stringify({ retrievedAt, requestUrl, response }),
);
console.log(`Snapshot written (${retrievedAt}).`);
