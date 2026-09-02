import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getSellerContextOrNull } from "@/lib/supabase-server";

// Invites a warehouse manager by email for one of the caller's own
// warehouses. Supabase's own mailer sends the invite (no third-party email
// provider needed) — creates the auth user + a matching profiles row up
// front (role: warehouse_manager) and links warehouses.manager_id right
// away, so the assignment shows up on the seller dashboard even before the
// invitee finishes setting their password.
export async function POST(request: Request) {
  const context = await getSellerContextOrNull();
  if (!context) {
    return NextResponse.json({ error: "Only sellers can invite warehouse managers" }, { status: 401 });
  }
  const { supabase, user } = context;

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const warehouseId = typeof body.warehouseId === "string" ? body.warehouseId : "";

  if (!email || !fullName || !warehouseId) {
    return NextResponse.json({ error: "email, fullName, and warehouseId are required" }, { status: 400 });
  }

  const { data: warehouse, error: warehouseError } = await supabase
    .from("warehouses")
    .select("id, seller_id, name")
    .eq("id", warehouseId)
    .single();

  if (warehouseError || !warehouse || warehouse.seller_id !== user.id) {
    return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
  }

  const admin = createAdminClient();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existingProfile) {
    return NextResponse.json(
      { error: "A SmartLogix account with this email already exists." },
      { status: 409 }
    );
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/warehouse/accept-invite`,
    data: { full_name: fullName },
  });

  if (inviteError || !invited.user) {
    console.error("Error inviting warehouse manager:", inviteError?.message);
    return NextResponse.json({ error: inviteError?.message ?? "Failed to send invite" }, { status: 500 });
  }

  const managerId = invited.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: managerId,
    role: "warehouse_manager",
    full_name: fullName,
    email,
  });

  if (profileError) {
    console.error("Error creating manager profile:", profileError.message);
    await admin.auth.admin.deleteUser(managerId).catch(() => {});
    return NextResponse.json(
      { error: "Invite sent, but failed to set up the manager profile. Please try again." },
      { status: 500 }
    );
  }

  const { error: assignError } = await supabase
    .from("warehouses")
    .update({ manager_id: managerId })
    .eq("id", warehouseId);

  if (assignError) {
    console.error("Error assigning manager to warehouse:", assignError.message);
    return NextResponse.json(
      { error: "Invite sent, but failed to assign the warehouse. Contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: managerId, email, fullName, warehouseId, warehouseName: warehouse.name });
}
