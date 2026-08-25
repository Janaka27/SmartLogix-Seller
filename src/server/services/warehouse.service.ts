import { createClient } from '@/lib/supabase';

const supabase = createClient();

// The UI passes camelCase fields
export interface WarehouseInput {
    name: string;
    latitude: number;
    longitude: number;
    capacity: number;
    sellerId?: string;
}

// Convert DB snake_case to UI camelCase
function mapToFrontend(dbWarehouse: any) {
    if (!dbWarehouse) return dbWarehouse;
    return {
        id: dbWarehouse.id,
        name: dbWarehouse.name,
        latitude: dbWarehouse.latitude,
        longitude: dbWarehouse.longitude,
        capacity: dbWarehouse.capacity,
        sellerFacing: dbWarehouse.is_seller_facing,
        droneDockCount: dbWarehouse.drone_dock_count,
        chargingStation: dbWarehouse.charging_station,
        sellerId: dbWarehouse.seller_id,
        createdAt: dbWarehouse.created_at,
    };
}

export const WarehouseService = {
    async getBySeller(sellerId: string) {
        const { data, error } = await supabase
            .from('warehouses')
            .select('*')
            .eq('seller_id', sellerId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching warehouse:', error.message);
            throw new Error(error.message);
        }
        return mapToFrontend(data);
    },

    async create(warehouseData: WarehouseInput) {
        const dbInput = {
            name: warehouseData.name,
            latitude: warehouseData.latitude,
            longitude: warehouseData.longitude,
            capacity: warehouseData.capacity,
            seller_id: warehouseData.sellerId,
            is_seller_facing: true,
            drone_dock_count: 0,
            charging_station: false,
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
        if (updates.latitude !== undefined) dbInput.latitude = updates.latitude;
        if (updates.longitude !== undefined) dbInput.longitude = updates.longitude;
        if (updates.capacity !== undefined) dbInput.capacity = updates.capacity;

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
