export interface WarehouseManagerStatus {
  warehouseId: string;
  warehouseName: string;
  manager: {
    id: string;
    name: string;
    email: string;
    status: "active" | "pending";
  } | null;
}

async function throwApiError(response: Response, fallbackMessage: string): Promise<never> {
  const body = await response.json().catch(() => ({}));
  throw new Error(body.error || fallbackMessage);
}

export const ManagerInviteService = {
  // Seller-facing: every warehouse the caller owns, with whoever manages it.
  async list(): Promise<WarehouseManagerStatus[]> {
    const response = await fetch("/api/seller/warehouse-managers");
    if (!response.ok) {
      await throwApiError(response, "Failed to load warehouse managers");
    }
    return response.json();
  },

  // Seller-facing: invite a new warehouse manager by email for one warehouse.
  // Sends a Supabase invite email; the invitee sets their password at
  // /warehouse/accept-invite.
  async invite(input: { email: string; fullName: string; warehouseId: string }) {
    const response = await fetch("/api/seller/warehouse-managers/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      await throwApiError(response, "Failed to send invite");
    }
    return response.json();
  },
};
