"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

interface LocationPreviewMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

const PIN_SVG = `
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13Z" fill="#ea580c" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="9" r="2.5" fill="white"/>
  </svg>
`;

// Read-only pin drop for a known location — no drag/click editing, unlike
// LocationPickerMap. Uses the same Leaflet + OpenStreetMap setup (no API key).
export function LocationPreviewMap({ latitude, longitude, className }: LocationPreviewMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const pinIcon = L.divIcon({
        html: PIN_SVG,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 14,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.marker([latitude, longitude], { icon: pinIcon }).addTo(map);

      mapRef.current = map;
      // Leaflet measures its container on init; a map mounted inside a
      // just-opened dialog can read a stale (zero) size, so re-measure once
      // the dialog's open/enter transition has settled.
      setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  return <div ref={containerRef} className={className ?? "h-72 w-full overflow-hidden rounded-lg"} />;
}
