"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { classifyFeasibility } from "@/lib/algorithms";
import type { FeasibilityInput, FeasibilityResult } from "@/lib/algorithms/types";

const CLASSIFICATION_STYLE: Record<FeasibilityResult["classification"], string> = {
  "Drone-Deliverable": "bg-emerald-50 text-emerald-700",
  "Requires Split": "bg-amber-50 text-amber-700",
  Reject: "bg-red-50 text-red-700",
};

export default function AdminDecisionPage() {
  const { register, control, watch } = useForm<FeasibilityInput>({
    defaultValues: {
      weightKg: 12,
      volumeCm3: 18000,
      distanceKm: 6.5,
      batteryMarginPct: 62,
      weatherFlag: false,
    },
  });

  const values = watch();
  const result = classifyFeasibility(values);

  const [retraining, setRetraining] = useState(false);
  const [progress, setProgress] = useState(0);

  const retrain = () => {
    setRetraining(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setRetraining(false);
          toast.success("Model retrained on 1,842 historical deliveries — rules unchanged in this demo");
          return 100;
        }
        return p + 20;
      });
    }, 200);
  };

  return (
    <div>
      <PageHeader
        title="Decision Module Console"
        description="Live delivery-feasibility classification, with a transparent rule audit trail for ops staff."
        actions={
          <Button variant="outline" onClick={retrain} disabled={retraining}>
            <RefreshCw className={retraining ? "animate-spin" : ""} /> Retrain Model
          </Button>
        }
      />

      {retraining && (
        <div className="mb-4">
          <Progress value={progress} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Order Inputs</CardTitle>
            <CardDescription>Adjust values to see the classification update live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input id="weightKg" type="number" step="0.1" {...register("weightKg", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="volumeCm3">Volume (cm³)</Label>
                <Input id="volumeCm3" type="number" {...register("volumeCm3", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="distanceKm">Distance (km)</Label>
                <Input id="distanceKm" type="number" step="0.1" {...register("distanceKm", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batteryMarginPct">Battery margin (%)</Label>
                <Input
                  id="batteryMarginPct"
                  type="number"
                  {...register("batteryMarginPct", { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="weatherFlag">Adverse weather</Label>
                <p className="text-xs text-muted-foreground">High wind or storm flag on the route.</p>
              </div>
              <Controller
                name="weatherFlag"
                control={control}
                render={({ field }) => (
                  <Switch id="weatherFlag" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge className={`border-0 px-3 py-1 text-sm ${CLASSIFICATION_STYLE[result.classification]}`}>
              {result.classification}
            </Badge>

            <div className="space-y-2">
              {result.rulePath.map((rule, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {rule.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <span className={rule.passed ? "text-foreground" : "text-red-600"}>{rule.rule}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
