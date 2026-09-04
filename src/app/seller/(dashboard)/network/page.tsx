"use client";

import { useState } from "react";
import { Network, Play, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NetworkMap } from "@/components/seller/NetworkMap";
import type { NetworkNode, NetworkEdge } from "@/lib/algorithms/seller-prims";

interface MstResult {
  nodes: NetworkNode[];
  connections: NetworkEdge[];
  totalDistance: number;
}

export default function SellerNetworkAnalysisPage() {
  const [result, setResult] = useState<MstResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/network-analysis");
      if (!res.ok) {
        throw new Error("Failed to fetch network analysis");
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setResult(data);
      toast.success("Network analysis completed successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Network Analysis Dashboard"
        description="Prim's MST across warehouses and charging stations — the minimum-cost infrastructure network."
        actions={
          <Button onClick={runAnalysis} disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</>
            ) : (
              <><Play className="mr-2 h-4 w-4" /> Run Prim&apos;s MST</>
            )}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Infrastructure Graph</CardTitle>
            <CardDescription>
              {result ? `${result.nodes.length} nodes connected with ${result.connections.length} links` : "Run the analysis to view the network graph."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result && result.nodes.length > 0 ? (
              <NetworkMap
                nodes={result.nodes}
                edges={result.connections}
                className="h-[500px] w-full"
              />
            ) : (
              <div className="flex h-[500px] w-full flex-col items-center justify-center rounded-lg bg-muted/30">
                <Network className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Graph visualization will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Result Details</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Minimum infrastructure distance</p>
                    <p className="text-3xl font-semibold text-foreground">{result.totalDistance.toFixed(2)} km</p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Established Links ({result.connections.length})</p>
                    <div className="max-h-[360px] overflow-y-auto pr-2 space-y-2">
                      {result.connections.map((e, idx) => {
                        const fromNode = result.nodes.find(n => n.id === e.from);
                        const toNode = result.nodes.find(n => n.id === e.to);
                        return (
                          <div key={idx} className="flex flex-col rounded-md bg-muted/50 p-2 text-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{fromNode?.name || e.from}</span>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground">
                              <span className="text-xs">→ {toNode?.name || e.to}</span>
                              <span className="font-semibold text-foreground">{e.distance.toFixed(2)} km</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Network className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Run the algorithm to view the minimum-cost connections.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
