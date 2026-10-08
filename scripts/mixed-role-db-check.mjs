import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {MIXED_UNITS,validateMixedUnits} from '../lib/mixed-role-content.ts';
const db=new PGlite(),id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');let checks=0;
const check=async(name,fn)=>{await fn();checks++;console.log('PASS',name);};
const original=readFileSync('scripts/role-training-db-check.mjs','utf8');
const fixture=original.match(/await db\.exec\(`(create role anon;[\s\S]*?)`\);/)[1];
const as=async(role,user,fn)=>{await db.exec('begin;set local role '+role);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);try{const result=await fn();await db.exec('commit');return result;}catch(e){await db.exec('rollback');throw e;}};
const call=(q,p=[])=>as('service_role',id(1),()=>db.query(q,p));
try{
 validateMixedUnits();await db.exec(new Function('id','return `'+fixture+'`')(id));
 await db.exec(readFileSync('supabase/migrations/20261008044128_production_role_training_and_project_approval.sql','utf8'));
 await db.exec(`create function codezero_private.effective_learning_plan(p_user uuid) returns text language sql stable as $$select plan_name from public.profiles where id=p_user$$;`);
 await db.exec(readFileSync('supabase/migrations/20261008065441_professional_routes_expansion.sql','utf8'));
 const before=(await db.query('select content_key,route_key,kind,competencies from public.learning_activity_catalog order by content_key')).rows;
 const profilesBefore=(await db.query('select * from public.learning_job_profiles order by position_key')).rows;
 await db.exec(readFileSync('supabase/migrations/20261008142517_mixed_role_routes.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/20261008162000_mixed_route_predecessor_consistency.sql','utf8'));
 await check('48 balanced steps reference existing catalog without changing existing profiles or activities',async()=>{
  assert.deepEqual((await db.query('select content_key,route_key,kind,competencies from public.learning_activity_catalog order by content_key')).rows,before);assert.equal(before.length,361);
  assert.deepEqual((await db.query("select * from public.learning_job_profiles where position_key<>'product_specialist' order by position_key")).rows,profilesBefore);
  assert.equal((await db.query('select count(*)::int n from public.learning_mixed_steps')).rows[0].n,48);
  assert.equal((await db.query("select count(*)::int n from public.learning_job_profiles where position_key='product_specialist'")).rows[0].n,1);
  const groups=(await db.query('select unit_key,work_type,count(*)::int n from public.learning_mixed_steps group by unit_key,work_type')).rows;assert.equal(groups.length,24);assert.ok(groups.every(g=>g.n===2));
 });
 const step=MIXED_UNITS[0].steps[0],source=(await db.query('select competencies from public.learning_activity_catalog where content_key=$1',[step.sourceKey])).rows[0];
 const scores=Object.fromEntries(source.competencies.map(k=>[k,2])),payload={company:'Faro',step:step.key,version:'mixed-v1'},draft='Evidencia ficticia de la QBR con periodo, responsables, fuentes y siguientes pasos pendientes de revisión humana. '.repeat(2);
 const save=(actor=id(3),org=id(10),request=id(500),key=step.key,body=payload)=>call('select public.submit_mixed_training($1,$2,$3,$4,$5,$6,$7,$8,$9) id',[actor,key,request,org,body,draft,scores,'guided',[]]);
 await check('release starts disabled and refuses saving until explicitly activated',async()=>{assert.equal((await db.query('select enabled from public.learning_mixed_release')).rows[0].enabled,false);await assert.rejects(()=>save());assert.equal((await db.query('select count(*)::int n from public.learning_practice_submissions')).rows[0].n,0);await db.exec('update public.learning_mixed_release set enabled=true');});
 await check('atomic saving preserves original submission and records context without autoapproval',async()=>{assert.equal((await save()).rows[0].id,id(500));assert.equal((await db.query('select count(*)::int n from public.learning_mixed_submission_steps')).rows[0].n,1);assert.equal((await db.query("select count(*)::int n from public.learning_evidence_history where review_source in ('manager','admin')")).rows[0].n,0);});
 await check('replay is idempotent; changed context, step or actor cannot reuse another request',async()=>{await save();await assert.rejects(()=>save(id(3),id(10),id(500),step.key,{...payload,fields:'changed'}));await assert.rejects(()=>save(id(3),id(10),id(500),MIXED_UNITS[0].steps[1].key));await assert.rejects(()=>save(id(2)));assert.equal((await db.query('select count(*)::int n from public.learning_practice_submissions')).rows[0].n,1);});
 await check('cross-company, suspended actors, invalid payload and unknown steps fail closed',async()=>{await assert.rejects(()=>save(id(3),id(20),id(501)));await assert.rejects(()=>save(id(5),null,id(502)));await assert.rejects(()=>save(id(3),id(10),id(503),'unknown'));await assert.rejects(()=>save(id(3),id(10),id(504),step.key,{text:'x'.repeat(24001)}));});
 await check('new RLS permits only the same submission scope and no client write or RPC execution',async()=>{
  assert.equal((await as('authenticated',id(3),()=>db.query('select * from public.learning_mixed_submission_steps'))).rows.length,1);
  assert.equal((await as('authenticated',id(4),()=>db.query('select * from public.learning_mixed_submission_steps'))).rows.length,0);
  for(const role of ['anon','authenticated']){await assert.rejects(()=>as(role,id(3),()=>db.query('update public.learning_mixed_release set enabled=true')));await assert.rejects(()=>as(role,id(3),()=>db.query('select public.submit_mixed_training($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id(3),step.key,id(505),id(10),payload,draft,scores,'guided',[]])));}
 });
 await check('reviewer in scope uses the existing human review; author cannot approve own work',async()=>{
  await call('select public.review_training_practice($1,$2,$3,$4,$5)',[id(2),id(500),scores,'Revisión humana de prueba que conserva evidencia, responsables, límites y fuentes del caso ficticio.',[]]);
  assert.equal((await db.query("select count(*)::int n from public.learning_evidence_history where submission_id=$1 and review_source='manager'",[id(500)])).rows[0].n,1);
  await assert.rejects(()=>db.query("insert into public.learning_evidence_history(submission_id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,reviewed_by) select id,user_id,organization_id,'test','test','deliverable',self_scores,assistance,'admin',user_id from public.learning_practice_submissions where id=$1",[id(500)]));
 });
 await check('each case requires the latest previous artifact from the same learner and organization',async()=>{
  const next=MIXED_UNITS[0].steps[1];const nextScores=Object.fromEntries((await db.query('select competencies from public.learning_activity_catalog where content_key=$1',[next.sourceKey])).rows[0].competencies.map(k=>[k,2]));
  const nextSave=(request,previous,actor=id(3),org=id(10))=>call('select public.submit_mixed_training($1,$2,$3,$4,$5,$6,$7,$8,$9)',[actor,next.key,request,org,{company:'Faro',previous_submission:previous},draft,nextScores,'guided',[]]);
  await assert.rejects(()=>nextSave(id(600),null));await assert.rejects(()=>nextSave(id(600),id(999)));await assert.rejects(()=>nextSave(id(600),id(500),id(4)));await assert.rejects(()=>nextSave(id(600),id(500),id(3),null));
  await nextSave(id(600),id(500));await save(id(3),id(10),id(601));
  await assert.rejects(()=>nextSave(id(602),id(500)));await nextSave(id(600),id(500));await nextSave(id(602),id(601));
 });
 await check('all 48 activities save their own context through the existing submission pipeline',async()=>{
  let n=700;for(const unit of MIXED_UNITS){let prior=null;for(const item of unit.steps){const request=id(n++),competencies=(await db.query('select competencies from public.learning_activity_catalog where content_key=$1',[item.sourceKey])).rows[0].competencies;
   await call('select public.submit_mixed_training($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id(3),item.key,request,null,{company:'Faro',previous_submission:prior,fields:{test:'fictional'},output:'test'},draft,Object.fromEntries(competencies.map(k=>[k,2])),'guided',[]]);prior=request;
  }}assert.equal((await db.query('select count(*)::int n from public.learning_mixed_submission_steps m join public.learning_practice_submissions s on s.id=m.submission_id where s.organization_id is null')).rows[0].n,48);
  assert.equal((await db.query("select count(*)::int n from public.learning_evidence_history where organization_id is null and review_source in ('manager','admin')")).rows[0].n,0);
 });
 await check('tables retain RLS, invoker functions and backend-only mutation privileges',async()=>{
  const tables=(await db.query("select relrowsecurity from pg_class where relname in ('learning_mixed_release','learning_mixed_steps','learning_mixed_submission_steps')")).rows;assert.equal(tables.length,3);assert.ok(tables.every(t=>t.relrowsecurity));
  assert.ok((await db.query("select prosecdef from pg_proc where proname in ('submit_mixed_training','reject_mixed_self_review')")).rows.every(f=>!f.prosecdef));
 });
 console.log('PASS',checks,'mixed-route PostgreSQL groups');
}finally{await db.close();}
