import test from "node:test";
import assert from "node:assert/strict";
import {
  POSITION_WEIGHTS,
  rankPositions,
  practicalTie,
  calculateProfileConfidence,
  experienceGate,
} from "../lib/career-guidance.ts";

for (const [position, weights] of Object.entries(POSITION_WEIGHTS)) {
  test(`canonical profile ranks ${position} first`, () => {
    const profile = Object.fromEntries(
      Object.entries(weights).map(([dimension, weight]) => [dimension, Math.min(1, 0.45 + weight * 0.55)])
    );
    const ranked = rankPositions(profile);
    assert.equal(ranked[0].position, position);
  });
}

test("practical ties use five point threshold", () => {
  assert.equal(practicalTie(.78, .75), true);
  assert.equal(practicalTie(.78, .70), false);
});

test("confidence stays preliminary with sparse evidence", () => {
  const confidence = calculateProfileConfidence([
    { dimension: "organization_execution", value: .9, source: "behavior", activityKey: "a1" },
    { dimension: "analysis_precision", value: .8, source: "preference", activityKey: "a1" },
  ]);
  assert.ok(confidence < .35);
});

test("confidence grows with diverse behavioral evidence", () => {
  const dimensions = [
    "technical_problem_solving",
    "analysis_precision",
    "autonomy",
    "troubleshooting",
    "documentation",
    "ambiguity_tolerance",
    "explanatory_communication",
    "organization_execution",
  ];
  const evidence = dimensions.flatMap((dimension, index) => [
    { dimension, value: .8, source: "behavior", activityKey: `a${index % 6}` },
    { dimension, value: .85, source: "performance", activityKey: `b${index % 6}` },
  ]);
  const confidence = calculateProfileConfidence(evidence);
  assert.ok(confidence >= .65);
});

test("manager requires progression evidence", () => {
  assert.equal(experienceGate("manager_team_lead", {}), "insufficient_evidence");
  assert.equal(experienceGate("manager_team_lead", { ledPeople: true }), "near_ready");
  assert.equal(
    experienceGate("manager_team_lead", { ledPeople: true, ownedProcessOrKpi: true }),
    "ready_now",
  );
});

test("tech support L3 requires more than affinity", () => {
  assert.equal(
    experienceGate("tech_support_l3", { advancedDebuggingEvidence: true }),
    "near_ready",
  );
  assert.equal(
    experienceGate("tech_support_l3", {
      advancedDebuggingEvidence: true,
      handledEscalations: true,
    }),
    "ready_now",
  );
});
