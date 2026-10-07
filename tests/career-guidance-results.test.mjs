import test from "node:test";
import assert from "node:assert/strict";
import { buildCareerProfileResult, CAREER_MODEL_VERSION } from "../lib/career-guidance-results.ts";
import { CAREER_DIMENSIONS } from "../lib/career-guidance.ts";

test("career result exposes model version and top recommendations", () => {
  const dimensionScores = Object.fromEntries(CAREER_DIMENSIONS.map((dimension) => [dimension, 0]));
  Object.assign(dimensionScores, {
    technical_problem_solving: .92,
    analysis_precision: .9,
    autonomy: .88,
    software_building: .95,
    ambiguity_tolerance: .72,
    customer_orientation: .25,
  });

  const result = buildCareerProfileResult({
    dimensionScores,
    evidence: Array.from({ length: 12 }, (_, index) => ({
      dimension: index % 2 === 0 ? "technical_problem_solving" : "analysis_precision",
      value: .9,
      source: "performance",
      activityKey: "a" + (index % 6),
    })),
  });

  assert.equal(result.modelVersion, CAREER_MODEL_VERSION);
  assert.equal(result.recommendations.length, 3);
  assert.equal(result.recommendations[0].position, "developer");
  assert.ok(result.recommendations[0].reasons.length > 0);
});

test("career result marks practical ties", () => {
  const result = buildCareerProfileResult({
    dimensionScores: {
      customer_orientation: .85,
      explanatory_communication: .88,
      organization_execution: .82,
      teaching_adoption: .8,
      project_management: .78,
      stakeholder_management: .76,
      ambiguity_tolerance: .8,
      analysis_precision: .72,
    },
    evidence: [],
  });

  assert.equal(typeof result.hasPracticalTie, "boolean");
});

test("senior roles apply experience gates", () => {
  const result = buildCareerProfileResult({
    dimensionScores: {
      people_management: .98,
      leadership_coordination: .95,
      stakeholder_management: .9,
      explanatory_communication: .85,
      ambiguity_tolerance: .85,
      organization_execution: .9,
      analysis_precision: .8,
      autonomy: .9,
    },
    evidence: [],
    experience: { ledPeople: true },
  });

  const manager = result.recommendations.find((item) => item.position === "manager_team_lead");
  assert.ok(manager);
  assert.equal(manager.experienceGate, "near_ready");
});

test("result disclaimer avoids deterministic career claims", () => {
  const result = buildCareerProfileResult({
    dimensionScores: { customer_orientation: .8 },
    evidence: [],
  });

  assert.match(result.disclaimer, /orientativas/i);
  assert.match(result.disclaimer, /no son un diagnóstico/i);
});
