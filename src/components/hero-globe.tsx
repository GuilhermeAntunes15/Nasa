"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

const SORRISO: [number, number] = [-55.72, -12.55];
const SPEED = 5; // degrees of longitude per second
const RESUME_MS = 1500;

/**
 * Decorative 3D globe for the hero. The server-rendered `children` (SVG illustration) stay underneath as
 * placeholder and fallback; the map fades in over them only once style and tiles are ready.
 */
export function HeroGlobe({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;
    let raf = 0;
    let resume = 0;
    let io: IntersectionObserver | undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    import("maplibre-gl")
      .then((ml) => {
        if (cancelled || !holder.current || !box.current) return;
        ml.setWorkerUrl("/maplibre-gl-worker.mjs");
        const m = (map = new ml.Map({
          container: holder.current,
          style: "https://tiles.openfreemap.org/styles/positron",
          center: SORRISO,
          // Zoom at which the globe fills ~90% of the box.
          zoom: Math.log2((box.current.clientWidth * 1.1 * Math.PI) / 512),
          attributionControl: false,
          // Touch: no map gestures at all, so vertical swipes always scroll the page.
          interactive: !coarse,
          fadeDuration: 0,
          canvasContextAttributes: { antialias: true },
        }));
        if (!coarse) {
          m.scrollZoom.disable();
          m.doubleClickZoom.disable();
          m.keyboard.disable();
          m.dragRotate.disable();
          m.touchZoomRotate.disable();
        }
        m.getCanvas().removeAttribute("tabindex");
        // maplibre sets touch-action: pinch-zoom here, which would block vertical page scroll on touch laptops.
        m.getCanvas().style.setProperty("touch-action", "pan-y", "important");

        m.on("style.load", () => {
          m.setProjection({ type: "globe" });
          m.setSky({
            "sky-color": "#081b2c",
            "horizon-color": "#5ea8d1",
            "fog-color": "#a8c9b3",
            "sky-horizon-blend": 0.5,
            "atmosphere-blend": 1,
          });
          for (const l of m.getStyle().layers) {
            if (l.id === "background") m.setPaintProperty(l.id, "background-color", "#2c6b57");
            else if (l.id === "water") m.setPaintProperty(l.id, "fill-color", "#0a2438");
            else if (l.id === "boundary_2") {
              m.setPaintProperty(l.id, "line-color", "#a8c9b3");
              m.setPaintProperty(l.id, "line-opacity", 0.35);
            } else m.setLayoutProperty(l.id, "visibility", "none");
          }
        });

        // Only show the map once everything visible is drawn; any style/tile error keeps the SVG fallback.
        let paused = true;
        let failed = false;
        m.on("error", () => (failed = true));
        m.once("idle", () => {
          if (cancelled || failed) return;
          paused = false; // start turning only once visible, so Brazil is still centred at reveal
          setReady(true);
        });

        const pin = document.createElement("div");
        pin.className = "hero-pin";
        new ml.Marker({ element: pin }).setLngLat(SORRISO).addTo(m);

        let visible = true;
        let last = performance.now();
        const tick = (now: number) => {
          const dt = Math.min(now - last, 100) / 1000;
          last = now;
          if (!paused && visible && !reduce.matches) {
            const c = m.getCenter();
            m.setCenter([c.lng + dt * SPEED, c.lat]);
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        const hold = () => {
          paused = true;
          clearTimeout(resume);
        };
        const release = () => {
          clearTimeout(resume);
          resume = window.setTimeout(() => (paused = false), RESUME_MS);
        };
        const el = box.current;
        el.addEventListener("pointerenter", hold);
        el.addEventListener("pointerleave", release);
        m.on("dragstart", hold);
        m.on("dragend", release);
        io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
        io.observe(el);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(resume);
      io?.disconnect();
      map?.remove();
    };
  }, []);

  return (
    <figure className="mx-auto flex w-full max-w-md flex-col gap-2 lg:max-w-none" role="img" aria-label="Decorative 3D globe centred on Brazil.">
      <div ref={box} className="hero-globe relative aspect-square w-full">
        <div
          className="absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none"
          style={{ opacity: ready ? 0 : 1 }}
          aria-hidden="true"
        >
          {children}
        </div>
        <div
          className="absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none"
          style={{ opacity: ready ? 1 : 0 }}
          aria-hidden="true"
        >
          <div ref={holder} className="size-full" />
        </div>
      </div>
      <figcaption className="text-center text-xs text-muted-foreground">
        Demo location: Sorriso, Mato Grosso, Brazil
      </figcaption>
    </figure>
  );
}
