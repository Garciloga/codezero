import test from "node:test";
import assert from "node:assert/strict";
import { isLevelUnlocked, isLevelIncludedInPlan } from "../lib/learning-rules.ts";

test("level 1 is always unlocked", () => {
  assert.equal(isLevelUnlocked(1, new Set()), true);
});

test("later levels require every previous level", () => {
  assert.equal(isLevelUnlocked(4, new Set([1, 2, 3])), true);
  assert.equal(isLevelUnlocked(4, new Set([1, 3])), false);
});

test("free access is limited to level 1", () => {
  assert.equal(isLevelIncludedInPlan(1, "free"), true);
  assert.equal(isLevelIncludedInPlan(2, "free"), false);
});

test("paid plans can access all levels", () => {
  for (const plan of ["starter", "pro", "enterprise"]) {
    assert.equal(isLevelIncludedInPlan(15, plan), true);
  }
});

test("owner and admin bypass plan limits", () => {
  assert.equal(isLevelIncludedInPlan(15, "free", "owner"), true);
  assert.equal(isLevelIncludedInPlan(15, "free", "admin"), true);
});
