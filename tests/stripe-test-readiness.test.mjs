import test from "node:test";import assert from "node:assert/strict";
import {stripeTestReadiness} from "../lib/stripe-test-readiness.ts";
const fixture={STRIPE_TEST_SECRET_KEY:"sk_test_fixture",STRIPE_TEST_WEBHOOK_SECRET:"whsec_fixture",STRIPE_TEST_STARTER_PRICE_ID:"price_teststarter",STRIPE_TEST_PRO_PRICE_ID:"price_testpro",STRIPE_TEST_APP_URL:"http://127.0.0.1:3000"};
test("billing test readiness fails closed without standalone test credentials",()=>{assert.equal(stripeTestReadiness({}).ready,false);assert.equal(stripeTestReadiness({...fixture,STRIPE_TEST_SECRET_KEY:"sk_live_danger"}).ready,false);assert.equal(stripeTestReadiness({...fixture,STRIPE_TEST_PRO_PRICE_ID:""}).ready,false);});
test("separate test credentials allow test setup checks, but not live checkout",()=>{const r=stripeTestReadiness(fixture);assert.equal(r.ready,true);assert.deepEqual(r.missing,[]);});
