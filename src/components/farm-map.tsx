"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";

export function FarmMap({
  lat,
  lon,
  onPick,
}: {
  lat: number;
  lon: number;
  onPick: (lat: number, lon: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const marker = useRef<Marker | null>(null);
  const [failed, setFailed] = useState(false);
  const initialCenter = useEffectEvent((): [number, number] => [lon, lat]);
  const pick = useEffectEvent((la: number, lo: number) => onPick(la, lo));

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;
    import("maplibre-gl")
      .then((ml) => {
        if (cancelled || !container.current) return;
        // The bundled worker URL is derived from import.meta.url, which does not survive bundling.
        ml.setWorkerUrl("/maplibre-gl-worker.mjs");
        const center = initialCenter();
        map = new ml.Map({
          container: container.current,
          style: "https://tiles.openfreemap.org/styles/positron",
          center,
          zoom: 4,
          attributionControl: { compact: false },
        });
        map.addControl(new ml.NavigationControl({ showCompass: false }));
        const pin = document.createElement("div");
        pin.className = "farm-marker";
        marker.current = new ml.Marker({ element: pin }).setLngLat(center).addTo(map);
        map.on("click", (e) => pick(e.lngLat.lat, e.lngLat.lng));
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      map?.remove();
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    marker.current?.setLngLat([lon, lat]);
  }, [lat, lon]);

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={container}
        role="region"
        aria-label="Map. Click to choose your farm location, or type latitude and longitude in the fields below."
        className="h-72 w-full overflow-hidden rounded-xl border bg-muted shadow-sm md:h-[26rem]"
      />
      {failed && (
        <p role="status" className="rounded-lg border border-destructive px-3 py-2 text-sm text-destructive">
          The map could not be loaded. Use the latitude and longitude fields instead.
        </p>
      )}
      <p className="text-xs text-muted-foreground">Map tiles: OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors</p>
    </div>
  );
}
