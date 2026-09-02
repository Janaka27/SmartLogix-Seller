"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { WarehouseManagerService } from "@/server/services/warehouse-manager.service";
import { createClient } from "@/lib/supabase";

const setupSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SetupValues = z.infer<typeof setupSchema>;

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const run = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      try {
        if (tokenHash && type) {
          await WarehouseManagerService.verifyInviteToken(tokenHash, type);
        }

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setInvalid(true);
          return;
        }

        const inviteName = (session.user.user_metadata?.full_name as string | undefined) ?? "";
        reset({ fullName: inviteName, password: "", confirmPassword: "" });
      } catch (err) {
        console.error("Failed to verify invite", err);
        setInvalid(true);
      } finally {
        setChecking(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values: SetupValues) => {
    try {
      await WarehouseManagerService.completeInvite({
        fullName: values.fullName,
        password: values.password,
      });
      toast.success("You're all set!");
      router.push("/warehouse");
    } catch (error: any) {
      toast.error(error.message || "Failed to finish setup. Please try again.");
    }
  };

  if (checking) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Verifying your invite…
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          This invite link is invalid or has expired
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask the seller who invited you to send a new one, or sign in below if you&apos;ve already
          set your password.
        </p>
        <Button className="mt-6 w-full" onClick={() => router.push("/warehouse/login")}>
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Set up your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You&apos;ve been invited as a warehouse manager. Confirm your name and choose a password to
        get started.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" placeholder="Alex Rivera" {...register("fullName")} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput id="confirmPassword" placeholder="••••••••" {...register("confirmPassword")} />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Setting up…" : "Finish setup"}
        </Button>
      </form>
    </div>
  );
}

export default function WarehouseAcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-3 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
