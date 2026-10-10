/**
 * Pure draft grading policy. This is NOT connected to production progress,
 * employer decisions, certificates or payment. A named, distinct human reviewer
 * must assess evidence. Never grade merely by words submitted.
 */
export type DraftReview={
 traineeId:string;reviewerId:string|null;level:number;
 completedPracticeIds:string[];requiredPracticeIds:string[];
 competencyScores:Record<string,number>;criticalErrors:string[];
 evidenceReferences:string[];observedAt:string|null;
};
export function draftMinimumScore(level:number){
 return level>=12?90:level>=8?88:level>=4?84:80;
}
export function evaluateDraftReview(review:DraftReview){
 const reasons:string[]=[];
 const values=Object.values(review.competencyScores);
 if(!review.reviewerId||review.reviewerId===review.traineeId)reasons.push("human_independent_review_required");
 if(!review.observedAt||Number.isNaN(Date.parse(review.observedAt)))reasons.push("review_timestamp_required");
 if(review.evidenceReferences.length<5||new Set(review.evidenceReferences).size<5)reasons.push("five_distinct_evidence_references_required");
 if(review.requiredPracticeIds.length!==5||new Set(review.requiredPracticeIds).size!==5)reasons.push("invalid_assessment_structure");
 if(new Set(review.completedPracticeIds).size!==review.completedPracticeIds.length||review.requiredPracticeIds.some(id=>!review.completedPracticeIds.includes(id)))reasons.push("incomplete_exercises");
 if(values.length!==5||values.some(s=>!Number.isInteger(s)||s<0||s>4))reasons.push("five_valid_rubric_scores_required");
 if(values.some(s=>s<3))reasons.push("competency_below_three_of_four");
 if(review.criticalErrors.length>0)reasons.push("unresolved_critical_error");
 const score=values.length===5&&values.every(Number.isFinite)?values.reduce((a,b)=>a+b,0)*5:0;
 const required=draftMinimumScore(review.level);
 if(score<required)reasons.push("score_below_stage_threshold");
 return {readyForHumanReviewedDraftProgress:reasons.length===0,score100:score,minimumScore100:required,reasons};
}
