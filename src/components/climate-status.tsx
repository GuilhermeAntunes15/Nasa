"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClimate, type ClimateError } from "@/components/use-climate";
import { locationRegion, MIN_SEASONS } from "@/lib/simulate";
import { hasInvalidLocation, serializeState } from "@/lib/state";
import type { ClimateResponse, FarmProfile, Scenario } from "@/lib/types";

const ERROR_TITLES: Record<ClimateError["code"], string> = {
  INVALID_COORDINATES: "These coordinates are not valid.",
  UPSTREAM_TIMEOUT: "NASA POWER did not respond in time.",
  UPSTREAM_UNAVAILABLE: "NASA POWER data could not be loaded.",
  UPSTREAM_INVALID: "NASA POWER returned data that could not be read.",
};

const REGION_BANNER =
  "Crop calendars in this MVP are based on Mato Grosso (Brazil) sowing windows. Results for this location are illustrative only.";

export function InvalidLocationNotice() {
  const params = useSearchParams();
  if (!hasInvalidLocation(params)) return null;
  return (
    <Alert>
      <AlertDescription>
        The latitude/longitude in the link was invalid, so the default location (Sorriso, Mato Grosso) is shown.
      </AlertDescription>
    </Alert>
  );
}

export function ClimateGate({
  lat,
  lon,
  children,
}: {
  lat: number | null;
  lon: number | null;
  children: (data: ClimateResponse) => ReactNode;
}) {
  const climate = useClimate(lat, lon);
  if (climate.status === "idle") return null;
  if (climate.status === "loading") {
    return (
      <div role="status" className="panel flex flex-col gap-3">
        <p className="text-sm font-medium">Retrieving ~4,000 days × 4 variables from NASA POWER…</p>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    );
  }
  if (climate.status === "error") {
    return (
      <Alert variant="destructive">
        <AlertTitle>{ERROR_TITLES[climate.error.code]}</AlertTitle>
        <AlertDescription>
          <p>{climate.error.message}</p>
          <Button variant="outline" className="mt-2 border-destructive" onClick={climate.retry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  const { provenance } = climate.data;
  return (
    <>
      {provenance.mode === "snapshot" && (
        <Alert>
          <AlertTitle>Snapshot data</AlertTitle>
          <AlertDescription>
            Live NASA POWER service unavailable. Showing a NASA POWER snapshot retrieved on{" "}
            {provenance.retrievedAt.slice(0, 10)} for this location.
          </AlertDescription>
        </Alert>
      )}
      {children(climate.data)}
    </>
  );
}

export function RegionGuard({
  farm,
  scenario,
  children,
}: {
  farm: FarmProfile;
  scenario: Scenario;
  children: ReactNode;
}) {
  const region = locationRegion(farm.lat, farm.lon);
  if (region === "outside") {
    return (
      <section aria-labelledby="region-empty" className="panel flex flex-col gap-2 border-dashed">
        <h2 id="region-empty" className="font-heading text-xl font-medium">
          Rotation comparisons are not available for this location
        </h2>
        <p>
          The selected point ({farm.lat}, {farm.lon}) is outside Brazil. The crop calendars in this MVP are based on
          Mato Grosso (Brazil) sowing windows, so RotaTerra only compares rotations for locations in Brazil.
        </p>
        <p>
          Historical NASA POWER climate data works for any location:{" "}
          <Link href={`/climate?${serializeState(farm, scenario)}`} className="font-medium text-forest underline underline-offset-4">
            open the Climate page
          </Link>
          .
        </p>
      </section>
    );
  }
  return (
    <>
      {region === "brazil" && (
        <Alert>
          <AlertTitle>Illustrative results</AlertTitle>
          <AlertDescription>{REGION_BANNER}</AlertDescription>
        </Alert>
      )}
      {children}
    </>
  );
}

export function NotEnoughSeasons() {
  return (
    <section className="panel border-dashed">
      <h2 className="font-heading text-xl font-medium">Not enough complete seasons</h2>
      <p>
        At least {MIN_SEASONS} agricultural seasons with complete NASA POWER data are needed to compare rotations for
        this location.
      </p>
    </section>
  );
}
