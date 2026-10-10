import test from "node:test";import assert from "node:assert/strict";
import {POSITION_PROGRAMS,positionProjectApproved} from "../lib/position-curriculum.ts";
import ui from "../lib/position-curricula/ui.json" with {type:"json"};
test("every role requires a final integrative project after level 14",()=>{
 const programs=Object.values(POSITION_PROGRAMS);assert.equal(programs.length,9);
 for(const p of programs){const final=p.projects.filter(x=>x.level===15);assert.equal(final.length,1,p.key);assert.equal(final[0].required,true);assert.ok(final[0].source.competencies.length>=1);}
});
test("human-reviewed rubric must be 3/4+ and free of critical errors",()=>{
 const p=POSITION_PROGRAMS.onboarding.projects.find(x=>x.level===15);
 const e={id:"1",activity_key:p.key,organization_id:null,review_source:"admin",reviewed_by:"other",observed_at:"2026-10-10T00:00:00Z",competency_scores:{communication:3,planning:4},critical_errors:[]};
 assert.equal(positionProjectApproved([e],p.key,null),true);
 assert.equal(positionProjectApproved([{...e,competency_scores:{communication:2}}],p.key,null),false);
 assert.equal(positionProjectApproved([{...e,critical_errors:["data_exposure"]}],p.key,null),false);
 assert.equal(positionProjectApproved([{...e,review_source:"self"}],p.key,null),false);
});
test("launch language labels and full rubric exist for ES EN PT FR",()=>{
 for(const lang of ["es","en","pt","fr"]){assert.ok(ui[lang].languageBeta.length>50);assert.equal(ui[lang].finalCriteria.length,5);assert.ok(ui[lang].finalApproval.includes("3/4"));}
});
