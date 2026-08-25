"use client";

import { useState } from "react";
import { Play, Boxes } from "lucide-react";
import { Line, LineChart, CartesianGrid, XAxis } from "recharts";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { GraphCanvas } from "@/components/algorithms/GraphCanvas";
import {
  runKnapsack,
  runSimulatedAnnealing,
  BATCHING_DEPOT,
  BATCHING_ORDERS,
  BATCHING_DRONE_CAPACITY,
  type KnapsackResult,
  type TourResult,
} from "@/lib/algorithms";
import type { GraphNode } from "@/lib/algorithms/types";

const chartConfig = {
  cost: { label: "Best distance (km)", color: "var(--color-orange-500)" },
} satisfies ChartConfig;

export default function AdminBatchingPage() {
  const [selection, setSelection] = useState<KnapsackResult | null>(null);
  const [tour, setTour] = useState<TourResult | null>(null);

  const runSelection = () => {
    const result = runKnapsack(
      BATCHING_ORDERS,
      BATCHING_DRONE_CAPACITY.maxWeightKg,
      BATCHING_DRONE_CAPACITY.maxVolumeCm3
    );
    setSelection(result);
    setTour(null);
  };

  const runSequencing = () => {
    if (!selection) return;
    const stops = BATCHING_ORDERS.filter((o) => selection.selectedIds.includes(o.id));
    setTour(runSimulatedAnnealing(BATCHING_DEPOT, stops));
  };

  const selectedOrders = selection
    ? BATCHING_ORDERS.filter((o) => selection.selectedIds.includes(o.id))
    : [];

  const graphNodes: GraphNode[] = [
    { id: BATCHING_DEPOT.id, label: BATCHING_DEPOT.label, x: BATCHING_DEPOT.x * 20, y: BATCHING_DEPOT.y * 20, type: "warehouse" },
    ...BATCHING_ORDERS.map((o) => ({
      id: o.id,
      label: o.label,
      x: o.x * 20,
      y: o.y * 20,
      type: "delivery_zone" as const,
    })),
  ];

  const tourPath = tour ? [BATCHING_DEPOT.id, ...tour.order, BATCHING_DEPOT.id] : undefined;
  const tourEdges = tourPath
    ? tourPath.slice(0, -1).map((from, i) => {
        const to = tourPath[i + 1];
        const a = graphNodes.find((n) => n.id === from)!;
        const b = graphNodes.find((n) => n.id === to)!;
        return { from, to, weight: Number((Math.hypot(a.x - b.x, a.y - b.y) / 20).toFixed(1)) };
      })
    : [];

  const chartData = tour?.costHistory.map((cost, i) => ({ step: i, cost })) ?? [];

  return (
    <div>
      <PageHeader
        title="Delivery Batching Console"
        description="Step 1: select which of today's orders fit on one drone (constrained knapsack). Step 2: sequence the delivery tour (simulated annealing)."
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Button onClick={runSelection}>
          <Play /> Run Order Selection
        </Button>
        <Button variant="outline" onClick={runSequencing} disabled={!selection || selection.selectedIds.length === 0}>
          <Play /> Sequence Tour
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Queue</CardTitle>
            <CardDescription>Depot-relative delivery map — highlighted stops are loaded onto the drone.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full rounded-lg bg-muted/30">
              <GraphCanvas
                nodes={graphNodes}
                edges={tourEdges}
                highlightedPath={tourPath}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selection ? (
                <>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Weight</span>
                      <span>
                        {selection.totalWeightKg} / {BATCHING_DRONE_CAPACITY.maxWeightKg} kg
                      </span>
                    </div>
                    <Progress value={(selection.totalWeightKg / BATCHING_DRONE_CAPACITY.maxWeightKg) * 100} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Volume</span>
                      <span>
                        {selection.totalVolumeCm3.toLocaleString()} / {BATCHING_DRONE_CAPACITY.maxVolumeCm3.toLocaleString()} cm³
                      </span>
                    </div>
                    <Progress value={(selection.totalVolumeCm3 / BATCHING_DRONE_CAPACITY.maxVolumeCm3) * 100} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Order value loaded</p>
                    <p className="text-lg font-semibold text-foreground">${selection.totalValue.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOrders.map((o) => (
                      <Badge key={o.id} variant="secondary" className="border-0 bg-orange-50 text-orange-700">
                        {o.label}
                      </Badge>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Boxes className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Run order selection to see capacity usage.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {tour && (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Tour Result</CardTitle>
                <CardDescription>
                  {tour.totalDistanceKm} km closed loop · {tour.executionTimeMs}ms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-32 w-full">
                  <LineChart data={chartData} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="step" hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line dataKey="cost" type="monotone" stroke="var(--color-cost)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
