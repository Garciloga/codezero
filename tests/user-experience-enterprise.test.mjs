import test from "node:test";
import assert from "node:assert/strict";
import { parseAppearance, appearanceStorageKey } from "../lib/user-appearance.ts";
import { canIssueBlockDiploma } from "../lib/block-diplomas.ts";
import { validOrganizationRoster, canViewEmployeeLearning, canManageOrganization, assignedProgress } from "../lib/enterprise-learning.ts";
test("appearance rejects unsupported colors and separates signed-in accounts", () => {
  assert.deepEqual(parseAppearance({mode:"dark",accent:"purple"}), {mode:"dark",accent:"purple"});
  for (const accent of ["__proto__", "constructor", "url(javascript:alert(1))"]) assert.equal(parseAppearance({accent}).accent, "green");
  assert.deepEqual(parseAppearance({mode:"invalid"}), {mode:"system",accent:"green"});
  assert.notEqual(appearanceStorageKey("a"), appearanceStorageKey("b"));
  assert.notEqual(appearanceStorageKey("visitor"), appearanceStorageKey(null));
});
const evidence = { lessonIds:[1,2], completedLessonIds:[1,2], examIds:[7], passedExamIds:[7], projectIds:[9], approvedProjectIds:[9] };
test("diploma requires every lesson, exam and required project", () => {
  assert.equal(canIssueBlockDiploma(evidence), true);
  assert.equal(canIssueBlockDiploma({...evidence, completedLessonIds:[1,1,30]}), false);
  assert.equal(canIssueBlockDiploma({...evidence, passedExamIds:[8]}), false);
  assert.equal(canIssueBlockDiploma({...evidence, approvedProjectIds:[]}), false);
  assert.equal(canIssueBlockDiploma({...evidence, lessonIds:[]}), false);
  assert.equal(canIssueBlockDiploma({...evidence, examIds:[]}), false);
  assert.equal(canIssueBlockDiploma({...evidence, projectIds:[], approvedProjectIds:[]}), true);
  assert.equal(canIssueBlockDiploma({...evidence, passedExamIds:[NaN]}), false);
});
const member = (userId,role,reportsTo=null) => ({organizationId:"org-a",userId,role,reportsTo,active:true});
const roster = [member("owner","owner"),member("manager","manager","owner"),member("supervisor","supervisor","manager"),member("learner","learner","supervisor"),member("peer","learner","owner")];
test("enterprise visibility follows organization and reporting line", () => {
  assert.equal(validOrganizationRoster(roster), true);
  for (const [viewer,target,expected] of [["owner","peer",true],["manager","learner",true],["manager","peer",false],["supervisor","learner",true],["supervisor","manager",false],["learner","learner",true],["learner","peer",false]])
    assert.equal(canViewEmployeeLearning("org-a",viewer,target,roster), expected);
  assert.equal(canViewEmployeeLearning("org-b","owner","learner",roster), false);
  assert.equal(canViewEmployeeLearning("org-a","unknown","learner",roster), false);
  assert.equal(canManageOrganization("org-a","owner",roster), true);
  assert.equal(canManageOrganization("org-a","manager",roster), false);
});
test("enterprise rejects cycles, cross-org parents, invalid roles and inactive memberships", () => {
  assert.equal(validOrganizationRoster([...roster,roster[0]]), false);
  assert.equal(validOrganizationRoster(roster.map(m=> m.userId==="owner" ? {...m,reportsTo:"learner"} : m)), false);
  assert.equal(validOrganizationRoster(roster.map(m=> m.userId==="learner" ? {...m,organizationId:"other"} : m)), false);
  assert.equal(validOrganizationRoster(roster.map(m=> m.userId==="learner" ? {...m,reportsTo:"missing"} : m)), false);
  assert.equal(validOrganizationRoster(roster.map(m=> m.userId==="learner" ? {...m,role:"superuser"} : m)), false);
  assert.equal(canViewEmployeeLearning("org-a","owner","learner",roster.map(m=>m.userId==="learner"?{...m,active:false}:m)), false);
});
test("progress counts assigned evidence once and preserves empty as no evidence", () => {
  assert.deepEqual(assignedProgress(["a","a","b"],["a","a","outside"]), {completed:1,total:2,percent:50});
  assert.equal(assignedProgress([],[]), null);
  assert.equal(assignedProgress([""],[""]), null);
});
