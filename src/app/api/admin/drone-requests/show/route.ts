import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getAdminUserOrNull } from "@/lib/supabase-server";

export async function GET() {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("drone_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching drone requests:", error.message);
    return NextResponse.json({ error: "Failed to fetch drone requests" }, { status: 500 });
  }

  return NextResponse.json(data);
}
