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
    .select("role,status")
    .eq("id", userId)
    .single();

  if (!data || data.status !== "active" || !["owner", "admin"].includes(data.role)) {
    throw new Error("FORBIDDEN");
  }
  return data;
}

export async function requireOwner(userId: string) {
  const data = await requireAdmin(userId);
  if (data.role !== "owner") throw new Error("FORBIDDEN");
  return data;
}

