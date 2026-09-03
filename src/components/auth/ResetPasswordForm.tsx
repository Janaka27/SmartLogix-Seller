"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  loginHref: string;
  /** Where to send the user once their password is set — usually the portal's dashboard root. */
  redirectHref: string;
  verifyToken: (tokenHash: string, type: string) => Promise<unknown>;
  hasSession: () => Promise<boolean>;
  updatePassword: (password: string) => Promise<void>;
}

export function ResetPasswordForm({
  loginHref,
  redirectHref,
  verifyToken,
  hasSession,
  updatePassword,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const run = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type) {
        try {
          await verifyToken(tokenHash, type);
        } catch (err) {
          // The token may already be consumed — e.g. React Strict Mode
          // double-invokes this effect in dev, and the first run already
          // used the (single-use) token. Don't treat that as fatal yet;
          // fall through and check for the session it should have left behind.
          console.warn("Reset token verification failed, checking for an existing session instead", err);
        }
      }

      try {
        const ok = await hasSession();
        setInvalid(!ok);
      } catch (err) {
        console.error("Failed to check session", err);
        setInvalid(true);
      } finally {
        setChecking(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      await updatePassword(values.password);
      toast.success("Password updated");
      router.push(redirectHref);
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password. Please try again.");
    }
  };

  if (checking) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Verifying your link…
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
          This reset link is invalid or has expired
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Request a new one and try again.</p>
        <Button className="mt-6 w-full" onClick={() => router.push(loginHref)}>
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Make it at least 8 characters.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
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
          {isSubmitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </div>
  );
}
