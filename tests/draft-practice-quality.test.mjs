import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const base="docs/curriculum-drafts/2026-10/practice-packs/";
const names=["grc-advanced","red-flags","cross-sell","upsell","retention","onboarding-30-60-90","ai-at-work","professional-languages","candidate-assessment","metrics-lab","employability","manager-toolkit"];
const expectedPracticeModes=["evidence-audit","quantitative-reasoning","decision-simulation","professional-deliverable","adversarial-defense"];
const packs=Object.fromEntries(names.map(x=>[x,JSON.parse(fs.readFileSync(base+x+".json","utf8"))]));
function expectedCalculation(name,data){
 const d=data;
 switch(name){
 case "grc-advanced":return 100*d.sin_aprobacion_verificable/d.exportaciones;
 case "red-flags":return 100*d.alertas_correctas/(d.alertas_correctas+d.alertas_falsas);
 case "cross-sell":return 100*d.pilotos_aceptados/d.necesidad_validada;
 case "upsell":return 100*d.usuarios_que_usan_premium/d.usuarios_activos;
 case "retention":return 100*(d.MRR_inicial-d.churn-d.contraccion+d.expansion)/d.MRR_inicial;
 case "onboarding-30-60-90":return 100*d.evidencias_verificadas/d.tareas_clave;
 case "ai-at-work":return 100*(d.afirmaciones_analizadas-d.afirmaciones_sin_fuente)/d.afirmaciones_analizadas;
 case "professional-languages":return 100*(d.adopcion_final_porcentaje-d.adopcion_inicial_porcentaje)/d.adopcion_inicial_porcentaje;
 case "candidate-assessment":return 100*d.casos_comparables_con_consentimiento/d.casos_revisados;
 case "metrics-lab":return 100*(d.MRR_inicio-d.churn-d.contraccion+d.expansion)/d.MRR_inicio;
 case "employability":return 100*d.entregables_personales_aprobados_para_portafolio/d.entregables_de_simulacion;
 case "manager-toolkit":return 100*d.reevaluaciones_humanas_con_evidencia/d.planes_de_refuerzo_programados;
 default:throw Error("Course calculation undefined: "+name);
 }
}
test("all twelve courses have unique and substantive five-format practice packs",()=>{
 let units=0,practices=0;const global=new Set();
 for(const [name,pack]of Object.entries(packs)){
  assert.equal(pack.status,"draft",name);
  assert.equal(pack.levels.length,name==="grc-advanced"?15:["red-flags","cross-sell","upsell","retention"].includes(name)?8:5,name);
  assert.equal(pack.gradingPolicy.criticalErrorsAllowed,0);
  assert.equal(pack.gradingPolicy.submissionAloneNeverUnlocks,true);
  for(const level of pack.levels){
   assert.equal(level.units.length,3,name+" "+level.number);
   assert.ok(level.scenarioShock.length>50);
   assert.equal(level.continuity.mustShowVersionHistory,true);
   for(const unit of level.units){
    units++;assert.ok(!global.has(unit.id),"Duplicate lesson key "+unit.id);global.add(unit.id);
    const r=unit.reading;
    assert.ok(r.principle.length>200,"Principle "+unit.id);
    assert.ok(r.workedCase.length>400,"Worked case "+unit.id);
    assert.ok(r.quantitativeReasoning.length>230,"Math "+unit.id);
    assert.ok(r.procedure.length>500,"Procedure "+unit.id);
    assert.ok(r.misconception.length>150,"Misconception "+unit.id);
    assert.equal(unit.publication.enabled,false);
    assert.equal(unit.practices.length,5,unit.id);
    assert.deepEqual(unit.practices.map(p=>p.type),expectedPracticeModes,unit.id);
    const pi=new Set();
    for(const exercise of unit.practices){
     practices++;
     assert.ok(!pi.has(exercise.id));pi.add(exercise.id);
     assert.ok((exercise.demand??exercise.task).length>180,exercise.id);
     assert.ok(exercise.required.length>=5,exercise.id);
     assert.ok(exercise.minWords>=180,exercise.id);
     assert.equal(exercise.requiresHumanReview,true);
     assert.equal(exercise.allowCompletionByAcknowledgement,false);
    }
    const weights=unit.instructor.rubric??unit.instructor.rubricDimensions;
    assert.equal(weights.length,5);
    assert.equal(weights.reduce((a,r)=>a+r.weight,0),100);
    assert.ok(unit.instructor.criticalErrors.length>=3);
    const ds=unit.practiceDataset;
    const vals=ds.data??ds.values;
    const expected=unit.instructor.referenceResult??unit.instructor.expectedValue;
    assert.ok(Number.isFinite(expected),unit.id);
    assert.ok(Math.abs(expectedCalculation(name,vals)-expected)<=0.00501,"Incorrect calculation: "+unit.id);
   }
  }
  assert.equal(pack.practicesCount,pack.unitsCount*5);
 }
 assert.equal(units,246);assert.equal(practices,1230);
});
test("answer keys remain in an authenticated owner-only module, not the public catalog",()=>{
 const source=fs.readFileSync("lib/draft-practice-packs.ts","utf8");
 const owner=fs.readFileSync("app/admin/curriculum/drafts/practices/page.tsx","utf8");
 assert.ok(source.includes('import "server-only"'));
 assert.match(owner,/requireOwner\(user.id\)/);
 assert.match(owner,/if\(!pack\)notFound\(\)/);
 assert.match(owner,/ownerDraftPractice\(query.course\)/);
 for(const path of ["app/(public)/programas/page.tsx","app/(public)/roadmap/page.tsx","lib/position-curriculum.ts"]){
  const src=fs.readFileSync(path,"utf8");
  assert.equal(src.includes("draft-practice-packs"),false,path);
  assert.equal(src.includes("practice-packs/grc-advanced"),false,path);
 }
});
test("recruiting and people programs prohibit automatic hiring decisions",()=>{
 for(const name of ["candidate-assessment","manager-toolkit","onboarding-30-60-90"]){
  const p=packs[name];assert.match(p.nonnegotiable,/No|Nunca/);
  assert.ok(p.levels.every(l=>l.units.every(u=>u.instructor.criticalErrors.length>=3)));
 }
});
