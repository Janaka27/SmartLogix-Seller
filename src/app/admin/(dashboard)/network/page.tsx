"use client";

import { useState } from "react";
import { Network, Play } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraphCanvas } from "@/components/algorithms/GraphCanvas";
import {
  runPrim,
  NETWORK_NODES,
  NETWORK_EDGE_COSTS,
  type MstResult,
} from "@/lib/algorithms";

export default function AdminNetworkPage() {
  const [result, setResult] = useState<MstResult | null>(null);

  const run = () => {
    setResult(runPrim(NETWORK_NODES, NETWORK_EDGE_COSTS));
  };

  const totalPossibleCost = NETWORK_EDGE_COSTS.reduce((sum, e) => sum + e.weight, 0);
  const savings = result ? totalPossibleCost - result.totalCost : 0;

  return (
    <div>
      <PageHeader
        title="Network Analysis Dashboard"
        description="Prim's MST across warehouses and charging stations — the minimum-cost network that keeps everything connected."
        actions={
          <Button onClick={run}>
            <Play /> Run Prim&apos;s MST
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Infrastructure Graph</CardTitle>
            <CardDescription>
              {NETWORK_NODES.length} nodes, {NETWORK_EDGE_COSTS.length} candidate links (cost in $k)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full rounded-lg bg-muted/30">
              <GraphCanvas
                nodes={NETWORK_NODES}
                edges={NETWORK_EDGE_COSTS}
                highlightedEdges={result?.edges}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Minimum infrastructure cost</p>
                    <p className="text-2xl font-semibold text-foreground">${result.totalCost}k</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Savings vs. connecting every candidate link</p>
                    <p className="text-lg font-medium text-emerald-600">${savings.toFixed(2)}k saved</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Execution time</p>
                    <p className="text-sm text-foreground">{result.executionTimeMs}ms</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Edges kept ({result.edges.length})</p>
                    <ul className="space-y-1 text-sm text-foreground">
                      {result.edges.map((e) => (
                        <li key={`${e.from}-${e.to}`} className="flex justify-between">
                          <span>
                            {e.from} → {e.to}
                          </span>
                          <span className="text-muted-foreground">${e.weight}k</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Network className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Run the algorithm to see the minimum-cost network.
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
