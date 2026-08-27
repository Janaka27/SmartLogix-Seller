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

// Verifies the request's own session belongs to an admin, using RLS (not
// the service-role key) so it can't be spoofed. Returns null otherwise —
// callers should respond 401/403 before touching any service-role client.
export async function getAdminUserOrNull() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;

  return user;
}
