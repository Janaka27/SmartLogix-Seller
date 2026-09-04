"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import type { NetworkNode, NetworkEdge } from "@/lib/algorithms/seller-prims";

interface NetworkMapProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  className?: string;
}

const WAREHOUSE_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M4 22V8.5L12 3l8 5.5V22H4z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
const CHARGING_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;

function pinHtml(label: string | null, bg: string, svg: string) {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#1f2937;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25));transform:translate(-50%,-100%);width:max-content;">
    <span style="display:flex;height:24px;width:24px;align-items:center;justify-content:center;border-radius:9999px;background:${bg};box-shadow:0 0 0 4px ${bg}33;">${svg}</span>
    ${label ? `<span style="white-space:nowrap;border-radius:4px;background:rgba(255,255,255,.9);padding:1px 5px;border: 1px solid #e5e7eb;">${label}</span>` : ''}
  </div>`;
}

export function NetworkMap({
  nodes,
  edges,
  className,
}: NetworkMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (nodes.length > 0) {
        const bounds = L.latLngBounds(nodes.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [56, 56] });

        // Create a map for quick node lookups when drawing edges
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        // Draw edges (connections)
        edges.forEach(edge => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          
          if (fromNode && toNode) {
            L.polyline(
              [[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]],
              { color: "#ea580c", weight: 3, opacity: 0.8, lineCap: "round" }
            ).addTo(map);
          }
        });

        // Add markers for nodes on top of edges
        nodes.forEach(node => {
          const isCharging = node.type === "charging_station";
          const bg = isCharging ? "#22c55e" : "#3b82f6";
          const svg = isCharging ? CHARGING_SVG : WAREHOUSE_SVG;

          L.marker([node.lat, node.lng], {
            icon: L.divIcon({ 
              html: pinHtml(node.name, bg, svg), 
              className: "", 
              iconSize: [0, 0], 
              iconAnchor: [0, 0] 
            }),
          }).addTo(map);
        });
      }

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [nodes, edges]);

  return <div ref={containerRef} className={className ?? "h-[500px] w-full overflow-hidden rounded-lg border border-border"} />;
}
