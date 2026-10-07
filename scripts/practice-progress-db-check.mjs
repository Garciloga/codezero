import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
const p={version:'samples-v1',role:'support',passed:['api-11'],startDay:'2026-10-07',onboarding:[0],pulse:'Duda privada'};
let checks=0;
async function as(role,user,fn){await db.exec(`begin;set local role ${role};set local "request.jwt.claim.sub"='${user}';`);try{const r=await fn();await db.exec('commit');return r;}catch(e){await db.exec('rollback');throw e;}}
const save=(user,progress,revision)=>as('authenticated',user,()=>db.query('select public.save_private_practice_progress($1,$2) revision',[JSON.stringify(progress),revision]));
async function check(name,fn){await fn();checks++;console.log('PASS',name);}
try{
 await db.exec(`create role anon;create role authenticated;create schema auth;grant usage on schema auth to authenticated;
 create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.profiles(id uuid primary key,status text);alter table public.profiles enable row level security;
 grant select on public.profiles to authenticated;create policy own_profile on public.profiles to authenticated using(id=auth.uid());
 insert into auth.users values('${a}'),('${b}');insert into public.profiles values('${a}','active'),('${b}','active');`);
 const migration=readdirSync('supabase/sandbox/migrations').find(f=>f.endsWith('_practice_progress_sandbox.sql'));
 await db.exec(readFileSync('supabase/sandbox/migrations/'+migration,'utf8'));
 const conflictMigration=readdirSync('supabase/sandbox/migrations').find(f=>f.endsWith('_private_practice_conflict_response.sql'));
 await db.exec(readFileSync('supabase/sandbox/migrations/'+conflictMigration,'utf8'));
 const waitlistMigration=readdirSync('supabase/sandbox/migrations').find(f=>f.endsWith('_addon_waitlist_sandbox.sql'));
 await db.exec(readFileSync('supabase/sandbox/migrations/'+waitlistMigration,'utf8'));
 await check('first and subsequent saves restore exact private data',async()=>{
 assert.equal((await save(a,p,0)).rows[0].revision,1);
 assert.equal((await save(a,{...p,pulse:'Nueva duda'},1)).rows[0].revision,2);
 assert.equal((await as('authenticated',a,()=>db.query('select progress from public.private_practice_progress'))).rows[0].progress.pulse,'Nueva duda');});
 await check('stale tab cannot overwrite latest snapshot',async()=>{await assert.rejects(save(a,p,1),e=>e.code==='PT409');assert.equal((await db.query('select revision from public.private_practice_progress')).rows[0].revision,2);});
 await check('other learner cannot read, insert or update another account',async()=>{
 assert.equal((await as('authenticated',b,()=>db.query('select * from public.private_practice_progress'))).rows.length,0);
 await assert.rejects(as('authenticated',b,()=>db.query('insert into public.private_practice_progress(user_id,progress) values($1,$2)',[a,JSON.stringify(p)])));
 assert.equal((await as('authenticated',b,()=>db.query('update public.private_practice_progress set revision=99 where user_id=$1 returning user_id',[a]))).rows.length,0);
 assert.equal((await save(b,p,0)).rows[0].revision,1);});
 await check('anonymous access and writes denied',async()=>{
 await assert.rejects(as('anon','',()=>db.query('select * from public.private_practice_progress')));
 await assert.rejects(as('anon','',()=>db.query('select public.save_private_practice_progress($1,0)',[JSON.stringify(p)])));});
 await check('catalog and payload constraints reject unknown IDs, oversized pulse and extra fields',async()=>{
 for(const change of [{version:'v2'},{passed:['invented']},{onboarding:[8]},{pulse:'x'.repeat(501)},{score:100},{role:'admin'}]) await assert.rejects(save(a,{...p,...change},2));
 assert.equal((await db.query('select revision from public.private_practice_progress where user_id=$1',[a])).rows[0].revision,2);});
 await check('inactive account immediately loses read and save access',async()=>{
 await db.query("update public.profiles set status='inactive' where id=$1",[a]);
 assert.equal((await as('authenticated',a,()=>db.query('select * from public.private_practice_progress'))).rows.length,0);
 await assert.rejects(save(a,p,2));});
 await check('no elevated functions or public function execution',async()=>{
 assert.equal((await db.query("select prosecdef from pg_proc where proname='save_private_practice_progress'")).rows[0].prosecdef,false);
 await assert.rejects(as('authenticated',b,()=>db.query('delete from public.private_practice_progress')));});
 await check('catalog seeded with 19 unavailable modules and correct AI limits',async()=>{
 const catalog=(await db.query('select * from public.addons')).rows;assert.equal(catalog.length,19);assert.ok(catalog.every(row=>row.status==='coming_soon'));
 assert.equal(catalog.find(row=>row.key==='ai_tutor').monthly_limit,100);assert.equal(catalog.find(row=>row.key==='ai_simulator').monthly_limit,20);
 await assert.rejects(as('authenticated',b,()=>db.query("update public.addons set status='active'")));});
 const interest=(user,key)=>as('authenticated',user,()=>db.query('insert into public.addon_waitlist(user_id,addon_key) values($1,$2) on conflict(user_id,addon_key) do nothing',[user,key]));
 await check('repeated waitlist clicks store one user per module',async()=>{
 await interest(b,'route_operations');await interest(b,'route_operations');assert.equal((await db.query('select * from public.addon_waitlist')).rows.length,1);});
 await check('inactive and anonymous users cannot register interest',async()=>{
 await assert.rejects(interest(a,'route_qa'));await assert.rejects(as('anon','',()=>db.query('select * from public.addon_waitlist')));});
 await check('waitlist rejects nonexistent and active modules',async()=>{
 await assert.rejects(interest(b,'unknown'));await db.query("update public.addons set status='active' where key='route_qa'");await assert.rejects(interest(b,'route_qa'));});
 await check('interest is private and cross-account insertion/deletion is denied',async()=>{
 await db.query("update public.profiles set status='active' where id=$1",[a]);
 assert.equal((await as('authenticated',a,()=>db.query('select * from public.addon_waitlist'))).rows.length,0);
 await assert.rejects(as('authenticated',a,()=>db.query('insert into public.addon_waitlist(user_id,addon_key) values($1,$2)',[b,'route_data_bi'])));
 assert.equal((await as('authenticated',a,()=>db.query('delete from public.addon_waitlist where user_id=$1 returning user_id',[b]))).rows.length,0);});
 await check('learner can withdraw own interest without affecting other users',async()=>{
 await interest(a,'route_operations');await as('authenticated',b,()=>db.query('delete from public.addon_waitlist where user_id=$1',[b]));
 const rows=(await db.query('select user_id from public.addon_waitlist')).rows;assert.deepEqual(rows,[{user_id:a}]);});
 console.log(`${checks} database checks passed (real PostgreSQL in PGlite; Auth/PostgREST not simulated as integration).`);
}finally{await db.close();}
