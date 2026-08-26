import { createClient } from '@/lib/supabase';
import type { Drone, DroneRequest, DroneRequestUrgency, DroneStatus } from '@/lib/types';

const supabase = createClient();

function mapDrone(row: any): Drone {
  return {
    id: row.id,
    droneCode: row.drone_code,
    model: row.model ?? '',
    maxPayloadKg: Number(row.max_payload_kg),
    cargoBayLengthCm: Number(row.cargo_bay_length_cm),
    cargoBayWidthCm: Number(row.cargo_bay_width_cm),
    cargoBayHeightCm: Number(row.cargo_bay_height_cm),
    maxRangeKm: Number(row.max_range_km),
    batteryCapacityPct: Number(row.battery_capacity_pct),
    speedKmh: Number(row.speed_kmh),
    status: row.status,
    homeWarehouseId: row.home_warehouse_id,
    currentLat: Number(row.current_lat),
    currentLng: Number(row.current_lng),
  };
}

function mapDroneRequest(row: any): DroneRequest {
  return {
    id: row.id,
    sellerId: row.seller_id,
    warehouseId: row.warehouse_id,
    requestedQuantity: row.requested_quantity,
    reason: row.reason,
    urgency: row.urgency,
    status: row.status,
    adminNotes: row.admin_notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at ?? undefined,
  };
}

export interface DroneRequestInput {
  sellerId: string;
  warehouseId?: string | null;
  requestedQuantity: number;
  reason: string;
  urgency: DroneRequestUrgency;
}

export const DroneService = {
  // Every drone docked at one warehouse — used for a seller's own fleet
  // (sellers have exactly one warehouse today) and by admin tooling.
  async getByWarehouse(warehouseId: string): Promise<Drone[]> {
    const { data, error } = await supabase
      .from('drones')
      .select('*')
      .eq('home_warehouse_id', warehouseId)
      .order('drone_code', { ascending: true });

    if (error) {
      console.error('Error fetching fleet:', error.message);
      throw new Error(error.message);
    }
    return (data || []).map(mapDrone);
  },

  // Sellers know their own fleet's real-world state best — the DB only
  // lets them change `status` (RLS + a trigger lock every other column).
  async updateStatus(id: string, status: DroneStatus): Promise<Drone> {
    const { data, error } = await supabase
      .from('drones')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating drone status:', error.message);
      throw new Error(error.message);
    }
    return mapDrone(data);
  },

  async getMyRequests(sellerId: string): Promise<DroneRequest[]> {
    const { data, error } = await supabase
      .from('drone_requests')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching drone requests:', error.message);
      throw new Error(error.message);
    }
    return (data || []).map(mapDroneRequest);
  },

  async createRequest(input: DroneRequestInput): Promise<DroneRequest> {
    const { data, error } = await supabase
      .from('drone_requests')
      .insert([{
        seller_id: input.sellerId,
        warehouse_id: input.warehouseId ?? null,
        requested_quantity: input.requestedQuantity,
        reason: input.reason,
        urgency: input.urgency,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error submitting drone request:', error.message);
      throw new Error(error.message);
    }
    
    return mapDroneRequest(data);
  },

  async cancelRequest(id: string): Promise<DroneRequest> {
    const { data, error } = await supabase
      .from('drone_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling drone request:', error.message);
      throw new Error(error.message);
    }
    return mapDroneRequest(data);
  },
};
