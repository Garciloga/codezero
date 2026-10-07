export const PUBLIC_PLAN_NAMES = ["free", "starter", "pro"] as const;
export type PublicPlanName = typeof PUBLIC_PLAN_NAMES[number];
export type PublicPlan = {
  name: PublicPlanName; price_monthly_cents: number;
  exercise_limit: number; exam_limit: number; project_limit: number;
};
export function parsePublicPlans(rows: unknown): PublicPlan[] | null {
  if (!Array.isArray(rows) || rows.length !== PUBLIC_PLAN_NAMES.length) return null;
  const result: PublicPlan[] = [];
  for (const name of PUBLIC_PLAN_NAMES) {
    const matching = rows.filter(row => row && typeof row === "object" && row.name === name);
    if (matching.length !== 1) return null;
    const row = matching[0];
    if (!Number.isSafeInteger(row.price_monthly_cents) || row.price_monthly_cents < 0) return null;
    if (![row.exercise_limit, row.exam_limit, row.project_limit].every(n => Number.isSafeInteger(n) && n >= -1)) return null;
    result.push({ name, price_monthly_cents: row.price_monthly_cents,
      exercise_limit: row.exercise_limit, exam_limit: row.exam_limit, project_limit: row.project_limit });
  }
  return result;
}
export const planPrice = (cents: number) => new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 2,
}).format(cents / 100);
export const planLimit = (limit: number) => limit === -1 ? "Sin límite mensual" : new Intl.NumberFormat("es-MX").format(limit);
