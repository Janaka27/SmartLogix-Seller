"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker as LeafletMarker, Polyline as LeafletPolyline } from "leaflet";

interface TrackingPoint {
  lat: number;
  lng: number;
  label: string;
}

interface PathTrackingMapProps {
  routePoints: TrackingPoint[];
  otherWarehouses?: TrackingPoint[];
  className?: string;
}

const PIN_SVG = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="3" stroke="white" stroke-width="2.5"/></svg>`;
const CHARGING_SVG = `<svg width="10" height="10" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;

function pinHtml(label: string | null, bg: string, svg: string = PIN_SVG) {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#1f2937;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25));transform:translate(-50%,-100%);width:max-content;">
    <span style="display:flex;height:20px;width:20px;align-items:center;justify-content:center;border-radius:9999px;background:${bg};box-shadow:0 0 0 4px ${bg}33;">${svg}</span>
    ${label ? `<span style="white-space:nowrap;border-radius:4px;background:rgba(255,255,255,.85);padding:1px 4px;">${label}</span>` : ''}
  </div>`;
}

export function PathTrackingMap({
  routePoints,
  otherWarehouses,
  className,
}: PathTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

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

      // Add other warehouses if provided
      if (otherWarehouses) {
        otherWarehouses.forEach(point => {
          const marker = L.marker([point.lat, point.lng], {
            icon: L.divIcon({ html: pinHtml(null, "#6b7280"), className: "", iconSize: [0, 0], iconAnchor: [0, 0] }),
          }).addTo(map);
          marker.bindTooltip(point.label, { direction: "top", offset: [0, -25], opacity: 0.9 });
        });
      }

      if (routePoints.length > 0) {
        const bounds = L.latLngBounds(routePoints.map(p => [p.lat, p.lng]));
        if (otherWarehouses) {
            otherWarehouses.forEach(p => bounds.extend([p.lat, p.lng]));
        }
        map.fitBounds(bounds, { padding: [56, 56] });

        // Add markers for all points
        routePoints.forEach((point, i) => {
          let bg = "#3b82f6";
          let svg = PIN_SVG;
          if (i === 0) {
            bg = "#ea580c";
          } else if (i === routePoints.length - 1) {
            bg = "#111827";
          } else {
            bg = "#22c55e"; // green for charging warehouse
            svg = CHARGING_SVG;
          }
          L.marker([point.lat, point.lng], {
            icon: L.divIcon({ html: pinHtml(point.label, bg, svg), className: "", iconSize: [0, 0], iconAnchor: [0, 0] }),
          }).addTo(map);
        });

        // Add polyline connecting points
        L.polyline(
          routePoints.map(p => [p.lat, p.lng]),
          { color: "#1f2937", weight: 4, opacity: 0.7, dashArray: "2, 10", lineCap: "round" }
        ).addTo(map);
      }

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [routePoints, otherWarehouses]);

  return <div ref={containerRef} className={className ?? "h-72 w-full overflow-hidden rounded-lg"} />;
}
