"use client";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthResetService } from "@/server/services/auth-reset.service";

export default function AdminForgotPasswordPage() {
  return (
    <ForgotPasswordForm
      loginHref="/admin/login"
      onSubmit={(email) =>
        AuthResetService.requestPasswordReset(email, `${window.location.origin}/admin/reset-password`)
      }
    />
  );
}
