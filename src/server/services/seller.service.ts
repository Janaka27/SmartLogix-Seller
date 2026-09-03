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

  // Orders dashboard: fetch all columns needed by the Priority Queue →
  // Decision Tree → Knapsack pipeline, plus product details for UI display.
  async getOrderDashboardData(warehouseId: string) {
    // 1️⃣  Orders for this warehouse (weight + volume + distance for knapsack)
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, warehouse_id, status, created_at, is_urgent, total_weight_kg, total_volume_cm3, distance_km')
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError.message);
      throw new Error(ordersError.message);
    }

    const orderIds = (ordersData ?? []).map((o: any) => o.id);

    // 2️⃣  Order items with nested product details in a single round-trip.
    //      weight_kg / volume_cm3 on order_items are the delivery-algorithm values;
    //      the nested product fields are display-only.
    let itemsData: any[] = [];
    let productsById: Record<string, any> = {};

    if (orderIds.length > 0) {
      const { data, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          quantity,
          weight_kg,
          volume_cm3,
          product:products!order_items_product_id_fkey (
            id,
            name,
            category,
            price,
            weight_kg,
            length_cm,
            width_cm,
            height_cm,
            volume_cm3,
            fragile,
            images
          )
        `)
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError.message);
        throw new Error(itemsError.message);
      }

      itemsData = (data ?? []).map((row: any) => {
        // Keep product as a sidecar so the algorithm types stay clean
        const { product, ...rest } = row;
        if (product) productsById[product.id] = product;
        return rest;
      });
    }

    // 3️⃣  Drones — algorithm fields + display fields (drone_code, model, battery, speed).
    //      FullDroneRow (used by knapsack) only needs the algorithm columns;
    //      extra display columns are peeled off into a dronesById map.
    const { data: dronesData, error: dronesError } = await supabase
      .from('drones')
      .select('id, drone_code, model, max_payload_kg, cargo_bay_volume_cm3, max_range_km, battery_capacity_pct, speed_kmh, status, home_warehouse_id')
      .eq('home_warehouse_id', warehouseId);

    if (dronesError) {
      console.error('Error fetching drones:', dronesError.message);
      throw new Error(dronesError.message);
    }

    // Build a display-only map; strip extra fields before passing to algorithm
    const dronesById: Record<string, any> = {};
    const algorithmDrones = (dronesData ?? []).map((d: any) => {
      dronesById[d.id] = d;
      // Return only the fields FullDroneRow expects
      return {
        id: d.id,
        max_payload_kg: d.max_payload_kg,
        cargo_bay_volume_cm3: d.cargo_bay_volume_cm3,
        max_range_km: d.max_range_km,
        status: d.status,
        home_warehouse_id: d.home_warehouse_id,
      };
    });

    return {
      orders: ordersData ?? [],
      orderItems: itemsData,   // algorithm-safe (no product sidecar)
      drones: algorithmDrones, // algorithm-safe subset
      productsById,            // display-only product lookup map
      dronesById,              // display-only drone lookup map
    };
  },

  // Fetch allocated orders for the dashboard, including their drone assignments and items.
  async getAllocatedOrdersDashboardData(warehouseId: string) {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        warehouse_id,
        status,
        created_at,
        is_urgent,
        total_amount,
        total_weight_kg,
        total_volume_cm3,
        delivery_address,
        delivery_lat,
        delivery_lng,
        distance_km,
        drone_assignment:drone_assignments (
          id,
          status,
          departed_at,
          delivered_at,
          drone:drones (
            id,
            drone_code,
            status,
            max_payload_kg,
            max_range_km,
            speed_kmh,
            battery_capacity_pct
          )
        )
      `)
      .eq('warehouse_id', warehouseId)
      .eq('status', 'allocated')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching allocated orders:', ordersError.message);
      throw new Error(ordersError.message);
    }

    const orderIds = (ordersData ?? []).map((o: any) => o.id);

    let itemsData: any[] = [];
    if (orderIds.length > 0) {
      const { data, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          quantity,
          weight_kg,
          volume_cm3,
          product:products (
            id,
            name,
            category,
            price,
            weight_kg,
            length_cm,
            width_cm,
            height_cm,
            volume_cm3,
            fragile,
            images
          )
        `)
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Error fetching allocated order items:', itemsError.message);
        throw new Error(itemsError.message);
      }
      itemsData = data ?? [];
    }

    return {
      orders: ordersData ?? [],
      orderItems: itemsData
    };
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
  },

  // Confirm a drone assignment made by the knapsack algorithm:
  //   • order.status           → 'allocated'
  //   • order.drone_assignment_id → droneId
  async confirmAssignment(orderId: string, droneId: string): Promise<void> {
    const { confirmAssignmentAdmin } = await import('@/server/actions/assignments');
    await confirmAssignmentAdmin(orderId, droneId);
  },

  // Marks an allocated order's assignment (and its drone) as delivered —
  // either the seller clicking "Mark Delivered", or the tracking view
  // auto-completing once the simulated flight has reached the destination.
  async deliverAssignment(orderId: string, assignmentId: string, droneId: string): Promise<void> {
    const { deliverAssignmentAdmin } = await import('@/server/actions/assignments');
    await deliverAssignmentAdmin(orderId, assignmentId, droneId);
  },
};
