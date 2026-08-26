import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, phone, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error.message);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  const users = (data || []).map((row) => ({
    id: row.id,
    name: row.full_name || "Unnamed user",
    email: row.email || "",
    phone: row.phone || "",
    role: row.role,
    avatarUrl: row.avatar_url || undefined,
    joinedAt: row.created_at,
  }));

  return NextResponse.json(users);
}
