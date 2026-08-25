"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const registerSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  storeDescription: z
    .string()
    .min(20, "Tell us a bit more (at least 20 characters)")
    .max(400, "Keep it under 400 characters"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function SellerRegisterPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: "",
      ownerName: "",
      email: "",
      phone: "",
      storeDescription: "",
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    void values;
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          Application submitted
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for applying to sell on SmartLogix. An admin will review your application —
          most are approved within 2 business days.
        </p>
        <Button className="mt-6 w-full" onClick={() => router.push("/seller")}>
          Continue to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Apply to sell</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us about your business. Approved sellers can list products immediately.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label htmlFor="businessName">Business name</Label>
          <Input id="businessName" placeholder="Torri Home Goods" {...register("businessName")} />
          {errors.businessName && (
            <p className="text-xs text-destructive">{errors.businessName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ownerName">Owner name</Label>
          <Input id="ownerName" placeholder="Jenna Torri" {...register("ownerName")} />
          {errors.ownerName && (
            <p className="text-xs text-destructive">{errors.ownerName.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@business.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="512-555-0100" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="storeDescription">Tell us about your store</Label>
          <Textarea
            id="storeDescription"
            rows={3}
            placeholder="What do you sell, and who's it for?"
            {...register("storeDescription")}
          />
          {errors.storeDescription && (
            <p className="text-xs text-destructive">{errors.storeDescription.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit application"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/seller/login" className="font-medium text-orange-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
