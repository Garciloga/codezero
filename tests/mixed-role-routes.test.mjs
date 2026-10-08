import test from 'node:test';
import assert from 'node:assert/strict';
import {MIXED_UNITS,validateMixedUnits} from '../lib/mixed-role-content.ts';
import {WORK_TYPES,COMPETENCY_WORK_TYPE,mixedLevels,mixedTeamLevels,lowestSupportedType} from '../lib/mixed-role-model.ts';
import {COMPETENCIES,competencyProfile} from '../lib/competency-matrix.ts';
import {findTrainingActivity} from '../lib/role-training-content.ts';
import {MIXED_SCENARIOS,TOOL_FIELDS,mixedStarter} from '../lib/mixed-role-scenarios.ts';
test('every case has a fictional dataset and every tool step has structured fields',()=>{
 for(const unit of MIXED_UNITS){assert.equal(MIXED_SCENARIOS[unit.key].company,'Faro');for(const step of unit.steps)if(step.format==='simulation')assert.ok(TOOL_FIELDS[step.category]?.length>=4);}
 const risk=MIXED_SCENARIOS['customer-success-risk'];assert.equal(risk.survey_response,6);assert.ok(!Object.hasOwn(risk,'nps'),'one survey response is not an aggregate NPS');
 const manager=MIXED_SCENARIOS['manager-rising-churn'];assert.ok(manager.portfolio.some(p=>p.opening_arr===0));assert.ok(manager.team.some(p=>p.csat_count===0));
});
test('code starters carry the actual previous artifact as inert JSON, including hostile text',()=>{
 const artifact={submission_id:'test',step_key:'previous',draft:'quote\'\\\n\"; DROP TABLE caso_faro; -- <script>',created_at:'2026-10-08',payload:{fields:{x:'hidden'},output:'1'}};
 for(const unit of MIXED_UNITS)for(const step of unit.steps){const starter=mixedStarter(unit,step,artifact);if(step.format==='python'){
  const literal=starter.match(/data = json.loads\((.*)\)/)[1];const decoded=JSON.parse(JSON.parse(literal));assert.equal(decoded.previous.draft,artifact.draft);assert.deepEqual(decoded.previous.fields,artifact.payload.fields);
 }else if(step.format==='sql'){
  const literal=starter.match(/INSERT INTO caso_faro VALUES \('([\s\S]*)'\);\n\n--/)[1];const decoded=JSON.parse(literal.replace(/''/g,"'"));assert.equal(decoded.previous.draft,artifact.draft);assert.equal(decoded.scenario.company,'Faro');
 }else assert.equal(starter,'');}
});
test('six complete units reuse canonical activities without creating duplicate routes',()=>{
 assert.equal(validateMixedUnits(),true);assert.equal(MIXED_UNITS.length,6);assert.equal(MIXED_UNITS.flatMap(u=>u.steps).length,48);
 assert.equal(new Set(MIXED_UNITS.flatMap(u=>u.steps.map(s=>s.key))).size,48);
 for(const u of MIXED_UNITS){assert.equal(u.company,'Faro');for(const type of WORK_TYPES)assert.equal(u.steps.filter(s=>s.type===type).length,2);
  for(const s of u.steps){const a=findTrainingActivity(s.sourceKey);assert.ok(a);assert.ok(a.competencies.includes(s.primary));assert.equal(COMPETENCY_WORK_TYPE[s.primary],s.type);}}
 assert.deepEqual(MIXED_UNITS.find(u=>u.key==='support-sync-incident').positions,['tech_support_l2','tech_support_l3']);
});
test('all ten competencies have one type and existing scale is preserved',()=>{
 assert.deepEqual(Object.keys(COMPETENCY_WORK_TYPE).sort(),Object.keys(COMPETENCIES).sort());
 assert.equal(mixedLevels([],null).length,4);assert.ok(mixedLevels([],null).every(t=>t.level===0&&!t.supported));
 assert.deepEqual(lowestSupportedType(mixedLevels([],null)),[]);
});
test('type calculations use validated competency levels, not self-assessment or weighted rubric',()=>{
 const now=new Date('2026-10-08T12:00:00Z');const scores={data:4,technical:4,diagnosis:4};
 const evidence=Array.from({length:3},(_,i)=>({id:String(i),user_id:'a',organization_id:null,activity_key:'work-'+i,independent_key:'work-'+i,kind:'deliverable',competency_scores:scores,assistance:'independent',review_source:i===2?'manager':'self',observed_at:'2026-10-07T12:00:00Z',critical_errors:[]}));
 const matrix=competencyProfile(evidence,null,now),types=mixedLevels(evidence,null,now),technical=types.find(t=>t.type==='tecnica');
 assert.equal(technical.level,matrix.competencies.filter(c=>COMPETENCY_WORK_TYPE[c.key]==='tecnica').reduce((s,c)=>s+c.level,0)/3);
 assert.equal(technical.level,3);assert.equal(technical.supported,true);assert.deepEqual(lowestSupportedType(types),['tecnica']);
 const self= evidence.map(e=>({...e,review_source:'self'}));assert.ok(mixedLevels(self,null,now).find(t=>t.type==='tecnica').level<3);
});
test('team aggregates the same per-person calculation and does not invent empty-team levels',()=>{
 assert.ok(mixedTeamLevels([]).every(t=>t.level===null&&t.people===0));
 const people=[mixedLevels([],null),mixedLevels([],null)];const aggregate=mixedTeamLevels(people);
 assert.ok(aggregate.every(t=>t.level===0&&t.people===2&&t.withEvidence===0&&t.belowTwo===0));
});
test('invalid type mappings and interleaving are rejected',()=>{
 const altered=structuredClone(MIXED_UNITS);altered[0].steps[0].primary='data';assert.throws(()=>validateMixedUnits(altered),/MIXED_SOURCE_MAPPING/);
 const unbalanced=structuredClone(MIXED_UNITS);unbalanced[0].steps[0].type='tecnica';assert.throws(()=>validateMixedUnits(unbalanced),/MIXED_TYPE_BALANCE/);
});
