"use client";

import Link from "next/link";
import { useState } from "react";
import { ClimateGate } from "@/components/climate-status";
import { DataBadge } from "@/components/data-badge";
import { FarmMap } from "@/components/farm-map";
import { ProvenanceCard } from "@/components/provenance-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRIORITY_LABELS } from "@/components/why-dialog";
import { toAnnualPrecip, toMonthly, toMonthlyNormals } from "@/lib/climate";
import { CURRENT_SEQUENCES } from "@/lib/crops";
import { parseCoordinates } from "@/lib/power";
import { PH_RANGE, serializeState } from "@/lib/state";
import type { ClimateResponse, CurrentSequenceId, Drainage, FarmProfile, Priority, Scenario, SoilTexture } from "@/lib/types";

export const SOIL_LABELS: Record<SoilTexture, string> = { sandy: "Sandy", loamy: "Loamy", clayey: "Clayey" };
export const DRAINAGE_LABELS: Record<Drainage, string> = {
  well: "Well drained",
  moderate: "Moderately drained",
  poor: "Poorly drained",
};

const fieldClass = "h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/30";
const radioClass = "size-4 accent-forest";
const labelClass = "text-sm font-semibold";
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function NasaSummary({ data }: { data: ClimateResponse }) {
  const annual = toAnnualPrecip(data.daily).flatMap((a) => (a.precipMm === null ? [] : [a.precipMm]));
  const t2m = toMonthlyNormals(toMonthly(data.daily)).flatMap((n) => (n.t2mMean === null ? [] : [n.t2mMean]));
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-muted p-3">
          <dt className="text-xs font-semibold">Mean annual rainfall</dt>
          <dd className="font-heading text-xl">
            {annual.length ? `${mean(annual).toFixed(0)} mm/yr` : "Not available"}
            {annual.length > 0 && <span className="block font-sans text-xs text-muted-foreground">{annual.length} complete years</span>}
          </dd>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <dt className="text-xs font-semibold">Mean air temperature (T2M)</dt>
          <dd className="font-heading text-xl">{t2m.length === 12 ? `${mean(t2m).toFixed(1)} °C` : "Not available"}</dd>
        </div>
      </dl>
      <ProvenanceCard provenance={data.provenance} />
    </div>
  );
}

export function FarmForm({ farm: initialFarm, scenario }: { farm: FarmProfile; scenario: Scenario }) {
  const [farm, setFarm] = useState(initialFarm);
  const [latText, setLatText] = useState(String(initialFarm.lat));
  const [lonText, setLonText] = useState(String(initialFarm.lon));
  const [phText, setPhText] = useState(initialFarm.soilPh === null ? "" : String(initialFarm.soilPh));
  const [loaded, setLoaded] = useState<{ lat: number; lon: number } | null>(null);

  const latInvalid = parseCoordinates(latText, 0) === null;
  const lonInvalid = parseCoordinates(0, lonText) === null;
  const ph = phText.trim() === "" ? null : Number(phText);
  const phInvalid = ph !== null && !(Number.isFinite(ph) && ph >= PH_RANGE.min && ph <= PH_RANGE.max);
  const query = serializeState(farm, scenario);

  const update = (patch: Partial<FarmProfile>) => {
    const next = { ...farm, ...patch };
    setFarm(next);
    window.history.replaceState(null, "", `?${serializeState(next, scenario)}`);
  };

  const setCoordinate = (axis: "lat" | "lon", text: string) => {
    const nextLat = axis === "lat" ? text : latText;
    const nextLon = axis === "lon" ? text : lonText;
    if (axis === "lat") setLatText(text);
    else setLonText(text);
    const coords = parseCoordinates(nextLat, nextLon);
    if (coords) update(coords);
  };

  const pickOnMap = (lat: number, lon: number) => {
    const coords = parseCoordinates(lat, lon);
    if (!coords) return;
    setLatText(String(coords.lat));
    setLonText(String(coords.lon));
    update(coords);
    setLoaded(coords);
  };

  const setPh = (text: string) => {
    setPhText(text);
    const value = text.trim() === "" ? null : Number(text);
    if (value === null) update({ soilPh: null });
    else if (Number.isFinite(value) && value >= PH_RANGE.min && value <= PH_RANGE.max) {
      update({ soilPh: Math.round(value * 10) / 10 });
    }
  };

  const loadData = (event: React.FormEvent) => {
    event.preventDefault();
    const coords = parseCoordinates(latText, lonText);
    if (coords) setLoaded(coords);
  };

  const stale = loaded !== null && (loaded.lat !== farm.lat || loaded.lon !== farm.lon);

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-medium md:text-5xl">Explore your farm</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Choose a location and describe your farm. NASA POWER data and your own information are kept separate.
        </p>
      </header>

      <section aria-labelledby="location-title" className="flex flex-col gap-4">
        <h2 id="location-title" className="text-2xl font-medium">
          Location
        </h2>
        <FarmMap lat={farm.lat} lon={farm.lon} onPick={pickOnMap} />
        <form onSubmit={loadData} noValidate className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
          <div className="flex flex-col gap-1">
            <label htmlFor="lat" className={labelClass}>
              Latitude (−90 to 90)
            </label>
            <Input
              id="lat"
              inputMode="decimal"
              value={latText}
              onChange={(e) => setCoordinate("lat", e.target.value)}
              aria-invalid={latInvalid}
              aria-describedby={latInvalid ? "lat-error" : undefined}
            />
            {latInvalid && (
              <p id="lat-error" className="text-sm text-destructive">
                Enter a latitude between −90 and 90.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="lon" className={labelClass}>
              Longitude (−180 to 180)
            </label>
            <Input
              id="lon"
              inputMode="decimal"
              value={lonText}
              onChange={(e) => setCoordinate("lon", e.target.value)}
              aria-invalid={lonInvalid}
              aria-describedby={lonInvalid ? "lon-error" : undefined}
            />
            {lonInvalid && (
              <p id="lon-error" className="text-sm text-destructive">
                Enter a longitude between −180 and 180.
              </p>
            )}
          </div>
          <Button type="submit" disabled={latInvalid || lonInvalid} className="sm:mt-6">
            Load NASA climate data
          </Button>
        </form>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="nasa-title" className="panel flex flex-col gap-3 border-t-4 border-t-navy">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="nasa-title" className="text-2xl font-medium">
              From NASA POWER
            </h2>
            <DataBadge category="nasa" />
          </div>
          <p className="text-sm text-muted-foreground">
            Daily rainfall and temperature, 2015–2025, for the grid cell around your point (~50 km). Not measured at
            your farm.
          </p>
          {!loaded && <p className="rounded-lg border border-dashed border-navy/40 bg-muted/60 p-3 text-sm">Click &ldquo;Load NASA climate data&rdquo; or a point on the map to retrieve the data.</p>}
          {stale && <p role="status" className="rounded-lg border border-forest bg-accent p-3 text-sm">The location changed. Load NASA climate data again for the new point.</p>}
          <ClimateGate lat={loaded?.lat ?? null} lon={loaded?.lon ?? null}>
            {(data) => <NasaSummary data={data} />}
          </ClimateGate>
        </section>

        <section aria-labelledby="farmer-title" className="panel flex flex-col gap-4 border-t-4 border-t-forest">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="farmer-title" className="text-2xl font-medium">
              From you
            </h2>
            <DataBadge category="farmer" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="seq" className={labelClass}>
              Current crop sequence
            </label>
            <select
              id="seq"
              className={fieldClass}
              value={farm.currentSequence}
              onChange={(e) => update({ currentSequence: e.target.value as CurrentSequenceId })}
            >
              {(Object.keys(CURRENT_SEQUENCES) as CurrentSequenceId[]).map((id) => (
                <option key={id} value={id}>
                  {CURRENT_SEQUENCES[id].label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="soil" className={labelClass}>
                Soil texture
              </label>
              <select
                id="soil"
                className={fieldClass}
                value={farm.soilTexture}
                onChange={(e) => update({ soilTexture: e.target.value as SoilTexture })}
              >
                {(Object.keys(SOIL_LABELS) as SoilTexture[]).map((id) => (
                  <option key={id} value={id}>
                    {SOIL_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="drain" className={labelClass}>
                Drainage
              </label>
              <select
                id="drain"
                className={fieldClass}
                value={farm.drainage}
                onChange={(e) => update({ drainage: e.target.value as Drainage })}
              >
                {(Object.keys(DRAINAGE_LABELS) as Drainage[]).map((id) => (
                  <option key={id} value={id}>
                    {DRAINAGE_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="ph" className={labelClass}>
              Soil pH (optional, {PH_RANGE.min}–{PH_RANGE.max})
            </label>
            <Input
              id="ph"
              type="number"
              step="0.1"
              min={PH_RANGE.min}
              max={PH_RANGE.max}
              value={phText}
              onChange={(e) => setPh(e.target.value)}
              aria-invalid={phInvalid}
              aria-describedby={phInvalid ? "ph-error" : undefined}
            />
            {phInvalid && (
              <p id="ph-error" className="text-sm text-destructive">
                Enter a pH between {PH_RANGE.min} and {PH_RANGE.max}, or leave it empty.
              </p>
            )}
          </div>
          <fieldset className="flex flex-col gap-1">
            <legend className={labelClass}>Irrigation availability</legend>
            {[
              { value: false, label: "Rain-fed (no irrigation)" },
              { value: true, label: "Irrigation available" },
            ].map((o) => (
              <label key={o.label} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  className={radioClass}
                  name="irr"
                  checked={farm.irrigation === o.value}
                  onChange={() => update({ irrigation: o.value })}
                />
                {o.label}
              </label>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-1">
            <legend className={labelClass}>Main priority</legend>
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  className={radioClass}
                  name="prio"
                  checked={farm.priority === id}
                  onChange={() => update({ priority: id })}
                />
                {PRIORITY_LABELS[id]}
              </label>
            ))}
          </fieldset>
        </section>
      </div>

      <nav aria-label="Next steps" className="flex flex-wrap gap-3">
        <Link href={`/climate?${query}`} className={buttonVariants({ variant: "outline", size: "lg" })}>
          View climate charts
        </Link>
        <Link href={`/simulator?${query}`} className={buttonVariants({ size: "lg" })}>
          Compare rotations
        </Link>
      </nav>
    </>
  );
}
