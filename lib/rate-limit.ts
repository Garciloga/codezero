import "server-only";
import { createAdminSupabase } from "./admin";

export type RateLimitResult = {
  allowed: boolean;
  count: number;
  limit: number;
  retry_after_seconds: number;
};

export async function consumeRateLimit(
  bucketKey: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const admin = createAdminSupabase();
  const { data, error } = await admin.rpc("consume_api_rate_limit", {
    p_bucket_key: bucketKey,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) throw error;

  return data as RateLimitResult;
}
