import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ownerDemoStrings} from "../lib/localization/owner-demo.ts";
const src=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("owner-only control center guards every authenticated entry point",()=>{
 const page=src("app/admin/demo/page.tsx"),route=src("app/api/admin/owner-self-reset/route.ts");
 assert.match(page,/await requireOwner\(user\.id\)/);
 assert.ok(page.indexOf("await requireOwner(user.id)")<page.indexOf("<OwnerSalesDemo"));
 assert.match(route,/isTrustedBrowserRequest\(req\)/);
 assert.match(route,/await requireOwner\(user\.id\)/);
 assert.match(route,/consumeRateLimit/);
 assert.match(route,/isUuid\(requestId\)/);
 assert.match(route,/phrase!=="REINICIAR MI PROGRESO"/);
 assert.match(route,/p_actor:user.id/);
 assert.match(route,/fee_cents:0/);
 assert.doesNotMatch(route,/fee_confirmed|LEARNING_RESET_FEE_CENTS/);
});
test("owner self reset is limited to personal education and retains billing, memberships, credentials and issued certificates",()=>{
 const sql=src("supabase/migrations/20261010193000_owner_self_learning_reset.sql");
 assert.match(sql,/role='owner' and status='active'/);
 assert.match(sql,/REINICIAR MI PROGRESO/);
 assert.match(sql,/lower\(btrim\(coalesce\(p_email/);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/personal_learning_submissions/);
 assert.match(sql,/where user_id=p_actor and organization_id is null/);
 assert.match(sql,/revoke all on function public.owner_reset_own_learning/);
 assert.match(sql,/grant execute on function public.owner_reset_own_learning[\s\S]*to service_role/);
 assert.match(sql,/fee_cents',0/);
 assert.doesNotMatch(sql,/\b(?:delete\s+from|truncate|drop\s+table)\s+public\.(?:certificates|profiles|organizations|organization_memberships|stripe_\w+|learning_assignments|learning_evidence\b)/i);
 assert.doesNotMatch(sql,/p_target/);
});
test("100% generated data never persists or pollutes real companies or customer metrics",()=>{
 const ui=src("app/components/owner-sales-demo.tsx");
 assert.match(ui,/useState\(0\)/);
 assert.match(ui,/onClick=\{generate\}/);
 assert.match(ui,/onClick=\{reset\}/);
 assert.match(ui,/perfectSalesDemo/);
 assert.match(ui,/completedLevels:15,totalLevels:15/);
 assert.match(ui,/competency_scores:\{\[key\]:4\}/);
 assert.match(ui,/review_source:"admin"/);
 assert.match(ui,/reevaluation_of:baseId\+"-base"/);
 assert.match(ui,/<CompetencyMap org="synthetic-demo-only"/);
 assert.match(ui,/readOnly/);
 assert.doesNotMatch(ui,/fetch\(|\.insert\(|\.upsert\(|\.update\(|\.delete\(|localStorage|sessionStorage|indexedDB/);
});
test("owner controls are provided in four supported languages",()=>{
 const a=Object.values(ownerDemoStrings);
 assert.equal(a.length,4);
 for(const lang of a){
  for(const key of ["resetTitle","resetWarning","email","phrase","resetDone","demoTitle","generate","resetDemo","fictitious","noStorage","notice"]){
   assert.ok(lang[key].length>=7,key);
  }
  assert.match(lang.phrase,/REINICIAR MI PROGRESO/);
 }
});
