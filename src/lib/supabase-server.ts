import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cookie-based client for Route Handlers — reads the caller's own session
// (respects RLS), unlike the service-role client in supabase-admin.ts.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a context that can't set cookies (e.g. during
            // render) — safe to ignore here since we only ever read.
          }
        },
      },
    }
  );
}

// TEMPORARY, for local testing only: mirrors the same allowlist added to
// private.is_admin() in the DB (migration temp_grant_janaka_admin_access) —
// keep these two in sync, and remove both together when done testing.
const TEMP_ADMIN_ALLOWLIST = new Set(["2105d859-f883-4855-98b8-d2f9769bc1bc"]);

// Verifies the request's own session belongs to an admin, using RLS (not
// the service-role key) so it can't be spoofed. Returns null otherwise —
// callers should respond 401/403 before touching any service-role client.
export async function getAdminUserOrNull() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  if (TEMP_ADMIN_ALLOWLIST.has(user.id)) return user;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;

  return user;
}

// Verifies the request's own session belongs to a seller, using RLS. Returns
// the RLS-bound client alongside the user so callers can do further reads/
// writes (e.g. their own warehouses) as that seller, not the service role.
export async function getSellerContextOrNull() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "seller") return null;

  return { supabase, user };
}
