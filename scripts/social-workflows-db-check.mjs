import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');let checks=0;
async function check(name,fn){await fn();checks++;console.log('PASS',name);}
async function rejected(fn){await assert.rejects(fn);}
async function as(role,user,fn){await db.exec(`begin;set local role ${role};set local "request.jwt.claim.sub"='${user}';`);try{const r=await fn();await db.exec('commit');return r;}catch(e){await db.exec('rollback');throw e;}}
const rpc=(q,p=[])=>as('service_role',id(1),()=>db.query(q,p));
const community=(n,action,target=null,request=null,parent=null,title='',body='',alias='',category='help',consent=false)=>rpc('select public.community_action($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) id',[id(n),action,target,request,parent,title,body,alias,category,consent]);
const mentor=(n,action,target=null,request=null,name='',bio='',languages=['es'],start=null,topic='',reference='',url='',consent=false)=>rpc('select public.mentoring_action($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) id',[id(n),action,target,request,name,bio,languages,start,topic,reference,url,consent]);
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 grant usage on schema public,auth to service_role,authenticated;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
 create table public.profiles(id uuid primary key references auth.users,role text,status text);
 grant all on auth.users,public.profiles to service_role;
 insert into auth.users values ${[1,2,3,4,5,6].map(n=>`('${id(n)}',${n===6?'null':'now()'})`).join(',')};
 insert into public.profiles values ${[1,2,3,4,5,6].map(n=>`('${id(n)}','${n===1?'owner':n===2?'admin':'student'}','active')`).join(',')};`);
 await db.exec(readFileSync('supabase/migrations/20261008130124_community_and_mentoring_workflows.sql','utf8'));
 await check('community requires verified active identity and consent; owner stays out of learner directory',async()=>{
  await rejected(()=>community(6,'join',null,null,null,'','','Unverified','help',true));
  await rejected(()=>community(1,'join',null,null,null,'','','Owner','help',true));
  await rejected(()=>community(3,'join',null,null,null,'','','Learner','help',false));
  await community(3,'join',null,null,null,'','','Learner A','help',true);
  await community(4,'join',null,null,null,'','','Learner B','help',true);
  await rejected(()=>community(5,'join',null,null,null,'','','Learner A','help',true));
 });
 let post;
 await check('pending posts stay private; replay is one post; direct API cannot read backend tables',async()=>{
  post=(await community(3,'post',null,id(101),null,'Learning question','Plain text <script>alert(1)</script>')).rows[0].id;
  assert.equal((await community(3,'post',null,id(101),null,'Changed','Changed body')).rows[0].id,post);
  const feed=async n=>(await rpc('select public.community_feed($1) rows',[id(n)])).rows[0].rows;
  assert.equal((await feed(4)).length,0);assert.equal((await feed(3)).length,1);
  assert.equal((await feed(3))[0].alias,'Learner A');assert.equal(Object.hasOwn((await feed(3))[0],'author_id'),false);
  await rejected(()=>as('authenticated',id(3),()=>db.query('select * from public.community_posts')));
  await rejected(()=>as('authenticated',id(3),()=>db.query('select public.community_action($1,$2)',[id(1),'approve'])));
  await rejected(()=>rpc('select public.community_feed($1)',[id(5)]));
 });
 await check('only platform moderation publishes; replies respect locked and hidden roots',async()=>{
  await rejected(()=>community(4,'approve',post));await community(2,'approve',post);
  const reply=(await community(4,'post',null,id(102),post,'','A useful reply')).rows[0].id;
  await rejected(()=>community(3,'remove',reply));await community(2,'approve',reply);
  assert.equal((await rpc('select public.community_feed($1,$2) rows',[id(3),post])).rows[0].rows.length,2);
  await community(2,'lock',post);await rejected(()=>community(4,'post',null,id(103),post,'','Blocked reply'));
  await community(2,'hide',post);await rejected(()=>rpc('select public.community_feed($1,$2)',[id(4),post]));
  await community(2,'approve',post);await community(2,'lock',post);
 });
 await check('thread pagination keeps its root and never loses replies with identical timestamps',async()=>{
  for(let n=300;n<335;n++)await db.query("insert into public.community_posts(author_id,parent_id,request_id,category,title,body,status,created_at) values($1,$2,$3,'help','Reply','A synthetic reply','approved',$4)",[id(4),post,id(n),'2026-01-01T00:00:00Z']);
  let before=null,cursor=null;const seen=new Set();
  for(let page=0;page<4;page++){
   const rows=(await rpc('select public.community_feed($1,$2,$3,$4) rows',[id(4),post,before,cursor])).rows[0].rows;
   assert.equal(rows[0].id,post);for(const row of rows.slice(0,30))if(row.id!==post){assert.equal(seen.has(row.id),false);seen.add(row.id);}
   if(rows.length<=30)break;before=rows[29].created_at;cursor=rows[29].id;
  }
  assert.equal(seen.size,36);
 });
 await check('reports deduplicate, moderation suspends and withdrawal removes content without bypassing suspension',async()=>{
  await community(4,'report',post,null,null,'','Confidential data in this post');await community(4,'report',post,null,null,'','Repeated report');
  assert.equal((await db.query('select count(*) n from public.community_reports')).rows[0].n,1);
  await community(2,'block',post);await rejected(()=>community(3,'post',null,id(104),null,'Question','Body'));
  await community(3,'leave');await rejected(()=>community(3,'join',null,null,null,'','','New alias','help',true));
  assert.equal((await db.query('select count(*) n from public.community_posts')).rows[0].n,0);
 });
 await check('mentor profiles require consent and platform approval',async()=>{
  await rejected(()=>mentor(5,'apply',null,null,'Mentor','A long biography about leadership.', ['es'],null,'','','',false));
  await mentor(5,'apply',null,null,'Mentor','A long biography about leadership.', ['es','en'],null,'','','',true);
  await rejected(()=>mentor(4,'approve_mentor',id(5)));await mentor(2,'approve_mentor',id(5));
 });
 const future=new Date(Date.now()+3*86400000).toISOString();let slot,booking;
 await check('slots reject short notice and overlap; request replay and competing users cannot double book',async()=>{
  await rejected(()=>mentor(5,'slot',null,null,'','',['es'],new Date(Date.now()+3600000).toISOString()));
  slot=(await mentor(5,'slot',null,null,'','',['es'],future)).rows[0].id;
  await rejected(()=>mentor(5,'slot',null,null,'','',['es'],new Date(Date.parse(future)+600000).toISOString()));
  booking=(await mentor(4,'request',slot,id(201),'','',['es'],null,'Improve my leadership process')).rows[0].id;
  assert.equal((await mentor(4,'request',slot,id(201),'','',['es'],null,'Changed topic')).rows[0].id,booking);
  await rejected(()=>mentor(3,'request',slot,id(202),'','',['es'],null,'Another learner goal'));
  await rejected(()=>mentor(5,'request',slot,id(203),'','',['es'],null,'My own slot'));
 });
 await check('unpaid or unauthorized confirmation is rejected; only participants cancel',async()=>{
  await rejected(()=>mentor(5,'confirm',booking,null,'','',['es'],null,'','paid-123','https://meeting.example.test/room'));
  await rejected(()=>mentor(2,'confirm',booking,null,'','',['es'],null,'','','https://meeting.example.test/room'));
  await mentor(2,'confirm',booking,null,'','',['es'],null,'','paid-123','https://meeting.example.test/room');
  await rejected(()=>mentor(3,'cancel',booking));await rejected(()=>mentor(5,'close_slot',slot));
  await rejected(()=>mentor(5,'complete',booking));await mentor(4,'cancel',booking);
 });
 await check('expired requests release the slot; inactive mentors and suspended learners are denied',async()=>{
  const expired=(await mentor(3,'request',slot,id(204),'','',['es'],null,'A leadership process question')).rows[0].id;
  await db.query("update public.mentoring_requests set expires_at=now()-interval '1 second' where id=$1",[expired]);
  await rejected(()=>mentor(2,'confirm',expired,null,'','',['es'],null,'','paid-123','https://meeting.example.test/room'));
  const next=(await mentor(4,'request',slot,id(205),'','',['es'],null,'A useful mentoring question')).rows[0].id;
  assert.equal((await db.query('select status from public.mentoring_requests where id=$1',[expired])).rows[0].status,'expired');
  await mentor(4,'cancel',next);await mentor(2,'pause_mentor',id(5));
  await rejected(()=>mentor(3,'request',slot,id(206),'','',['es'],null,'Another process question'));
  await db.query("update public.profiles set status='suspended' where id=$1",[id(4)]);
  await rejected(()=>community(4,'join',null,null,null,'','','Alias','help',true));
  await rejected(()=>mentor(4,'apply',null,null,'Mentor','This is a longer mentor biography',['es'],null,'','','',true));
 });
 await check('new tables and routines expose no anonymous or authenticated reads/writes',async()=>{
  for(const table of ['community_members','community_posts','community_reports','mentoring_profiles','mentoring_slots','mentoring_requests','social_workflow_audit']){
   await rejected(()=>as('authenticated',id(4),()=>db.query('select * from public.'+table)));
   assert.equal((await db.query("select relrowsecurity from pg_class where oid=$1::regclass",['public.'+table])).rows[0].relrowsecurity,true);
  }
  await rejected(()=>as('anon',id(4),()=>db.query('select public.community_feed($1)',[id(4)])));
  await rejected(()=>as('authenticated',id(4),()=>db.query('select public.mentoring_action($1,$2,$3)',[id(1),'approve_mentor',id(4)])));
 });
 console.log(`PASS ${checks} social workflow PostgreSQL groups`);
}finally{await db.close();}
