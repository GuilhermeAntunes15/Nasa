import snapshot from "../../../../data/power-snapshot.json";
import { buildPowerUrl, parseCoordinates, parsePowerResponse } from "@/lib/power";
import type { ApiError } from "@/lib/types";

export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };

const FAILURES = {
  UPSTREAM_TIMEOUT: { status: 504, message: "NASA POWER did not respond in time. Please try again." },
  UPSTREAM_UNAVAILABLE: { status: 502, message: "NASA POWER is currently unavailable. Please try again later." },
  UPSTREAM_INVALID: { status: 502, message: "NASA POWER returned data that could not be read." },
} as const;

const fail = (code: ApiError["error"]["code"], status: number, message: string) =>
  Response.json({ error: { code, message } } satisfies ApiError, { status, headers: NO_STORE });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = parseCoordinates(searchParams.get("lat"), searchParams.get("lon"));
  if (!coords) {
    return fail("INVALID_COORDINATES", 400, "Latitude must be between -90 and 90 and longitude between -180 and 180.");
  }

  const requestUrl = buildPowerUrl(coords.lat, coords.lon);
  let failure: keyof typeof FAILURES = "UPSTREAM_UNAVAILABLE";
  try {
    const res = await fetch(requestUrl, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(25000) });
    if (res.ok) {
      failure = "UPSTREAM_INVALID";
      const json: unknown = await res.json();
      const date = res.headers.get("date");
      const retrievedAt = (date && !Number.isNaN(Date.parse(date)) ? new Date(date) : new Date()).toISOString();
      return Response.json(parsePowerResponse(json, { requestUrl, retrievedAt, mode: "live" }), {
        headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
      });
    }
  } catch (error) {
    if ((error as Error | undefined)?.name === "TimeoutError") failure = "UPSTREAM_TIMEOUT";
  }

  if (requestUrl === snapshot.requestUrl) {
    const body = parsePowerResponse(snapshot.response, {
      requestUrl: snapshot.requestUrl,
      retrievedAt: snapshot.retrievedAt,
      mode: "snapshot",
    });
    return Response.json(body, { headers: NO_STORE });
  }
  const { status, message } = FAILURES[failure];
  return fail(failure, status, message);
}
