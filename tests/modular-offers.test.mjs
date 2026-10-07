import test from "node:test";
import assert from "node:assert/strict";
import { quoteModularPlan, getOfferState, UNREADY, FUTURE_ROUTES, ADDON_OFFERS } from "../lib/modular-offers.ts";
const ready = { tutor: true, customerSuccess: true, certificate: true };
test("future career catalog cannot be sold or unlocked by Pro or launch readiness", () => {
  assert.equal(FUTURE_ROUTES.length, 8);
  assert.equal(new Set(ADDON_OFFERS.map(offer => offer.key)).size, ADDON_OFFERS.length);
  for (const route of FUTURE_ROUTES) for (const plan of ["free", "starter", "pro"]) {
    assert.equal(getOfferState(route.key, plan, ready), "coming_soon");
    assert.throws(() => quoteModularPlan(plan, [route.key], ready));
  }
});
test("Starter combines the tutor promotion and route on one monthly quote", () => {
  assert.deepEqual(quoteModularPlan("starter", ["ai_tutor", "route_customer_success"], ready), {
    firstMonthCents: 44800, renewalCents: 49800, oneTimeCents: 0, included: [], startsAt: "next_renewal",
  });
});
test("Pro inclusions never charge twice and duplicate selections are idempotent", () => {
  const quote = quoteModularPlan("pro", ["ai_tutor", "ai_tutor", "route_customer_success", "verified_certificate"], ready);
  assert.equal(quote.firstMonthCents, 69900);
  assert.equal(quote.renewalCents, 69900);
  assert.equal(quote.oneTimeCents, 0);
  assert.equal(quote.included.length, 3);
});
test("inactive products remain blocked even when Pro lists an inclusion", () => {
  for (const plan of ["free", "starter", "pro"]) {
    for (const key of ["ai_tutor", "route_customer_success", "verified_certificate", "ai_simulator", "routes_three", "routes_all"]) {
      assert.equal(getOfferState(key, plan, UNREADY), "coming_soon");
      assert.throws(() => quoteModularPlan(plan, [key], UNREADY));
    }
  }
});
test("Free cannot generate a standalone 50-peso tutor charge and certificates have no separate charge", () => {
  assert.throws(() => quoteModularPlan("free", ["ai_tutor"], ready));
  assert.deepEqual(quoteModularPlan("free", ["verified_certificate"], ready), {
    firstMonthCents: 0, renewalCents: 0, oneTimeCents: 0, included: ["verified_certificate"], startsAt: "next_renewal",
  });
});
test("unknown modules fail closed and monthly and one-time prices remain separate", () => {
  for (const plan of ["unknown", "__proto__", "constructor"]) assert.throws(() => quoteModularPlan(plan, [], ready));
  assert.throws(() => quoteModularPlan("starter", ["unrecognized"], ready));
  const quote = quoteModularPlan("starter", ["ai_tutor", "verified_certificate"], ready);
  assert.equal(quote.firstMonthCents, 29900);
  assert.equal(quote.renewalCents, 34900);
  assert.equal(quote.oneTimeCents, 0);
});


test("certificate fees never appear on any base plan and exam packs are not sold",()=>{
 assert.ok(!ADDON_OFFERS.some(x=>x.key==="extra_quota"));
 for(const plan of ["free","starter","pro"]){const q=quoteModularPlan(plan,["verified_certificate","verified_certificate"],ready);assert.equal(q.oneTimeCents,0);assert.deepEqual(q.included,["verified_certificate"]);}
});
