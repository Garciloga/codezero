import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root="docs/curriculum-drafts/2026-10/practice-packs";
const names=["grc-advanced","red-flags","cross-sell","upsell","retention","onboarding-30-60-90","ai-at-work","professional-languages","candidate-assessment","metrics-lab","employability","manager-toolkit"];
assert.deepEqual(fs.readdirSync(root).filter(name=>name.endsWith(".json")).sort(),names.map(name=>name+".json").sort(),"Twelve draft programs tracked");
const seen=new Set();
let totalUnits=0,totalPractices=0,totalLevels=0;
for(const name of names){
 const course=JSON.parse(fs.readFileSync(path.join(root,name+".json"),"utf8"));
 assert.equal(course.status,"draft",name+" not approved for publication");
 assert.equal(course.language,"es",name+" original text");
 assert.equal(course.gradingPolicy?.submissionAloneNeverUnlocks,true,name+" no superficial unlocking");
 assert.equal(course.gradingPolicy?.criticalErrorsAllowed,0,name+" no critical errors");
 assert.ok(course.gradingPolicy?.humanFinalApproval||course.gradingPolicy?.manualApproval,name+" reviewer required");
 const levels=course.levels??[];
 const units=levels.flatMap(level=>level.units??[]);
 assert.ok(levels.length>=5,name+" authored stages exist");
 assert.equal(units.length,course.unitsCount,name+" stored units count");
 assert.equal(units.length*5,course.practicesCount,name+" five practices per unit");
 assert.deepEqual(levels.map(level=>level.number),levels.map((_,i)=>i+1),name+" stage numbering");
 for(const unit of units){
   assert.ok(unit.title?.length>=6,name+" named unit");
   assert.ok(unit.reading?.principle?.length>=200,name+" substantial context");
   assert.ok(unit.reading?.workedCase?.length>=200,name+" worked case");
   assert.equal(unit.practices?.length,5,name+" five distinct exercises");
   assert.equal(new Set(unit.practices.map(x=>x.type)).size,5,name+" five formats");
   for(const exercise of unit.practices){
     assert.ok(!seen.has(exercise.id),exercise.id+" unique exercise");
     seen.add(exercise.id);
     assert.equal(exercise.requiresHumanReview,true,exercise.id+" reviewed");
     assert.equal(exercise.allowCompletionByAcknowledgement,false,exercise.id+" no mere acknowledgement");
   }
 }
 totalUnits+=units.length;
 totalPractices+=course.practicesCount;
 totalLevels+=levels.length;
}
assert.equal(totalUnits,246);
assert.equal(totalPractices,1230);
assert.equal(seen.size,1230);
const editorial=fs.readFileSync("lib/draft-expanded-curriculum.ts","utf8");
const topics=editorial.match(/export const FIFTEEN_LEVEL_TOPICS=([\s\S]*?)\} as const;/)?.[1]??"";
for(const name of names){
 const topic=topics.match(new RegExp('"'+name+'": "([^"]+)"'));
 assert.ok(topic,name+" included in expanded map");
 assert.equal(topic[1].split(";").length,15,name+" proposed stages");
}
const help=fs.readFileSync("lib/company-help-content.ts","utf8");
assert.equal((help.match(/state:"Borrador · no disponible"/g)??[]).length,12,"All modules labelled non-public");
assert.ok((help.match(/\{q:/g)??[]).length>=35,"Enterprise manual FAQs expanded");
const guide=fs.readFileSync("app/guides/companies/page.tsx","utf8");
assert.ok(guide.includes("h.modules.map"),"All modules visible in future guide");
assert.ok(guide.includes("h.steps.map"),"Illustrated guide preserved");
const roadmap=fs.readFileSync("lib/product-roadmap.ts","utf8");
for(const key of ["android_app","ios_app","team_course_assignment"]){
 assert.ok(roadmap.includes("key: '"+key+"'"),key+" visible in future roadmap");
}
const policy=fs.readFileSync("lib/draft-course-assignment-policy.ts","utf8");
assert.ok(policy.includes("workspaceSandboxEnabled(env)"),"Assignments confined to isolated sandbox");
assert.ok(policy.includes('CODEZERO_DRAFT_COURSE_ASSIGNMENTS==="1"'),"Explicit opt-in flag");
const home=fs.readFileSync("app/(public)/page.tsx","utf8");
assert.equal([...home.matchAll(/<Link\b(?![^>]*\bprefetch=\{false\})[^>]*>/g)].length,0,"Public marketing routes disable nonessential RSC prefetch");
console.log("Draft integrity PASS",JSON.stringify({programs:names.length,authoredStages:totalLevels,units:totalUnits,practices:totalPractices,editorialStages:15,publicRelease:false}));
