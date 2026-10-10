import test from "node:test";import assert from "node:assert/strict";
import {evaluateDraftReview,draftMinimumScore} from "../lib/draft-review-policy.ts";
const base={traineeId:"learner",reviewerId:"reviewer",level:1,completedPracticeIds:["a","b","c","d","e"],requiredPracticeIds:["a","b","c","d","e"],competencyScores:{accuracy:4,analysis:4,decisions:3,privacy:3,evidence:3},criticalErrors:[],evidenceReferences:["1","2","3","4","5"],observedAt:"2026-10-10T13:00:00.000Z"};
test("stage thresholds increase at higher levels",()=>{assert.equal(draftMinimumScore(1),80);assert.equal(draftMinimumScore(4),84);assert.equal(draftMinimumScore(8),88);assert.equal(draftMinimumScore(12),90);});
test("reviewed evidence meets first-level policy only after human review",()=>{
 assert.equal(evaluateDraftReview(base).readyForHumanReviewedDraftProgress,true);
 for(const update of [{reviewerId:null},{reviewerId:"learner"},{criticalErrors:["data_exposure"]},{completedPracticeIds:["a","b"]},{evidenceReferences:[]},{competencyScores:{accuracy:4,analysis:4,decisions:4,privacy:2,evidence:4}},{observedAt:null}])
  assert.equal(evaluateDraftReview({...base,...update}).readyForHumanReviewedDraftProgress,false,JSON.stringify(update));
 assert.equal(evaluateDraftReview({...base,level:15}).readyForHumanReviewedDraftProgress,false);
 assert.equal(evaluateDraftReview({...base,level:15,competencyScores:{accuracy:4,analysis:4,decisions:4,privacy:3,evidence:4}}).readyForHumanReviewedDraftProgress,true);
});
test("no learner can pass with acknowledgement, duplicate evidence or unverified scores",()=>{
 assert.equal(evaluateDraftReview({...base,completedPracticeIds:["a","b","c","d","d"]}).readyForHumanReviewedDraftProgress,false);
 assert.equal(evaluateDraftReview({...base,evidenceReferences:["same","same","same","same","same"]}).readyForHumanReviewedDraftProgress,false);
 assert.equal(evaluateDraftReview({...base,competencyScores:{accuracy:4}}).readyForHumanReviewedDraftProgress,false);
});
