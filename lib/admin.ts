import { createClient } from "@supabase/supabase-js";

export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function requireAdmin(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!data || !["owner", "admin"].includes(data.role)) {
    throw new Error("FORBIDDEN");
  }
  return data;
}
