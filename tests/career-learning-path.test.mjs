import test from "node:test";
import assert from "node:assert/strict";
import { LEARNING_GUIDES } from "../lib/career-learning-content.ts";
import { startLearningPath, transitionLearningPath } from "../lib/career-learning-path.ts";
import { ROLE_PRACTICES } from "../lib/career-lab-catalog.ts";

test("all 16 positions have distinct introductory decisions, guided steps and challenge conditions", () => {
  assert.deepEqual(Object.keys(LEARNING_GUIDES).sort(), Object.keys(ROLE_PRACTICES).sort());
  assert.equal(new Set(Object.values(LEARNING_GUIDES).map(g => g.question)).size, 16);
  assert.equal(new Set(Object.values(LEARNING_GUIDES).map(g => g.twist)).size, 16);
  for (const guide of Object.values(LEARNING_GUIDES)) {
    assert.equal(guide.options.filter(option => option.correct).length, 1);
    assert.equal(guide.steps.length, 3);
    assert.ok(guide.concept.length > 100);
    assert.ok(guide.options.every(option => option.explanation.length > 40));
  }
});

test("a learner can choose a challenge immediately and return to foundations without a diagnostic gate", () => {
  const initial = startLearningPath("onboarding");
  const challenge = transitionLearningPath(initial, { type: "choose", goal: "challenge" });
  assert.equal(challenge.goal, "challenge");
  assert.deepEqual(challenge.reviewed, []);
  assert.equal(initial.goal, "foundation");
  const back = transitionLearningPath(challenge, { type: "choose", goal: "foundation" });
  assert.equal(back.history.length, 2);
  assert.equal(back.goal, "foundation");
});

test("a misconception gives corrective feedback without marking comprehension reviewed", () => {
  for (const position of Object.keys(LEARNING_GUIDES)) {
    const wrong = LEARNING_GUIDES[position].options.findIndex(o => !o.correct);
    const result = transitionLearningPath(startLearningPath(position), { type: "answer", option: wrong });
    assert.equal(result.feedback.correct, false);
    assert.equal(result.goal, "foundation");
    assert.deepEqual(result.reviewed, []);
    assert.equal(result.history[0].reason, "reinforce");
  }
});

test("comprehension and self-review support complete paths for every position", () => {
  for (const position of Object.keys(LEARNING_GUIDES)) {
    let state = startLearningPath(position);
    const option = LEARNING_GUIDES[position].options.findIndex(o => o.correct);
    state = transitionLearningPath(state, { type: "answer", option });
    assert.equal(state.feedback.correct, true);
    assert.equal(state.goal, "foundation", "the learner chooses the next mission");
    for (const goal of ["guided", "challenge"]) {
      state = transitionLearningPath(state, { type: "choose", goal });
      assert.equal(state.feedback, null);
      state = transitionLearningPath(state, { type: "review", checks: [true, true, true] });
    }
    assert.deepEqual(state.reviewed, ["foundation", "guided", "challenge"]);
    const repeat = transitionLearningPath(state, { type: "review", checks: [true, true, true] });
    assert.equal(repeat.reviewed.length, 3, "repeating a review cannot inflate progress");
  }
});

test("partial, missing or forged self-review cannot mark a mission reviewed", () => {
  const state = transitionLearningPath(startLearningPath("developer"), { type: "choose", goal: "guided" });
  for (const checks of [[], [true], [true, true, false], [true, true, 1], [true, true, true, true]]) {
    assert.equal(transitionLearningPath(state, { type: "review", checks }), state);
  }
  const initial = startLearningPath("developer");
  assert.equal(transitionLearningPath(initial, { type: "review", checks: [true, true, true] }), initial);
});

test("review progress survives goal changes while module state stays isolated", () => {
  const option = LEARNING_GUIDES.customer_success.options.findIndex(o => o.correct);
  const completed = transitionLearningPath(startLearningPath("customer_success"), { type: "answer", option });
  const next = transitionLearningPath(completed, { type: "choose", goal: "guided" });
  assert.deepEqual(next.reviewed, ["foundation"]);
  const unrelated = startLearningPath("sdr_bdr");
  assert.deepEqual(unrelated.reviewed, []);
});

test("invalid answer indices and goals cannot mutate the path", () => {
  const initial = startLearningPath("developer");
  for (const option of [-1, 100, NaN, .5]) assert.equal(transitionLearningPath(initial, { type: "answer", option }), initial);
  assert.equal(transitionLearningPath(initial, { type: "choose", goal: "unknown" }), initial);
  const challenge = transitionLearningPath(initial, { type: "choose", goal: "challenge" });
  assert.equal(transitionLearningPath(challenge, { type: "answer", option: 1 }), challenge);
});

test("long exploratory paths have bounded recent history", () => {
  let state = startLearningPath("project_manager");
  for (let i = 0; i < 200; i++) state = transitionLearningPath(state, { type: "choose", goal: i % 2 ? "guided" : "challenge" });
  assert.equal(state.history.length, 50);
  assert.equal(state.goal, "guided");
});
