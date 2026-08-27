import { createClient } from '@/lib/supabase';

const supabase = createClient();

// The UI passes camelCase fields
export interface WarehouseInput {
    name: string;
    city?: string;
    latitude: number;
    longitude: number;
    capacity: number;
    droneDockCount?: number;
    chargingStation?: boolean;
    sellerFacing?: boolean;
    sellerId?: string;
}

// Convert DB snake_case to UI camelCase
function mapToFrontend(dbWarehouse: any) {
    if (!dbWarehouse) return dbWarehouse;
    return {
        id: dbWarehouse.id,
        name: dbWarehouse.name,
        city: dbWarehouse.city ?? "",
        latitude: dbWarehouse.latitude,
        longitude: dbWarehouse.longitude,
        capacity: dbWarehouse.capacity,
        sellerFacing: dbWarehouse.is_seller_facing,
        droneDockCount: dbWarehouse.drone_dock_count,
        chargingStation: dbWarehouse.charging_station,
        sellerId: dbWarehouse.seller_id,
        createdAt: dbWarehouse.created_at,
        activeDroneCount: Array.isArray(dbWarehouse.drones) ? dbWarehouse.drones.length : undefined,
    };
}

export const WarehouseService = {
    async getAll() {
        const { data, error } = await supabase
            .from('warehouses')
            .select('*, drones:drones!drones_home_warehouse_id_fkey(id)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching warehouses:', error.message);
            throw new Error(error.message);
        }
        return (data || []).map(mapToFrontend);
    },

    // A seller can have more than one warehouse — this returns their oldest
    // one only, for pages that just need "a" warehouse to work with (e.g.
    // Store Settings, Drone Fleet). Use getAllBySeller for anything that
    // should reflect every warehouse the seller has.
    async getBySeller(sellerId: string) {
        const { data, error } = await supabase
            .from('warehouses')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching warehouse:', error.message);
            throw new Error(error.message);
        }
        return mapToFrontend(data);
    },

    async getAllBySeller(sellerId: string) {
        const { data, error } = await supabase
            .from('warehouses')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching warehouses:', error.message);
            throw new Error(error.message);
        }
        return (data || []).map(mapToFrontend);
    },

    async create(warehouseData: WarehouseInput) {
        const dbInput = {
            name: warehouseData.name,
            city: warehouseData.city ?? null,
            latitude: warehouseData.latitude,
            longitude: warehouseData.longitude,
            capacity: warehouseData.capacity,
            seller_id: warehouseData.sellerId,
            is_seller_facing: warehouseData.sellerFacing ?? true,
            drone_dock_count: warehouseData.droneDockCount ?? 0,
            charging_station: warehouseData.chargingStation ?? false,
        };

        const { data, error } = await supabase
            .from('warehouses')
            .insert([dbInput])
            .select()
            .single();

        if (error) {
            console.error('Error saving warehouse to database:', error.message);
            throw new Error(error.message);
        }

        return mapToFrontend(data);
    },

    async update(id: string, updates: Partial<WarehouseInput>) {
        const dbInput: any = {};

        if (updates.name !== undefined) dbInput.name = updates.name;
        if (updates.city !== undefined) dbInput.city = updates.city;
        if (updates.latitude !== undefined) dbInput.latitude = updates.latitude;
        if (updates.longitude !== undefined) dbInput.longitude = updates.longitude;
        if (updates.capacity !== undefined) dbInput.capacity = updates.capacity;
        if (updates.droneDockCount !== undefined) dbInput.drone_dock_count = updates.droneDockCount;
        if (updates.chargingStation !== undefined) dbInput.charging_station = updates.chargingStation;
        if (updates.sellerFacing !== undefined) dbInput.is_seller_facing = updates.sellerFacing;

        const { data, error } = await supabase
            .from('warehouses')
            .update(dbInput)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating warehouse:', error.message);
            throw new Error(error.message);
        }

        return mapToFrontend(data);
    }
};
