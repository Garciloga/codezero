import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const inspector = readFileSync(new URL("../app/admin/curriculum/page.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
const positionCatalog = readFileSync(new URL("../lib/position-curriculum.ts", import.meta.url), "utf8");

test("curriculum inspector authenticates a verified owner before using privileged database access", () => {
  assert.match(inspector, /await getServerUser\(\)/);
  assert.match(inspector, /await requireOwner\(user\.id\)/);
  assert.ok(inspector.indexOf("await requireOwner(user.id)") < inspector.indexOf("createAdminSupabase()"));
  assert.match(inspector, /catch \{ notFound\(\); \}/);
});

test("owner inspection is read-only, never awards learning progress or certificates", () => {
  assert.doesNotMatch(inspector, /\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(|method="post"|action=/i);
  assert.doesNotMatch(inspector, /finish_exam_sitting|complete_verified_lesson|submit_position_practice/);
  assert.match(inspector, /level_exams/);
  assert.match(inspector, /exam_solutions/);
});

test("inspector covers all currently published position programs and technical levels", () => {
  assert.match(inspector, /Object\.values\(POSITION_PROGRAMS\)/);
  assert.match(inspector, /db\.from\("levels"\)/);
  assert.match(inspector, /db\.from\("lessons"\)/);
  for (const key of [
    "customer_success", "onboarding", "account_manager", "customer_support",
    "tech_support_l3", "key_account_manager", "product_specialist",
    "project_manager", "manager_team_lead",
  ]) assert.match(positionCatalog, new RegExp(key));
  assert.match(dashboard, /operatorRole==='owner'.*href="\/admin\/curriculum"/);
});
