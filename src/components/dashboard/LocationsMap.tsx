"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

export interface MapLocation {
  id: string;
  name: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
}

interface LocationsMapProps {
  locations: MapLocation[];
  onSelect?: (id: string) => void;
  className?: string;
}

const DEFAULT_SINGLE_PIN_ZOOM = 15;
const MAX_FIT_ZOOM = 16;

const PIN_SVG = `
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13Z" fill="#ea580c" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="9" r="2.5" fill="white"/>
  </svg>
`;

// Full-network overview: every location pinned on one map, each labeled with
// its name so the whole warehouse footprint can be checked at a glance.
export function LocationsMap({ locations, onSelect, className }: LocationsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      mapRef.current?.remove();

      const map = L.map(containerRef.current, { scrollWheelZoom: true });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        html: PIN_SVG,
        className: "",
        iconSize: [26, 26],
        iconAnchor: [13, 26],
      });

      locations.forEach((loc) => {
        const marker = L.marker([loc.latitude, loc.longitude], { icon: pinIcon }).addTo(map);

        // Built as DOM nodes (not HTML strings) so a warehouse name can never
        // be interpreted as markup — Leaflet just appends these as-is.
        const label = document.createElement("span");
        label.textContent = loc.name;
        marker.bindTooltip(label, {
          permanent: true,
          direction: "top",
          offset: [0, -22],
          className: "text-xs font-medium",
        });

        if (loc.subtitle) {
          const popup = document.createElement("div");
          const title = document.createElement("p");
          title.className = "text-sm font-medium";
          title.textContent = loc.name;
          const subtitle = document.createElement("p");
          subtitle.className = "text-xs text-muted-foreground";
          subtitle.textContent = loc.subtitle;
          popup.append(title, subtitle);
          marker.bindPopup(popup);
        }

        if (onSelect) marker.on("click", () => onSelect(loc.id));
      });

      if (locations.length === 1) {
        // fitBounds on a single point has no area to fit, so it falls back to
        // its zoom cap — set a sensible default instead of the deepest zoom.
        map.setView([locations[0].latitude, locations[0].longitude], DEFAULT_SINGLE_PIN_ZOOM);
      } else if (locations.length > 1) {
        // Fit to exactly the area the pins span — no artificial low zoom cap,
        // so a tight cluster of pins zooms in close instead of showing a wide
        // area of empty space around them.
        map.fitBounds(
          L.latLngBounds(locations.map((l) => [l.latitude, l.longitude] as [number, number])),
          { padding: [48, 48], maxZoom: MAX_FIT_ZOOM }
        );
      } else {
        map.setView([20, 0], 2);
      }

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [locations, onSelect]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-[560px] w-full overflow-hidden rounded-xl border border-border"}
    />
  );
}
