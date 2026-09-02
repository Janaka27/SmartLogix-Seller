"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from "leaflet";

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

const PIN_SVG = `
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13Z" fill="#ea580c" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="9" r="2.5" fill="white"/>
  </svg>
`;

// Click-to-pick / drag-to-adjust warehouse location. Uses Leaflet + OpenStreetMap
// tiles (no API key required) instead of Google Maps.
export function LocationPickerMap({ latitude, longitude, onChange, className }: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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

      const bounds = L.latLngBounds(
        L.latLng(5.8, 79.5), // South West
        L.latLng(9.9, 82.0)  // North East
      );

      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 12,
        minZoom: 7,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        bounds: bounds,
      }).addTo(map);

      const marker = L.marker([latitude, longitude], { icon: pinIcon, draggable: true }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        // Prevent marker from being dragged outside bounds (Leaflet usually does this automatically with maxBounds, but good to ensure if needed, though maxBounds mostly applies to pan)
        if (bounds.contains(pos)) {
          onChangeRef.current(Number(pos.lat.toFixed(4)), Number(pos.lng.toFixed(4)));
        } else {
          // Revert to old valid position or snap to bounds
          marker.setLatLng([latitude, longitude]);
        }
      });

      map.on("click", (e: LeafletMouseEvent) => {
        if (bounds.contains(e.latlng)) {
          marker.setLatLng(e.latlng);
          onChangeRef.current(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
        }
      });

      mapRef.current = map;
      markerRef.current = marker;
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker/view in sync when lat/lng change from outside the map
  // (typed manually, or "use current location").
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const current = markerRef.current.getLatLng();
    if (Math.abs(current.lat - latitude) < 1e-6 && Math.abs(current.lng - longitude) < 1e-6) return;
    markerRef.current.setLatLng([latitude, longitude]);
    mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-64 w-full overflow-hidden rounded-lg"}
      data-loaded={loaded}
    />
  );
}
