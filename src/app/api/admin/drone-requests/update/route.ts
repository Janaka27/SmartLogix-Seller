import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(request: Request) {
    const supabase = createAdminClient();
    const { requestId, status, adminNotes } = await request.json();

    const { data, error } = await supabase
        .from("drone_requests")
        .update({ status, admin_notes: adminNotes })
        .eq("id", requestId)
        .select()
        .single();

    if (error) {
        console.error("Error updating drone request:", error.message);
        return NextResponse.json({ error: "Failed to update drone request" }, { status: 500 });
    }

    return NextResponse.json(data);
}