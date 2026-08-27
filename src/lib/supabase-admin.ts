import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses Row Level Security — never import this
// into client components, only into server-side route handlers.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}
