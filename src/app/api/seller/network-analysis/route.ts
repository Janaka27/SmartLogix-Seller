import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { calculateDistance, calculateMST, NetworkNode, NetworkEdge } from "@/lib/algorithms/seller-prims";

export async function GET() {
  try {
    const supabase = createClient();
    
    // Fetch all warehouses
    const { data: warehouses, error } = await supabase
      .from("warehouses")
      .select("*");

    if (error) {
      console.error("Error fetching warehouses:", error);
      return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
    }

    if (!warehouses || warehouses.length === 0) {
      return NextResponse.json({ error: "No locations found" }, { status: 404 });
    }

    // Map DB rows to NetworkNode type
    const nodes: NetworkNode[] = warehouses.map((w: any) => ({
      id: w.id,
      name: w.name,
      lat: Number(w.latitude),
      lng: Number(w.longitude),
      type: w.charging_station ? "charging_station" : "warehouse"
    }));

    // Create edges between every pair of nodes based on distance
    const edges: NetworkEdge[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = calculateDistance(nodes[i].lat, nodes[i].lng, nodes[j].lat, nodes[j].lng);
        edges.push({
          from: nodes[i].id,
          to: nodes[j].id,
          distance: dist
        });
      }
    }

    // Run Prim's MST algorithm
    const result = calculateMST(nodes, edges);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("MST computation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to compute minimum spanning tree" },
      { status: 500 }
    );
  }
}
