import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getSellerContextOrNull } from "@/lib/supabase-server";

// One row per warehouse the caller owns, with whoever manages it (if
// anyone) and whether they've finished setting a password yet. Confirmation
// status comes from the auth admin API — the profiles table doesn't carry it.
export async function GET() {
  const context = await getSellerContextOrNull();
  if (!context) {
    return NextResponse.json({ error: "Only sellers can view warehouse managers" }, { status: 401 });
  }
  const { supabase, user } = context;

  const { data: warehouses, error } = await supabase
    .from("warehouses")
    .select("id, name, manager_id")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching warehouses:", error.message);
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
  }

  const admin = createAdminClient();

  const results = await Promise.all(
    (warehouses ?? []).map(async (w) => {
      if (!w.manager_id) {
        return { warehouseId: w.id, warehouseName: w.name, manager: null };
      }

      const [{ data: profile }, { data: authUser }] = await Promise.all([
        admin.from("profiles").select("full_name, email").eq("id", w.manager_id).maybeSingle(),
        admin.auth.admin.getUserById(w.manager_id),
      ]);

      return {
        warehouseId: w.id,
        warehouseName: w.name,
        manager: {
          id: w.manager_id,
          name: profile?.full_name || "Unnamed manager",
          email: profile?.email ?? "",
          status: authUser?.user?.email_confirmed_at ? "active" : "pending",
        },
      };
    })
  );

  return NextResponse.json(results);
}
