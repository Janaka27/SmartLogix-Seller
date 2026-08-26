import { createClient } from '@/lib/supabase';
import type { Seller, SellerStatus } from '@/lib/types';

const supabase = createClient();

interface SellerProfileRow {
  profile_id: string;
  store_name: string;
  description: string | null;
  status: SellerStatus;
  payout_details: { method?: string } | null;
  created_at: string;
  updated_at: string;
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    warehouses: { id: string }[] | null;
  } | null;
}

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
      // No active session is a normal, expected state — not a failure.
      if (error.name === 'AuthSessionMissingError') return null;
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
  },

  // Seller-facing: their own store profile + owner contact info, shaped for
  // the Store Settings form (Settings page).
  async getMySettings(userId: string) {
    const { data, error } = await supabase
      .from('seller_profiles')
      .select(`
        store_name,
        description,
        payout_details,
        profile:profiles!seller_profiles_profile_id_fkey (
          full_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('profile_id', userId)
      .single();

    if (error) {
      console.error('Error fetching store settings:', error.message);
      throw new Error(error.message);
    }

    const row = data as unknown as {
      store_name: string;
      description: string | null;
      payout_details: { method?: string; last4?: string } | null;
      profile: { full_name: string | null; email: string | null; phone: string | null; avatar_url: string | null } | null;
    };

    return {
      businessName: row.store_name,
      ownerName: row.profile?.full_name ?? '',
      email: row.profile?.email ?? '',
      phone: row.profile?.phone ?? '',
      storeDescription: row.description ?? '',
      logoUrl: row.profile?.avatar_url ?? null,
      payoutMethod: row.payout_details?.method
        ? `${row.payout_details.method}${row.payout_details.last4 ? ` •••• ${row.payout_details.last4}` : ''}`
        : 'Not configured',
    };
  },

  // Seller-facing: save Store Settings changes. Login email is intentionally
  // left out — changing it goes through Supabase auth's own confirmation flow.
  async updateMySettings(
    userId: string,
    updates: {
      businessName: string;
      ownerName: string;
      phone: string;
      storeDescription: string;
      logoUrl?: string | null;
    }
  ) {
    const profileUpdate: Record<string, unknown> = { full_name: updates.ownerName, phone: updates.phone };
    if (updates.logoUrl !== undefined) profileUpdate.avatar_url = updates.logoUrl;

    const [{ error: profileError }, { error: sellerError }] = await Promise.all([
      supabase.from('profiles').update(profileUpdate).eq('id', userId),
      supabase
        .from('seller_profiles')
        .update({ store_name: updates.businessName, description: updates.storeDescription })
        .eq('profile_id', userId),
    ]);

    if (profileError) {
      console.error('Error updating profile:', profileError.message);
      throw new Error(profileError.message);
    }
    if (sellerError) {
      console.error('Error updating seller profile:', sellerError.message);
      throw new Error(sellerError.message);
    }
  },

  // Admin-only: every seller across the platform, with owner contact info
  // and how many warehouses each one has.
  async getAllSellers(): Promise<Seller[]> {
    const { data, error } = await supabase
      .from('seller_profiles')
      .select(`
        id,
        profile_id,
        store_name,
        description,
        status,
        payout_details,
        created_at,
        updated_at,
        profile:profiles!seller_profiles_profile_id_fkey (
          id,
          full_name,
          email,
          phone,
          warehouses:warehouses!warehouses_seller_id_fkey ( id )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sellers:', error.message);
      throw new Error(error.message);
    }

    return ((data || []) as unknown as SellerProfileRow[]).map((row) => ({
      id: row.profile?.id ?? row.profile_id,
      businessName: row.store_name,
      ownerName: row.profile?.full_name ?? '',
      email: row.profile?.email ?? '',
      phone: row.profile?.phone ?? '',
      status: row.status,
      appliedAt: row.created_at,
      approvedAt: row.status === 'approved' ? row.updated_at : undefined,
      warehouseIds: (row.profile?.warehouses ?? []).map((w) => w.id),
      payoutMethod: row.payout_details?.method ?? 'Not configured',
      storeDescription: row.description ?? '',
    })) as unknown as Seller[];
  },

  // Admin-only: approve / reject / suspend / reinstate a seller.
  async updateSellerStatus(sellerId: string, status: SellerStatus) {
    const { data, error } = await supabase
      .from('seller_profiles')
      .update({ status })
      .eq('profile_id', sellerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating seller status:', error.message);
      throw new Error(error.message);
    }

    return data;
  }
};
