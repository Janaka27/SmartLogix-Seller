"use server";

import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Bypasses RLS to update order and drone statuses when a seller confirms an assignment.
 * Sellers often don't have RLS UPDATE permission on the orders table (which belongs to buyers),
 * so this server action uses the service-role admin client to perform the necessary state changes.
 */
export async function confirmAssignmentAdmin(orderId: string, droneId: string) {
  const supabase = createAdminClient();


  const { error } = await supabase.rpc("confirm_drone_assignment", {
    p_order_id: orderId,
    p_drone_id: droneId,
  });

  if (error) {
    throw new Error(`Failed to confirm assignment: ${error.message}`);
  }
}
