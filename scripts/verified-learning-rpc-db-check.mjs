// Verifies the real production-bound RPC definitions against isolated PostgreSQL (PGlite).
// Does not contact Supabase, run migrations in the cloud or modify commercial entitlements.
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
const user='00000000-0000-4000-8000-000000000001',suspended='00000000-0000-4000-8000-000000000002';
const check=async(label,fn)=>{await fn();console.log('PASS verified learning RPC:',label);};
const deny=async fn=>assert.rejects(fn);
try {
 await db.exec(`
 create role anon;create role authenticated;create role service_role bypassrls;
 create table public.profiles(id uuid primary key,status text);
 create table public.courses(id bigint primary key,status text);
 create table public.levels(id bigint primary key,course_id bigint,status text);
 create table public.lessons(id bigint primary key,level_id bigint,sort_order integer,status text,slug text);
 create table public.exercises(id bigint primary key,lesson_id bigint references public.lessons(id),kind text,status text);
 create table public.exercise_solutions(exercise_id bigint primary key references public.exercises(id),correct_answer text not null,correct_sequence text);
 create table public.exercise_attempts(id bigserial primary key,user_id uuid,exercise_id bigint references public.exercises(id),answer text,is_correct boolean,category text,created_at timestamptz default now());
 create table public.lesson_progress(id bigserial primary key,user_id uuid,lesson_id bigint references public.lessons(id),status text,progress_percent integer,started_at timestamptz,completed_at timestamptz,updated_at timestamptz,verified_at timestamptz,unique(user_id,lesson_id));
 create table public.test_quota(user_id uuid primary key,used integer default 0,max integer default 1);
 create function public.consume_quota(p_user uuid,p_metric text,p_amount integer) returns jsonb language plpgsql security invoker set search_path='' as $$begin
  if p_metric <> 'exercises' then raise exception 'unknown metric';end if;
  update public.test_quota set used=used+p_amount where user_id=p_user and used+p_amount<=max;
  return jsonb_build_object('allowed',found);
 end$$;
 grant usage on schema public to service_role;
 grant all on all tables in schema public to service_role;
 grant all on all sequences in schema public to service_role;
 grant execute on function public.consume_quota(uuid,text,integer) to service_role;
 insert into public.profiles values ('${user}','active'),('${suspended}','suspended');
 insert into public.test_quota(user_id) values ('${user}');
 insert into public.courses values(1,'published'),(2,'draft');
 insert into public.levels values(1,1,'published'),(2,1,'draft'),(3,2,'published');
 insert into public.lessons values(1,1,1,'published','first'),(2,1,2,'published','second'),(3,1,3,'draft','draft'),(4,2,1,'published','draft-level'),(5,3,1,'published','draft-course');
 insert into public.exercises values (10,1,'multiple_choice','published'),(11,1,'multiple_choice','draft'),(20,2,'order_steps','published'),(30,3,'multiple_choice','published'),(40,4,'multiple_choice','published'),(50,5,'multiple_choice','published');
 insert into public.exercise_solutions values(10,'A',null),(11,'A',null),(20,'B','BDCA'),(30,'A',null),(40,'A',null),(50,'A',null);
 `);
 const full=readFileSync('supabase/migrations/20261010160000_professional_lesson_integrity.sql','utf8');
 const start=full.indexOf('-- Atomic attempt persistence and quota accounting.');
 assert.ok(start>0,'real migration contains graded attempt functions');
 await db.exec(full.slice(start));
 const attempt=(who,exercise,answer)=>db.query('select public.submit_graded_lesson_attempt($1,$2,$3) outcome',[who,exercise,answer]).then(x=>x.rows[0].outcome);
 const complete=(who,lesson)=>db.query('select public.complete_verified_lesson($1,$2) result',[who,lesson]).then(x=>x.rows[0].result);
 const used=async()=>Number((await db.query('select used from public.test_quota where user_id=$1',[user])).rows[0].used);
 const saved=async()=>Number((await db.query('select count(*) n from public.exercise_attempts where user_id=$1',[user])).rows[0].n);
 await check('function grants block anonymous and authenticated clients',async()=>{
  for(const role of ['anon','authenticated']){
   await db.exec('set role '+role);
   await deny(()=>attempt(user,10,'A'));
   await deny(()=>complete(user,1));
   await db.exec('reset role');
  }
  const functions=await db.query(`select p.proname,has_function_privilege('anon',p.oid,'EXECUTE') anon,has_function_privilege('authenticated',p.oid,'EXECUTE') authenticated,has_function_privilege('service_role',p.oid,'EXECUTE') service from pg_proc p where p.proname in ('submit_graded_lesson_attempt','complete_verified_lesson') order by p.proname`);
  assert.equal(functions.rows.length,2);
  assert.ok(functions.rows.every(x=>!x.anon&&!x.authenticated&&x.service));
 });
 await db.exec('set role service_role');
 await check('draft and suspended content refused before any changes',async()=>{
  await deny(()=>attempt(user,11,'A'));
  await deny(()=>attempt(user,30,'A'));
  await deny(()=>attempt(user,40,'A'));
  await deny(()=>attempt(user,50,'A'));
  assert.equal(await complete(user,4),'not_published');
  assert.equal(await complete(user,5),'not_published');
  await deny(()=>attempt(suspended,10,'A'));
  assert.equal(await complete(user,3),'not_published');
  assert.equal(await saved(),0);
  assert.equal(await used(),0);
 });
 await check('incorrect and correct minimum checks are free; duplicate retry is replay',async()=>{
  const wrong=await attempt(user,10,'B');assert.equal(wrong.result,'incorrect');assert.equal(wrong.category,'lesson_check');
  const replay=await attempt(user,10,'B');assert.equal(replay.replay,true);
  const right=await attempt(user,10,'A');assert.equal(right.result,'correct');assert.equal(right.category,'lesson_check');
  const replayRight=await attempt(user,10,'A');assert.equal(replayRight.replay,true);
  assert.equal(await used(),0);assert.equal(await saved(),2);
 });
 await check('extra practice is metered atomically and monthly limit enforced',async()=>{
  const extra=await attempt(user,10,'C');assert.equal(extra.category,'practice');
  assert.equal(await used(),1);assert.equal(await saved(),3);
  const denied=await attempt(user,10,'D');assert.equal(denied.result,'limit');
  assert.equal(await used(),1);assert.equal(await saved(),3);
 });
 await check('completions are gated by correct evidence, not published drafts, and idempotent',async()=>{
  assert.equal(await complete(user,2),'locked');
  assert.equal(await complete(user,1),'completed');
  const first=(await db.query('select verified_at from public.lesson_progress where user_id=$1 and lesson_id=1',[user])).rows[0].verified_at;
  assert.ok(first);assert.equal(await complete(user,1),'completed');
  const second=(await db.query('select verified_at from public.lesson_progress where user_id=$1 and lesson_id=1',[user])).rows[0].verified_at;
  assert.equal(String(first),String(second));
  assert.equal(await complete(user,2),'blocked');
  await deny(()=>attempt(user,20,'not-a-sequence'));
  const sequence=await attempt(user,20,'BDCA');assert.equal(sequence.result,'correct');
  assert.equal(sequence.category,'lesson_check');
  assert.equal(await complete(user,2),'completed');
  assert.equal(await used(),1);
 });
 await db.exec('reset role');
 console.log('PASS verified learning RPC database tests; concurrency requires a separate multi-connection PostgreSQL check.');
} finally {await db.close();}
