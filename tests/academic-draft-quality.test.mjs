import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const base="docs/curriculum-drafts/2026-10/";
const paths=["grc-advanced","red-flags","cross-sell","upsell","retention"];
const files=Object.fromEntries(paths.map(name=>[name,JSON.parse(fs.readFileSync(base+name+".json","utf8"))]));
test("academic drafts are unpublished, progressive, with distinct cases and objectives",()=>{
 for(const [name,d] of Object.entries(files)){
  assert.equal(d.status,"draft",name);
  assert.equal(d.publicationGate.enabled,false,name);
  assert.equal(d.localeStates.es,"es");
  for(const l of ["en","pt","fr"])assert.equal(d.localeStates[l],"beta-pending");
  assert.equal(d.levels.length,name==="grc-advanced"?15:8);
  assert.equal(new Set(d.levels.map(l=>l.title)).size,d.levels.length);
  assert.equal(new Set(d.levels.map(l=>l.case.facts)).size,d.levels.length);
  let count=0;for(const lvl of d.levels){
    const units=lvl.learningUnits??lvl.lessons;assert.equal(units.length,3);
    assert.equal(new Set(units.map(u=>u.title)).size,3);
    for(const u of units){assert.ok(u.teaching.length>220);assert.ok(u.evidence.minWords>=200);assert.ok(u.evidence.required.length>=6);}
    const exam=lvl.assessment??lvl.exam;assert.equal((exam.prompts??exam.tasks).length,8);
    assert.equal((exam.prompts??exam.tasks).reduce((n,a)=>n+a.points,0),100);
    assert.equal(exam.passingPoints,80);
    assert.equal(lvl.decisions.length,2);
    for(const decision of lvl.decisions){assert.equal(decision.options.length,3);assert.equal(new Set(decision.options).size,3);assert.ok(decision.options[decision.correctIndex]);assert.ok(decision.feedback.length>65);count++;}
   }
   assert.equal(count,2*d.levels.length);
 }
});
test("all capstones require human review and sound scoring criteria",()=>{
 for(const [name,d] of Object.entries(files)){
  const caps=d.levels.filter(x=>x.capstone??x.project);
  assert.equal(caps.length,2);
  assert.equal(caps.at(-1).number,d.levels.length);
  for(const lv of caps){
   const x=lv.capstone??lv.project;assert.equal(x.mandatory,true);assert.equal(x.humanReview,true);
   assert.equal(x.rubric.reduce((n,r)=>n+r.weight,0),100);
   assert.ok(x.minWords>=1400||x.minimumWords>=1400);
  }
 }
});
test("ISO metadata tracks 2026 edition and protects certification boundaries",()=>{
 const d=files["grc-advanced"];assert.ok(d.sources.some(s=>s.id==="ISO 19011:2026"));
 assert.ok(d.sources.some(s=>s.id==="ISO/IEC 27701:2025"));
 assert.ok(d.disclaimer.toLowerCase().includes("no es certificado"));
 for(const l of d.levels)for(const u of l.learningUnits)assert.ok(u.references.length>0);
});
test("draft content cannot leak via public curriculum module references",()=>{
 const s=fs.readFileSync("lib/position-curriculum.ts","utf8");
 for(const key of paths)assert.equal(s.includes(base+key+".json"),false);
});
