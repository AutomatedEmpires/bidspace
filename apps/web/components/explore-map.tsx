"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { formatMoney } from "@bidspace/core";
import { Icon, buttonClasses, cn } from "@bidspace/ui";

interface ViewportUnit {
  id: string;
  opportunityId: string;
  name: string;
  type: string;
  status: string;
  minimumBidCents: number | null;
  longitude: number;
  latitude: number;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Spokane — the launch region — as the initial camera.
const INITIAL = { lng: -117.426, lat: 47.658, zoom: 11 };

const TYPE_LABEL: Record<string, string> = {
  vendor_space: "Vendor space",
  sponsor_asset: "Sponsor placement",
  service_slot: "Service slot",
  advertising_placement: "Advertising",
  temporary_real_estate: "Temporary space",
};

export function ExploreMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [units, setUnits] = useState<ViewportUnit[]>([]);
  const [selected, setSelected] = useState<ViewportUnit | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchViewport = useCallback(async (map: mapboxgl.Map) => {
    const bounds = map.getBounds();
    if (!bounds) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        minLng: String(bounds.getWest()),
        minLat: String(bounds.getSouth()),
        maxLng: String(bounds.getEast()),
        maxLat: String(bounds.getNorth()),
      });
      const res = await fetch(`/api/discovery/viewport?${qs}`);
      if (!res.ok) return;
      const data = (await res.json()) as { units?: ViewportUnit[] };
      setUnits(data.units ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [INITIAL.lng, INITIAL.lat],
      zoom: INITIAL.zoom,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleFetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void fetchViewport(map), 350);
    };
    map.on("load", scheduleFetch);
    map.on("moveend", scheduleFetch);

    return () => {
      if (timer) clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
  }, [fetchViewport]);

  // Sync markers with results.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const marker of markersRef.current) marker.remove();
    markersRef.current = units.map((unit) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", unit.name);
      el.className =
        "bs-marker rounded-[3px] border border-[#16181d] bg-[#f6f4ee] px-1.5 py-0.5 text-[11px] font-semibold text-[#16181d] shadow-sm cursor-pointer";
      el.textContent =
        unit.minimumBidCents != null ? formatMoney(unit.minimumBidCents).replace(/\.00$/, "") : "Open";
      el.addEventListener("click", () => setSelected(unit));
      return new mapboxgl.Marker({ element: el })
        .setLngLat([unit.longitude, unit.latitude])
        .addTo(map);
    });
  }, [units]);

  if (!TOKEN) {
    return (
      <div className="plan-grid flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <Icon name="map" size={36} className="text-ink-faint dark:text-canvas-faint" />
        <div className="max-w-md">
          <h2 className="font-display text-xl font-semibold">Map view needs a Mapbox token</h2>
          <p className="mt-2 text-sm text-ink-muted dark:text-canvas-muted">
            Set <code className="rounded bg-ink/[0.06] px-1 dark:bg-canvas/10">NEXT_PUBLIC_MAPBOX_TOKEN</code>{" "}
            to enable spatial discovery. Every opportunity remains fully accessible in the list.
          </p>
        </div>
        <Link href="/explore" className={buttonClasses("primary", "sm")}>
          Browse the list instead
        </Link>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Results rail / bottom sheet */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 sm:inset-y-0 sm:right-auto sm:w-[340px] sm:p-4">
        <div className="pointer-events-auto max-h-[38dvh] overflow-y-auto rounded-[4px] border border-line bg-surface/95 backdrop-blur-sm dark:bg-surface-dark/95 sm:max-h-full">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">
              {loading ? "Searching this area…" : `${units.length} position${units.length === 1 ? "" : "s"} in view`}
            </p>
            <Link href="/explore" className="text-xs font-semibold text-signal-deep hover:underline dark:text-signal-bright">
              List view
            </Link>
          </div>
          {units.length === 0 && !loading ? (
            <p className="px-4 py-6 text-sm text-ink-muted dark:text-canvas-muted">
              No open positions in this area yet. Pan the map or zoom out — supply is added as
              hosts publish.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {units.map((unit) => (
                <li key={unit.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(unit);
                      mapRef.current?.flyTo({ center: [unit.longitude, unit.latitude], zoom: 14 });
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-ink/[0.04] dark:hover:bg-canvas/[0.06]",
                      selected?.id === unit.id && "bg-signal/[0.07]",
                    )}
                  >
                    <span>
                      <span className="block font-medium">{unit.name}</span>
                      <span className="block text-xs text-ink-muted dark:text-canvas-muted">
                        {TYPE_LABEL[unit.type] ?? unit.type}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {unit.minimumBidCents != null ? formatMoney(unit.minimumBidCents) : "Open"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Selected unit action card */}
      {selected ? (
        <div className="absolute left-1/2 top-3 z-20 w-[min(92%,380px)] -translate-x-1/2 rounded-[4px] border border-strong bg-surface p-4 shadow-lg dark:bg-surface-dark">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display font-semibold leading-tight">{selected.name}</p>
              <p className="mt-0.5 text-xs text-ink-muted dark:text-canvas-muted">
                {TYPE_LABEL[selected.type] ?? selected.type}
                {selected.minimumBidCents != null
                  ? ` · from ${formatMoney(selected.minimumBidCents)}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelected(null)}
              className="text-ink-muted hover:text-ink dark:text-canvas-muted dark:hover:text-canvas"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <Link
            href={`/units/${selected.id}`}
            className={buttonClasses("signal", "sm", "mt-3 w-full")}
          >
            View position &amp; bid
          </Link>
        </div>
      ) : null}
    </div>
  );
}
