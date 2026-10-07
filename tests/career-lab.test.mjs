import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { LAB_FIXTURES, validateLabRequest, runCareerLab } from "../lib/career-lab.ts";
import { isCareerLabOwner } from "../lib/career-lab-access.ts";
import { CAREER_MODEL_VERSION } from "../lib/career-guidance-results.ts";
import { CAREER_DIMENSIONS, POSITION_WEIGHTS } from "../lib/career-guidance.ts";
import { ROLE_PRACTICES } from "../lib/career-lab-catalog.ts";

const request=(overrides={})=>({version:CAREER_MODEL_VERSION,synthetic:true,enabled:true,mode:"guided",answers:[],experience:"unknown",...overrides});
const fixture=(key,experience="unknown")=>runCareerLab(validateLabRequest(request({mode:"fixture",fixture:key,experience})));

test("only active owners have laboratory access",()=>{
 for(const profile of [null,{}, {role:"admin",status:"active"},{role:"user",status:"active"},{role:"owner",status:"suspended"},{role:"owner",status:"cancelled"}]) assert.equal(isCareerLabOwner(profile),false);
 assert.equal(isCareerLabOwner({role:"owner",status:"active"}),true);
});
test("request validation rejects real input, missing opt-in, stale model and forged scoring",()=>{
 for(const input of [null,[],request({synthetic:false}),request({enabled:false}),request({version:"old"}),request({scores:{autonomy:1}}),request({experience:"CV text"}),request({answers:[{key:"priority",option:NaN}]}),request({answers:[{key:"priority",option:0,value:1}]}),request({mode:"fixture",fixture:"unknown"}),request({answers:Array(12).fill({key:"priority",option:0})})]) assert.throws(()=>validateLabRequest(input));
});
test("out of order, duplicated and out of range activity answers are rejected",()=>{
 for(const answers of [[{key:"diagnose",option:0}],[{key:"priority",option:3}],[{key:"priority",option:0},{key:"priority",option:0}]]) assert.throws(()=>runCareerLab(validateLabRequest(request({answers}))),/NOT_EXPECTED|INVALID_ACTIVITY/);
});
test("guided transcripts finish after eight base and at most three nonrepeating comparisons",()=>{
 for(let seed=0;seed<32;seed++){
  const answers=[];let result=runCareerLab(request());
  const keys=new Set();
  while(result.activity){
   assert.ok(answers.length<11);
   assert.ok(!keys.has(result.activity.key));keys.add(result.activity.key);
   const option=(seed+answers.length)%result.activity.options.length;
   answers.push({key:result.activity.key,option});
   result=runCareerLab(validateLabRequest(request({answers})));
  }
  assert.equal(result.completedBase,8);assert.ok(result.completedExtra<=3);
  assert.ok(result.result);assert.equal(result.catalog.length,16);
  assert.ok(result.result.recommendations.every(r=>r.position!=="manager_team_lead"));
  assert.throws(()=>runCareerLab(request({answers:[...answers,{key:"choice",option:0}]})),/NOT_EXPECTED/);
 }
});
test("synthetic scenarios cover all positions and never return invalid numeric results",()=>{
 assert.equal(LAB_FIXTURES.length,35);
 for(const f of LAB_FIXTURES){
  const result=fixture(f.key);
  assert.equal(result.modelVersion,CAREER_MODEL_VERSION);
  assert.equal(result.catalog.length,16);
  for(const r of result.catalog){assert.ok(Number.isFinite(r.affinity));assert.ok(r.affinity>=0&&r.affinity<=1);}
 }
 for(const position of Object.keys(POSITION_WEIGHTS)) assert.equal(fixture(position).catalog[0].position,position);
});
test("empty and sparse scenarios retain missing dimensions and preliminary confidence",()=>{
 const empty=fixture("empty");assert.equal(empty.result.recommendations.length,0);assert.equal(empty.result.confidence,0);
 assert.equal(empty.dimensions.length,0);assert.ok(empty.catalog.every(r=>r.coverage===0));
 const sparse=fixture("sparse");assert.equal(sparse.dimensions.length,1);assert.equal(sparse.result.confidenceBand,"preliminary");
 assert.equal(sparse.dimensions[0].dimension,"organization_execution");
 assert.ok(!sparse.dimensions.some(d=>d.dimension==="technical_problem_solving"));
});
test("experience affects gates but never affinity; management remains progression",()=>{
 for(const position of ["tech_support_l3","key_account_manager","executive_assistant","manager_team_lead"]){
  const unknown=fixture(position),established=fixture(position,"established");
  const a=unknown.catalog.find(r=>r.position===position),b=established.catalog.find(r=>r.position===position);
  assert.equal(a.affinity,b.affinity);assert.equal(a.experienceGate,"insufficient_evidence");assert.equal(b.experienceGate,"ready_now");
  assert.ok(!established.result.recommendations.some(r=>r.position==="manager_team_lead"));
 }
});
test("conflicting capability and preference are visible without inventing other dimensions",()=>{
 const result=fixture("tension");assert.equal(result.dimensions.length,1);
 assert.equal(result.dimensions[0].tension.status,"mixed");
 assert.ok(CAREER_DIMENSIONS.includes(result.dimensions[0].dimension));
});
test("each position has a task, deliverable, review criterion and example",()=>{
 assert.deepEqual(Object.keys(ROLE_PRACTICES).sort(),Object.keys(POSITION_WEIGHTS).sort());
 for(const practice of Object.values(ROLE_PRACTICES)) for(const value of Object.values(practice)) assert.ok(value.length>20);
});
test("hidden page and endpoint independently enforce access; no laboratory persistence",async()=>{
 const page=await readFile(new URL("../app/internal/career-lab/page.tsx",import.meta.url),"utf8");
 const api=await readFile(new URL("../app/api/internal/career-lab/route.ts",import.meta.url),"utf8");
 const ui=await readFile(new URL("../app/internal/career-lab/career-lab.tsx",import.meta.url),"utf8");
 assert.match(page,/if\(!await careerLabOwner\(\)\) notFound\(\)/);
 assert.match(api,/if\(!await careerLabOwner\(\)\)/);
 assert.match(api,/private, no-store/);assert.match(api,/bytes>4096/);assert.match(api,/get\("origin"\)!==new URL\(req.url\).origin/);
 for(const source of [page,api,ui]) assert.doesNotMatch(source,/localStorage|sessionStorage|\.insert\(|\.update\(|\.upsert\(|consumeRateLimit|console\.log/);
});
