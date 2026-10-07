import "server-only";
import { createAdminSupabase } from "./admin";
import { parsePublicPlans, PUBLIC_PLAN_NAMES } from "./public-plans";

export async function getPublicPlans() {
  try {
    // Existing RLS reserves plans to signed-in users. Publish only approved commercial fields.
    // Do not expose Stripe IDs, user data, or the server credential; do not broaden DB grants.
    const admin = createAdminSupabase();
    const { data, error } = await admin.from("plans")
      .select("name,price_monthly_cents,exercise_limit,exam_limit,project_limit")
      .eq("active", true).in("name", [...PUBLIC_PLAN_NAMES]);
    return error ? null : parsePublicPlans(data);
  } catch {
    return null;
  }
}
