import {PGlite} from '@electric-sql/pglite';import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite(),id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
async function as(role,user,fn){await db.exec('begin;set local role '+role);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);try{const r=await fn();await db.exec('commit');return r;}catch(e){await db.exec('rollback');throw e;}}
try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create function auth.uid() returns uuid language sql as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to authenticated;create table profiles(id uuid primary key,role text,status text,deleted_at timestamptz,email text,full_name text);grant select on profiles to service_role;`);
  for(const [n,role,status,deleted] of [[1,'owner','active',null],[2,'user','active',null],[3,'user','active',null],[4,'user','suspended',null],[5,'user','active','2026-10-08'],[6,'admin','active',null]])await db.query('insert into profiles values($1,$2,$3,$4,$5,$6)',[id(n),role,status,deleted,'user'+n+'@example.test','User '+n]);
  const file=fs.readdirSync('supabase/migrations').find(f=>f.endsWith('_platform_usage.sql'));await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8').split('-- Daily buckets')[0]);
  const record=(user,batch,clicks=5,visits=1)=>as('service_role',user,()=>db.query('select record_platform_usage($1,$2,$3,$4,$5)',[user,batch,'learning',clicks,visits]));
  await record(id(2),id(101));await record(id(2),id(101));await record(id(2),id(102),3,0);
  assert.deepEqual((await db.query('select clicks,visits from platform_usage_daily')).rows,[{clicks:8,visits:1}]);
  for(const n of [1,4,5])await record(id(n),id(200+n));assert.equal((await db.query('select count(*)::int n from platform_usage_daily')).rows[0].n,1);
  const report=(actor,order='least')=>as('service_role',actor,()=>db.query("select * from platform_usage_report($1,30,$2,'',1)",[actor,order]));
  const least=(await report(id(1))).rows;assert.equal(least.length,3);assert.equal(Number(least[0].clicks),0);assert.equal(least.at(-1).user_id,id(2));assert.equal(Number(least.at(-1).active_days),1);assert.equal(Number(least[0].total_users),3);
  assert.equal((await report(id(1),'most')).rows[0].user_id,id(2));await assert.rejects(()=>report(id(6)));await assert.rejects(()=>report(id(2)));
  assert.equal((await as('authenticated',id(2),()=>db.query('select * from platform_usage_daily'))).rows.length,1);assert.equal((await as('authenticated',id(3),()=>db.query('select * from platform_usage_daily'))).rows.length,0);
  for(const role of ['anon','authenticated']){await assert.rejects(()=>as(role,id(2),()=>db.query('select record_platform_usage($1,$2,$3,1,1)',[id(3),id(999),'learning'])));await assert.rejects(()=>as(role,id(2),()=>db.query('select * from platform_usage_receipts')));await assert.rejects(()=>as(role,id(2),()=>db.query('select * from platform_usage_report($1)',[id(1)])));await assert.rejects(()=>as(role,id(2),()=>db.query('delete from platform_usage_daily')));}
  await assert.rejects(()=>record(id(2),id(777),201));await assert.rejects(()=>record(id(2),id(778),-1));
  await db.query("insert into platform_usage_daily values($1,current_date-100,'profile',99,1,now()-interval '100 days')",[id(3)]);assert.equal(Number((await report(id(1))).rows.find(r=>r.user_id===id(3)).clicks),0);
  console.log('PASS usage PostgreSQL: idempotent batches, atomic counts, zero-activity users, owner-only ranking, self export, blocked client writes, suspension/deletion and period boundaries');
}finally{await db.close();}
