import { createClient } from '@/lib/supabase';

const supabase = createClient();

export const WarehouseManagerService = {

  async signUp(email: string, password: string, metadata?: { full_name?: string; phone?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Error signing up warehouse manager:', error.message);
      throw new Error(error.message);
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        role: 'warehouse_manager',
        full_name: metadata?.full_name,
        email: email,
        phone: metadata?.phone,
      });

      if (profileError) {
        console.error('Error creating base profile:', profileError.message);
        throw new Error(profileError.message);
      }
    }

    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error logging in warehouse manager:', error.message);
      throw new Error(error.message);
    }

    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error verifying profile role:', profileError.message);
        await supabase.auth.signOut();
        throw new Error('Access denied. Failed to retrieve user role.');
      }

      if (profile?.role !== 'warehouse_manager') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Only warehouse managers are allowed to sign in here.');
      }
    }

    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error logging out:', error.message);
      throw new Error(error.message);
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error.message);
      throw new Error(error.message);
    }

    return data.session;
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // No active session is a normal, expected state — not a failure.
      if (error.name === 'AuthSessionMissingError') return null;
      console.error('Error getting user:', error.message);
      throw new Error(error.message);
    }

    return data.user;
  },

  async getMyProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, email, phone, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      throw new Error(error.message);
    }

    return data;
  },

  async updateMyProfile(userId: string, updates: { fullName: string; phone: string }) {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: updates.fullName, phone: updates.phone })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error.message);
      throw new Error(error.message);
    }
  },

  // Turns the token from an invite email into a real session — used by
  // /warehouse/accept-invite before the "set your password" step.
  async verifyInviteToken(tokenHash: string, type: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'invite' | 'signup' | 'magiclink' | 'recovery' | 'email_change' | 'email',
    });

    if (error) {
      console.error('Error verifying invite token:', error.message);
      throw new Error(error.message);
    }

    return data;
  },

  // Finishes onboarding for an invited manager: sets their password and
  // saves the name they confirm on the accept-invite screen. Requires an
  // active session (established by verifyInviteToken, or an existing login).
  async completeInvite(input: { fullName: string; password: string }) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('Your invite link has expired. Ask for a new one.');
    }

    const { error: passwordError } = await supabase.auth.updateUser({
      password: input.password,
      data: { full_name: input.fullName },
    });
    if (passwordError) {
      console.error('Error setting password:', passwordError.message);
      throw new Error(passwordError.message);
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: input.fullName })
      .eq('id', userData.user.id);
    if (profileError) {
      console.error('Error saving profile name:', profileError.message);
      throw new Error(profileError.message);
    }
  },
};
