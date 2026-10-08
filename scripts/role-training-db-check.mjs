import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {TRAINING_ACTIVITIES} from '../lib/role-training-content.ts';
import {DEFAULT_JOB_PROFILES} from '../lib/competency-matrix.ts';
import {trainingCatalogSeed} from './role-training-catalog.mjs';
const db=new PGlite();let checks=0;
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const reject=async f=>assert.rejects(f);
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema codezero_private;grant usage on schema auth,public,codezero_private to authenticated,service_role;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.profiles(id uuid primary key,status text,role text,plan_name text default 'enterprise');
 create table public.certificates(id uuid primary key default gen_random_uuid(),user_id uuid,certificate_type text,title text,metadata jsonb,unique(user_id,certificate_type));
 create table public.organizations(id uuid primary key,active boolean);
 create table public.organization_memberships(organization_id uuid,user_id uuid,active boolean,role text,primary key(organization_id,user_id));
 create table codezero_private.organization_access(organization_id uuid,viewer_id uuid,target_id uuid);
 grant select on codezero_private.organization_access to authenticated,service_role;
 create table public.learning_assignments(organization_id uuid,user_id uuid,activity_key text,activity_type text check(activity_type in ('lesson','exam','project')),activity_id bigint,title text,competency text,primary key(organization_id,user_id,activity_key));
 create table public.learning_evidence(organization_id uuid,user_id uuid,activity_key text,completed boolean,score integer,observed_at timestamptz default now(),primary key(organization_id,user_id,activity_key));
 create table public.organization_audit_log(id uuid default gen_random_uuid(),organization_id uuid,actor_id uuid,target_id uuid,action text,metadata jsonb);
 insert into public.profiles(id,status,role) values('${id(1)}','active','owner'),('${id(2)}','active','student'),('${id(3)}','active','student'),('${id(4)}','active','student'),('${id(5)}','suspended','student');
 insert into public.organizations values('${id(10)}',true),('${id(20)}',true);
 insert into public.organization_memberships values('${id(10)}','${id(1)}',true,'owner'),('${id(10)}','${id(2)}',true,'manager'),('${id(10)}','${id(3)}',true,'learner'),('${id(20)}','${id(4)}',true,'learner');
 insert into codezero_private.organization_access values('${id(10)}','${id(1)}','${id(3)}'),('${id(10)}','${id(2)}','${id(3)}'),('${id(10)}','${id(3)}','${id(3)}'),('${id(20)}','${id(4)}','${id(4)}');
 grant all on all tables in schema public to service_role;`);
 await db.exec(readFileSync('supabase/sandbox/migrations/20261008032420_role_training_phases_0_1.sql','utf8'));
 await db.exec(readFileSync('supabase/sandbox/migrations/20261008033010_role_training_included_diploma.sql','utf8'));
 const seed=trainingCatalogSeed();assert.equal(readFileSync('supabase/sandbox/role_training_catalog_seed.sql','utf8'),seed);await db.exec(seed);
 const as=async(role,user,f)=>{await db.exec('set role '+role);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);try{return await f();}finally{await db.exec('reset role');}};
 const call=(q,p=[])=>as('service_role',id(1),()=>db.query(q,p));
 const aid=(await db.query("select id from public.learning_activity_catalog where content_key='common-communication'")).rows[0].id;
 const project=(await db.query("select id from public.learning_activity_catalog where content_key='cs-project-adoption'")).rows[0].id;
 const submit=(user,activity,request,org=id(10),recheck=null)=>call('select public.submit_training_practice($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[user,activity,request,org,'Una entrega educativa con observaciones, fuentes, decisiones, riesgos, responsables y seguimiento verificable. '.repeat(3),activity===aid?{communication:3,documentation:3}:{data:3,diagnosis:3,planning:3},'independent',[0,1,0],[1,1,1],recheck]);
 const check=async(name,f)=>{await f();checks++;console.log('PASS',name);};
 await check('same request replay preserves evidence count and conflicting body is rejected',async()=>{
  await submit(id(3),aid,id(100));await submit(id(3),aid,id(100));assert.equal((await db.query('select count(*) n from public.learning_practice_submissions')).rows[0].n,1);
  await reject(()=>submit(id(3),project,id(100)));assert.equal((await db.query('select count(*) n from public.learning_evidence_history')).rows[0].n,4);
 });
 await check('suspended actor and cross organization submission rejected',async()=>{await reject(()=>submit(id(5),aid,id(101)));await reject(()=>submit(id(4),aid,id(102)));});
 await check('learner sees own history; unrelated organization sees none; manager sees permitted target',async()=>{
  const rows=role=>as('authenticated',role,()=>db.query('select * from public.learning_evidence_history'));
  assert.equal((await rows(id(3))).rows.length,4);assert.equal((await rows(id(4))).rows.length,0);assert.equal((await rows(id(2))).rows.length,4);
 });
 await check('authenticated cannot write evidence or invoke privileged grading',async()=>{
  await reject(()=>as('authenticated',id(3),()=>db.query('select public.review_training_practice($1,$2,$3,$4,$5)',[id(3),id(100),{communication:4,documentation:4},'Feedback largo con evidencia y seguimiento verificable.',[]])));
  await reject(()=>as('authenticated',id(3),()=>db.exec('delete from public.learning_evidence_history')));
 });
 let review;
 await check('manager can review deliverable but not project or own work; stale reviews conflict',async()=>{
  review=(await call('select public.review_training_practice($1,$2,$3,$4,$5) id',[id(2),id(100),{communication:3,documentation:3},'Evidencia correcta y decisión justificada; confirmar el siguiente contacto.',[]])).rows[0].id;
  await reject(()=>call('select public.review_training_practice($1,$2,$3,$4,$5)',[id(2),id(100),{communication:4,documentation:4},'Otra revisión sin la versión previa para comprobar conflicto.',[]]));
  await submit(id(3),project,id(103));await reject(()=>call('select public.review_training_practice($1,$2,$3,$4,$5)',[id(2),id(103),{data:3,diagnosis:3,planning:3},'Esta revisión de proyecto debe quedar reservada para Admin.',[]]));
 });
 await check('reevaluation is rejected before thirty days and permits linked review afterward',async()=>{
  await reject(()=>submit(id(3),aid,id(104),id(10),review));await db.query("update public.learning_evidence_history set observed_at=now()-interval '31 days' where id=$1",[review]);
  await submit(id(3),aid,id(104),id(10),review);
 });
 await check('reinforcement uses existing assignments, date and before snapshot; cross scope denied',async()=>{
  await call("select public.assign_training_reinforcement($1,$2,$3,$4,now()+interval '7 days',$5)",[id(10),id(2),id(3),[aid],{communication:0}]);
  assert.equal((await db.query('select activity_type from public.learning_assignments')).rows[0].activity_type,'route_unit');
  await reject(()=>call("select public.assign_training_reinforcement($1,$2,$3,$4,now()+interval '7 days',$5)",[id(10),id(2),id(4),[aid],{communication:0}]));
 });
 await check('profiles are configurable only by owner and use optimistic versioning',async()=>{
  const p=DEFAULT_JOB_PROFILES.find(x=>x.position_key==='customer_success');
  await reject(()=>call('select public.save_training_job_profile($1,$2,$3,$4,$5)',[id(2),p.position_key,p.weights,p.expected,1]));
  assert.equal((await call('select public.save_training_job_profile($1,$2,$3,$4,$5) v',[id(1),p.position_key,p.weights,p.expected,1])).rows[0].v,2);
  await reject(()=>call('select public.save_training_job_profile($1,$2,$3,$4,$5)',[id(1),p.position_key,p.weights,p.expected,1]));
 });
 await check('route diploma rejects insufficient evidence and keeps existing certificates',async()=>{
  await reject(()=>call('select public.issue_training_route_diploma($1,$2)',[id(3),id(10)]));
  await db.query("insert into public.certificates(user_id,certificate_type,title,metadata) values($1,'customer-success-v1','Constancia anterior','{}')",[id(3)]);
  await reject(()=>as('authenticated',id(3),()=>db.query('select public.issue_training_route_diploma($1,$2)',[id(3),id(10)])));
  for(const key of ['communication','diagnosis','data','planning','collaboration'])for(let n=0;n<3;n++)await db.query("insert into public.learning_evidence_history(submission_id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,reviewed_by) values($1,$2,$3,$4,$4,'deliverable',$5,'independent','admin',$6)",[id(100),id(3),id(10),key+':'+n,{[key]:3},id(1)]);
  await db.query("insert into public.learning_evidence_history(submission_id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,reviewed_by) values($1,$2,$3,'cs-capstone-faro','cs-capstone-faro','capstone',$4,'independent','admin',$5)",[id(100),id(3),id(10),{communication:3,diagnosis:3,planning:3},id(1)]);
  const first=(await call('select public.issue_training_route_diploma($1,$2) id',[id(3),id(10)])).rows[0].id;
  assert.equal((await call('select public.issue_training_route_diploma($1,$2) id',[id(3),id(10)])).rows[0].id,first);
  assert.equal((await db.query('select count(*) n from public.certificates')).rows[0].n,2);
 });
 console.log(checks+' database checks passed');
}finally{await db.close();}
