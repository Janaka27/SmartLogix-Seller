import { createClient } from '@/lib/supabase';

const supabase = createClient();

// Role-agnostic password reset — one Supabase Auth account can hold the
// seller/admin/warehouse-manager role, and this just operates on whichever
// account owns the email, same as Supabase's own behavior.
export const AuthResetService = {
  async requestPasswordReset(email: string, redirectTo: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      console.error('Error requesting password reset:', error.message);
      throw new Error(error.message);
    }
  },

  // Turns the token from a reset-password email into a real session — used
  // by the reset-password screen before the "choose a new password" step.
  async verifyResetToken(tokenHash: string, type: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'recovery' | 'invite' | 'signup' | 'magiclink' | 'email_change' | 'email',
    });

    if (error) {
      console.error('Error verifying reset token:', error.message);
      throw new Error(error.message);
    }

    return data;
  },

  async hasSession() {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error('Error updating password:', error.message);
      throw new Error(error.message);
    }
  },
};
