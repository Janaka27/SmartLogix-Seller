"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Info } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CmsValues {
  heroHeadline: string;
  heroSubheadline: string;
  statSellers: string;
  statOnTime: string;
  statWarehouses: string;
  faqHeading: string;
}

const DEFAULT_VALUES: CmsValues = {
  heroHeadline: "Sell Smarter With Drone-Powered Delivery",
  heroSubheadline:
    "List your products, store them across our warehouse network, and let SmartLogix handle the rest — automated routing, real-time drone tracking, and delivery in minutes, not days.",
  statSellers: "500+",
  statOnTime: "98%",
  statWarehouses: "40+",
  faqHeading: "The Most Common Questions About Selling on SmartLogix",
};

export default function AdminCmsPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<CmsValues>({
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = async (values: CmsValues) => {
    void values;
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast.success("Draft saved (preview only — the live site is unchanged in this demo)");
  };

  return (
    <div>
      <PageHeader title="Landing Page CMS" description="Edit marketing copy for the public landing page." />

      <Alert className="mb-6">
        <Info />
        <AlertTitle>Preview only</AlertTitle>
        <AlertDescription>
          This editor is a UI mockup for the coursework demo — saving here does not modify the
          live landing page content, since there&apos;s no CMS backend wired up yet.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>The first thing visitors see on smartlogix.com.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="heroHeadline">Headline</Label>
              <Input id="heroHeadline" {...register("heroHeadline")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="heroSubheadline">Subheadline</Label>
              <Textarea id="heroSubheadline" rows={3} {...register("heroSubheadline")} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Stats Bar</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="statSellers">Active Sellers</Label>
              <Input id="statSellers" {...register("statSellers")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="statOnTime">On-Time Delivery</Label>
              <Input id="statOnTime" {...register("statOnTime")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="statWarehouses">Warehouses</Label>
              <Input id="statWarehouses" {...register("statWarehouses")} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>FAQ Section</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="faqHeading">Heading</Label>
              <Input id="faqHeading" {...register("faqHeading")} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save draft"}
        </Button>
      </form>
    </div>
  );
}
