/**
 * Billing interval for the individual Starter and Pro plans.
 *
 * Monthly is the only interval sold today. Annual stays dormant until the two
 * annual Stripe price IDs exist in the environment: without them nothing is
 * offered, shown or accepted. Monthly quotas do not depend on the interval.
 */
export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
export type PaidPlan = "starter" | "pro";
type Env = Record<string, string | undefined>;

const PRICE_VARIABLES: Record<PaidPlan, Record<BillingInterval, string>> = {
  starter: { month: "STRIPE_STARTER_PRICE_ID", year: "STRIPE_STARTER_ANNUAL_PRICE_ID" },
  pro: { month: "STRIPE_PRO_PRICE_ID", year: "STRIPE_PRO_ANNUAL_PRICE_ID" },
};

/** Absent means monthly, so existing links and clients keep working. */
export function parseBillingInterval(value: unknown): BillingInterval | null {
  if (value === undefined || value === null || value === "") return "month";
  return typeof value === "string" && (BILLING_INTERVALS as readonly string[]).includes(value) ? (value as BillingInterval) : null;
}

export function basePriceId(plan: PaidPlan, interval: BillingInterval, env: Env): string | null {
  return env[PRICE_VARIABLES[plan][interval]]?.trim() || null;
}

/** Annual is offered only when both paid plans have an annual price, never one alone. */
export function annualBillingConfigured(env: Env): boolean {
  return Boolean(basePriceId("starter", "year", env) && basePriceId("pro", "year", env));
}

/** Price ID → plan for webhooks. Unset variables are skipped instead of sharing an empty key. */
export function basePriceToPlan(env: Env): Record<string, "starter" | "pro" | "enterprise"> {
  const map: Record<string, "starter" | "pro" | "enterprise"> = {};
  const add = (id: string | null | undefined, plan: "starter" | "pro" | "enterprise") => { if (id?.trim()) map[id.trim()] = plan; };
  for (const plan of ["starter", "pro"] as const) for (const interval of BILLING_INTERVALS) add(basePriceId(plan, interval, env), plan);
  add(env.STRIPE_ENTERPRISE_PRICE_ID, "enterprise");
  return map;
}
