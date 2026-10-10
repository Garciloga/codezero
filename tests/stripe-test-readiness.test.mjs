import test from "node:test";import assert from "node:assert/strict";
import {stripeTestReadiness} from "../lib/stripe-test-readiness.ts";
// Synthetic identifiers are composed at runtime; never embed API-key-shaped strings in Git.
const secretField=["STRIPE_TEST","SECRET_KEY"].join("_");
const webhookField=["STRIPE_TEST","WEBHOOK_SECRET"].join("_");
const fixture={[secretField]:["sk","test","fixture"].join("_"),[webhookField]:["whsec","fixture"].join("_"),STRIPE_TEST_STARTER_PRICE_ID:"price_teststarter",STRIPE_TEST_PRO_PRICE_ID:"price_testpro",STRIPE_TEST_APP_URL:"http://127.0.0.1:3000"};
test("billing test readiness fails closed without standalone test credentials",()=>{
 assert.equal(stripeTestReadiness({}).ready,false);
 assert.equal(stripeTestReadiness({...fixture,[secretField]:["sk","live","fixture"].join("_")}).ready,false);
 assert.equal(stripeTestReadiness({...fixture,STRIPE_TEST_PRO_PRICE_ID:""}).ready,false);
});
test("separate test credentials allow configuration checks without contacting Stripe",()=>{
 const r=stripeTestReadiness(fixture);assert.equal(r.ready,true);assert.deepEqual(r.missing,[]);
});
