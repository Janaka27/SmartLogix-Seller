"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthResetService } from "@/server/services/auth-reset.service";

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading…
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm
        loginHref="/admin/login"
        redirectHref="/admin"
        verifyToken={AuthResetService.verifyResetToken}
        hasSession={AuthResetService.hasSession}
        updatePassword={AuthResetService.updatePassword}
      />
    </Suspense>
  );
}
