import { createClient } from '@/lib/supabase';

const supabase = createClient();

export const AdminService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error logging in admin:', error.message);
      throw new Error(error.message);
    }

    if (data.user) {
      // Verify if the user profile role is 'admin' (or similar administrative role)
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

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Only administrators are allowed to sign in.');
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
      console.error('Error getting user:', error.message);
      throw new Error(error.message);
    }
    return data.user;
  }
};
