import test from "node:test";
import assert from "node:assert/strict";
import { DECISION_PILOT, startDecisionPilot, transitionDecisionPilot } from "../lib/career-decision-pilot.ts";
import { startLearningPath, transitionLearningPath } from "../lib/career-learning-path.ts";

const answer = (state, choice) => transitionDecisionPilot(state, { type: "answer", choice });
const next = state => transitionDecisionPilot(state, { type: "continue" });

test("every pilot branch has a valid destination and an explained consequence; all nodes are reachable", () => {
  const reached = new Set();
  const visit = key => {
    if (reached.has(key)) return;
    reached.add(key);
    const node = DECISION_PILOT[key];
    assert.ok(node, key);
    assert.equal(new Set(node.choices.map(c => c.key)).size, node.choices.length);
    for (const choice of node.choices) {
      assert.ok(choice.consequence.length > 70, `${key}/${choice.key} needs an explanation`);
      visit(choice.next);
    }
  };
  visit("rule");
  assert.deepEqual([...reached].sort(), Object.keys(DECISION_PILOT).sort());
});

test("a misconception opens support only after showing its consequence and does not count comprehension", () => {
  const initial = startDecisionPilot();
  assert.equal(next(initial), initial);
  const feedback = answer(initial, "hide");
  assert.equal(feedback.node, "rule");
  assert.equal(feedback.feedback.next, "rule_support");
  assert.deepEqual(feedback.checks, []);
  assert.equal(answer(feedback, "define"), feedback, "cannot bypass unread consequence with another submission");
  const support = next(feedback);
  assert.equal(support.node, "rule_support");
  const retry = next(answer(support, "retry"));
  assert.equal(retry.node, "rule");
  assert.deepEqual(next(answer(retry, "define")).checks, ["rule"]);
  assert.deepEqual(initial, startDecisionPilot(), "transitions do not mutate earlier state");
});

test("learner can explore another branch and close without silently marking pending checks complete", () => {
  let state = next(answer(startDecisionPilot(), "accept"));
  state = next(answer(state, "explore"));
  assert.equal(state.node, "server");
  state = next(answer(state, "trust"));
  state = next(answer(state, "explore"));
  state = next(answer(state, "matrix"));
  assert.equal(state.node, "reflection");
  state = next(answer(state, "finish"));
  assert.equal(state.node, "complete");
  assert.deepEqual(state.checks, ["tests"]);
  assert.equal(answer(state, "define"), state);
});

test("three applied criteria are unique across retries; back, reflection and restart remain available", () => {
  let state = next(answer(startDecisionPilot(), "define"));
  state = next(answer(state, "validate"));
  state = next(answer(state, "matrix"));
  assert.deepEqual(state.checks, ["rule", "server", "tests"]);
  state = next(answer(state, "rule"));
  state = next(answer(state, "define"));
  assert.equal(state.checks.length, 3);
  const back = transitionDecisionPilot(state, { type: "back" });
  assert.equal(back.node, "rule");
  assert.equal(back.feedback, null);
  assert.deepEqual(back.checks, state.checks);
  assert.deepEqual(transitionDecisionPilot(back, { type: "restart" }), startDecisionPilot());
});

test("invalid choices do not mutate the pilot, and repeated exploration has bounded history", () => {
  const initial = startDecisionPilot();
  for (const choice of ["unknown", "__proto__", "matrix", "", 0, null]) assert.equal(answer(initial, choice), initial);
  assert.equal(transitionDecisionPilot(initial, { type: "back" }), initial);
  let state = initial;
  for (let i = 0; i < 60; i++) {
    state = next(answer(state, "hide"));
    state = next(answer(state, "retry"));
  }
  assert.equal(state.history.length, 30);
  assert.equal(state.back.length, 20);
});

test("pilot stays separate from affinity and introductory progress, survives goal changes and resets with the module", () => {
  let path = startLearningPath("developer");
  path = transitionLearningPath(path, { type: "pilot", action: { type: "answer", choice: "define" } });
  path = transitionLearningPath(path, { type: "pilot", action: { type: "continue" } });
  const changed = transitionLearningPath(path, { type: "choose", goal: "challenge" });
  assert.equal(changed.pilot.node, "server");
  assert.deepEqual(changed.reviewed, []);
  const other = startLearningPath("onboarding");
  assert.equal(other.pilot, null);
  assert.equal(transitionLearningPath(other, { type: "pilot", action: { type: "restart" } }), other);
  assert.deepEqual(startLearningPath("developer").pilot, startDecisionPilot());
});
