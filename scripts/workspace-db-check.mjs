import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
let checks=0;
const check = (name,fn) => fn().then(()=>{checks++; console.log('PASS',name);});
async function as(role,user,fn){
 await db.exec(`begin; set local role ${role}; set local "request.jwt.claim.sub"='${user}';`);
 try {const r=await fn();await db.exec('commit');return r;}catch(e){await db.exec('rollback');throw e;}
}
async function rejected(fn){let caught=false;try{await fn();}catch{caught=true;}assert.equal(caught,true);}
try {
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; grant usage on schema auth to authenticated,service_role;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.profiles(id uuid primary key references auth.users,role text,status text,full_name text);
 alter table public.profiles enable row level security;
 grant select on public.profiles to authenticated;
 create policy profiles_own on public.profiles for select to authenticated using(id=auth.uid());
 create table public.levels(id bigint primary key,level_number integer unique,title text,status text);
 create table public.lessons(id bigint primary key,level_id bigint,status text,title text);
 create table public.level_exams(id bigint primary key,level_id bigint,status text,title text);
 create table public.level_projects(id bigint primary key,level_id bigint,status text,title text);
 create table public.lesson_progress(user_id uuid,lesson_id bigint,status text);
 create table public.exam_attempts(id bigint generated always as identity,user_id uuid,exam_id bigint,passed boolean,score integer default 80,created_at timestamptz default now());
 create table public.project_submissions(id bigint generated always as identity,user_id uuid,project_id bigint,status text,score integer default 80,updated_at timestamptz default now());
 grant usage on schema public to anon,authenticated,service_role;
 grant select on all tables in schema public to service_role;
 insert into auth.users values ${Array.from({length:8},(_,i)=>`('${id(i+1)}')`).join(',')};
 insert into public.profiles values ${Array.from({length:8},(_,i)=>`('${id(i+1)}','${[0,5].includes(i)?'owner':'student'}','active','Persona ${i+1}')`).join(',')};`);
 const migration=process.env.CODEZERO_DB_CHECK_MIGRATION || readdirSync('supabase/sandbox/migrations').find(f=>f.endsWith('_enterprise_workspace_sandbox.sql'));
 await db.exec(readFileSync((process.env.CODEZERO_DB_CHECK_MIGRATION?'supabase/migrations/':'supabase/sandbox/migrations/')+migration,'utf8'));
 console.log('PostgreSQL', (await db.query('select version()')).rows[0].version);
 const rpc=async(q,params=[])=>as('service_role',id(1),()=>db.query(q,params));
 const org=(await rpc('select public.create_workspace_organization($1,$2) id',[id(1),'Empresa de prueba A'])).rows[0].id;
 const other=(await rpc('select public.create_workspace_organization($1,$2) id',[id(6),'Empresa de prueba B'])).rows[0].id;
 for(const [n,role,parent] of [[2,'manager',1],[3,'supervisor',2],[4,'learner',3],[5,'learner',1]]){
  const invitation=(await rpc('select public.create_workspace_invitation($1,$2,$3,$4,$5) id',[org,id(1),`persona${n}@codezero.example.test`,role,id(parent)])).rows[0].id;
  await rpc('select public.accept_workspace_invitation($1,$2,$3,$4)',[invitation,id(n),`persona${n}@codezero.example.test`,`Persona ${n}`]);
 }
 const visible=n=>as('authenticated',id(n),async()=> (await db.query('select user_id from public.organization_memberships order by user_id')).rows.map(r=>r.user_id));
 await check('manager sees self and descendants, never peer or other company',async()=>assert.deepEqual(await visible(2),[id(2),id(3),id(4)]));
 await check('supervisor sees direct report and self only',async()=>assert.deepEqual(await visible(3),[id(3),id(4)]));
 await check('employee only sees own membership',async()=>assert.deepEqual(await visible(4),[id(4)]));
 await check('outsider sees nothing even when guessing organization',async()=>assert.deepEqual(await visible(7),[]));
 await check('owner sees only own organization',async()=>assert.deepEqual(await visible(1),[id(1),id(2),id(3),id(4),id(5)]));
 await check('user cannot self-promote or invoke server RPC',async()=>{
  await rejected(()=>as('authenticated',id(4),()=>db.exec(`update public.organization_memberships set role='owner' where user_id='${id(4)}'`)));
  await rejected(()=>as('authenticated',id(4),()=>db.query('select public.rebuild_organization_access($1)',[org])));
 });
 await check('cycles roll back membership AND permission changes atomically',async()=>{
  await rejected(()=>rpc('select public.update_workspace_member($1,$2,$3,$4,$5,$6)',[org,id(1),id(2),'manager',id(3),true]));
  assert.deepEqual(await visible(2),[id(2),id(3),id(4)]);
 });
 await check('cross-company reporting lines and removing last owner are denied',async()=>{
  await rejected(()=>rpc('select public.update_workspace_member($1,$2,$3,$4,$5,$6)',[org,id(1),id(4),'learner',id(6),true]));
  await rejected(()=>rpc('select public.update_workspace_member($1,$2,$3,$4,$5,$6)',[org,id(1),id(1),'learner',null,true]));
 });
 await check('revocation removes visibility immediately',async()=>{
  await rpc('select public.update_workspace_member($1,$2,$3,$4,$5,$6)',[org,id(1),id(4),'learner',id(3),false]);
  assert.deepEqual(await visible(4),[]);
  assert.deepEqual(await visible(2),[id(2),id(3)]);
  await rpc('select public.update_workspace_member($1,$2,$3,$4,$5,$6)',[org,id(1),id(4),'learner',id(3),true]);
 });
 await check('preferences cannot be read, inserted or reassigned across users',async()=>{
  await as('authenticated',id(4),()=>db.query('insert into public.user_preferences(user_id,mode,accent) values($1,$2,$3)',[id(4),'dark','green']));
  assert.equal((await as('authenticated',id(5),()=>db.query('select * from public.user_preferences'))).rows.length,0);
  await rejected(()=>as('authenticated',id(5),()=>db.query('insert into public.user_preferences(user_id,mode,accent) values($1,$2,$3)',[id(4),'light','blue'])));
  await rejected(()=>as('authenticated',id(4),()=>db.query('update public.user_preferences set user_id=$1',[id(5)])));
  await rejected(()=>as('authenticated',id(4),()=>db.exec("update public.user_preferences set accent='unsafe'")));
 });
 await check('invites require matching verified email and deny reuse by another user',async()=>{
  const invite=(await rpc('select public.create_workspace_invitation($1,$2,$3,$4,$5) id',[other,id(6),'persona8@codezero.example.test','learner',id(6)])).rows[0].id;
  await rejected(()=>rpc('select public.accept_workspace_invitation($1,$2,$3,$4)',[invite,id(7),'wrong@codezero.example.test','Persona 7']));
  await rpc('select public.accept_workspace_invitation($1,$2,$3,$4)',[invite,id(8),'persona8@codezero.example.test','Persona 8']);
  await rejected(()=>rpc('select public.accept_workspace_invitation($1,$2,$3,$4)',[invite,id(7),'persona8@codezero.example.test','Persona 7']));
  assert.equal((await rpc('select public.accept_workspace_invitation($1,$2,$3,$4) id',[invite,id(8),'persona8@codezero.example.test','Persona 8'])).rows[0].id,other);
  await rejected(()=>rpc('select public.create_workspace_invitation($1,$2,$3,$4,$5)',[org,id(1),process.env.CODEZERO_DB_CHECK_MIGRATION?'invalid email':'real@example.com','learner',id(1)]));
  if(process.env.CODEZERO_DB_CHECK_MIGRATION) assert.ok((await rpc('select public.create_workspace_invitation($1,$2,$3,$4,$5) id',[org,id(1),'real@example.com','learner',id(1)])).rows[0].id);
 });
 await db.exec(`insert into public.levels values(1,1,'Bloque 1','published');
 insert into public.lessons(id,level_id,status) values(10,1,'published'),(11,1,'published');
 insert into public.level_exams(id,level_id,status) values(20,1,'published'),(21,1,'draft');
 insert into public.level_projects(id,level_id,status) values(30,1,'published');
 insert into public.lesson_progress values('${id(4)}',10,'completed'),('${id(4)}',11,'completed');
 insert into public.exam_attempts(user_id,exam_id,passed) values('${id(4)}',20,true);`);
 await check('required project prevents diploma even with all lessons and exam',async()=>{
  await rejected(()=>rpc('select * from public.issue_workspace_diploma($1,$2)',[id(4),1]));
  await rejected(()=>as('authenticated',id(4),()=>db.query('select * from public.issue_workspace_diploma($1,$2)',[id(4),1])));
 });
 await db.exec(`insert into public.project_submissions(user_id,project_id,status) values('${id(4)}',30,'approved')`);
 const first=(await rpc('select * from public.issue_workspace_diploma($1,$2)',[id(4),1])).rows[0];
 await check('diploma persists same identity/date and excludes unpublished exams',async()=>{
  const second=(await rpc('select * from public.issue_workspace_diploma($1,$2)',[id(4),1])).rows[0];
  assert.equal(second.id,first.id);assert.equal(String(second.issued_at),String(first.issued_at));
  assert.deepEqual(second.requirements.exams,[20]);
 });
 await check('issued diploma survives curriculum changes and is private',async()=>{
  await db.exec("insert into public.lessons(id,level_id,status) values(12,1,'published')");
  assert.equal((await rpc('select * from public.issue_workspace_diploma($1,$2)',[id(4),1])).rows[0].id,first.id);
  assert.equal((await as('authenticated',id(5),()=>db.query('select * from public.issued_block_diplomas'))).rows.length,0);
  await rejected(()=>as('authenticated',id(4),()=>db.exec("update public.issued_block_diplomas set block_title='Falso'")));
 });
 await check('real assignment evidence is scoped and never trusts self-reported grades',async()=>{
  await db.exec("update public.level_exams set title='Evaluación' where id=20");
  await rpc('select public.assign_workspace_activity($1,$2,$3,$4,$5,$6)',[org,id(1),id(4),'exam',20,'Fundamentos técnicos']);
  await rpc('select public.refresh_workspace_evidence($1,$2)',[org,id(2)]);
  assert.equal((await as('authenticated',id(2),()=>db.query('select completed,score from public.learning_evidence'))).rows[0].completed,true);
  assert.equal((await as('authenticated',id(5),()=>db.query('select * from public.learning_evidence'))).rows.length,0);
  await rejected(()=>as('authenticated',id(4),()=>db.exec('update public.learning_evidence set score=100')));
  await db.exec(`insert into public.exam_attempts(user_id,exam_id,passed,score) values('${id(4)}',20,false,40)`);
  await rpc('select public.refresh_workspace_evidence($1,$2)',[org,id(3)]);
  assert.equal((await as('authenticated',id(3),()=>db.query('select category from public.learning_errors'))).rows[0].category,'exam_not_passed');
  assert.equal((await as('authenticated',id(5),()=>db.query('select * from public.learning_errors'))).rows.length,0);
 });
 await check('disabled global profile loses team visibility via database policy',async()=>{
  await db.exec(`update public.profiles set status='disabled' where id='${id(2)}'`);
  assert.deepEqual(await visible(2),[]);
  await db.exec(`update public.profiles set status='active' where id='${id(2)}'`);
 });
 await check('pending and expired invitations never grant membership',async()=>{
  const invitation=(await rpc('select public.create_workspace_invitation($1,$2,$3,$4,$5) id',[org,id(1),'persona7@codezero.example.test','learner',id(1)])).rows[0].id;
  assert.deepEqual(await visible(7),[]);
  await db.query("update public.organization_invitations set expires_at=now()-interval '1 hour' where id=$1",[invitation]);
  await rejected(()=>rpc('select public.accept_workspace_invitation($1,$2,$3,$4)',[invitation,id(7),'persona7@codezero.example.test','Persona 7']));
  assert.deepEqual(await visible(7),[]);
 });
 await check('anonymous role has no access; inactive organization cannot mutate roles',async()=>{
  await rejected(()=>as('anon',id(7),()=>db.query('select * from public.user_preferences')));
  await db.query('update public.organizations set active=false where id=$1',[other]);
  await rejected(()=>rpc('select public.update_workspace_member($1,$2,$3,$4,$5,$6)',[other,id(6),id(8),'learner',id(6),true]));
 });
 await check('no new definer functions; RLS enabled on all new tables',async()=>{
  const functions=await db.query("select proname from pg_proc where pronamespace='public'::regnamespace and prosecdef");
  assert.deepEqual(functions.rows,[]);
  const disabled=await db.query("select relname from pg_class where relnamespace in ('public'::regnamespace,'codezero_private'::regnamespace) and relname in ('user_preferences','issued_block_diplomas','organizations','organization_memberships','organization_invitations','learning_assignments','learning_evidence','learning_errors','organization_audit_log','organization_access') and not relrowsecurity");
  assert.deepEqual(disabled.rows,[]);
 });
 await check('new practice and waitlist migrations coexist without changing official evidence or diplomas',async()=>{
 const before=(await db.query('select (select count(*) from public.issued_block_diplomas) diplomas, (select count(*) from public.learning_evidence) evidence, (select count(*) from public.exam_attempts) exams')).rows;
 for(const suffix of process.env.CODEZERO_DB_CHECK_MIGRATION ? [] : ['_practice_progress_sandbox.sql','_addon_waitlist_sandbox.sql']){
 const name=readdirSync('supabase/sandbox/migrations').find(f=>f.endsWith(suffix));await db.exec(readFileSync('supabase/sandbox/migrations/'+name,'utf8'));}
 const after=(await db.query('select (select count(*) from public.issued_block_diplomas) diplomas, (select count(*) from public.learning_evidence) evidence, (select count(*) from public.exam_attempts) exams')).rows;
 assert.deepEqual(after,before);assert.deepEqual(await visible(2),[id(2),id(3),id(4)]);
 });
 console.log(`${checks} database checks passed. No remote database or Auth service was contacted.`);
} finally {await db.close();}
