import test from "node:test";
import assert from "node:assert/strict";
import { parsePublicPlans, planPrice, planLimit } from "../lib/public-plans.ts";
const rows = [
  { name: "pro", price_monthly_cents: 69900, exercise_limit: 1000, exam_limit: 50, project_limit: 20, stripe_price_id: "not-for-public-output" },
  { name: "free", price_monthly_cents: 0, exercise_limit: 20, exam_limit: 1, project_limit: 0 },
  { name: "starter", price_monthly_cents: 24900, exercise_limit: 200, exam_limit: 10, project_limit: 5 },
];
test("public pricing uses database cents and quotas in stable order and strips non-public fields", () => {
  const plans = parsePublicPlans(rows);
  assert.deepEqual(plans.map(p => p.name), ["free", "starter", "pro"]);
  assert.equal(plans[1].price_monthly_cents, 24900);
  assert.equal(plans[2].project_limit, 20);
  assert.ok(!JSON.stringify(plans).includes("stripe_price_id"));
  assert.equal(planPrice(24900), "$249");
  assert.equal(planPrice(24950), "$249.5");
  assert.equal(planLimit(-1), "Sin límite mensual");
});
test("incomplete, duplicated or unsafe commercial data fails closed instead of publishing misleading prices", () => {
  for (const invalid of [null, [], [...rows, rows[0]], [rows[0], rows[0], rows[1]], rows.map(r => ({ ...r, price_monthly_cents: "24900" })), rows.map(r => ({ ...r, price_monthly_cents: -1 })), rows.map(r => ({ ...r, exam_limit: -2 })), rows.map(r => ({ ...r, price_monthly_cents: NaN }))]) assert.equal(parsePublicPlans(invalid), null);
});
