import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {startAdvanced,sceneFor,advancedOptions,applyAdvancedDecision,replayAdvanced,replayAdvancedPartial,advancedSummary,recommendAdvanced} from "../lib/advanced-assessment.ts";
import {ADVANCED_OPTION_IDS} from "../lib/advanced-assessment-public.ts";
import {summarizeCompetency} from "../lib/competency-matrix.ts";
import {advancedWords,advancedScenarioText} from "../lib/localization/advanced-assessment.ts";
const reason="I would compare measured outcomes against a reliable baseline and record unresolved assumptions before selecting commitments.";
const fields={facts:reason,tradeoff:reason,verification:reason};
const best={intake:"triage",diagnosis:"cohort",stakeholders:"charter",tradeoff:"scoped",finance:"value",crisis:"recovery",evidence:"reconcile",renewal:"conditional",transfer:"disclose"};
const poor={intake:"freeze",diagnosis:"permissions",stakeholders:"delegate",tradeoff:"promise",finance:"invent",crisis:"conceal",evidence:"omit",renewal:"pressure",transfer:"suppress"};
function pathThrough(selections){
 let state=startAdvanced();const answers=[];
 while(state.step<8){
  const scene=sceneFor(state),choice=selections[scene];
  assert.ok(advancedOptions(state).some(x=>x.id===choice),scene);
  const answer={choice,...fields};answers.push(answer);
  state=applyAdvancedDecision(state,answer);
 }
 return {state,answers};
}
test("advanced simulation has eight reasoning stages, branching and cumulative business consequences",()=>{
 const {state,answers}=pathThrough(best);
 assert.equal(state.events.length,8);
 assert.equal(state.events[5].scene,"evidence");
 assert.ok(state.metrics.risk<68);
 assert.ok(state.metrics.budget<12000);
 assert.deepEqual(replayAdvanced(answers),state);
 assert.equal(replayAdvancedPartial(answers.slice(0,3)).step,3);
 const result=advancedSummary(state);
 assert.equal(result.critical,0);
 assert.ok(result.objective>=80);
 assert.ok(Array.isArray(recommendAdvanced(state)));
});
test("business crises branch after earlier mistakes and critical commitments never grant readiness",()=>{
 const {state}=pathThrough(poor);
 assert.equal(state.events[5].scene,"crisis");
 assert.ok(state.events.some(e=>e.critical));
 assert.equal(advancedSummary(state).readyForHumanReview,false);
 assert.ok(state.metrics.trust<44);
});
test("short rationales, altered choices, extra steps and unfinished cases are rejected",()=>{
 assert.throws(()=>applyAdvancedDecision(startAdvanced(),{choice:"triage",facts:"done",tradeoff:reason,verification:reason}),/JUSTIFICATION/);
 assert.throws(()=>applyAdvancedDecision(startAdvanced(),{choice:"missing",...fields}),/INVALID_OPTION/);
 assert.throws(()=>replayAdvanced([]),/UNFINISHED/);
 assert.throws(()=>replayAdvancedPartial(Array(9).fill({choice:"triage",...fields})),/INVALID_SEQUENCE/);
 const {state}=pathThrough(best);
 assert.throws(()=>applyAdvancedDecision(state,{choice:"triage",...fields}),/COMPLETED/);
});
test("all supported languages contain nine branching scenes with four public choices each",()=>{
 for(const lang of ["es","en","pt","fr"]){
  const copy=advancedWords[lang];
  assert.equal(copy.scenes.length,9);
  assert.ok(copy.consent.length>=50);
  assert.equal(copy.reviewRubric.length,4);
  for(const [key,ids] of Object.entries(ADVANCED_OPTION_IDS)){
   const row=advancedScenarioText(lang,key);
   assert.equal(row.choices.length,ids.length,lang+":"+key);
   assert.ok(row.context.length>50,lang+":"+key);
  }
 }
});
test("students never receive scoring weights and manager review is authoritative",()=>{
 const client=readFileSync(new URL("../app/components/advanced-assessment-player.tsx",import.meta.url),"utf8");
 const submit=readFileSync(new URL("../app/api/decisions/submit/route.ts",import.meta.url),"utf8");
 const step=readFileSync(new URL("../app/api/decisions/step/route.ts",import.meta.url),"utf8");
 const reviewer=readFileSync(new URL("../app/role-training/review/page.tsx",import.meta.url),"utf8");
 const migration=readFileSync(new URL("../supabase/migrations/20261010190000_advanced_decision_evidence.sql",import.meta.url),"utf8");
 const scope=readFileSync(new URL("../lib/advanced-assessment-server.ts",import.meta.url),"utf8");
 assert.doesNotMatch(client,/import\s+\{[^}]*\}\s+from ["']\.\.\/\.\.\/lib\/advanced-assessment["']/);
 assert.match(step,/replayAdvancedPartial/);
 assert.match(submit,/replayAdvanced\(request.inputs\)/);
 assert.match(submit,/request.org.*share_with_team/);
 assert.match(submit,/submit_training_practice/);
 assert.match(submit,/p_auto_results:\[\]/);
 assert.match(submit,/p_scores:\{diagnosis:0,data:0,planning:0\}/);
 assert.doesNotMatch(submit,/certificates|finish_exam_sitting|level_progress|\.update\(/);
 assert.match(reviewer,/ADVANCED_ACTIVITY_KEY/);
 assert.match(reviewer,/advanced.reviewRubric/);
 assert.match(scope,/organization_memberships/);
 assert.match(scope,/eq\("active",true\)/);
 assert.match(migration,/on conflict \(content_key\) do nothing/);
});

test("awaiting human review cannot reduce or increase previously validated competency levels",()=>{
 const now=new Date("2026-10-10T12:00:00Z");
 const base=[0,1,2].map(i=>({
  id:"human-"+i,user_id:"learner",organization_id:"team",
  activity_key:"previous-"+i,independent_key:"previous-"+i,
  kind:"deliverable",competency_scores:{diagnosis:3},assistance:"independent",
  review_source:"manager",observed_at:new Date(now.getTime()-(i+1)*86400000).toISOString(),
  critical_errors:[]
 }));
 const before=summarizeCompetency(base,"diagnosis",now);
 const pending={...base[0],id:"pending",activity_key:"cs-decision-evidence-v2",independent_key:"cs-decision-evidence-v2",
  competency_scores:{diagnosis:0},review_source:"self",assistance:"guided"};
 const during=summarizeCompetency([...base,pending],"diagnosis",now);
 assert.equal(during.level,before.level);
 assert.equal(during.count,before.count);
 assert.equal(during.weightedScore,before.weightedScore);
 const reviewed={...pending,id:"validated",review_source:"manager",competency_scores:{diagnosis:4},assistance:"independent"};
 const after=summarizeCompetency([...base,pending,reviewed],"diagnosis",now);
 assert.equal(after.count,before.count+1);
 assert.ok(after.weightedScore>=before.weightedScore);
});
