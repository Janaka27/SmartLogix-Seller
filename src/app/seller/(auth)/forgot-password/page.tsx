"use client";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthResetService } from "@/server/services/auth-reset.service";

export default function SellerForgotPasswordPage() {
  return (
    <ForgotPasswordForm
      loginHref="/seller/login"
      onSubmit={(email) =>
        AuthResetService.requestPasswordReset(email, `${window.location.origin}/seller/reset-password`)
      }
    />
  );
}
