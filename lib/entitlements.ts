import { createServerSupabase } from "./supabase-server";
import { createAdminSupabase } from "./admin";

export async function getEntitlements(userId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("account_entitlements")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Server-side quota gate.
 * IMPORTANT: call this from trusted server code before consuming a metered action.
 */
export async function consumeQuota(
  userId: string,
  metric: "exercises" | "exams" | "ai_queries" | "projects",
  amount = 1
) {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase.rpc("consume_quota", {
    p_user_id: userId,
    p_metric: metric,
    p_amount: amount
  });
  if (error) throw error;
  return data as { allowed: boolean; used: number; limit: number; remaining: number };
}

