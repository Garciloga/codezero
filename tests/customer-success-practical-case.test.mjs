import test from "node:test";
import assert from "node:assert/strict";
import { CS_CASE_STAGES, getCsDecisionFeedback } from "../lib/customer-success-practical-case.ts";
test("CS decisions give case-specific feedback and can be explored in any order", () => {
  const before = JSON.stringify(CS_CASE_STAGES);
  for (const stage of [...CS_CASE_STAGES].reverse()) {
    const responses = stage.choices.map(choice => getCsDecisionFeedback(stage.key, choice.key));
    assert.ok(responses.every(response => typeof response === "string" && response.length > 50));
    assert.equal(new Set(responses).size, stage.choices.length);
  }
  assert.equal(JSON.stringify(CS_CASE_STAGES), before);
});
test("unknown or cross-stage choices cannot display feedback from another decision", () => {
  assert.equal(getCsDecisionFeedback("missing", "clarify"), null);
  assert.equal(getCsDecisionFeedback("handoff", "result"), null);
  assert.equal(getCsDecisionFeedback("handoff", "<script>"), null);
});
