import test from 'node:test';
import assert from 'node:assert/strict';
import {PRACTICE_EXTENSIONS,INTEGRATION_FIXTURES} from '../lib/workplace-practice-content.ts';
import {TRAINING_ACTIVITIES,findTrainingActivity} from '../lib/role-training-content.ts';
import {PROFESSIONAL_ACTIVITIES} from '../lib/professional-route-content.ts';

test('remote reinforcements and work-like projects reuse seven existing catalog activities',()=>{
 const catalog=[...TRAINING_ACTIVITIES,...PROFESSIONAL_ACTIVITIES];
 assert.equal(catalog.length,361);assert.equal(new Set(catalog.map(a=>a.key)).size,361);
 assert.equal(PRACTICE_EXTENSIONS.length,7);
 for(const extension of PRACTICE_EXTENSIONS){const activity=findTrainingActivity(extension.key);assert.ok(activity,extension.key);assert.ok(activity.task.includes(extension.task));assert.ok(activity.optionalPractice.includes(extension.acceptance));assert.equal(activity.rubric.length,4);}
 assert.equal(PRACTICE_EXTENSIONS.filter(a=>a.key.startsWith('common-')).length,4);
 assert.ok(PRACTICE_EXTENSIONS.filter(a=>a.key.startsWith('solutions-')).every(a=>findTrainingActivity(a.key).kind==='project'));
});
test('contract fixtures reconcile unique valid rows, reject missing currency and preserve unmatched records',()=>{
 const {crm,billing}=INTEGRATION_FIXTURES.contract;const seen=new Set(),matched=[],duplicate=[],rejected=[],unmatched=[];
 for(const row of crm){if(seen.has(row.account_id)){duplicate.push(row.account_id);continue;}seen.add(row.account_id);if(!row.currency){rejected.push(row.account_id);continue;}
 const bill=billing.find(b=>b.customer_id===row.account_id&&b.currency===row.currency&&b.amount===row.amount);(bill?matched:unmatched).push(row.account_id);}
 assert.deepEqual({matched,duplicate,rejected,unmatched},{matched:['F-01'],duplicate:['F-01'],rejected:['F-02'],unmatched:['F-03']});
});
test('webhook retry after uncertain response is reconciled instead of duplicated',()=>{
 const {events,ledger}=INTEGRATION_FIXTURES.webhook;const effects=new Set(ledger.map(row=>row.event_id));let newEffects=0;const reasons=[];
 for(const event of events){if(!event.signature_valid){reasons.push('invalid_signature');continue;}if(!event.body.account_id||!event.body.currency){reasons.push('invalid_body');continue;}if(!effects.has(event.event_id)){effects.add(event.event_id);newEffects++;}}
 assert.equal(newEffects,0);assert.equal(effects.size,1);assert.deepEqual(reasons,['invalid_signature','invalid_body']);
});
test('batch recovery preserves the checkpoint and leaves invalid rows rejected on a second run',()=>{
 const {source,destination,checkpoint}=INTEGRATION_FIXTURES.recovery;const target=new Map(destination.map(row=>[row.row,row]));const rejected=[];
 assert.equal(checkpoint,1);
 for(let attempt=0;attempt<2;attempt++)for(const row of source){if(!row.currency){if(!rejected.includes(row.row))rejected.push(row.row);continue;}if(!target.has(row.row))target.set(row.row,row);}
 assert.deepEqual([...target.keys()],[1,2]);assert.deepEqual(rejected,[3]);
});

test('employment certificate translations retain the limits on official degrees and guaranteed employment',async()=>{
 const fs=await import('node:fs');
 const limits={en:/not an official degree and does not guarantee employment/,pt:/não é um diploma oficial e não garante emprego/,fr:/ne constitue pas un diplôme officiel et ne garantit pas un emploi/};
 for(const lang of ['en','pt','fr']){const messages=JSON.parse(fs.readFileSync('lib/localization/'+lang+'-curriculum.json','utf8'));const statements=Object.entries(messages).filter(([source])=>source.startsWith('No tiene cargo adicional. Debes completar el contenido disponible, aprobar el examen'));assert.equal(statements.length,2);for(const [,translated]of statements)assert.match(translated,limits[lang]);}
});
