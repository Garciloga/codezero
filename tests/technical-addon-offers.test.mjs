import test from "node:test";
import assert from "node:assert/strict";
import {TECHNICAL_ADDON_OFFERS,technicalOffer,technicalQuote,technicalLegacyAccess,TECHNICAL_CHECKOUT_ENABLED} from "../lib/technical-addon-offers.ts";
import {ADDON_OFFERS,getOfferState,quoteModularPlan,UNREADY} from "../lib/modular-offers.ts";
test("approved technical prices are unique and purchase is fail-closed",()=>{
 const expected={technical_essential:14900,technical_complete:24900,technical_teams:12900};
 assert.deepEqual(Object.fromEntries(TECHNICAL_ADDON_OFFERS.map(o=>[o.key,o.priceCents])),expected);
 assert.equal(TECHNICAL_CHECKOUT_ENABLED,false);
 for(const o of TECHNICAL_ADDON_OFFERS){
  assert.equal(ADDON_OFFERS.filter(x=>x.key===o.key).length,1);
  assert.equal(getOfferState(o.key,"pro",UNREADY),"coming_soon");
  assert.throws(()=>quoteModularPlan("pro",[o.key],UNREADY));
  assert.equal(technicalOffer(o.key)?.priceCents,o.priceCents);
 }
});
test("team addon is per-seat with a hard minimum, no single-user upsell",()=>{
 assert.throws(()=>technicalQuote("technical_teams",4));
 assert.equal(technicalQuote("technical_teams",5).totalCents,64500);
 assert.equal(technicalQuote("technical_teams",6).totalCents,77400);
 assert.throws(()=>technicalQuote("technical_complete",5));
 assert.throws(()=>technicalQuote("technical_teams",0));
 assert.throws(()=>technicalQuote("technical_teams",5.2));
 assert.throws(()=>technicalQuote("__proto__"));
});
test("existing technical benefits stay available with the existing paid plan",()=>{
 for(const p of ["starter","pro","enterprise"])assert.equal(technicalLegacyAccess(p,"user"),true);
 assert.equal(technicalLegacyAccess("free","user"),false);
 assert.equal(technicalLegacyAccess("free","owner"),true);
 assert.equal(technicalLegacyAccess("free","admin"),true);
});
