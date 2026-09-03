"use client";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthResetService } from "@/server/services/auth-reset.service";

export default function WarehouseForgotPasswordPage() {
  return (
    <ForgotPasswordForm
      loginHref="/warehouse/login"
      onSubmit={(email) =>
        AuthResetService.requestPasswordReset(email, `${window.location.origin}/warehouse/reset-password`)
      }
    />
  );
}
