import "server-only";
import Stripe from "stripe";
import { annualBillingConfigured, basePriceId, type PaidPlan } from "./billing-interval";

export type AnnualPrices = Record<PaidPlan, number>;
const TTL_MS = 10 * 60 * 1000;
let cached: { at: number; value: AnnualPrices | null } | null = null;

/**
 * Annual amounts in MXN cents, read from Stripe so the page can never show a
 * figure that differs from what Stripe charges. Returns null — annual hidden —
 * when it is not configured or any price is not an active yearly MXN price.
 */
export async function getAnnualPrices(env: Record<string, string | undefined> = process.env): Promise<AnnualPrices | null> {
  if (!env.STRIPE_SECRET_KEY || !annualBillingConfigured(env)) return null;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  let value: AnnualPrices | null = null;
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const read = async (plan: PaidPlan) => {
      const price = await stripe.prices.retrieve(basePriceId(plan, "year", env)!);
      const valid = price.active && price.currency === "mxn" && price.recurring?.interval === "year"
        && price.recurring.interval_count === 1 && Number.isSafeInteger(price.unit_amount) && price.unit_amount! > 0;
      if (!valid) throw new Error("INVALID_ANNUAL_PRICE");
      return price.unit_amount!;
    };
    const [starter, pro] = await Promise.all([read("starter"), read("pro")]);
    value = { starter, pro };
  } catch {
    value = null;
  }
  cached = { at: Date.now(), value };
  return value;
}
