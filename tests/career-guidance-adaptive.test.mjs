import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseNextAdaptiveStep,
  findTiedPairs,
  diagnosticProgress,
} from "../lib/career-guidance-adaptive.ts";

test("base activities always finish before discriminators", () => {
  const next = chooseNextAdaptiveStep(
    [
      { position: "customer_success", affinity: .79 },
      { position: "account_manager", affinity: .77 },
    ],
    { completedBaseActivities: 6, completedDiscriminators: [] },
  );
  assert.equal(next.kind, "base");
  assert.equal(next.remainingBaseActivities, 2);
});

test("selects CSM vs AM discriminator for a practical tie", () => {
  const next = chooseNextAdaptiveStep(
    [
      { position: "customer_success", affinity: .79 },
      { position: "account_manager", affinity: .77 },
      { position: "customer_support", affinity: .63 },
    ],
    { completedBaseActivities: 8, completedDiscriminators: [] },
  );

  assert.equal(next.kind, "discriminator");
  assert.equal(next.discriminator.key, "csm_vs_am");
});

test("selects closest supported tie inside top five", () => {
  const next = chooseNextAdaptiveStep(
    [
      { position: "developer", affinity: .82 },
      { position: "tech_support_l2", affinity: .76 },
      { position: "pre_sales", affinity: .755 },
      { position: "customer_support", affinity: .65 },
    ],
    { completedBaseActivities: 8, completedDiscriminators: [] },
  );

  assert.equal(next.kind, "discriminator");
  assert.equal(next.discriminator.key, "ts_l2_vs_presales");
});

test("does not repeat an already completed discriminator", () => {
  const next = chooseNextAdaptiveStep(
    [
      { position: "customer_success", affinity: .79 },
      { position: "account_manager", affinity: .77 },
    ],
    {
      completedBaseActivities: 8,
      completedDiscriminators: ["csm_vs_am"],
    },
  );

  assert.equal(next.kind, "result");
  assert.equal(next.reason, "no_discriminator_available");
});

test("stops after maximum three discriminators", () => {
  const next = chooseNextAdaptiveStep(
    [
      { position: "account_manager", affinity: .80 },
      { position: "key_account_manager", affinity: .78 },
    ],
    {
      completedBaseActivities: 8,
      completedDiscriminators: ["csm_vs_am", "sdr_vs_ae", "onboarding_vs_pm"],
    },
  );

  assert.equal(next.kind, "result");
  assert.equal(next.reason, "max_discriminators_reached");
});

test("returns clear result when top positions are sufficiently separated", () => {
  const next = chooseNextAdaptiveStep(
    [
      { position: "developer", affinity: .86 },
      { position: "tech_support_l2", affinity: .70 },
      { position: "pre_sales", affinity: .60 },
    ],
    { completedBaseActivities: 8, completedDiscriminators: [] },
  );

  assert.equal(next.kind, "result");
  assert.equal(next.reason, "clear_enough");
});

test("findTiedPairs uses the practical five-point threshold", () => {
  const pairs = findTiedPairs([
    { position: "onboarding", affinity: .80 },
    { position: "project_manager", affinity: .765 },
    { position: "customer_success", affinity: .70 },
  ]);

  assert.equal(pairs.length, 1);
  assert.deepEqual(
    new Set(pairs[0].positions),
    new Set(["onboarding", "project_manager"]),
  );
});

test("progress caps base and discriminator counts", () => {
  const progress = diagnosticProgress({
    completedBaseActivities: 12,
    completedDiscriminators: [
      "csm_vs_am",
      "sdr_vs_ae",
      "onboarding_vs_pm",
      "admin_vs_exec",
    ],
  });

  assert.equal(progress.completedBase, 8);
  assert.equal(progress.completedExtra, 3);
  assert.equal(progress.minTotal, 8);
  assert.equal(progress.maxTotal, 11);
});
