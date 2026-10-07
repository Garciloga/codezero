import test from "node:test";
import assert from "node:assert/strict";
import { PRACTICE_ACTIVITIES, API_LABS, gradePractice, simulateApi, skillPracticeCoverage, weeklyPracticePlan } from "../lib/practice-learning.ts";

test("ordered practice rejects partial, duplicated and untrusted answers", () => {
  const activity = PRACTICE_ACTIVITIES.find(item => item.id === "handoff");
  assert.equal(gradePractice(activity, ["1", "0", "3", "2"]), true);
  for (const input of [["1", "0", "3"], ["1", "1", "3", "2"], [1, 0, 3, 2], "1,0,3,2", null]) assert.equal(gradePractice(activity, input), false);
});
test("written code practice normalizes only appropriate answers without evaluating code", () => {
  const sql = PRACTICE_ACTIVITIES.find(item => item.id === "sql-filter");
  const output = PRACTICE_ACTIVITIES.find(item => item.id === "python-output");
  assert.equal(gradePractice(sql, " where "), true);
  assert.equal(gradePractice(sql, "WHERE 1=1; DROP TABLE users"), false);
  assert.equal(gradePractice(output, " 2 "), true);
  for (const input of [2, "2+0", "eval('2')", "02", "2".repeat(201)]) assert.equal(gradePractice(output, input), false);
});
const request = lab => ({ method: lab.method, path: lab.path, token: lab.token, body: JSON.stringify(lab.payload), resolution: lab.resolution });
test("each integration case distinguishes an observed failure from a correct diagnosis", () => {
  assert.deepEqual(API_LABS.map(lab => lab.level), [11, 12, 13, 14, 15]);
  for (const lab of API_LABS) {
    assert.deepEqual(simulateApi(lab, request(lab)), { status: 200, output: lab.fault, diagnosed: true });
    assert.equal(simulateApi(lab, { ...request(lab), resolution: "invalid" }).diagnosed, false);
    assert.equal(simulateApi(lab, { ...request(lab), resolution: "" }).status, 200);
  }
});
test("simulator rejects external endpoints, incorrect methods, real tokens and broken contracts", () => {
  const lab = API_LABS[2]; const valid = request(lab);
  for (const [change, status] of [[{ path: "https://attacker.example" }, 404], [{ method: "DELETE" }, 405], [{ token: "real_secret" }, 401], [{ body: "{" }, 400], [{ body: "null" }, 422], [{ body: "[]" }, 422], [{ body: "{}" }, 422], [{ body: JSON.stringify({ ...lab.payload, amount_cents: "14900" }) }, 422], [{ body: JSON.stringify({ ...lab.payload, extra: true }) }, 422], [{ body: "x".repeat(4001) }, 400]]) {
    const result = simulateApi(lab, { ...valid, ...change }); assert.equal(result.status, status); assert.equal(result.diagnosed, false);
  }
});
test("competency coverage never counts duplicates or unknown evidence and distinguishes missing practice", () => {
  const coverage = skillPracticeCoverage(["api-11", "api-11", "invented", "sql-filter"], "integrations");
  assert.deepEqual(coverage, [{ skill: "sql", practiced: 1, total: 1 }, { skill: "apis", practiced: 1, total: 5 }, { skill: "security", practiced: 0, total: 1 }]);
  assert.deepEqual(skillPracticeCoverage([], "admin"), []);
});
test("weekly plan follows role-specific gaps and real calendar dates", () => {
  const plan = weeklyPracticePlan(["sql-filter"], "integrations", "2026-12-31");
  assert.deepEqual(plan.map(item => [item.skill, item.day]), [["apis", "2027-01-01"], ["security", "2027-01-02"]]);
  for (const start of ["", "2026-02-30", "invalid", "2026-1-1"]) assert.deepEqual(weeklyPracticePlan([], "integrations", start), []);
  assert.deepEqual(weeklyPracticePlan([], "unknown", "2026-10-07"), []);
});
