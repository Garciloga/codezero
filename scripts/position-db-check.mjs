import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {trainingCatalogSeed} from './role-training-catalog.mjs';
import {CS_CURRICULUM_LESSONS,CS_CURRICULUM_EXAMS,POSITION_ITEMS,ONBOARDING_PROGRAM} from '../lib/position-curriculum.ts';
const db=new PGlite(),id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
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

await db.exec(trainingCatalogSeed());
await db.exec(`create function public.check_cs_course_access(p_user uuid) returns void language plpgsql security invoker as $$begin if not exists(select 1 from public.profiles where id=p_user and status='active' and plan_name in('pro','enterprise')) then raise exception 'PLAN_REQUIRED';end if;end$$;
create function public.company_learning_plan(p_actor uuid,p_org uuid) returns text language sql security invoker as $$select null::text$$;grant execute on function public.company_learning_plan(uuid,uuid) to service_role;
create table public.test_quota(user_id uuid primary key,used integer default 0,quota integer default 20);
insert into public.test_quota select id,0,20 from public.profiles;
create function public.consume_quota(p_user uuid,p_kind text,p_amount integer) returns jsonb language plpgsql security invoker as $$begin update public.test_quota set used=used+p_amount where user_id=p_user and used+p_amount<=quota;if not found then return '{"allowed":false}'::jsonb;end if;return '{"allowed":true}'::jsonb;end$$;
grant all on public.test_quota to service_role;grant execute on function public.check_cs_course_access(uuid),public.consume_quota(uuid,text,integer) to service_role;`);
const migration=readFileSync('supabase/migrations/20261008235031_position_curriculum.sql','utf8');await db.exec(migration);
await db.exec(readFileSync('supabase/migrations/20261009051500_position_programs.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261009102500_onboarding_answer_positions.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261009190000_account_manager_program.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261009210000_customer_support_program.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261009230000_tech_support_program.sql','utf8'));
let request=500;const submit=(user,key,org=id(10),answers=null,draft=null,req=null)=>{
 const item=POSITION_ITEMS.find(a=>a.key===key);return db.query('select submit_position_practice($1,$2,$3,$4,$5,$6,$7) result',[user,key,req??id(request++),org,draft??(['exam','diagnostic'].includes(item.type)?'':'Evidence, explicit constraints, owned decisions and next review with verifiable acceptance. '.repeat(4)),JSON.stringify(answers??item.decisions.map(d=>d.correct)),'guided']);
};
const reject=async f=>assert.rejects(f);
await db.exec('set role service_role');
await reject(()=>submit(id(5),'position-diagnostic-data'));
await reject(()=>submit(id(4),'position-diagnostic-data'));
await reject(()=>submit(id(3),'position-cs-l2-1'));
await reject(()=>submit(id(3),'position-cs-exam-1'));
await reject(()=>submit(id(3),'position-diagnostic-data',id(10),[99,0,0]));
await db.exec('reset role');await db.exec(`update profiles set plan_name='free' where id='${id(3)}'`);await db.exec('set role service_role');
await submit(id(3),'position-diagnostic-data');await reject(()=>submit(id(3),'position-cs-l1-1'));
await db.exec('reset role');await db.exec(`update profiles set plan_name='pro' where id='${id(3)}'`);await db.exec('set role service_role');
for(let n=1;n<=15;n++){
 for(const lesson of CS_CURRICULUM_LESSONS.filter(a=>a.level===n))await submit(id(3),lesson.key);
 if([8,15].includes(n)){
  await reject(()=>submit(id(3),'position-cs-exam-'+n));
  const submission=id(request++);await submit(id(3),'position-cs-project-'+n,id(10),[],'Project rationale with source, scope, numeric formulas, alternatives and verification. '.repeat(5),submission);
  await reject(()=>submit(id(3),'position-cs-exam-'+n));
  const item=POSITION_ITEMS.find(a=>a.key==='position-cs-project-'+n),scores=Object.fromEntries(item.source.competencies.map(k=>[k,3]));
  await reject(()=>db.query('select review_training_practice($1,$2,$3,$4,$5,null,$6)',[id(3),submission,JSON.stringify(scores),'Feedback with verifiable evidence and explicit acceptance criteria. ',[],'independent']));
  await db.query('select review_training_practice($1,$2,$3,$4,$5,null,$6)',[id(2),submission,JSON.stringify(scores),'Feedback with verifiable evidence and explicit acceptance criteria. ',[],'independent']);
 }
 const req=id(request++),exam='position-cs-exam-'+n;
 assert.equal((await submit(id(3),exam,id(10),null,'',req)).rows[0].result,'passed');
 assert.equal((await submit(id(3),exam,id(10),null,'',req)).rows[0].result,'passed');
}
assert.equal((await db.query(`select used from test_quota where user_id='${id(3)}'`)).rows[0].used,15);
assert.equal((await db.query(`select count(*) n from learning_practice_submissions s join learning_activity_catalog a on a.id=s.activity_id where a.content_key like 'position-cs-l%'`)).rows[0].n,92);
await db.exec('reset role');await db.exec(`update public.test_quota set quota=15 where user_id='${id(3)}'`);await db.exec('set role service_role');assert.equal((await submit(id(3),'position-cs-exam-15')).rows[0].result,'limit');
await reject(()=>submit(id(3),'position-cs-l2-1',id(20)));
// A second position: its own level gates, project gates, answer keys and certificate; Customer Success progress does not unlock it.
await db.exec('reset role');await db.exec(`update public.test_quota set quota=60 where user_id='${id(3)}'`);await db.exec('set role service_role');
const ob=ONBOARDING_PROGRAM,obExam=n=>ob.exams.find(a=>a.level===n).key;
await reject(()=>submit(id(3),'position-onboarding-l2-1'));
await reject(()=>submit(id(3),obExam(1)));
for(const lesson of ob.lessons.filter(a=>a.level===1))await submit(id(3),lesson.key);
const wrong=ob.exams[0].decisions.map(d=>(d.correct+1)%d.options.length);
assert.equal((await submit(id(3),obExam(1),id(10),wrong)).rows[0].result,'failed');
await reject(()=>submit(id(3),'position-onboarding-l2-1'));
assert.equal((await submit(id(3),obExam(1))).rows[0].result,'passed');
for(let n=2;n<=15;n++){
 for(const lesson of ob.lessons.filter(a=>a.level===n))await submit(id(3),lesson.key);
 const project=ob.projects.find(a=>a.level===n);
 if(project){
  await reject(()=>submit(id(3),obExam(n)));
  const submission=id(request++);await submit(id(3),project.key,id(10),[],'Project rationale with source, scope, numeric formulas, alternatives and verification. '.repeat(5),submission);
  await reject(()=>submit(id(3),obExam(n)));
  const scores=Object.fromEntries(project.source.competencies.map(k=>[k,3]));
  await db.query('select review_training_practice($1,$2,$3,$4,$5,null,$6)',[id(2),submission,JSON.stringify(scores),'Feedback with verifiable evidence and explicit acceptance criteria. ',[],'independent']);
 }
 assert.equal((await submit(id(3),obExam(n))).rows[0].result,'passed');
}
assert.equal(ob.projects.length,2);
assert.deepEqual((await db.query(`select certificate_type,metadata->>'curriculum_version' v from certificates where user_id='${id(3)}' order by 1`)).rows,[{certificate_type:'customer-success-positions-v1',v:'position-cs-v1'},{certificate_type:'onboarding-positions-v1',v:'position-onboarding-v1'}]);
assert.equal((await db.query(`select count(*) n from learning_practice_submissions s join learning_activity_catalog a on a.id=s.activity_id where a.content_key like 'position-onboarding-l%'`)).rows[0].n,92);
assert.equal((await db.query(`select public.position_level_passed($1,$2,15) cs,public.position_level_passed($1,$2,15,'onboarding') ob,public.position_level_passed($1,$2,1,'account_manager') other`,[id(3),id(10)])).rows[0].cs,true);
assert.deepEqual((await db.query(`select public.position_level_passed($1,$2,15,'onboarding') ob,public.position_level_passed($1,$2,1,'account_manager') other`,[id(3),id(10)])).rows[0],{ob:true,other:false});
// Third program: its own catalog, keys and level gate; nothing passed elsewhere unlocks it.
for(const role of ['account_manager','customer_support','tech_support_l3']){
assert.deepEqual((await db.query(`select count(*)::int n,count(*) filter(where item_type='exam')::int exams,count(*) filter(where item_type='project')::int projects from codezero_private.position_assessments where position_key='${role}'`)).rows[0],{n:109,exams:15,projects:2});
assert.equal((await db.query(`select count(*)::int n from learning_activity_catalog where route_key='${role}'`)).rows[0].n,109);
for(const item of POSITION_ITEMS.filter(a=>a.position===role&&a.decisions.length)){const row=(await db.query(`select correct_answers,option_counts from codezero_private.position_assessments where activity_key=$1`,[item.key])).rows[0];assert.deepEqual(row.correct_answers,item.decisions.map(q=>q.correct),item.key);assert.deepEqual(row.option_counts,item.decisions.map(q=>q.options.length));}
await reject(()=>submit(id(3),`position-${role}-l2-1`));
}
console.log('PASS further positions (Account Manager, Customer Support, Tech Support): 109 items each, keys equal to the curriculum and level gate independent of other programs');
console.log('PASS second position (Onboarding): separate gates, failed attempt, project approval, 92 lessons and its own certificate');

await db.exec('reset role');await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${id(4)}',false)`);
assert.equal((await db.query("select * from learning_practice_submissions where user_id=$1",[id(3)])).rows.length,0);
await reject(()=>db.query('select * from codezero_private.position_assessments'));
await reject(()=>db.query("select submit_position_practice($1,$2,$3,null,'','[]','guided')",[id(3),'position-cs-project-15',id(3000)]));
console.log('PASS position progression: 92 lessons, 184 exercises, 75 keys; human project gates, no self-review, scope, plans, idempotency and quota exhaustion');
}finally{await db.close();}
