"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker as LeafletMarker, Polyline as LeafletPolyline } from "leaflet";

interface TrackingPoint {
  lat: number;
  lng: number;
  label: string;
}

interface TrackingMapProps {
  origin: TrackingPoint;
  destination: TrackingPoint;
  dronePosition: { lat: number; lng: number };
  headingDegrees?: number;
  className?: string;
}

const PIN_SVG = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="3" stroke="white" stroke-width="2.5"/></svg>`;

const DRONE_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 9 4 4M15 9l5-5M9 15l-5 5M15 15l5 5"/><circle cx="4" cy="4" r="1.6"/><circle cx="20" cy="4" r="1.6"/><circle cx="4" cy="20" r="1.6"/><circle cx="20" cy="20" r="1.6"/></svg>`;

function pinHtml(label: string, bg: string) {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#1f2937;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25));transform:translate(-50%,-100%);width:max-content;">
    <span style="display:flex;height:20px;width:20px;align-items:center;justify-content:center;border-radius:9999px;background:${bg};box-shadow:0 0 0 4px ${bg}33;">${PIN_SVG}</span>
    <span style="white-space:nowrap;border-radius:4px;background:rgba(255,255,255,.85);padding:1px 4px;">${label}</span>
  </div>`;
}

function droneHtml(headingDegrees: number) {
  return `<div style="display:flex;height:32px;width:32px;align-items:center;justify-content:center;border-radius:9999px;background:#1f2937;box-shadow:0 4px 10px rgba(0,0,0,.3),0 0 0 4px rgba(255,255,255,.7);transform:translate(-50%,-50%) rotate(${headingDegrees}deg);">${DRONE_SVG}</div>`;
}

// Live drone-delivery tracking map — origin (warehouse), destination
// (delivery address), a planned-route line, the flown-so-far segment, and an
// animated drone marker. Same imperative Leaflet pattern as
// LocationPreviewMap, extended to update the drone's position/heading in
// place (setLatLng) each tick instead of remounting the whole map.
export function TrackingMap({
  origin,
  destination,
  dronePosition,
  headingDegrees = 0,
  className,
}: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const droneMarkerRef = useRef<LeafletMarker | null>(null);
  const flownLineRef = useRef<LeafletPolyline | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      map.fitBounds(
        [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ],
        { padding: [56, 56] },
      );

      L.marker([origin.lat, origin.lng], {
        icon: L.divIcon({ html: pinHtml(origin.label, "#ea580c"), className: "", iconSize: [0, 0], iconAnchor: [0, 0] }),
      }).addTo(map);
      L.marker([destination.lat, destination.lng], {
        icon: L.divIcon({ html: pinHtml(destination.label, "#111827"), className: "", iconSize: [0, 0], iconAnchor: [0, 0] }),
      }).addTo(map);

      // Full planned route
      L.polyline(
        [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ],
        { color: "#1f2937", weight: 4, opacity: 0.7, dashArray: "2, 10", lineCap: "round" },
      ).addTo(map);

      // Flown-so-far segment, kept up to date via the ref below
      flownLineRef.current = L.polyline(
        [
          [origin.lat, origin.lng],
          [dronePosition.lat, dronePosition.lng],
        ],
        { color: "#03a038", weight: 5, lineCap: "round" },
      ).addTo(map);

      droneMarkerRef.current = L.marker([dronePosition.lat, dronePosition.lng], {
        icon: L.divIcon({ html: droneHtml(headingDegrees), className: "", iconSize: [0, 0], iconAnchor: [0, 0] }),
      }).addTo(map);

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      droneMarkerRef.current = null;
      flownLineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  // Move the drone marker / redraw the flown segment in place each tick,
  // instead of tearing down and rebuilding the whole map.
  useEffect(() => {
    (async () => {
      if (!droneMarkerRef.current || !flownLineRef.current) return;
      const L = (await import("leaflet")).default;
      droneMarkerRef.current.setLatLng([dronePosition.lat, dronePosition.lng]);
      droneMarkerRef.current.setIcon(
        L.divIcon({ html: droneHtml(headingDegrees), className: "", iconSize: [0, 0], iconAnchor: [0, 0] }),
      );
      flownLineRef.current.setLatLngs([
        [origin.lat, origin.lng],
        [dronePosition.lat, dronePosition.lng],
      ]);
    })();
  }, [dronePosition.lat, dronePosition.lng, headingDegrees, origin.lat, origin.lng]);

  return <div ref={containerRef} className={className ?? "h-72 w-full overflow-hidden rounded-lg"} />;
}
