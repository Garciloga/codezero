import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {TRAINING_ACTIVITIES} from '../lib/role-training-content.ts';
import {DEFAULT_JOB_PROFILES} from '../lib/competency-matrix.ts';
import {PROFESSIONAL_ACTIVITIES} from '../lib/professional-route-content.ts';
import {professionalCatalogSeed} from './professional-route-catalog.mjs';
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
 create table public.organization_memberships(organization_id uuid,user_id uuid,active boolean,role text,display_name text,primary key(organization_id,user_id));
 create table codezero_private.organization_access(organization_id uuid,viewer_id uuid,target_id uuid,primary key(organization_id,viewer_id,target_id));
 grant select on codezero_private.organization_access to authenticated,service_role;
 create table public.learning_assignments(organization_id uuid,user_id uuid,activity_key text,activity_type text check(activity_type in ('lesson','exam','project')),activity_id bigint,title text,competency text,primary key(organization_id,user_id,activity_key));
 create table public.learning_evidence(organization_id uuid,user_id uuid,activity_key text,completed boolean,score integer,observed_at timestamptz default now(),primary key(organization_id,user_id,activity_key));
 create table public.organization_audit_log(id uuid default gen_random_uuid(),organization_id uuid,actor_id uuid,target_id uuid,action text,metadata jsonb);
 insert into public.profiles(id,status,role) values('${id(1)}','active','owner'),('${id(2)}','active','student'),('${id(3)}','active','student'),('${id(4)}','active','student'),('${id(5)}','suspended','student');
 insert into public.organizations values('${id(10)}',true),('${id(20)}',true);
 insert into public.organization_memberships(organization_id,user_id,active,role) values('${id(10)}','${id(1)}',true,'owner'),('${id(10)}','${id(2)}',true,'manager'),('${id(10)}','${id(3)}',true,'learner'),('${id(20)}','${id(4)}',true,'learner');
 insert into codezero_private.organization_access values('${id(10)}','${id(1)}','${id(3)}'),('${id(10)}','${id(2)}','${id(3)}'),('${id(10)}','${id(3)}','${id(3)}'),('${id(20)}','${id(4)}','${id(4)}');
 grant all on all tables in schema public to service_role;grant select on public.profiles to authenticated;alter table codezero_private.organization_access enable row level security;create policy access_own on codezero_private.organization_access for select to authenticated using(viewer_id=auth.uid());alter table public.profiles enable row level security;create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());`);
 if(process.env.CODEZERO_ROLE_TRAINING_MIGRATION){await db.exec(readFileSync(process.env.CODEZERO_ROLE_TRAINING_MIGRATION,'utf8'));}else{
 await db.exec(readFileSync('supabase/sandbox/migrations/20261008032420_role_training_phases_0_1.sql','utf8'));
 await db.exec(readFileSync('supabase/sandbox/migrations/20261008033010_role_training_included_diploma.sql','utf8'));
 await db.exec(readFileSync('supabase/sandbox/migrations/20261008042551_project_approval_workflows.sql','utf8'));
 await db.exec(readFileSync('supabase/sandbox/migrations/20261008042816_project_review_delegation_scope.sql','utf8'));
 }
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
 await check('manager can review deliverable and project; stale reviews conflict',async()=>{
  review=(await call('select public.review_training_practice($1,$2,$3,$4,$5) id',[id(2),id(100),{communication:3,documentation:3},'Evidencia correcta y decisión justificada; confirmar el siguiente contacto.',[]])).rows[0].id;
  await reject(()=>call('select public.review_training_practice($1,$2,$3,$4,$5)',[id(2),id(100),{communication:4,documentation:4},'Otra revisión sin la versión previa para comprobar conflicto.',[]]));
  await submit(id(3),project,id(103));await call('select public.review_training_practice($1,$2,$3,$4,$5)',[id(2),id(103),{data:3,diagnosis:3,planning:3},'Proyecto revisado por manager con evidencia y seguimiento claro.',[]]);
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
 await db.exec(`insert into public.profiles(id,status,role) values('${id(6)}','active','student'),('${id(7)}','active','student'),('${id(8)}','active','student'),('${id(9)}','active','student');
 insert into public.organization_memberships(organization_id,user_id,active,role,display_name,learning_position_key) values('${id(10)}','${id(6)}',true,'supervisor','Supervisor A','customer_success'),('${id(10)}','${id(7)}',true,'learner','Revisor delegado','support'),('${id(10)}','${id(8)}',true,'admin','Admin de organización','customer_success'),('${id(10)}','${id(9)}',true,'supervisor','Supervisor B','customer_success');`);
 for(const n of [1,2,3,6,7,8,9]){
  await db.query('insert into codezero_private.organization_access values($1,$2,$2) on conflict do nothing',[id(10),id(n)]);
  for(const lead of [1,2])await db.query('insert into codezero_private.organization_access values($1,$2,$3) on conflict do nothing',[id(10),id(lead),id(n)]);
 }
 const selector=(patch={})=>({all:false,roles:[],positions:[],users:[],...patch});
 const audience=selector({users:[id(3)]});
 const stage=(name,required,reviewers)=>({name,required,reviewers});
 const save=(stages,key=null,version=0,enabled=true,priority=100,actor=id(2),a=audience)=>call('select public.save_project_review_flow($1,$2,$3,$4,$5,$6,$7,$8,$9) id',[actor,id(10),key,version,'Flujo de prueba',enabled,priority,a,stages]);
 const stages=[stage('Supervisores primero',2,selector({roles:['supervisor']})),stage('Colaborador delegado después',1,selector({users:[id(7)]}))];
 const scores={data:3,diagnosis:3,planning:3};
 const feedback='Evidencia clara con decisiones justificadas, responsable y siguiente comprobación del proyecto.';
 const vote=(actor,request,step,decision='approve',expected=null,values=scores)=>call('select public.review_training_practice($1,$2,$3,$4,$5,$6,$7,$8,$9) id',[id(actor),id(request),values,feedback,[] ,expected,'independent',step,decision]);
 let flowKey;
 await check('all roles and position/user selectors validate; malformed and cross-scope config denied',async()=>{
  for(const role of ['owner','admin','manager','supervisor','learner'])assert.equal((await call('select public.project_selector_valid($1) v',[selector({roles:[role]})])).rows[0].v,true);
  assert.equal((await call('select public.project_selector_valid($1) v',[{all:false,roles:[],users:[],wrong:[]}])).rows[0].v,false);
  await reject(()=>save([stage('Fuera de alcance',1,selector({users:[id(4)]}))]));
  await reject(()=>save([stage('Puesto desconocido',1,selector({positions:['invalid']}))]));
  await reject(()=>save([stage('Sin revisores',1,selector())]));
  await reject(()=>save(stages,null,0,true,100,id(7)));
  const f=(await save(stages)).rows[0].id;flowKey=(await db.query('select flow_key from public.learning_project_review_flows where id=$1',[f])).rows[0].flow_key;
 });
 await check('stage ordering and distinct-person quorum; no self, outsider or direct-helper bypass',async()=>{
  await submit(id(3),project,id(200));
  await reject(()=>vote(7,200,1));await reject(()=>vote(3,200,0));await reject(()=>vote(4,200,0));await reject(()=>vote(8,200,0));
  await reject(()=>call('select public.review_training_practice_direct($1,$2,$3,$4,$5)',[id(1),id(200),scores,feedback,[]]));
  const first=(await vote(6,200,0)).rows[0].id;
  await reject(()=>vote(6,200,0));await vote(6,200,0,'approve',first);
  assert.equal((await db.query('select current_stage from public.learning_project_review_runs where submission_id=$1',[id(200)])).rows[0].current_stage,0);
  assert.equal((await db.query("select count(*) n from public.learning_evidence_history where submission_id=$1 and review_source in ('manager','admin')",[id(200)])).rows[0].n,0);
  await vote(9,200,0);assert.equal((await db.query('select current_stage from public.learning_project_review_runs where submission_id=$1',[id(200)])).rows[0].current_stage,1);
  await reject(()=>vote(6,200,0));await vote(7,200,1);
  assert.equal((await db.query('select state from public.learning_project_review_runs where submission_id=$1',[id(200)])).rows[0].state,'approved');
  assert.equal((await db.query('select count(*) n from public.learning_evidence_history where approval_submission_id=$1',[id(200)])).rows[0].n,1);
  await reject(()=>vote(7,200,1));
 });
 await check('delegated learner can read only named project, without general learner evidence access',async()=>{
  const submissions=await as('authenticated',id(7),()=>db.query('select id from public.learning_practice_submissions'));assert.deepEqual(submissions.rows.map(x=>x.id),[id(200)]);
  assert.equal((await as('authenticated',id(7),()=>db.query('select * from public.learning_evidence_history'))).rows.length,0);
  assert.equal((await as('authenticated',id(4),()=>db.query('select * from public.learning_project_review_runs'))).rows.length,0);
  await reject(()=>as('authenticated',id(7),()=>db.exec('delete from public.learning_project_review_votes')));
 });
 await check('delegation reads revoke and restore when the authorizer scope changes',async()=>{
 await db.query('delete from codezero_private.organization_access where organization_id=$1 and viewer_id=$2 and target_id=$3',[id(10),id(2),id(7)]);
 assert.equal((await as('authenticated',id(7),()=>db.query('select * from public.learning_practice_submissions'))).rows.length,0);
 await db.query('insert into codezero_private.organization_access values($1,$2,$3)',[id(10),id(2),id(7)]);
 assert.equal((await as('authenticated',id(7),()=>db.query('select * from public.learning_practice_submissions'))).rows.length,1);
 });
 await check('change requests block quorum; failing rubric cannot approve; individual revisions remain immutable',async()=>{
  await submit(id(3),project,id(201));
  const veto=(await vote(6,201,0,'request_changes')).rows[0].id;await vote(9,201,0);
  assert.equal((await db.query('select state,current_stage from public.learning_project_review_runs where submission_id=$1',[id(201)])).rows[0].state,'changes_requested');
  await reject(()=>vote(6,201,0,'approve',veto,{...scores,data:2}));
  await vote(6,201,0,'approve',veto);assert.equal((await db.query('select current_stage from public.learning_project_review_runs where submission_id=$1',[id(201)])).rows[0].current_stage,1);
  assert.equal((await db.query('select count(*) n from public.learning_project_review_votes where submission_id=$1',[id(201)])).rows[0].n,3);
 });
 await check('new versions reorder/position-select new deliveries while existing runs retain original rules',async()=>{
  await save([stage('Manager primero',1,selector({roles:['manager']})),stage('Puesto CS',1,selector({positions:['customer_success']}))],flowKey,1);
  await reject(()=>save(stages,flowKey,1));
  await submit(id(3),project,id(202));
  const snap=(await db.query('select snapshot from public.learning_project_review_runs where submission_id=$1',[id(202)])).rows[0].snapshot;
  assert.equal(snap[0].reviewers[0].id,id(2));assert.ok(snap[1].reviewers.some(r=>r.id===id(8)));
  assert.equal((await db.query('select snapshot from public.learning_project_review_runs where submission_id=$1',[id(201)])).rows[0].snapshot[0].name,'Supervisores primero');
  await reject(()=>vote(6,202,1));await vote(2,202,0);await vote(8,202,1);
 });
 await check('impossible quorum and priority ties reject submission atomically; disabled flow falls back to scoped direct review',async()=>{
  await save([stage('Imposible',20,selector({roles:['supervisor']}))],flowKey,2);
  await reject(()=>submit(id(3),project,id(203)));assert.equal((await db.query('select count(*) n from public.learning_practice_submissions where id=$1',[id(203)])).rows[0].n,0);
  await save(stages,flowKey,3);const other=(await save(stages)).rows[0].id;
  await reject(()=>submit(id(3),project,id(204)));
  const otherKey=(await db.query('select flow_key from public.learning_project_review_flows where id=$1',[other])).rows[0].flow_key;
  await save(stages,otherKey,1,false);await save(stages,flowKey,4,false);
  await db.query('insert into codezero_private.organization_access values($1,$2,$3) on conflict do nothing',[id(10),id(6),id(3)]);await submit(id(3),project,id(205));assert.equal((await db.query('select count(*) n from public.learning_project_review_runs where submission_id=$1',[id(205)])).rows[0].n,0);await vote(6,205,null);
 });
 await check('capstones remain platform Admin-only and all self-review is denied',async()=>{
  const cap=(await db.query("select id from public.learning_activity_catalog where kind='capstone' limit 1")).rows[0].id;
  const own=id(206);await call('select public.submit_training_practice($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id(3),cap,own,id(10),feedback.repeat(3),{communication:3,diagnosis:3,planning:3},'independent',[],[]]);
  await reject(()=>call('select public.review_training_practice($1,$2,$3,$4,$5)',[id(2),own,{communication:3,diagnosis:3,planning:3},feedback,[]]));
  await reject(()=>call('select public.review_training_practice_direct($1,$2,$3,$4,$5)',[id(3),own,{communication:3,diagnosis:3,planning:3},feedback,[]]));
 });

 if(process.env.CODEZERO_PROFESSIONAL_ROUTES_CHECK==='1'){
 await db.exec(`create function codezero_private.effective_learning_plan(p_user uuid) returns text language sql stable as $$ select plan_name from public.profiles where id=p_user $$;`);
 const expansion=readFileSync('supabase/migrations/20261008065441_professional_routes_expansion.sql','utf8');
 assert.ok(expansion.includes(professionalCatalogSeed()));await db.exec(expansion);
 await check('seven curricula reuse the catalog, with twenty units and twenty-four integrators each',async()=>{
 const counts=(await db.query("select route_key,count(*)::integer n from public.learning_activity_catalog where route_key not in ('common','customer_success') group by route_key")).rows;
 assert.equal(counts.length,7);assert.ok(counts.every(r=>r.n===44));assert.equal(PROFESSIONAL_ACTIVITIES.length,308);
 });
 await check('new units use the existing submission and review history, without client grading authority',async()=>{
 const key='quality-unit-1-1',unit=(await db.query('select id from public.learning_activity_catalog where content_key=$1',[key])).rows[0].id;
 const scores={diagnosis:3,documentation:3,technical:3};
 await call('select public.submit_training_practice($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id(3),unit,id(500),id(10),feedback.repeat(3),scores,'independent',[1,0,1],[1,1,1]]);
 await call('select public.review_training_practice($1,$2,$3,$4,$5)',[id(2),id(500),scores,feedback,[]]);
 assert.ok((await db.query('select count(*)::integer n from public.learning_evidence_history where submission_id=$1',[id(500)])).rows[0].n>=2);
 await reject(()=>as('authenticated',id(3),()=>db.query('select public.issue_professional_route_diploma($1,$2,$3)',[id(3),id(10),'quality'])));
 await reject(()=>call('select public.issue_professional_route_diploma($1,$2,$3)',[id(3),id(10),'unknown']));
 await reject(()=>call('select public.issue_professional_route_diploma($1,$2,$3)',[id(3),id(10),'quality']));
 });
 await check('new route diploma requires reviewed high-weight evidence and approved capstone; replay returns one certificate',async()=>{
 await call('select public.set_training_position($1,$2,$3,$4)',[id(1),id(3),id(10),'developer']);
 const profile=DEFAULT_JOB_PROFILES.find(p=>p.position_key==='developer'),keys=new Set();
 for(const [competency,weight] of Object.entries(profile.weights))if(weight==='high')for(const unit of PROFESSIONAL_ACTIVITIES.filter(a=>a.route==='quality'&&a.key.includes('-unit-')&&a.competencies.includes(competency)).slice(0,3))keys.add(unit.key);
 let n=600;
 for(const key of keys){const activity=PROFESSIONAL_ACTIVITIES.find(a=>a.key===key),catalog=(await db.query('select id from public.learning_activity_catalog where content_key=$1',[key])).rows[0].id,request=id(n++),scores=Object.fromEntries(activity.competencies.map(k=>[k,3]));
 await call('select public.submit_training_practice($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id(3),catalog,request,id(10),feedback.repeat(3),scores,'independent',[1,0,1],[1,1,1]]);
 await call('select public.review_training_practice($1,$2,$3,$4,$5)',[id(2),request,scores,feedback,[]]);
 }
 await reject(()=>call('select public.issue_professional_route_diploma($1,$2,$3)',[id(3),id(10),'quality']));
 const cap=(await db.query("select id from public.learning_activity_catalog where content_key='quality-capstone'")).rows[0].id;
 await call('select public.submit_training_practice($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id(3),cap,id(699),id(10),feedback.repeat(3),{diagnosis:3,planning:3,communication:3},'independent',[],[]]);
 await call('select public.review_training_practice($1,$2,$3,$4,$5)',[id(1),id(699),{diagnosis:3,planning:3,communication:3},feedback,[]]);
 const diploma=()=>call('select public.issue_professional_route_diploma($1,$2,$3) id',[id(3),id(10),'quality']);
 assert.equal((await diploma()).rows[0].id,(await diploma()).rows[0].id);
 assert.equal((await db.query("select count(*)::integer n from public.certificates where certificate_type='professional-quality-v1'")).rows[0].n,1);
 });
 }
 console.log(checks+' database checks passed');
}finally{await db.close();}
