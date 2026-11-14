"use client";

import { useCallback, useEffect, useState } from "react";
import { parseCoordinates } from "@/lib/power";
import type { ApiError, ClimateResponse } from "@/lib/types";

export type ClimateError = ApiError["error"];
type Settled = { status: "data"; data: ClimateResponse } | { status: "error"; error: ClimateError };
export type ClimateState = { status: "idle" } | { status: "loading" } | Settled;

const cache = new Map<string, Promise<ClimateResponse>>();

const NETWORK_ERROR: ClimateError = {
  code: "UPSTREAM_UNAVAILABLE",
  message: "Could not reach the RotaTerra server. Check your connection and try again.",
};

function loadClimate(key: string) {
  const cached = cache.get(key);
  if (cached) return cached;
  const [lat, lon] = key.split(",");
  const promise = fetch(`/api/power?${new URLSearchParams({ lat, lon })}`).then(async (res) => {
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok || body === null) throw (body as ApiError | null)?.error ?? NETWORK_ERROR;
    return body as ClimateResponse;
  });
  cache.set(key, promise);
  promise.catch(() => {
    if (cache.get(key) === promise) cache.delete(key);
  });
  return promise;
}

const toClimateError = (e: unknown): ClimateError =>
  typeof e === "object" && e !== null && "code" in e && "message" in e ? (e as ClimateError) : NETWORK_ERROR;

export function useClimate(lat: number | null, lon: number | null): ClimateState & { retry: () => void } {
  const coords = lat === null || lon === null ? null : parseCoordinates(lat, lon);
  const key = coords ? `${coords.lat},${coords.lon}` : null;
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<{ key: string; attempt: number; result: Settled } | null>(null);

  useEffect(() => {
    if (!key) return;
    let active = true;
    loadClimate(key).then(
      (data) => active && setSettled({ key, attempt, result: { status: "data", data } }),
      (e: unknown) => active && setSettled({ key, attempt, result: { status: "error", error: toClimateError(e) } }),
    );
    return () => {
      active = false;
    };
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  if (!key) return { status: "idle", retry };
  if (!settled || settled.key !== key || settled.attempt !== attempt) return { status: "loading", retry };
  return { ...settled.result, retry };
}
