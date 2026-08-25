import { createClient } from '@/lib/supabase';

const supabase = createClient();

export const SellerService = {

  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Error signing up seller:', error.message);
      throw new Error(error.message);
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        role: 'seller',
        full_name: metadata?.owner_name,
        email: email,
        phone: metadata?.phone,
      });

      if (profileError) {
        console.error('Error creating base profile:', profileError.message);
        throw new Error(profileError.message);
      }

      const { error: sellerError } = await supabase.from('seller_profiles').insert({
        profile_id: data.user.id,
        store_name: metadata?.business_name,
        description: metadata?.store_description,
        status: 'approved', // Auto-approve for development
      });

      if (sellerError) {
        console.error('Error creating seller profile:', sellerError.message);
        throw new Error(sellerError.message);
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
      console.error('Error logging in seller:', error.message);
      throw new Error(error.message);
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
  },

  async getSellerProfile(userId: string) {
    const { data, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('profile_id', userId)
      .single();

    if (error) {
      console.error('Error fetching seller profile:', error.message);
      throw new Error(error.message);
    }

    return data;
  }
};
